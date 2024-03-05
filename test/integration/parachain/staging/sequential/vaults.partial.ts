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
    DefaultTransactionAPI,
} from "../../../../../src/index";

import { createSubstrateAPI } from "../../../../../src/factory";
import { VAULT_1_URI, VAULT_2_URI, PARACHAIN_ENDPOINT, VAULT_3_URI, ESPLORA_BASE_PATH, SUDO_URI } from "../../../../config";
import { newAccountId, WrappedCurrency, newVaultId } from "../../../../../src";
import { getSS58Prefix, newCurrencyId, newMonetaryAmount } from "../../../../../src/utils";
import {
    getAUSDForeignAsset,
    getCorrespondingCollateralCurrenciesForTests,
    getIssuableAmounts,
    submitExtrinsic,
    vaultStatusToLabel,
} from "../../../../utils/helpers";

export const vaultsTests = () => {
    describe("vaultsAPI", () => {
        let sudoAccount: KeyringPair;
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
    
        beforeAll(async () => {
            api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
            const ss58Prefix = getSS58Prefix(api);
            const keyring = new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
            assetRegistry = new DefaultAssetRegistryAPI(api);
            interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, ESPLORA_BASE_PATH);
    
            wrappedCurrency = interBtcAPI.getWrappedCurrency();
            governanceCurrency = interBtcAPI.getGovernanceCurrency();
    
            collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(governanceCurrency);
            const aUSD = await getAUSDForeignAsset(assetRegistry);
            if (aUSD !== undefined) {
                // also add aUSD collateral vaults if they exist (ie. the foreign asset exists)
                collateralCurrencies.push(aUSD);
            }
            
            sudoAccount = keyring.addFromUri(SUDO_URI);
            vault_1 = keyring.addFromUri(VAULT_1_URI);
            vault_1_ids = collateralCurrencies.map((collateralCurrency) =>
                newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency)
            );
    
            vault_2 = keyring.addFromUri(VAULT_2_URI);
            vault_3 = keyring.addFromUri(VAULT_3_URI);
        });
    
        afterAll(async () => {
            await api.disconnect();
        });
    
        afterEach(() => {
            // discard any stubbed methods after each test
            jest.restoreAllMocks();
        });
    
        function vaultIsATestVault(vaultAddress: string): boolean {
            return vaultAddress === vault_2.address || vaultAddress === vault_1.address || vaultAddress === vault_3.address;
        }
    
        it("should get issuable", async () => {
            const issuableInterBTC = await interBtcAPI.vaults.getTotalIssuableAmount();
            const issuableAmounts = await getIssuableAmounts(interBtcAPI);
            const totalIssuable = issuableAmounts.reduce((prev, curr) => prev.add(curr));
            expect(issuableInterBTC.toBig().sub(totalIssuable.toBig()).abs().lte(1)).toBe(true);
        });
    
        it("should get the required collateral for the vault", async () => {
            for (const vault_1_id of vault_1_ids) {
                const collateralCurrency = await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral);
                const requiredCollateralForVault = await interBtcAPI.vaults.getRequiredCollateralForVault(
                    vault_1_id.accountId,
                    collateralCurrency
                );
    
                const vault = await interBtcAPI.vaults.get(vault_1_id.accountId, collateralCurrency);
    
                // The numeric value of the required collateral should be greater than that of issued tokens.
                // e.g. we require `0.8096` KSM for `0.00014` kBTC
                // edge case: we require 0 KSM for 0 kBTC, so check greater than or equal to
                expect(requiredCollateralForVault.toBig().gte(vault.getBackedTokens().toBig())).toBe(true);
            }
        });
    
        // WARNING: this test is not idempotent
        // PRECONDITION: vault_1 must have issued some tokens against all collateral currencies
        it("should deposit and withdraw collateral", async () => {
            const interBtcAPI = new DefaultInterBtcApi(api, "regtest", vault_1, ESPLORA_BASE_PATH);
            for (const vault_1_id of vault_1_ids) {
                const collateralCurrency = await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral);
                const currencyTicker = collateralCurrency.ticker;
    
                const amount = newMonetaryAmount(100, collateralCurrency, true);
    
                const collateralizationBeforeDeposit = await interBtcAPI.vaults.getVaultCollateralization(
                    newAccountId(api, vault_1.address),
                    collateralCurrency
                );
                await submitExtrinsic(interBtcAPI, interBtcAPI.vaults.depositCollateral(amount));
                const collateralizationAfterDeposit = await interBtcAPI.vaults.getVaultCollateralization(
                    newAccountId(api, vault_1.address),
                    collateralCurrency
                );
                if (collateralizationBeforeDeposit === undefined || collateralizationAfterDeposit == undefined) {
                    throw Error(
                        `Collateralization is undefined for vault with collateral currency ${currencyTicker}
                        - potential cause: the vault may not have any issued tokens secured by ${currencyTicker}`
                    );
                }
                expect(collateralizationAfterDeposit.gt(collateralizationBeforeDeposit)).toBe(true);
    
                await submitExtrinsic(interBtcAPI, await interBtcAPI.vaults.withdrawCollateral(amount));
                const collateralizationAfterWithdrawal = await interBtcAPI.vaults.getVaultCollateralization(
                    newAccountId(api, vault_1.address),
                    collateralCurrency
                );
                if (collateralizationAfterWithdrawal === undefined) {
                    throw Error(`Collateralization is undefined for vault with collateral currency ${currencyTicker}`);
                }
                expect(collateralizationAfterDeposit.gt(collateralizationAfterWithdrawal)).toBe(true);
                expect(collateralizationBeforeDeposit.toString()).toEqual(collateralizationAfterWithdrawal.toString());
            }
        });

        it("should be able to withdraw all collateral", async () => {
            const vaults = await interBtcAPI.vaults.list();
            // find vault with issued tokens, but zero to-be-issued tokens
            const vaultExt = vaults.find((vault) => vault.toBeIssuedTokens.isZero() && vault.issuedTokens.toBig().gt(0));

            if (vaultExt === undefined) {
                throw Error("Precondition failure: Unable to find test vault to attempt withdraw all collateral");
            }

            const vaultAccountId = newAccountId(api, vaultExt.id.accountId.toHuman());
            const collateralCurrency = await currencyIdToMonetaryCurrency(api, vaultExt.id.currencies.collateral);
            
            // give enough wrapped tokens to vault to be able to self redeem all
            const amountIssued = vaultExt.getBackedTokens();
            // .toBig(0) returns amount in atomic units
            const amountIssuedAtomic = amountIssued.toBig(0).toNumber();
            const issuedCurrencyId = newCurrencyId(api, amountIssued.currency);

            const vaultIssuedBalance = await interBtcAPI.tokens.balance(amountIssued.currency, vaultAccountId);
            if (!vaultIssuedBalance.free.gt(amountIssued)) {
                // set balance and wait for event
                const result = await DefaultTransactionAPI.sendLogged(
                    api,
                    sudoAccount,
                    api.tx.sudo.sudo(api.tx.tokens.setBalance(vaultAccountId, issuedCurrencyId , amountIssuedAtomic * 2, 0)),
                    api.events.tokens.BalanceSet
                );
                expect(result.isCompleted).toBe(true);
            }
            
            // find matching keyring
            const vaultKR = (vault_1.address === vaultAccountId.toHuman())
            ? vault_1
            : (vault_2.address === vaultAccountId.toHuman())
            ? vault_2
            : vault_3;

            // self redeem so vault has no more issued tokens
            const result2 = await DefaultTransactionAPI.sendLogged(
                api,
                vaultKR,
                api.tx.redeem.selfRedeem(vaultExt.id.currencies, amountIssuedAtomic),
                api.events.redeem.ExecuteRedeem
            );
            expect(result2.isCompleted).toBe(true);
            
            const vaultInterBtcApi = new DefaultInterBtcApi(api, "regtest", vaultKR, ESPLORA_BASE_PATH);

            // finally, withdraw all collateral
            await submitExtrinsic(vaultInterBtcApi, await vaultInterBtcApi.vaults.withdrawAllCollateral(collateralCurrency));

            const collateralAfter = await vaultInterBtcApi.vaults.getCollateral(vaultAccountId, collateralCurrency);
            expect(collateralAfter.toBig().toNumber()).toEqual(0);
        });
    
        it("should getLiquidationCollateralThreshold", async () => {
            for (const collateralCurrency of collateralCurrencies) {
                const currencyTicker = collateralCurrency.ticker;
    
                const threshold = await interBtcAPI.vaults.getLiquidationCollateralThreshold(collateralCurrency);
                try {
                    expect(threshold.gt(0)).toBe(true);
                } catch(_) {
                    throw Error(`Liqduiation collateral threshold for ${currencyTicker} was ${threshold.toString()}, expected: 0`);
                }
            }
        });
    
        it("should getPremiumRedeemThreshold", async () => {
            for (const collateralCurrency of collateralCurrencies) {
                const currencyTicker = collateralCurrency.ticker;
                const threshold = await interBtcAPI.vaults.getPremiumRedeemThreshold(collateralCurrency);
    
                try {
                    expect(threshold.gt(0)).toBe(true);
                } catch(_) {
                    throw Error(`Premium redeem threshold for ${currencyTicker} was ${threshold.toString()}, expected: 0`);
                }
            }
        });
    
        it("should select random vault for issue", async () => {
            const randomVault = await interBtcAPI.vaults.selectRandomVaultIssue(newMonetaryAmount(0, wrappedCurrency));
            expect(vaultIsATestVault(randomVault.accountId.toHuman())).toBe(true);
        });
    
        it("should fail if no vault for issuing is found", async () => {
            await expect(interBtcAPI.vaults.selectRandomVaultIssue(newMonetaryAmount(9000000, wrappedCurrency, true))).rejects.toThrow();
        });
    
        it("should select random vault for redeem", async () => {
            const randomVault = await interBtcAPI.vaults.selectRandomVaultRedeem(newMonetaryAmount(0, wrappedCurrency));
            expect(vaultIsATestVault(randomVault.accountId.toHuman())).toBe(true);
        });
    
        it("should fail if no vault for redeeming is found", async () => {
            const amount = newMonetaryAmount(9000000, wrappedCurrency, true);
            await expect(interBtcAPI.vaults.selectRandomVaultRedeem(amount)).rejects.toThrow();
        });
    
        it("should get the issuable InterBtc for a vault", async () => {
            for (const vault_1_id of vault_1_ids) {
                const collateralCurrency = await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral);
                const currencyTicker = collateralCurrency.ticker;
    
                const vault = await interBtcAPI.vaults.get(vault_1_id.accountId, collateralCurrency);
                const issuableTokens = await vault.getIssuableTokens();
    
                try {
                    expect(issuableTokens.gt(newMonetaryAmount(0, wrappedCurrency))).toBe(true);
                } catch(_) {
                    throw Error(`Issuable tokens should be greater than 0 (${currencyTicker} vault)`);
                }
            }
        });
    
        it("should get the issuable InterBtc", async () => {
            const issuableInterBtc = await interBtcAPI.vaults.getTotalIssuableAmount();
            expect(issuableInterBtc.gt(newMonetaryAmount(0, wrappedCurrency))).toBe(true);
        });
    
        it("should getFees", async () => {
            const vaultIdsInScope = vault_1_ids;
            let countSkippedVaults = 0;
            let countVaultsWithNonZeroWrappedRewards = 0;
    
            for (const vaultId of vaultIdsInScope) {
                const collateralCurrency = await currencyIdToMonetaryCurrency(api, vaultId.currencies.collateral);
                const wrappedCurrency = await currencyIdToMonetaryCurrency(api, vaultId.currencies.wrapped);
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
    
                try {
                    expect(feesWrapped.gte(newMonetaryAmount(0, wrappedCurrency))).toBe(true);
                } catch(_) {
                    // eslint-disable-next-line max-len
                    throw Error(`Fees (wrapped reward) should be greater than or equal to 0 (${currencyTicker} vault, account id ${vaultId.accountId.toString()}), but was: ${feesWrapped.toHuman()}`);
                }
    
                if (feesWrapped.gt(newMonetaryAmount(0, wrappedCurrency))) {
                    // we will check that at least one return was greater than zero
                    countVaultsWithNonZeroWrappedRewards++;
                }
    
                const govTokenReward = await interBtcAPI.vaults.getGovernanceReward(
                    vaultId.accountId,
                    collateralCurrency,
                    governanceCurrency
                );
    
                try {
                    expect(govTokenReward.gte(newMonetaryAmount(0, governanceCurrency))).toBe(true);
                } catch(_) {
                    // eslint-disable-next-line max-len
                    throw Error(`Governance reward should be greater than or equal to 0 (${currencyTicker} vault, account id ${vaultId.accountId.toString()}), but was: ${feesWrapped.toHuman()}`);
                }
            }
            // make sure not every vault has been skipped (due to no issued tokens)
            try {
                expect(countSkippedVaults).not.toEqual(vaultIdsInScope.length);
            } catch(_) {
                // eslint-disable-next-line max-len
                throw Error(`Unexpected test behavior: skipped all ${vaultIdsInScope.length} vaults in the test; all vaults lacking capacity (issued + issuable > 0)`);
            }
    
            // make sure at least one vault is receiving wrapped rewards greater than zero
            try {
                expect(countVaultsWithNonZeroWrappedRewards).toBeGreaterThan(0);
            } catch(_) {
                // eslint-disable-next-line max-len
                throw Error(`Unexpected test behavior: none of the ${vaultIdsInScope.length} vaults in the test have received more than 0 wrapped token rewards`);
            }
        });
    
        it("should getAPY", async () => {
            for (const vault_1_id of vault_1_ids) {
                const collateralCurrency = await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral);
                const currencyTicker = collateralCurrency.ticker;
                const accountId = newAccountId(api, vault_1.address);
    
                const apy = await interBtcAPI.vaults.getAPY(accountId, collateralCurrency);
                const apyBig = new Big(apy);
                const apyBenchmark = new Big("0");
                try {
                    expect(apyBig.gte(apyBenchmark)).toBe(true);
                } catch(_) {
                    throw Error(`APY should be greater than or equal to ${apyBenchmark.toString()},
                    but was ${apyBig.toString()} (${currencyTicker} vault)`);
                }
            }
        });
    
        it("should getPunishmentFee", async () => {
            const punishmentFee = await interBtcAPI.vaults.getPunishmentFee();
            expect(punishmentFee.toString()).toEqual("0.1");
        });
    
        it("should get vault list", async () => {
            const vaults = (await interBtcAPI.vaults.list()).map((vault) => vault.id.toHuman());
            expect(vaults.length).toBeGreaterThan(0);
        });
    
        it("should disable and enable issuing with vault", async () => {
            const interBtcAPI = new DefaultInterBtcApi(api, "regtest", vault_1, ESPLORA_BASE_PATH);

            const assertVaultStatus = async (id: InterbtcPrimitivesVaultId, expectedStatus: VaultStatusExt) => {
                const collateralCurrency = await currencyIdToMonetaryCurrency(api, id.currencies.collateral);
                const currencyTicker = collateralCurrency.ticker;
                const { status } = await interBtcAPI.vaults.get(id.accountId, collateralCurrency);
                const assertionMessage = `Vault with id ${id.toString()} (collateral: ${currencyTicker}) was expected to have
                        status: ${vaultStatusToLabel(expectedStatus)}, but got status: ${vaultStatusToLabel(status)}`;
    
                try {
                    expect(status === expectedStatus).toBe(true);
                } catch(_) {
                    throw Error(assertionMessage);
                }
            };
            const ACCEPT_NEW_ISSUES = true;
            const REJECT_NEW_ISSUES = false;
    
            for (const vault_1_id of vault_1_ids) {
                // Check that vault 1 is active.
                await assertVaultStatus(vault_1_id, VaultStatusExt.Active);
                // Disables vault 1 which is active.
                await submitExtrinsic(
                    interBtcAPI,
                    await interBtcAPI.vaults.toggleIssueRequests(vault_1_id, REJECT_NEW_ISSUES)
                );
                // Check that vault 1 is inactive.
                await assertVaultStatus(vault_1_id, VaultStatusExt.Inactive);
                // Re-enable issuing with vault 1.
                await submitExtrinsic(
                    interBtcAPI,
                    await interBtcAPI.vaults.toggleIssueRequests(vault_1_id, ACCEPT_NEW_ISSUES)
                );
                // Check that vault 1 is again active.
                await assertVaultStatus(vault_1_id, VaultStatusExt.Active);
            }
        });
    });
};
