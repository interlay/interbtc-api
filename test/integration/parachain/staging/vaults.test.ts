import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, InterBtcAmount, BitcoinUnit, ExchangeRate, InterBtc, Polkadot, PolkadotAmount, PolkadotUnit } from "@interlay/monetary-js";
import { TypeRegistry } from "@polkadot/types";
import * as bitcoinjs from "bitcoinjs-lib";
import Big from "big.js";

import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { ORACLE_URI, VAULT_1_URI, VAULT_2_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, VAULT_3_URI, VAULT_TO_LIQUIDATE_URI, VAULT_TO_BAN_URI, ESPLORA_BASE_PATH } from "../../../config";
import { BitcoinCoreClient, DefaultVaultsAPI, DefaultElectrsAPI, DefaultOracleAPI, ElectrsAPI, newAccountId } from "../../../../src/";
import { issueSingle } from "../../../../src/utils";
import { DefaultRewardsAPI } from "../../../../src/parachain/rewards";

describe("vaultsAPI", () => {
    let oracleAccount: KeyringPair;
    let vault_to_liquidate: KeyringPair;
    let vault_to_ban: KeyringPair;
    let vault_1: KeyringPair;
    let vault_2: KeyringPair;
    let vault_3: KeyringPair;
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;
    let oracleAPI: DefaultOracleAPI;
    let rewardsAPI: DefaultRewardsAPI;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    const registry = new TypeRegistry();

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_to_ban = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_BAN_URI);
        oracleAPI = new DefaultOracleAPI(api, InterBtc, oracleAccount);
        rewardsAPI = new DefaultRewardsAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc);

        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc);
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
    });

    after(() => {
        return api.disconnect();
    });

    function vaultIsATestVault(vaultAddress: string): boolean {
        return vaultAddress === vault_2.address ||
            vaultAddress === vault_1.address ||
            vaultAddress === vault_3.address ||
            vaultAddress === vault_to_ban.address ||
            vaultAddress === vault_to_liquidate.address;
    }

    it("should get issuable", async () => {
        const issuableInterBTC = await vaultsAPI.getTotalIssuableAmount();
        const minExpectedIssuableInterBTC = InterBtcAmount.from.BTC(1);
        assert.isTrue(issuableInterBTC.gte(minExpectedIssuableInterBTC));
    });

    // WARNING: this test is not idempotent
    it("should deposit and withdraw collateral", async () => {
        vaultsAPI.setAccount(vault_1);
        const amount = PolkadotAmount.from.DOT(100);
        const collateralizationBeforeDeposit = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_1.address));
        await vaultsAPI.depositCollateral(amount);
        const collateralizationAfterDeposit = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_1.address));
        if (collateralizationBeforeDeposit === undefined || collateralizationAfterDeposit == undefined) {
            throw new Error("Collateralization is undefined");
        }
        assert.isTrue(
            collateralizationAfterDeposit > collateralizationBeforeDeposit,
            "Depositing did not increase collateralization"
        );

        await vaultsAPI.withdrawCollateral(amount);
        const collateralizationAfterWithdrawal = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_1.address));
        if (collateralizationAfterWithdrawal === undefined) {
            throw new Error("Collateralization is undefined");
        }
        assert.isTrue(
            collateralizationAfterDeposit > collateralizationAfterWithdrawal,
            "Withdrawing did not decrease collateralization"
        );
        assert.equal(
            collateralizationBeforeDeposit.toString(), collateralizationAfterWithdrawal.toString(),
            "Collateralization after identical deposit and withdrawal changed"
        );
    });

    it("should getLiquidationVaultId", async () => {
        const liquidationVaultId = await vaultsAPI.getLiquidationVaultId();
        assert.equal(liquidationVaultId.toString(), "5EYCAe5i8QbRra1jndPz1WAuf1q1KHQNfu2cW1EXJ231emTd");
    });

    it("should getPremiumRedeemVaults after a price crash", async () => {
        const issuableAmount = await vaultsAPI.getIssuableAmount(newAccountId(api, vault_3.address));
        await issueSingle(api, electrsAPI, bitcoinCoreClient, oracleAccount, issuableAmount, vault_3.address);

        const currentVaultCollateralization = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_3.address));
        if (currentVaultCollateralization === undefined) {
            throw new Error("Collateralization is undefined");
        }

        // The factor to adjust the exchange rate by. Calculated such that the resulting collateralization
        // will be 90% of the premium redeem threshold. (e.g. 1.35 * 90% = 1.215)
        const premiumRedeemThreshold = await vaultsAPI.getPremiumRedeemThreshold(Polkadot);
        const modifyExchangeRateBy = premiumRedeemThreshold.mul(0.9).div(currentVaultCollateralization);

        const initialExchangeRate = await oracleAPI.getExchangeRate(Polkadot);
        // crash the exchange rate so that the vault falls below the premium redeem threshold
        const exchangeRateValue = initialExchangeRate.toBig().div(modifyExchangeRateBy);
        const exchangeRateToSet = new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await oracleAPI.setExchangeRate(exchangeRateToSet);

        const premiumRedeemVaults = await vaultsAPI.getPremiumRedeemVaults();
        assert.equal(premiumRedeemVaults.size, 1);
        assert.equal(
            premiumRedeemVaults.keys().next().value.toString(),
            vault_3.address,
            "Premium redeem vault is not the expected one"
        );

        const premiumRedeemAmount = premiumRedeemVaults.values().next().value as InterBtcAmount;
        assert.isTrue(
            premiumRedeemAmount.gte(issuableAmount),
            "Amount available for premium redeem should be higher"
        );

        // Revert the exchange rate to its initial value,
        // to minimize the side effects of this test.
        await oracleAPI.setExchangeRate(initialExchangeRate);
    });

    it("should getLiquidationCollateralThreshold", async () => {
        const threshold = await vaultsAPI.getLiquidationCollateralThreshold(Polkadot);
        assert.equal(threshold.toString(), "1.1");
    });

    it("should getPremiumRedeemThreshold", async () => {
        const threshold = await vaultsAPI.getPremiumRedeemThreshold(Polkadot);
        assert.equal(threshold.toString(), "1.35");
    });

    it("should select random vault for issue", async () => {
        const randomVault = await vaultsAPI.selectRandomVaultIssue(InterBtcAmount.zero);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for issuing is found", async () => {
        assert.isRejected(vaultsAPI.selectRandomVaultIssue(InterBtcAmount.from.BTC(9000000)));
    });

    it("should select random vault for redeem", async () => {
        const randomVault = await vaultsAPI.selectRandomVaultRedeem(InterBtcAmount.zero);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for redeeming is found", async () => {
        const InterBtc = InterBtcAmount.from.BTC(9000000);
        assert.isRejected(vaultsAPI.selectRandomVaultRedeem(InterBtc));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        const charlieId = api.createType("AccountId", vault_1.address);
        assert.isRejected(vaultsAPI.getVaultCollateralization(charlieId));
    });

    it("should fail to get total collateralization when no tokens are issued", async () => {
        assert.isRejected(vaultsAPI.getSystemCollateralization());
    });

    it("should get vault theft flag", async () => {
        const ferdieStashId = api.createType("AccountId", vault_to_ban.address);
        const flaggedForTheft = await vaultsAPI.isVaultFlaggedForTheft(ferdieStashId);
        assert.isTrue(flaggedForTheft);
    });

    it("should get the issuable InterBtc for a vault", async () => {
        const charlieId = api.createType("AccountId", vault_1.address);
        const issuableInterBtc = await vaultsAPI.getIssuableAmount(charlieId);
        assert.isTrue(issuableInterBtc.gt(InterBtcAmount.zero));
    });

    it("should get the issuable InterBtc", async () => {
        const issuableInterBtc = await vaultsAPI.getTotalIssuableAmount();
        assert.isTrue(issuableInterBtc.gt(InterBtcAmount.zero));
    });

    it("should getFees", async () => {
        const feesWrapped = await rewardsAPI.getFeesWrapped(vault_1.address);
        assert.isTrue(feesWrapped.gte(InterBtcAmount.zero));
    });

    it("should getAPY", async () => {
        const apy = await vaultsAPI.getAPY(registry.createType("AccountId", vault_1.address));
        const apyBig = new Big(apy);
        const apyBenchmark = new Big("0");
        assert.isTrue(apyBig.gte(apyBenchmark));
    });

    it("should getPunishmentFee", async () => {
        const punishmentFee = await vaultsAPI.getPunishmentFee();
        assert.equal(punishmentFee.toString(), "0.1");
    });

    it("should get vault list", async () => {
        const vaults = (await vaultsAPI.list()).map(vault => vault.id.toHuman());
        assert.isAbove(vaults.length, 0, "Vault list should not be empty");
    });
});
