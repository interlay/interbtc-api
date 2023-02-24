import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
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
    LoansAPI,
    DefaultLoansAPI,
    DefaultTransactionAPI,
} from "../../../../../src/index";

import { createSubstrateAPI } from "../../../../../src/factory";
import { assert } from "../../../../chai";
import {
    VAULT_1_URI,
    VAULT_2_URI,
    PARACHAIN_ENDPOINT,
    VAULT_3_URI,
    VAULT_TO_LIQUIDATE_URI,
    VAULT_TO_BAN_URI,
    ESPLORA_BASE_PATH,
} from "../../../../config";
import { newAccountId, WrappedCurrency, newVaultId } from "../../../../../src";
import { getSS58Prefix, newMonetaryAmount } from "../../../../../src/utils";
import {
    getAUSDForeignAsset,
    getCorrespondingCollateralCurrenciesForTests,
    vaultStatusToLabel,
} from "../../../../utils/helpers";
import sinon from "sinon";

describe("vaultsAPI", () => {
    let vault_to_liquidate: KeyringPair;
    let vault_to_ban: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_ids: Array<InterbtcPrimitivesVaultId>;
    let vault_2: KeyringPair;
    let vault_3: KeyringPair;
    let api: ApiPromise;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrencies: Array<CollateralCurrencyExt>;
    let governanceCurrency: GovernanceCurrency;

    let interBtcAPI: InterBtcApi;
    let assetRegistry: AssetRegistryAPI;
    let loansAPI: LoansAPI;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const ss58Prefix = getSS58Prefix(api);
        const keyring = new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
        assetRegistry = new DefaultAssetRegistryAPI(api);
        const transactionAPI = new DefaultTransactionAPI(api);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, ESPLORA_BASE_PATH);

        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        governanceCurrency = interBtcAPI.getGovernanceCurrency();
        loansAPI = new DefaultLoansAPI(api, wrappedCurrency, assetRegistry, transactionAPI);

        collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(governanceCurrency);
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

        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
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
                loansAPI,
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
                loansAPI,
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
            assert.equal(
                collateralizationBeforeDeposit.toString(),
                collateralizationAfterWithdrawal.toString(),
                `Collateralization after identical deposit and withdrawal changed (${currencyTicker} vault)`
            );
        }
        if (prevAccount) {
            interBtcAPI.setAccount(prevAccount);
        }
    });

    it("should getLiquidationCollateralThreshold", async () => {
        for (const collateralCurrency of collateralCurrencies) {
            const currencyTicker = collateralCurrency.ticker;

            const threshold = await interBtcAPI.vaults.getLiquidationCollateralThreshold(collateralCurrency);
            assert.isTrue(
                threshold.gt(0),
                `Expected liquidation threshold for ${currencyTicker} to be greater than 0, but was ${threshold.toString()}`
            );
        }
    });

    it("should getPremiumRedeemThreshold", async () => {
        for (const collateralCurrency of collateralCurrencies) {
            const currencyTicker = collateralCurrency.ticker;

            const threshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(collateralCurrency);
            assert.isTrue(
                threshold.gt(0),
                `Expected premium redeem threshold for ${currencyTicker} to be greater than 0, but was ${threshold.toString()}`
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
                loansAPI,
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
                loansAPI,
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

    it("should getFees", async () => {
        const vaultIdsInScope = vault_1_ids;
        let countSkippedVaults = 0;
        let countVaultsWithNonZeroWrappedRewards = 0;

        for (const vaultId of vaultIdsInScope) {
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                loansAPI,
                vaultId.currencies.collateral
            );
            const wrappedCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                loansAPI,
                vaultId.currencies.wrapped
            );
            const currencyTicker = collateralCurrency.ticker;

            const vault = await interBtcAPI.vaults.get(vaultId.accountId, collateralCurrency);
            const issueableTokens = await vault.getIssuableTokens();
            const issuedTokens = vault.issuedTokens;
            const totalTokensCapacity = issuedTokens.toBig().add(issueableTokens.toBig());
            if (totalTokensCapacity.eq(0)) {
                // no token capacity => no rewards => nothing to check
                countSkippedVaults++;
                continue;
            }

            const feesWrapped = await interBtcAPI.vaults.getWrappedReward(
                vaultId.accountId,
                collateralCurrency,
                wrappedCurrency
            );
            assert.isTrue(
                feesWrapped.gte(newMonetaryAmount(0, wrappedCurrency)),
                // eslint-disable-next-line max-len
                `Fees (wrapped reward) should be greater than or equal to 0 (${currencyTicker} vault, account id ${vaultId.accountId.toString()}), but was: ${feesWrapped.toHuman()}`
            );

            if (feesWrapped.gt(newMonetaryAmount(0, wrappedCurrency))) {
                // we will check that at least one return was greater than zero
                countVaultsWithNonZeroWrappedRewards++;
            }

            const govTokenReward = await interBtcAPI.vaults.getGovernanceReward(
                vaultId.accountId,
                collateralCurrency,
                governanceCurrency
            );
            assert.isTrue(
                govTokenReward.gte(newMonetaryAmount(0, governanceCurrency)),
                // eslint-disable-next-line max-len
                `Governance reward should be greater than or equal to 0 (${currencyTicker} vault, account id ${vaultId.accountId.toString()}), but was: ${feesWrapped.toHuman()}`
            );
        }
        // make sure not every vault has been skipped (due to no issued tokens)
        assert.notEqual(
            countSkippedVaults,
            vaultIdsInScope.length,
            // eslint-disable-next-line max-len
            `Unexpected test behavior: skipped all ${vaultIdsInScope.length} vaults in the test; all vaults lacking capacity (issued + issuable > 0)`
        );

        // make sure at least one vault is receiving wrapped rewards greater than zero
        assert.isAbove(
            countVaultsWithNonZeroWrappedRewards,
            0,
            // eslint-disable-next-line max-len
            `Unexpected test behavior: none of the ${vaultIdsInScope.length} vaults in the test have received more than 0 wrapped token rewards`
        );
    });

    it("should getAPY", async () => {
        for (const vault_1_id of vault_1_ids) {
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                loansAPI,
                vault_1_id.currencies.collateral
            );
            const currencyTicker = collateralCurrency.ticker;
            const accountId = newAccountId(api, vault_1.address);

            const apy = await interBtcAPI.vaults.getAPY(accountId, collateralCurrency);
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
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                assetRegistry,
                loansAPI,
                id.currencies.collateral
            );
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
