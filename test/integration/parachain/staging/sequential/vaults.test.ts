import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, BitcoinUnit, ExchangeRate, Currency } from "@interlay/monetary-js";
import Big from "big.js";
import { 
    DefaultInterBtcApi,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    WrappedIdLiteral,
    currencyIdToMonetaryCurrency,
    CollateralUnit,
    CollateralCurrency,
    tickerToCurrencyIdLiteral,
    GovernanceUnit,
    GovernanceIdLiteral,
    VaultStatusExt
} from "../../../../../src/index";

import { createSubstrateAPI } from "../../../../../src/factory";
import { assert } from "../../../../chai";
import { 
    ORACLE_URI,
    VAULT_1_URI,
    VAULT_2_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    VAULT_3_URI,
    VAULT_TO_LIQUIDATE_URI,
    VAULT_TO_BAN_URI,
    ESPLORA_BASE_PATH 
} from "../../../../config";
import { BitcoinCoreClient, newAccountId, WrappedCurrency, newVaultId, currencyIdToLiteral, CollateralIdLiteral } from "../../../../../src";
import { encodeVaultId, getCorrespondingCollateralCurrencies, issueSingle, newMonetaryAmount } from "../../../../../src/utils";
import { vaultStatusToLabel } from "../../../../utils/helpers";
import sinon from "sinon";

describe("vaultsAPI", () => {
    let oracleAccount: KeyringPair;
    let vault_to_liquidate: KeyringPair;
    let vault_to_ban: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_ids: Array<InterbtcPrimitivesVaultId>;
    let vault_2: KeyringPair;
    let vault_3: KeyringPair;
    let vault_3_ids: Array<InterbtcPrimitivesVaultId>;
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrencies: Array<CollateralCurrency>;
    let governanceCurrency: Currency<GovernanceUnit>;

    let interBtcAPI: InterBtcApi;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, ESPLORA_BASE_PATH);
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        governanceCurrency = interBtcAPI.getGovernanceCurrency();
        collateralCurrencies = getCorrespondingCollateralCurrencies(governanceCurrency);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_ids = collateralCurrencies
            .map(collateralCurrency => newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency));
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_ids = collateralCurrencies
            .map(collateralCurrency => newVaultId(api, vault_3.address, collateralCurrency, wrappedCurrency));
        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);


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

    afterEach(() => {
        // discard any stubbed methods after each test
        sinon.restore();
    });

    function vaultIsATestVault(vaultAddress: string): boolean {
        return vaultAddress === vault_2.address ||
            vaultAddress === vault_1.address ||
            vaultAddress === vault_3.address ||
            vaultAddress === vault_to_ban.address ||
            vaultAddress === vault_to_liquidate.address;
    }

    // FIXME: this should be tested in a way that in doesn't use magic numbers
    it("should get issuable", async () => {
        const issuableInterBTC = await interBtcAPI.vaults.getTotalIssuableAmount();
        const minExpectedIssuableInterBTC = newMonetaryAmount(0.002, wrappedCurrency, true);
        assert.isTrue(issuableInterBTC.gte(minExpectedIssuableInterBTC), `Issuable ${issuableInterBTC.toHuman()}`);
    });

    it("should get the required collateral for the vault", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as Currency<CollateralUnit>;
            const requiredCollateralForVault =
                await interBtcAPI.vaults.getRequiredCollateralForVault(vault_1_id.accountId, collateralCurrency);
    
            const vault = await interBtcAPI.vaults.get(vault_1_id.accountId, currencyIdToLiteral(vault_1_id.currencies.collateral));
    
            // The numeric value of the required collateral should be greater than that of issued tokens.
            // e.g. we require `0.8096` KSM for `0.00014` kBTC
            // edge case: we require 0 KSM for 0 kBTC, so check greater than or equal to
            assert.isTrue(
                requiredCollateralForVault.toBig().gte(vault.getBackedTokens().toBig()),
                `Expect required collateral (${requiredCollateralForVault.toHuman()}) 
                to be greater than or equal to backed tokens (${vault.getBackedTokens().toHuman()})`
            );
        }
    });

    // WARNING: this test is not idempotent
    // PRECONDITION: vault_1 must have issued some tokens against all collateral currencies
    it("should deposit and withdraw collateral", async () => {
        const prevAccount = interBtcAPI.account;
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency;
            const currencyTicker = collateralCurrency.ticker;

            interBtcAPI.setAccount(vault_1);
            const amount = newMonetaryAmount(100, collateralCurrency as Currency<CollateralUnit>, true);
            const collateralCurrencyIdLiteral = tickerToCurrencyIdLiteral(collateralCurrency.ticker) as CollateralIdLiteral;
    
            const collateralizationBeforeDeposit =
                await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_1.address), collateralCurrencyIdLiteral);
            await interBtcAPI.vaults.depositCollateral(amount);
            const collateralizationAfterDeposit =
                await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_1.address), collateralCurrencyIdLiteral);
            if (collateralizationBeforeDeposit === undefined || collateralizationAfterDeposit == undefined) {
                assert.fail(
                    `Collateralization is undefined for vault with collateral currency ${currencyTicker}
                    - potential cause: the vault may not have any issued tokens secured by ${currencyTicker}`
                );
                return;
            }
            assert.isTrue(
                collateralizationAfterDeposit.gt(collateralizationBeforeDeposit),
                `Depositing did not increase collateralization (${currencyTicker} vault),
                expected ${collateralizationAfterDeposit} greater than ${collateralizationBeforeDeposit}`
            );


    
            await interBtcAPI.vaults.withdrawCollateral(amount);
            const collateralizationAfterWithdrawal =
                await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_1.address), collateralCurrencyIdLiteral);
            if (collateralizationAfterWithdrawal === undefined) {
                assert.fail(`Collateralization is undefined for vault with collateral currency ${currencyTicker}`);
                return;
            }
            assert.isTrue(
                collateralizationAfterDeposit.gt(collateralizationAfterWithdrawal),
                `Withdrawing did not decrease collateralization (${currencyTicker} vault), expected
                ${collateralizationAfterDeposit} greater than ${collateralizationAfterWithdrawal}`
            );
            assert.equal(
                collateralizationBeforeDeposit.toString(), collateralizationAfterWithdrawal.toString(),
                `Collateralization after identical deposit and withdrawal changed (${currencyTicker} vault)`
            );
        }
        if (prevAccount) {
            interBtcAPI.setAccount(prevAccount);
        }
    });

    it("should getPremiumRedeemVaults after a price crash", async () => {
        for (const vault_3_id of vault_3_ids) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vault_3_id.currencies.collateral) as CollateralCurrency;
            const currencyTicker = collateralCurrency.ticker;

            const collateralCurrencyIdLiteral = currencyIdToLiteral(vault_3_id.currencies.collateral) as CollateralIdLiteral;
            const vault = await interBtcAPI.vaults.get(vault_3_id.accountId, collateralCurrencyIdLiteral);
            let issuableAmount = await vault.getIssuableTokens();
            // TODO: Look into why requesting the full issuable amount fails, and remove the line below
            issuableAmount = issuableAmount.mul(0.9);
            await issueSingle(interBtcAPI, bitcoinCoreClient, oracleAccount, issuableAmount, vault_3_id);
    
            const currentVaultCollateralization =
                await interBtcAPI.vaults.getVaultCollateralization(newAccountId(api, vault_3.address), collateralCurrencyIdLiteral);
            if (currentVaultCollateralization === undefined) {
                throw new Error("Collateralization is undefined");
            }
    
            const collateralCurrencyTyped = collateralCurrency as Currency<CollateralUnit>;
    
            // The factor to adjust the exchange rate by. Calculated such that the resulting collateralization
            // will be 90% of the premium redeem threshold. (e.g. 1.35 * 90% = 1.215)
            const premiumRedeemThreshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(collateralCurrency);
            const modifyExchangeRateBy = premiumRedeemThreshold.mul(0.9).div(currentVaultCollateralization);
    
            const initialExchangeRate = await interBtcAPI.oracle.getExchangeRate(collateralCurrencyTyped);
            // crash the exchange rate so that the vault falls below the premium redeem threshold
            const exchangeRateValue = initialExchangeRate.toBig().div(modifyExchangeRateBy);
            const mockExchangeRate = new ExchangeRate<
                Bitcoin,
                BitcoinUnit,
                typeof collateralCurrencyTyped,
                typeof collateralCurrencyTyped.units
            >(Bitcoin, collateralCurrencyTyped, exchangeRateValue);
    
            // stub the oracle API to always return the new exchange rate
            const stub = sinon.stub(interBtcAPI.oracle, "getExchangeRate")
                .withArgs(sinon.match.any)
                .returns(Promise.resolve(mockExchangeRate as any)); // "as any" to help eslint play nicely
    
            const premiumRedeemVaults = await interBtcAPI.vaults.getPremiumRedeemVaults();
    
            // Check that the stub has indeed been called at least once 
            // If not, code has changed and our assumptions when mocking the oracle API are no longer valid
            sinon.assert.called(stub);
    
            // real assertions here
            assert.equal(premiumRedeemVaults.size, 1);
            assert.equal(
                encodeVaultId(premiumRedeemVaults.keys().next().value),
                encodeVaultId(vault_3_id),
                `Premium redeem vault is not the expected one (${currencyTicker} vault)`
            );
    
            const premiumRedeemAmount = premiumRedeemVaults.values().next().value;
            assert.isTrue(
                premiumRedeemAmount.gte(issuableAmount),
                `Amount available for premium redeem should be higher (${currencyTicker} vault)`
            );
        }
    }).timeout(10 * 60000);

    it("should getLiquidationCollateralThreshold", async () => {
        for (const collateralCurrency of collateralCurrencies) {
            const currencyTicker = collateralCurrency.ticker;
            const threshold = await interBtcAPI.vaults.getLiquidationCollateralThreshold(collateralCurrency);
            assert.equal(
                threshold.toString(), 
                "1.1",
                `Liquidation collateral threshold is not 1.1 (${currencyTicker})`
            );
        }
    });

    it("should getPremiumRedeemThreshold", async () => {
        for (const collateralCurrency of collateralCurrencies) {
            const currencyTicker = collateralCurrency.ticker;
            const threshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(collateralCurrency);
            assert.equal(
                threshold.toString(), 
                "1.35",
                `Premium redeem threshold is not 1.35 (${currencyTicker})`
            );
        }
    });

    it("should select random vault for issue", async () => {
        const randomVault = await interBtcAPI.vaults.selectRandomVaultIssue(newMonetaryAmount(0, wrappedCurrency));
        assert.isTrue(vaultIsATestVault(randomVault.accountId.toHuman()));
    });

    it("should fail if no vault for issuing is found", async () => {
        assert.isRejected(interBtcAPI.vaults.selectRandomVaultIssue(newMonetaryAmount(9000000, wrappedCurrency, true)));
    });

    it("should select random vault for redeem", async () => {
        const randomVault = await interBtcAPI.vaults.selectRandomVaultRedeem(newMonetaryAmount(0, wrappedCurrency));
        assert.isTrue(vaultIsATestVault(randomVault.accountId.toHuman()));
    });

    it("should fail if no vault for redeeming is found", async () => {
        const amount = newMonetaryAmount(9000000, wrappedCurrency, true);
        assert.isRejected(interBtcAPI.vaults.selectRandomVaultRedeem(amount));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency;
            const currencyTicker = collateralCurrency.ticker;

            const vault1Id = newAccountId(api, vault_1.address);
            const collateralCurrencyIdLiteral = tickerToCurrencyIdLiteral(collateralCurrency.ticker) as CollateralIdLiteral;
            assert.isRejected(
                interBtcAPI.vaults.getVaultCollateralization(vault1Id, collateralCurrencyIdLiteral),
                `Collateralization should not be available (${currencyTicker} vault)`
            );
        }
    });

    it("should get the issuable InterBtc for a vault", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency;
            const currencyTicker = collateralCurrency.ticker;

            const collateralCurrencyIdLiteral = currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral;
            const vault = await interBtcAPI.vaults.get(vault_1_id.accountId, collateralCurrencyIdLiteral);
            const issuableTokens = await vault.getIssuableTokens();
            assert.isTrue(
                issuableTokens.gt(newMonetaryAmount(0, wrappedCurrency)),
                `Issuable tokens should be greater than 0 (${currencyTicker} vault)`
            );
        }
    });

    it("should get the issuable InterBtc", async () => {
        const issuableInterBtc = await interBtcAPI.vaults.getTotalIssuableAmount();
        assert.isTrue(issuableInterBtc.gt(newMonetaryAmount(0, wrappedCurrency)));
    });

    // TODO: revisit after next publish why intrReward is always zero
    it.skip("should getFees", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency;
            const currencyTicker = collateralCurrency.ticker;

            const vault1Id = newAccountId(api, vault_1.address);

            const feesWrapped = await interBtcAPI.vaults.getWrappedReward(
                vault1Id,
                currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral,
                currencyIdToLiteral(vault_1_id.currencies.wrapped) as WrappedIdLiteral
            );
            assert.isTrue(
                feesWrapped.gt(newMonetaryAmount(0, wrappedCurrency)),
                `Fees should be greater than 0 (${currencyTicker} vault)`
            );

            const intrReward = await interBtcAPI.vaults.getGovernanceReward(
                vault1Id,
                currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral,
                tickerToCurrencyIdLiteral(governanceCurrency.ticker) as GovernanceIdLiteral
            );
            assert.isTrue(
                intrReward.gt(newMonetaryAmount(0, governanceCurrency)),
                `Governance reward should be greater than 0 (${currencyTicker} vault)`
            );
        }
    });

    it("should getAPY", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency;
            const currencyTicker = collateralCurrency.ticker;

            const apy =
                await interBtcAPI.vaults.getAPY(
                    newAccountId(api, vault_1.address), currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral
                );
            const apyBig = new Big(apy);
            const apyBenchmark = new Big("0");
            assert.isTrue(
                apyBig.gte(apyBenchmark),
                `APY should be greater than or equal to ${apyBenchmark.toString()},
                    but was ${apyBig.toString()} (${currencyTicker} vault)`
            );
        }
    });

    it("should getPunishmentFee", async () => {
        const punishmentFee = await interBtcAPI.vaults.getPunishmentFee();
        assert.equal(punishmentFee.toString(), "0.1");
    });

    it("should get vault list", async () => {
        const vaults = (await interBtcAPI.vaults.list()).map(vault => vault.id.toHuman());
        assert.isAbove(vaults.length, 0, "Vault list should not be empty");
    });

    it("should disable and enable issuing with vault", async () => {
        const assertVaultStatus = async (id: InterbtcPrimitivesVaultId, expectedStatus: VaultStatusExt) => {
            const collateralCurrencyIdLiteral = currencyIdToLiteral(id.currencies.collateral);
            const currencyTicker = currencyIdToMonetaryCurrency(id.currencies.collateral).ticker;
            const { status } = await interBtcAPI.vaults.get(id.accountId, collateralCurrencyIdLiteral);
            const assertionMessage = `Vault with id ${id.toString()} (collateral: ${currencyTicker}) was expected to have 
                    status: ${vaultStatusToLabel(expectedStatus)}, but got status: ${vaultStatusToLabel(status)}`;

            assert.isTrue(status === expectedStatus, assertionMessage);
        };
        const ACCEPT_NEW_ISSUES = true;
        const REJECT_NEW_ISSUES = false;

        for (const vault_1_id of vault_1_ids) {
            // Check that vault 1 is active.
            await assertVaultStatus(vault_1_id, VaultStatusExt.Active);
            // Disables vault 1 which is active.
            await interBtcAPI.vaults.toggleIssueRequests(vault_1_id, REJECT_NEW_ISSUES);
            // Check that vault 1 is inactive.
            await assertVaultStatus(vault_1_id, VaultStatusExt.Inactive);
            // Re-enable issuing with vault 1.
            await interBtcAPI.vaults.toggleIssueRequests(vault_1_id, ACCEPT_NEW_ISSUES);
            // Check that vault 1 is again active.
            await assertVaultStatus(vault_1_id, VaultStatusExt.Active);
        }
    });
});
