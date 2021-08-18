import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import Big from "big.js";
import { TypeRegistry } from "@polkadot/types";

import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { DefaultVaultsAPI } from "../../../../src/parachain/vaults";
import { BitcoinCoreClient, DefaultElectrsAPI, DefaultOracleAPI, ElectrsAPI, issueSingle, newAccountId, REGTEST_ESPLORA_BASE_PATH } from "../../../../src";
import { Bitcoin, BTCAmount, BTCUnit, ExchangeRate, Polkadot, PolkadotAmount, PolkadotUnit } from "@interlay/monetary-js";
import { DefaultPoolsAPI } from "../../../../src/parachain/pools";

describe("vaultsAPI", () => {
    let bob: KeyringPair;
    let ferdie: KeyringPair;
    let ferdie_stash: KeyringPair;
    let charlie_stash: KeyringPair;
    let dave_stash: KeyringPair;
    let eve_stash: KeyringPair;
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;
    let oracleAPI: DefaultOracleAPI;
    let poolsAPI: DefaultPoolsAPI;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    const registry = new TypeRegistry();

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
        charlie_stash = keyring.addFromUri("//Charlie//stash");
        dave_stash = keyring.addFromUri("//Dave//stash");
        eve_stash = keyring.addFromUri("//Eve//stash");
        ferdie_stash = keyring.addFromUri("//Ferdie//stash");
        ferdie = keyring.addFromUri("//Ferdie");
        // Bob is the authorized oracle
        oracleAPI = new DefaultOracleAPI(api, bob);
        poolsAPI = new DefaultPoolsAPI(api, bitcoinjs.networks.regtest, electrsAPI);

        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
    });

    after(() => {
        return api.disconnect();
    });

    function vaultIsATestVault(vaultAddress: string): boolean {
        return vaultAddress === dave_stash.address ||
            vaultAddress === charlie_stash.address ||
            vaultAddress === eve_stash.address ||
            vaultAddress === ferdie_stash.address ||
            vaultAddress === ferdie.address;
    }

    it("should get issuable", async () => {
        const issuableInterBTC = await vaultsAPI.getTotalIssuableAmount();
        const minExpectedIssuableInterBTC = BTCAmount.from.BTC(1);
        assert.isTrue(issuableInterBTC.gte(minExpectedIssuableInterBTC));
    });

    it("should deposit and withdraw collateral", async () => {
        vaultsAPI.setAccount(charlie_stash);
        const amount = PolkadotAmount.from.DOT(100);
        const collateralizationBeforeDeposit = await vaultsAPI.getVaultCollateralization(newAccountId(api, charlie_stash.address));
        await vaultsAPI.depositCollateral(amount);
        const collateralizationAfterDeposit = await vaultsAPI.getVaultCollateralization(newAccountId(api, charlie_stash.address));
        if (collateralizationBeforeDeposit === undefined || collateralizationAfterDeposit == undefined) {
            throw new Error("Collateralization is undefined");
        }
        assert.isTrue(
            collateralizationAfterDeposit > collateralizationBeforeDeposit,
            "Depositing did not increase collateralization"
        );

        await vaultsAPI.withdrawCollateral(amount);
        const collateralizationAfterWithdrawal = await vaultsAPI.getVaultCollateralization(newAccountId(api, charlie_stash.address));
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
        const issuableAmount = await vaultsAPI.getIssuableAmount(newAccountId(api, eve_stash.address));
        await issueSingle(api, electrsAPI, bitcoinCoreClient, bob, issuableAmount, eve_stash.address);

        const currentVaultCollateralization = await vaultsAPI.getVaultCollateralization(newAccountId(api, eve_stash.address));
        if (currentVaultCollateralization === undefined) {
            throw new Error("Collateralization is undefined");
        }

        // The factor to adjust the exchange rate by. Calculated such that the resulting collateralization
        // will be 90% of the premium redeem threshold. (e.g. 1.35 * 90% = 1.215)
        const premiumRedeemThreshold = await vaultsAPI.getPremiumRedeemThreshold();
        const modifyExchangeRateBy = premiumRedeemThreshold.mul(0.9).div(currentVaultCollateralization);

        const initialExchangeRate = await oracleAPI.getExchangeRate(Polkadot);
        // crash the exchange rate so that the vault falls below the premium redeem threshold
        const exchangeRateValue = initialExchangeRate.toBig().div(modifyExchangeRateBy);
        const exchangeRateToSet = new ExchangeRate<Bitcoin, BTCUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await oracleAPI.setExchangeRate(exchangeRateToSet);

        const premiumRedeemVaults = await vaultsAPI.getPremiumRedeemVaults();
        assert.equal(premiumRedeemVaults.size, 1);
        assert.equal(
            premiumRedeemVaults.keys().next().value.toString(),
            eve_stash.address,
            "Premium redeem vault is not the expected one"
        );

        const premiumRedeemAmount = premiumRedeemVaults.values().next().value as BTCAmount;
        assert.isTrue(
            premiumRedeemAmount.gte(issuableAmount),
            "Amount available for premium redeem should be higher"
        );

        // Revert the exchange rate to its initial value,
        // to minimize the side effects of this test.
        await oracleAPI.setExchangeRate(initialExchangeRate);
    });

    it("should getLiquidationCollateralThreshold", async () => {
        const threshold = await vaultsAPI.getLiquidationCollateralThreshold();
        assert.equal(threshold.toString(), "1.1");
    });

    it("should getPremiumRedeemThreshold", async () => {
        const threshold = await vaultsAPI.getPremiumRedeemThreshold();
        assert.equal(threshold.toString(), "1.35");
    });

    it("should select random vault for issue", async () => {
        const interBTC = BTCAmount.zero;
        const randomVault = await vaultsAPI.selectRandomVaultIssue(interBTC);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for issuing is found", async () => {
        const interBTC = BTCAmount.from.BTC(9000000);
        assert.isRejected(vaultsAPI.selectRandomVaultIssue(interBTC));
    });

    it("should select random vault for redeem", async () => {
        const interBTC = BTCAmount.zero;
        const randomVault = await vaultsAPI.selectRandomVaultRedeem(interBTC);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for redeeming is found", async () => {
        const interBTC = BTCAmount.from.BTC(9000000);
        assert.isRejected(vaultsAPI.selectRandomVaultRedeem(interBTC));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        const charlieId = api.createType("AccountId", charlie_stash.address);
        assert.isRejected(vaultsAPI.getVaultCollateralization(charlieId));
    });

    it("should fail to get total collateralization when no tokens are issued", async () => {
        assert.isRejected(vaultsAPI.getSystemCollateralization());
    });

    it("should get vault theft flag", async () => {
        const bobId = api.createType("AccountId", ferdie_stash.address);
        const flaggedForTheft = await vaultsAPI.isVaultFlaggedForTheft(bobId);
        assert.isTrue(flaggedForTheft);
    });

    it("should list issue request by a vault", async () => {
        const bobAddress = ferdie_stash.address;
        const bobId = api.createType("AccountId", bobAddress);
        const issueRequests = await vaultsAPI.mapIssueRequests(bobId);
        issueRequests.forEach((request) => {
            assert.deepEqual(request.vaultDOTAddress, bobAddress);
        });
    });

    it("should list redeem request by a vault", async () => {
        const bobAddress = ferdie_stash.address;
        const bobId = api.createType("AccountId", bobAddress);
        const redeemRequests = await vaultsAPI.mapRedeemRequests(bobId);
        redeemRequests.forEach((request) => {
            assert.deepEqual(request.vaultDOTAddress, bobAddress);
        });
    });

    it("should list replace request by a vault", async () => {
        const eveStashId = api.createType("AccountId", eve_stash.address);
        const replaceRequests = await vaultsAPI.mapReplaceRequests(eveStashId);
        replaceRequests.forEach((request) => {
            assert.deepEqual(request.oldVault, eveStashId);
        });
    });

    it("should get the issuable InterBTC for a vault", async () => {
        const bobId = api.createType("AccountId", ferdie_stash.address);
        const issuableInterBtc = await vaultsAPI.getIssuableAmount(bobId);
        assert.isTrue(issuableInterBtc.gt(BTCAmount.zero));
    });

    it("should get the issuable InterBTC", async () => {
        const issuableInterBtc = await vaultsAPI.getTotalIssuableAmount();
        assert.isTrue(issuableInterBtc.gt(BTCAmount.zero));
    });

    it("should getFees", async () => {
        const feesWrapped = await poolsAPI.getFeesWrapped(charlie_stash.address, Polkadot);
        assert.isTrue(feesWrapped.gte(BTCAmount.zero));
    });

    it("should getAPY", async () => {
        const apy = await vaultsAPI.getAPY(registry.createType("AccountId", charlie_stash.address));
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
