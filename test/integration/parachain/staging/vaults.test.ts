import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, InterBtcAmount, BitcoinUnit, ExchangeRate, InterBtc, Polkadot, PolkadotAmount, PolkadotUnit, Kusama } from "@interlay/monetary-js";
import * as bitcoinjs from "bitcoinjs-lib";
import Big from "big.js";
import { InterbtcPrimitivesVaultId } from "../../../../src/index";

import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { ORACLE_URI, VAULT_1_URI, VAULT_2_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, VAULT_3_URI, VAULT_TO_LIQUIDATE_URI, VAULT_TO_BAN_URI, ESPLORA_BASE_PATH, WRAPPED_CURRENCY_TICKER, NATIVE_CURRENCY_TICKER } from "../../../config";
import { BitcoinCoreClient, DefaultVaultsAPI, DefaultElectrsAPI, DefaultOracleAPI, ElectrsAPI, newAccountId, CollateralCurrency, WrappedCurrency, newVaultId, currencyIdToLiteral, CollateralIdLiteral, tickerToMonetaryCurrency, CurrencyIdLiteral } from "../../../../src/";
import { encodeVaultId, issueSingle } from "../../../../src/utils";
import { DefaultRewardsAPI } from "../../../../src/parachain/rewards";
import { callWithExchangeRate } from "../../../utils/helpers";

describe("vaultsAPI", () => {
    let oracleAccount: KeyringPair;
    let vault_to_liquidate: KeyringPair;
    let vault_to_ban: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;
    let vault_3: KeyringPair;
    let vault_3_id: InterbtcPrimitivesVaultId;
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;
    let oracleAPI: DefaultOracleAPI;
    let rewardsAPI: DefaultRewardsAPI;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    
    let collateralCurrency: CollateralCurrency;
    let wrappedCurrency: WrappedCurrency;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        collateralCurrency = tickerToMonetaryCurrency(api, NATIVE_CURRENCY_TICKER) as CollateralCurrency;
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        const keyring = new Keyring({ type: "sr25519" });
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, Polkadot, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, Kusama, wrappedCurrency);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_id = newVaultId(api, vault_3.address, Polkadot, wrappedCurrency);
        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        oracleAPI = new DefaultOracleAPI(api, InterBtc, oracleAccount);
        rewardsAPI = new DefaultRewardsAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency);

        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency);
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
        const collateralizationBeforeDeposit = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_1.address), CurrencyIdLiteral.DOT);
        await vaultsAPI.depositCollateral(amount);
        const collateralizationAfterDeposit = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_1.address), CurrencyIdLiteral.DOT);
        if (collateralizationBeforeDeposit === undefined || collateralizationAfterDeposit == undefined) {
            throw new Error("Collateralization is undefined");
        }
        assert.isTrue(
            collateralizationAfterDeposit > collateralizationBeforeDeposit,
            "Depositing did not increase collateralization"
        );

        await vaultsAPI.withdrawCollateral(amount);
        const collateralizationAfterWithdrawal = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_1.address), CurrencyIdLiteral.DOT);
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

    it("should getPremiumRedeemVaults after a price crash", async () => {
        const collateralLiteral = currencyIdToLiteral(vault_3_id.currencies.collateral) as CollateralIdLiteral;
        const issuableAmount = await vaultsAPI.getIssuableAmount(
            newAccountId(api, vault_3.address),
            collateralLiteral
        );
        await issueSingle(api, electrsAPI, bitcoinCoreClient, oracleAccount, issuableAmount, collateralCurrency, vault_3_id);

        const currentVaultCollateralization = await vaultsAPI.getVaultCollateralization(newAccountId(api, vault_3.address), collateralLiteral);
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

        await callWithExchangeRate(oracleAPI, exchangeRateToSet, async () => {
            const premiumRedeemVaults = await vaultsAPI.getPremiumRedeemVaults();
            assert.equal(premiumRedeemVaults.size, 1);
            assert.equal(
                encodeVaultId(premiumRedeemVaults.keys().next().value),
                encodeVaultId(vault_3_id),
                "Premium redeem vault is not the expected one"
            );
    
            const premiumRedeemAmount = premiumRedeemVaults.values().next().value as InterBtcAmount;
            assert.isTrue(
                premiumRedeemAmount.gte(issuableAmount),
                "Amount available for premium redeem should be higher"
            );
        });
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
        assert.isTrue(vaultIsATestVault(randomVault.accountId.toHuman()));
    });

    it("should fail if no vault for issuing is found", async () => {
        assert.isRejected(vaultsAPI.selectRandomVaultIssue(InterBtcAmount.from.BTC(9000000)));
    });

    it("should select random vault for redeem", async () => {
        const randomVault = await vaultsAPI.selectRandomVaultRedeem(InterBtcAmount.zero);
        assert.isTrue(vaultIsATestVault(randomVault.accountId.toHuman()));
    });

    it("should fail if no vault for redeeming is found", async () => {
        const InterBtc = InterBtcAmount.from.BTC(9000000);
        assert.isRejected(vaultsAPI.selectRandomVaultRedeem(InterBtc));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        const vault1Id = newAccountId(api, vault_1.address);
        assert.isRejected(vaultsAPI.getVaultCollateralization(vault1Id, CurrencyIdLiteral.DOT));
    });

    it("should get the issuable InterBtc for a vault", async () => {
        const vault1Id = newAccountId(api, vault_1.address);
        const issuableInterBtc = await vaultsAPI.getIssuableAmount(
            vault1Id,
            currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral
        );
        assert.isTrue(issuableInterBtc.gt(InterBtcAmount.zero));
    });

    it("should get the issuable InterBtc", async () => {
        const issuableInterBtc = await vaultsAPI.getTotalIssuableAmount();
        assert.isTrue(issuableInterBtc.gt(InterBtcAmount.zero));
    });

    it("should getFees", async () => {
        const vault1Id = newAccountId(api, vault_1.address);
        const feesWrapped = await rewardsAPI.getFeesWrapped(
            vault1Id,
            currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral
        );
        assert.isTrue(feesWrapped.gte(InterBtcAmount.zero));
    });

    it("should getAPY", async () => {
        const apy = await vaultsAPI.getAPY(newAccountId(api, vault_1.address), currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral);
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
