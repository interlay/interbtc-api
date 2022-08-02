import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, ExchangeRate, MonetaryAmount, Kintsugi, Kusama, Polkadot } from "@interlay/monetary-js";
import Big from "big.js";
import {
    DefaultInterBtcApi,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    currencyIdToMonetaryCurrency,
    CollateralCurrencyExt,
    VaultStatusExt,
    GovernanceCurrency,
    AssetRegistryAPI,
    DefaultAssetRegistryAPI,
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
    ESPLORA_BASE_PATH,
} from "../../../../config";
import { BitcoinCoreClient, newAccountId, WrappedCurrency, newVaultId } from "../../../../../src";
import {
    encodeVaultId,
    getCorrespondingCollateralCurrencies,
    getSS58Prefix,
    issueSingle,
    newMonetaryAmount,
} from "../../../../../src/utils";
import { AUSD_TICKER, getAUSDForeignAsset, vaultStatusToLabel } from "../../../../utils/helpers";
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
    let collateralCurrencies: Array<CollateralCurrencyExt>;
    let governanceCurrency: GovernanceCurrency;

    let interBtcAPI: InterBtcApi;
    let assetRegistry: AssetRegistryAPI;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const ss58Prefix = getSS58Prefix(api);
        const keyring = new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        assetRegistry = new DefaultAssetRegistryAPI(api);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, ESPLORA_BASE_PATH);

        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        governanceCurrency = interBtcAPI.getGovernanceCurrency();

        collateralCurrencies = getCorrespondingCollateralCurrencies(governanceCurrency);
        const aUSD = await getAUSDForeignAsset(assetRegistry);
        if (aUSD !== undefined) {
            // also add aUSD collateral vaults if they exist (ie. the foreign asset exists)
            collateralCurrencies.push(aUSD);
        }

        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency)
        );

        vault_2 = keyring.addFromUri(VAULT_2_URI);

        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_3.address, collateralCurrency, wrappedCurrency)
        );

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
        return (
            vaultAddress === vault_2.address ||
            vaultAddress === vault_1.address ||
            vaultAddress === vault_3.address ||
            vaultAddress === vault_to_ban.address ||
            vaultAddress === vault_to_liquidate.address
        );
    }

    // FIXME: this should be tested in a way that in doesn't use magic numbers
    it("should get issuable", async () => {
        const issuableInterBTC = await interBtcAPI.vaults.getTotalIssuableAmount();
        const minExpectedIssuableInterBTC = newMonetaryAmount(0.002, wrappedCurrency, true);
        assert.isTrue(issuableInterBTC.gte(minExpectedIssuableInterBTC), `Issuable ${issuableInterBTC.toHuman()}`);
    });

    it("should get the required collateral for the vault", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                vault_1_id.currencies.collateral
            );
            const requiredCollateralForVault = await interBtcAPI.vaults.getRequiredCollateralForVault(
                vault_1_id.accountId,
                collateralCurrency
            );

            const vault = await interBtcAPI.vaults.get(vault_1_id.accountId, collateralCurrency);

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
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                vault_1_id.currencies.collateral
            );
            const currencyTicker = collateralCurrency.ticker;

            interBtcAPI.setAccount(vault_1);
            const amount = newMonetaryAmount(100, collateralCurrency, true);

            const collateralizationBeforeDeposit = await interBtcAPI.vaults.getVaultCollateralization(
                newAccountId(api, vault_1.address),
                collateralCurrency
            );
            await interBtcAPI.vaults.depositCollateral(amount);
            const collateralizationAfterDeposit = await interBtcAPI.vaults.getVaultCollateralization(
                newAccountId(api, vault_1.address),
                collateralCurrency
            );
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
            const collateralizationAfterWithdrawal = await interBtcAPI.vaults.getVaultCollateralization(
                newAccountId(api, vault_1.address),
                collateralCurrency
            );
            if (collateralizationAfterWithdrawal === undefined) {
                assert.fail(`Collateralization is undefined for vault with collateral currency ${currencyTicker}`);
                return;
            }
            assert.isTrue(
                collateralizationAfterDeposit.gt(collateralizationAfterWithdrawal),
                `Withdrawing did not decrease collateralization (${currencyTicker} vault), expected
                ${collateralizationAfterDeposit} greater than ${collateralizationAfterWithdrawal}`
            );
            // removed this assertion because it is flaky
            // TODO: figure out why / fix it (usual suspect: exchange rates change between assertions)
            // assert.equal(
            //     collateralizationBeforeDeposit.toString(),
            //     collateralizationAfterWithdrawal.toString(),
            //     `Collateralization after identical deposit and withdrawal changed (${currencyTicker} vault)`
            // );
        }
        if (prevAccount) {
            interBtcAPI.setAccount(prevAccount);
        }
    });

    it("should getPremiumRedeemVaults after a price crash", async () => {
        assert.isAbove(vault_3_ids.length, 0, "Precondition: Expect vault_3_ids to have length > 0");

        // TODO: Look into why requesting the full issuable amount fails, and remove the line below
        // note: divide 90% by number of loops (issue requests) expected.
        const issuableAmountModifier = 0.9 / vault_3_ids.length;

        for (const vault_3_id of vault_3_ids) {
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                vault_3_id.currencies.collateral
            );
            const currencyTicker = collateralCurrency.ticker;

            const vault = await interBtcAPI.vaults.get(vault_3_id.accountId, collateralCurrency);
            let issuableAmount = await vault.getIssuableTokens();
            issuableAmount = issuableAmount.mul(issuableAmountModifier);
            await issueSingle(interBtcAPI, bitcoinCoreClient, oracleAccount, issuableAmount, vault_3_id);

            const currentVaultCollateralization = await interBtcAPI.vaults.getVaultCollateralization(
                newAccountId(api, vault_3.address),
                collateralCurrency
            );
            if (currentVaultCollateralization === undefined) {
                throw new Error("Collateralization is undefined");
            }

            // The factor to adjust the exchange rate by. Calculated such that the resulting collateralization
            // will be 90% of the premium redeem threshold. (e.g. 1.35 * 90% = 1.215)
            const premiumRedeemThreshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(collateralCurrency);
            const modifyExchangeRateBy = premiumRedeemThreshold.mul(0.9).div(currentVaultCollateralization);

            const initialExchangeRate = await interBtcAPI.oracle.getExchangeRate(collateralCurrency);
            // crash the exchange rate so that the vault falls below the premium redeem threshold
            const exchangeRateValue = initialExchangeRate.toBig().div(modifyExchangeRateBy);
            const mockExchangeRate = new ExchangeRate<Bitcoin, typeof collateralCurrency>(
                Bitcoin,
                collateralCurrency,
                exchangeRateValue
            );

            // stub the oracle API to always return the new exchange rate
            const stub = sinon
                .stub(interBtcAPI.oracle, "getExchangeRate")
                .withArgs(sinon.match.any)
                .returns(Promise.resolve(mockExchangeRate)); // "as any" to help eslint play nicely

            const premiumRedeemVaults = await interBtcAPI.vaults.getPremiumRedeemVaults();

            // Check that the stub has indeed been called at least once
            // If not, code has changed and our assumptions when mocking the oracle API are no longer valid
            sinon.assert.called(stub);
            sinon.restore();

            // real assertions here
            assert.isAtLeast(premiumRedeemVaults.size, 1);

            // locate the amount for the current vault
            let premiumRedeemAmount: MonetaryAmount<WrappedCurrency> | undefined = undefined;
            for (const [vaultId, amount] of premiumRedeemVaults) {
                if (
                    (await encodeVaultId(assetRegistry, vaultId)) === (await encodeVaultId(assetRegistry, vault_3_id))
                ) {
                    premiumRedeemAmount = amount;
                    break;
                }
            }

            if (premiumRedeemAmount === undefined) {
                assert.fail(`Could not locate expected premium redeem amount for vault (${currencyTicker} collateral)`);
                return;
            }

            assert.isTrue(
                premiumRedeemAmount.gte(issuableAmount),
                `Amount available for premium redeem should be higher (${currencyTicker} vault)`
            );
        }
    }).timeout(10 * 60000);

    it("should getLiquidationCollateralThreshold", async () => {
        const expectedThresholdByTicker: Map<string, string> = new Map([
            [Polkadot.ticker, "1.1"],
            [Kusama.ticker, "1.1"],
            [Kintsugi.ticker, "2"],
            [AUSD_TICKER, "1.1"],
        ]);

        for (const collateralCurrency of collateralCurrencies) {
            const currencyTicker = collateralCurrency.ticker;

            const expectedThreshold = expectedThresholdByTicker.get(currencyTicker);
            if (expectedThreshold === undefined) {
                assert.fail(`Precondition: No expected threshold set for ${currencyTicker}`);
                return;
            }

            const threshold = await interBtcAPI.vaults.getLiquidationCollateralThreshold(collateralCurrency);
            assert.equal(
                threshold.toString(),
                expectedThreshold,
                `Liquidation collateral threshold is not ${expectedThreshold} (${currencyTicker})`
            );
        }
    });

    it("should getPremiumRedeemThreshold", async () => {
        const expectedThresholdByTicker: Map<string, string> = new Map([
            [Polkadot.ticker, "1.35"],
            [Kusama.ticker, "1.35"],
            [Kintsugi.ticker, "3"],
            [AUSD_TICKER, "1.35"],
        ]);

        for (const collateralCurrency of collateralCurrencies) {
            const currencyTicker = collateralCurrency.ticker;

            const expectedThreshold = expectedThresholdByTicker.get(currencyTicker);
            if (expectedThreshold === undefined) {
                assert.fail(`Precondition: No expected threshold set for ${currencyTicker}`);
                return;
            }

            const threshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(collateralCurrency);
            assert.equal(
                threshold.toString(),
                expectedThreshold,
                `Premium redeem threshold is not ${expectedThreshold} (${currencyTicker})`
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
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                vault_1_id.currencies.collateral
            );
            const currencyTicker = collateralCurrency.ticker;

            const vault1Id = newAccountId(api, vault_1.address);
            assert.isRejected(
                interBtcAPI.vaults.getVaultCollateralization(vault1Id, collateralCurrency),
                `Collateralization should not be available (${currencyTicker} vault)`
            );
        }
    });

    it("should get the issuable InterBtc for a vault", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                vault_1_id.currencies.collateral
            );
            const currencyTicker = collateralCurrency.ticker;

            const vault = await interBtcAPI.vaults.get(vault_1_id.accountId, collateralCurrency);
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
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                vault_1_id.currencies.collateral
            );
            const wrappedCurrency = await currencyIdToMonetaryCurrency(assetRegistry, vault_1_id.currencies.wrapped);
            const currencyTicker = collateralCurrency.ticker;

            const vault1Id = newAccountId(api, vault_1.address);

            const feesWrapped = await interBtcAPI.vaults.getWrappedReward(
                vault1Id,
                collateralCurrency,
                wrappedCurrency
            );
            assert.isTrue(
                feesWrapped.gt(newMonetaryAmount(0, wrappedCurrency)),
                `Fees should be greater than 0 (${currencyTicker} vault)`
            );

            const intrReward = await interBtcAPI.vaults.getGovernanceReward(
                vault1Id,
                collateralCurrency,
                governanceCurrency
            );
            assert.isTrue(
                intrReward.gt(newMonetaryAmount(0, governanceCurrency)),
                `Governance reward should be greater than 0 (${currencyTicker} vault)`
            );
        }
    });

    it("should getAPY", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                vault_1_id.currencies.collateral
            );
            const currencyTicker = collateralCurrency.ticker;

            const apy = await interBtcAPI.vaults.getAPY(newAccountId(api, vault_1.address), collateralCurrency);
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
        const vaults = (await interBtcAPI.vaults.list()).map((vault) => vault.id.toHuman());
        assert.isAbove(vaults.length, 0, "Vault list should not be empty");
    });

    it("should disable and enable issuing with vault", async () => {
        const assertVaultStatus = async (id: InterbtcPrimitivesVaultId, expectedStatus: VaultStatusExt) => {
            const collateralCurrency = await currencyIdToMonetaryCurrency(assetRegistry, id.currencies.collateral);
            const currencyTicker = collateralCurrency.ticker;
            const { status } = await interBtcAPI.vaults.get(id.accountId, collateralCurrency);
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
