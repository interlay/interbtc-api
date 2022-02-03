import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, InterBtcAmount, BitcoinUnit, ExchangeRate, InterBtc, Polkadot, PolkadotAmount, PolkadotUnit, Kusama, Interlay } from "@interlay/monetary-js";
import * as bitcoinjs from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultInterBtcApi, InterBtcApi, InterbtcPrimitivesVaultId, WrappedIdLiteral, GovernanceCurrency } from "../../../../src/index";

import { createSubstrateAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { ORACLE_URI, VAULT_1_URI, VAULT_2_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, VAULT_3_URI, VAULT_TO_LIQUIDATE_URI, VAULT_TO_BAN_URI, ESPLORA_BASE_PATH, WRAPPED_CURRENCY_TICKER, COLLATERAL_CURRENCY_TICKER, GOVERNANCE_CURRENCY_TICKER } from "../../../config";
import { BitcoinCoreClient, DefaultVaultsAPI, DefaultElectrsAPI, DefaultOracleAPI, ElectrsAPI, newAccountId, CollateralCurrency, WrappedCurrency, newVaultId, currencyIdToLiteral, CollateralIdLiteral, tickerToMonetaryCurrency, CurrencyIdLiteral } from "../../../../src/";
import { encodeVaultId, issueSingle } from "../../../../src/utils";
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
    let bitcoinCoreClient: BitcoinCoreClient;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrency: Currency<CollateralUnit>;

    let interBtcAPI: InterBtcApi;
    let oracleInterBtcAPI: InterBtcApi;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        const governanceCurrency = tickerToMonetaryCurrency(api, GOVERNANCE_CURRENCY_TICKER) as GovernanceCurrency;
        const keyring = new Keyring({ type: "sr25519" });
        collateralCurrency = tickerToMonetaryCurrency(api, COLLATERAL_CURRENCY_TICKER) as Currency<CollateralUnit>;
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, Polkadot, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, Kusama, wrappedCurrency);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_id = newVaultId(api, vault_3.address, Polkadot, wrappedCurrency);
        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);

        interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, ESPLORA_BASE_PATH);
        oracleInterBtcAPI = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);

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
        const issuableInterBTC = await interBtcAPI.vaults.getTotalIssuableAmount();
        const minExpectedIssuableInterBTC = InterBtcAmount.from.BTC(0.005);
        assert.isTrue(issuableInterBTC.gte(minExpectedIssuableInterBTC));
    });

    it.only("should get the required collateral for the vault", async () => {
        interBtcAPI.setAccount(vault_1);
        const vault1Id = newAccountId(api, vault_1.address);

        const requiredCollateralForVault =
            await interBtcAPI.vaults.getRequiredCollateralForVault(vault1Id, collateralCurrency);
            
        console.log("requiredCollateralForVault", requiredCollateralForVault);
        assert.exists(requiredCollateralForVault);
    });

    // WARNING: this test is not idempotent
    it("should deposit and withdraw collateral", async () => {
        interBtcAPI.setAccount(vault_1);
        const amount = PolkadotAmount.from.DOT(100);

        const collateralizationBeforeDeposit = 
            await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_1.address), CurrencyIdLiteral.DOT);
        await interBtcAPI.vaults.depositCollateral(amount);
        const collateralizationAfterDeposit = 
            await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_1.address), CurrencyIdLiteral.DOT);
        if (collateralizationBeforeDeposit === undefined || collateralizationAfterDeposit == undefined) {
            throw new Error("Collateralization is undefined");
        }
        assert.isTrue(
            collateralizationAfterDeposit > collateralizationBeforeDeposit,
            "Depositing did not increase collateralization"
        );

        await interBtcAPI.vaults.withdrawCollateral(amount);
        const collateralizationAfterWithdrawal = 
            await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_1.address), CurrencyIdLiteral.DOT);
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
        const collateralCurrencyIdLiteral = currencyIdToLiteral(vault_3_id.currencies.collateral) as CollateralIdLiteral;
        const vault = await interBtcAPI.vaults.get(vault_3_id.accountId, collateralCurrencyIdLiteral);
        const issuableAmount = await vault.getIssuableTokens();
        await issueSingle(interBtcAPI, bitcoinCoreClient, oracleAccount, issuableAmount, vault_3_id);

        const currentVaultCollateralization = 
            await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_3.address), collateralCurrencyIdLiteral);
        if (currentVaultCollateralization === undefined) {
            throw new Error("Collateralization is undefined");
        }

        // The factor to adjust the exchange rate by. Calculated such that the resulting collateralization
        // will be 90% of the premium redeem threshold. (e.g. 1.35 * 90% = 1.215)
        const premiumRedeemThreshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(Polkadot);
        const modifyExchangeRateBy = premiumRedeemThreshold.mul(0.9).div(currentVaultCollateralization);

        const initialExchangeRate = await interBtcAPI.oracle.getExchangeRate(Polkadot);
        // crash the exchange rate so that the vault falls below the premium redeem threshold
        const exchangeRateValue = initialExchangeRate.toBig().div(modifyExchangeRateBy);
        const exchangeRateToSet = new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);

        await callWithExchangeRate(oracleInterBtcAPI.oracle, exchangeRateToSet, async () => {
            const premiumRedeemVaults = await interBtcAPI.vaults.getPremiumRedeemVaults();
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
        const threshold = await interBtcAPI.vaults.getLiquidationCollateralThreshold(Polkadot);
        assert.equal(threshold.toString(), "1.1");
    });

    it("should getPremiumRedeemThreshold", async () => {
        const threshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(Polkadot);
        assert.equal(threshold.toString(), "1.35");
    });

    it("should select random vault for issue", async () => {
        const randomVault = await interBtcAPI.vaults.selectRandomVaultIssue(InterBtcAmount.zero);
        assert.isTrue(vaultIsATestVault(randomVault.accountId.toHuman()));
    });

    it("should fail if no vault for issuing is found", async () => {
        assert.isRejected(interBtcAPI.vaults.selectRandomVaultIssue(InterBtcAmount.from.BTC(9000000)));
    });

    it("should select random vault for redeem", async () => {
        const randomVault = await interBtcAPI.vaults.selectRandomVaultRedeem(InterBtcAmount.zero);
        assert.isTrue(vaultIsATestVault(randomVault.accountId.toHuman()));
    });

    it("should fail if no vault for redeeming is found", async () => {
        const InterBtc = InterBtcAmount.from.BTC(9000000);
        assert.isRejected(interBtcAPI.vaults.selectRandomVaultRedeem(InterBtc));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        const vault1Id = newAccountId(api, vault_1.address);
        assert.isRejected(interBtcAPI.vaults.getVaultCollateralization(vault1Id, CurrencyIdLiteral.DOT));
    });

    it("should get the issuable InterBtc for a vault", async () => {
        const collateralCurrencyIdLiteral = currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral;
        const vault = await interBtcAPI.vaults.get(vault_1_id.accountId, collateralCurrencyIdLiteral);
        const issuableTokens = await vault.getIssuableTokens();
        assert.isTrue(issuableTokens.gt(InterBtcAmount.zero));
    });

    it("should get the issuable InterBtc", async () => {
        const issuableInterBtc = await interBtcAPI.vaults.getTotalIssuableAmount();
        assert.isTrue(issuableInterBtc.gt(InterBtcAmount.zero));
    });

    it("should getFees", async () => {
        const vault1Id = newAccountId(api, vault_1.address);
        const feesWrapped = await interBtcAPI.vaults.getWrappedReward(
            vault1Id,
            currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral,
            currencyIdToLiteral(vault_1_id.currencies.wrapped) as WrappedIdLiteral
        );
        assert.isTrue(feesWrapped.gt(InterBtcAmount.zero));

        const kintReward = await interBtcAPI.vaults.computeReward(
            vault1Id,
            vault1Id,
            currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral,
            CurrencyIdLiteral.INTR
        );
        console.log(`kint rwad: ${kintReward.toString()}`);
        console.log(`wrapped rwd: ${feesWrapped}`);
        assert.isTrue(feesWrapped.gt(InterBtcAmount.zero));
    });

    it("should getAPY", async () => {
        const apy = 
            await interBtcAPI.vaults.getAPY(
                newAccountId(api, vault_1.address), currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral
            );
        const apyBig = new Big(apy);
        const apyBenchmark = new Big("0");
        assert.isTrue(apyBig.gte(apyBenchmark));
    });

    it("should getPunishmentFee", async () => {
        const punishmentFee = await interBtcAPI.vaults.getPunishmentFee();
        assert.equal(punishmentFee.toString(), "0.1");
    });

    it("should get vault list", async () => {
        const vaults = (await interBtcAPI.vaults.list()).map(vault => vault.id.toHuman());
        assert.isAbove(vaults.length, 0, "Vault list should not be empty");
    });
});
