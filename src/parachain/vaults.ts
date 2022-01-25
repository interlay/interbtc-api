import { ApiPromise } from "@polkadot/api";
import { AccountId, BlockNumber, BlockHash } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import { MonetaryAmount, Currency, BitcoinUnit } from "@interlay/monetary-js";
import { Bytes, Option } from "@polkadot/types";
import { VaultRegistryVaultStatus, VaultRegistrySystemVault, InterbtcPrimitivesVaultId, VaultRegistryVault } from "@polkadot/types/lookup";

import {
    decodeFixedPointType,
    newMonetaryAmount,
    parseWallet,
    parseSystemVault,
    getTxProof,
    newCurrencyId,
    newVaultId,
    newVaultCurrencyPair,
} from "../utils";
import { TokensAPI, DefaultTokensAPI } from "./tokens";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import { DefaultIssueAPI } from "./issue";
import {
    CollateralUnit,
    tickerToCurrencyIdLiteral,
    VaultExt,
    SystemVaultExt,
    VaultStatusExt,
    currencyIdToMonetaryCurrency,
    CurrencyUnit,
    CollateralCurrency,
    WrappedCurrency,
    CurrencyIdLiteral,
    WrappedIdLiteral,
    CollateralIdLiteral,
    currencyIdToLiteral,
    tickerToMonetaryCurrency,
} from "../types";
import { DefaultRewardsAPI, RewardsAPI } from "./rewards";
import { BalanceWrapper, UnsignedFixedPoint } from "../interfaces";

/**
 * @category InterBTC Bridge
 */
export interface VaultsAPI extends TransactionAPI {
    /**
     * @returns An array containing the vaults with non-zero backing collateral
     */
    list(atBlock?: BlockHash): Promise<VaultExt<BitcoinUnit>[]>;
    /**
     * @param vaultAccountId The ID of the vault to fetch
     * @param collateralCurrencyIdLiteral Collateral used by vault
     * @returns A vault object
     */
    get(vaultAccountId: AccountId, collateralCurrencyIdLiteral: CurrencyIdLiteral): Promise<VaultExt<BitcoinUnit>>;
    /**
     * Get the collateralization of a single vault measured by dividing the value of issued (wrapped) tokens
     * by the value of total locked collateral.
     *
     * @remarks Undefined collateralization is handled as infinite collateralization in the UI.
     * If no tokens have been issued, the `collateralFunds / issuedFunds` ratio divides by zero,
     * which means collateralization is infinite.
     * @param vaultAccountId the vault account id
     * @param collateralCurrencyIdLiteral Collateral used by vault
     * @param newCollateral use this instead of the vault's actual collateral
     * @param onlyIssued optional, defaults to `false`. Specifies whether the collateralization
     * should only include the issued tokens, leaving out unsettled ("to-be-issued") tokens
     * @returns the vault collateralization
     */
     getVaultCollateralization<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        newCollateral?: MonetaryAmount<Currency<C>, C>,
        onlyIssued?: boolean
    ): Promise<Big | undefined>;
    // /**
    //  * Get the total system collateralization measured by dividing the value of issued (wrapped) tokens
    //  * by the value of total locked collateral.
    //  *
    //  * @returns The total system collateralization
    //  */
    // TODO: Uncomment once implemented
    // getSystemCollateralization(): Promise<Big | undefined>;
    /**
     * Get the amount of collateral required for the given vault to be at the
     * current SecureCollateralThreshold with the current exchange rate
     *
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns The required collateral the vault needs to deposit to stay
     * above the threshold limit
     */
    getRequiredCollateralForVault<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns The amount of wrapped tokens issued by the given vault
     */
    getIssuedAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CurrencyIdLiteral
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns The amount of wrapped tokens issuable by this vault
     */
    getIssuableAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CurrencyIdLiteral
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @returns The total amount of wrapped tokens issued by the vaults
     */
    getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @returns The total amount of wrapped tokens that can be issued, considering the collateral
     * locked by the vaults
     */
    getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @param amount Wrapped tokens amount to issue
     * @returns A vault that has sufficient collateral to issue the given amount
     */
    selectRandomVaultIssue(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<InterbtcPrimitivesVaultId>;
    /**
     * @param amount Wrapped tokens amount to redeem
     * @returns A vault that has issued sufficient wrapped tokens to redeem the given amount
     */
    selectRandomVaultRedeem(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<InterbtcPrimitivesVaultId>;
    /**
     * @returns Vaults below the premium redeem threshold, sorted in descending order of their redeemable tokens
     */
    getPremiumRedeemVaults(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>>;
    /**
     * @returns Vaults with issuable tokens
     */
    getVaultsWithIssuableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>>;
    /**
     * @returns Vaults with redeemable tokens
     */
    getVaultsWithRedeemableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @param btcTxId ID of the Bitcoin transaction to check
     * @returns A bollean value
     */
     isVaultFlaggedForTheft(
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        btcTxId: string
    ): Promise<boolean>;
    /**
     * @param collateralCurrency
     * @returns The lower bound for vault collateralization.
     * If a Vault’s collateral rate
     * drops below this, automatic liquidation (forced Redeem) is triggered.
     */
    getLiquidationCollateralThreshold(collateralCurrency: CollateralCurrency): Promise<Big>;
    /**
     * @param collateralCurrency
     * @returns The collateral rate at which users receive
     * a premium allocated from the Vault’s collateral, when performing a redeem with this Vault.
     */
    getPremiumRedeemThreshold(collateralCurrency: CollateralCurrency): Promise<Big>;
    /**
     * @param collateralCurrency
     * @returns The over-collateralization rate for collateral locked
     * by Vaults, necessary for issuing wrapped tokens
     */
    getSecureCollateralThreshold(collateralCurrency: CollateralCurrency): Promise<Big>;
    /**
     * Get the total APY for a vault based on the income in wrapped and collateral tokens
     * divided by the locked collateral.
     *
     * @note this does not account for interest compounding
     *
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns the APY as a percentage string
     */
    getAPY(vaultAccountId: AccountId, collateralCurrency: CurrencyIdLiteral): Promise<Big>;
    /**
     * @returns Fee that a Vault has to pay, as a percentage, if it fails to execute
     * redeem or replace requests (for redeem, on top of the slashed wrapped-token-to-collateral
     * value of the request). The fee is paid in collateral currency based on the wrapped token
     * amount at the current exchange rate.
     */
    getPunishmentFee(): Promise<Big>;
    /**
     * @param amount The amount of collateral to withdraw
     */
    withdrawCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void>;
    /**
     * @param amount The amount of extra collateral to lock
     */
    depositCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void>;
    /**
     * @param collateralCurrency
     * @returns A vault object representing the liquidation vault
     */
    getLiquidationVault(collateralCurrency: CollateralCurrency): Promise<SystemVaultExt<BitcoinUnit>>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns The collateral of a vault, taking slashes into account.
     */
    getCollateral(
        vaultId: AccountId,
        collateralCurrencyIdLiteral: CurrencyIdLiteral
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * @param collateralCurrency The collateral currency specification, a `Monetary.js` object
     * @returns The maximum collateral a vault can accept as nomination, as a ratio of its own collateral
     */
    getMaxNominationRatio(collateralCurrency: CollateralCurrency): Promise<Big>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns Staking capacity, as a collateral currency (e.g. DOT)
     */
    getStakingCapacity(
        vaultAccountId: AccountId,
        collateralCurrency: CurrencyIdLiteral
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * @param vaultId Vault ID object
     * @param nonce Nonce of the staking pool
     * @returns The entire collateral backing a vault's issued tokens.
     */
    computeBackingCollateral(
        vaultId: InterbtcPrimitivesVaultId,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * A relayer may report Vault misbehavior by providing a fraud proof
     * (malicious Bitcoin transaction and transaction inclusion proof).
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param vaultId The account of the vault to check.
     * @param btcTxId The hash of the transaction
     * @param merkleProof The proof of tx inclusion.
     * @param rawTx The raw Bitcoin transaction.
     */
    reportVaultTheft(vaultId: AccountId, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void>;
    /**
     * @returns The wrapped currency issued by the vaults
     */
    getWrappedCurrency(): WrappedCurrency;
}

export class DefaultVaultsAPI extends DefaultTransactionAPI implements VaultsAPI {
    private btcNetwork: Network;
    tokensAPI: TokensAPI;
    oracleAPI: OracleAPI;
    feeAPI: FeeAPI;
    rewardsAPI: RewardsAPI;

    constructor(
        api: ApiPromise,
        btcNetwork: Network,
        private electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        private collateralCurrency: CollateralCurrency,
        account?: AddressOrPair
    ) {
        super(api, account);
        this.btcNetwork = btcNetwork;
        this.tokensAPI = new DefaultTokensAPI(api);
        this.oracleAPI = new DefaultOracleAPI(api, wrappedCurrency);
        this.feeAPI = new DefaultFeeAPI(api, wrappedCurrency);
        this.rewardsAPI = new DefaultRewardsAPI(api, btcNetwork, electrsAPI, wrappedCurrency, collateralCurrency);
    }

    getWrappedCurrency(): WrappedCurrency {
        return this.wrappedCurrency;
    }

    async register<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>, publicKey: string): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString());
        const currencyPair = newVaultCurrencyPair(
            this.api,
            tickerToMonetaryCurrency(this.api, amount.currency.ticker) as CollateralCurrency,
            this.wrappedCurrency
        );
        const tx = this.api.tx.vaultRegistry.registerVault(currencyPair, amountAtomicUnit, publicKey);
        await this.sendLogged(tx, this.api.events.vaultRegistry.RegisterVault);
    }

    async withdrawCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString());
        const currencyPair = newVaultCurrencyPair(
            this.api,
            tickerToMonetaryCurrency(this.api, amount.currency.ticker) as CollateralCurrency,
            this.wrappedCurrency
        );
        const tx = this.api.tx.vaultRegistry.withdrawCollateral(currencyPair, amountAtomicUnit);
        await this.sendLogged(tx, this.api.events.vaultRegistry.WithdrawCollateral);
    }

    async depositCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const currencyPair = newVaultCurrencyPair(
            this.api,
            tickerToMonetaryCurrency(this.api, amount.currency.ticker) as CollateralCurrency,
            this.wrappedCurrency
        );
        const tx = this.api.tx.vaultRegistry.depositCollateral(currencyPair, amountAsPlanck);
        await this.sendLogged(tx, this.api.events.vaultRegistry.DepositCollateral);
    }

    async list(atBlock?: BlockHash): Promise<VaultExt<BitcoinUnit>[]> {
        const block = atBlock || (await this.api.rpc.chain.getFinalizedHead());
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entriesAt(block);
        return Promise.all(
            vaultsMap
                .filter((v) => v[1].isSome)
                .map((v) => this.parseVault(v[1].value as VaultRegistryVault, this.btcNetwork))
        );
    }

    async get(
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral
    ): Promise<VaultExt<BitcoinUnit>> {
        try {
            const head = await this.api.rpc.chain.getFinalizedHead();
            const collateralCurrency = currencyIdToMonetaryCurrency(
                newCurrencyId(this.api, collateralCurrencyIdLiteral)
            ) as CollateralCurrency;
            const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
            const api = await this.api.at(head);
            const vault = await api.query.vaultRegistry.vaults<Option<VaultRegistryVault>>(vaultId);
            if (!vault.isSome) {
                return Promise.reject(`No vault registered with id ${vaultId}`);
            }
            return this.parseVault(vault.value as VaultRegistryVault, this.btcNetwork);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getCollateral(
        vaultId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        return this.rewardsAPI.computeCollateralInStakingPool(vaultId, vaultId, collateralCurrencyIdLiteral);
    }

    async getMaxNominationRatio(collateralCurrency: CollateralCurrency): Promise<Big> {
        const [premiumRedeemThreshold, secureCollateralThreshold] = await Promise.all([
            this.getPremiumRedeemThreshold(collateralCurrency),
            this.getSecureCollateralThreshold(collateralCurrency),
        ]);
        return secureCollateralThreshold.div(premiumRedeemThreshold);
    }

    async computeBackingCollateral(
        vaultId: InterbtcPrimitivesVaultId,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const collateralCurrencyIdLiteral = currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral;
        if (nonce === undefined) {
            nonce = await this.rewardsAPI.getStakingPoolNonce(collateralCurrencyIdLiteral, vaultId.accountId);
        }

        const rawBackingCollateral = await this.api.query.vaultStaking.totalCurrentStake(nonce, vaultId);
        const collateralCurrency = currencyIdToMonetaryCurrency(vaultId.currencies.collateral);
        return newMonetaryAmount(
            decodeFixedPointType(rawBackingCollateral),
            collateralCurrency as Currency<CollateralUnit>
        );
    }

    async getStakingCapacity(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        const [collateral, maxNominationRatio] = await Promise.all([
            this.getCollateral(vaultAccountId, collateralCurrency),
            this.getMaxNominationRatio(
                currencyIdToMonetaryCurrency(vault.id.currencies.collateral) as CollateralCurrency
            )
        ]);
        return collateral.mul(maxNominationRatio).sub(vault.backingCollateral);
    }

    async getLiquidationVault(collateralCurrency: CollateralCurrency): Promise<SystemVaultExt<BitcoinUnit>> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const head = await this.api.rpc.chain.getFinalizedHead();
        const liquidationVault = await this.api.query.vaultRegistry.liquidationVault.at(head, vaultCurrencyPair);
        if (!liquidationVault.isSome) {
            return Promise.reject("System vault could not be fetched");
        }
        return parseSystemVault(liquidationVault.value as VaultRegistrySystemVault, this.wrappedCurrency, collateralCurrency);
    }

    private isNoTokensIssuedError(e: Error): boolean {
        return e.message !== undefined && e.message.includes("NoTokensIssued");
    }

    async isBelowPremiumThreshold(vaultId: InterbtcPrimitivesVaultId): Promise<boolean> {
        const [premiumRedeemThreshold, vaultCollateralization] = await Promise.all([
            this.getPremiumRedeemThreshold(
                currencyIdToMonetaryCurrency(vaultId.currencies.collateral) as CollateralCurrency
            ),
            this.getCollateralizationFromVault(vaultId)
        ]);
        return vaultCollateralization.lt(premiumRedeemThreshold);
    }

    async getVaultCollateralization<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        newCollateral?: MonetaryAmount<Currency<C>, C>,
        onlyIssued = false
    ): Promise<Big | undefined> {
        let collateralization = undefined;
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrencyIdLiteral);
        const vaultId = newVaultId(
            this.api,
            vaultAccountId.toString(),
            currencyIdToMonetaryCurrency(collateralCurrencyId) as CollateralCurrency,
            this.wrappedCurrency
        );
        try {
            if (newCollateral) {
                collateralization = await this.getCollateralizationFromVaultAndCollateral(
                    vaultId,
                    newCollateral,
                    onlyIssued
                );
            } else {
                collateralization = await this.getCollateralizationFromVault(vaultId, onlyIssued);
            }
        } catch (e) {
            if (this.isNoTokensIssuedError(e as Error)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error(`Error during collateralization computation: ${(e as Error).message}`));
        }
        if (!collateralization) {
            return Promise.resolve(undefined);
        }
        return collateralization;
    }

    async getCollateralizationFromVault(
        vaultId: InterbtcPrimitivesVaultId,
        onlyIssued = false
    ): Promise<Big> {
        const vault = await this.get(vaultId.accountId, currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral);
        const collateral = await vault.computeBackingCollateral();
        return this.getCollateralizationFromVaultAndCollateral(vaultId, collateral, onlyIssued);
    }

    async getCollateralizationFromVaultAndCollateral<C extends CollateralUnit>(
        vaultId: InterbtcPrimitivesVaultId,
        newCollateral: MonetaryAmount<Currency<C>, C>,
        onlyIssued: boolean
    ): Promise<Big> {
        const vault = await this.get(vaultId.accountId, currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral);
        const issuedTokens = await (onlyIssued ? Promise.resolve(vault.issuedTokens) : vault.getBackedTokens());
        if (issuedTokens.isZero()) {
            return Promise.reject("No tokens issued");
        }
        const collateralInWrapped = await this.oracleAPI.convertCollateralToWrapped(
            newCollateral,
            currencyIdToMonetaryCurrency(vaultId.currencies.wrapped)
        );
        return collateralInWrapped.toBig().div(issuedTokens.toBig());
    }

    async getSystemCollateralization(): Promise<Big | undefined> {
        // TODO: Implement once method of calculation is decided on
        return Promise.resolve(undefined);
    }

    async getRequiredCollateralForVault<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const vaultId = newVaultId(
            this.api,
            vaultAccountId.toString(),
            currency as unknown as CollateralCurrency,
            this.wrappedCurrency
        );
        try {
            // TODO: Decide whether to keep using RPC or duplicate logic
            // RPC decoration in polkadot-js/api is broken at the moment, disable linter
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const amountWrapper: BalanceWrapper = await (this.api.rpc as any).vaultRegistry.getRequiredCollateralForVault(
                vaultId
            );
            const amountUnwrapped = this.unwrapCurrency(amountWrapper);
            return newMonetaryAmount(amountUnwrapped.toString(), currency);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async getIssuedAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        return vault.issuedTokens;
    }

    async getIssuableAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        return this.getIssuableAmountFromVault(vault);
    }

    async getIssuableAmountFromVault(
        vault: VaultExt<BitcoinUnit>,
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const wrappedTokenCapacity = await this.calculateCapacity(vault.backingCollateral);
        const issuedAmount = vault.issuedTokens.add(vault.toBeIssuedTokens);
        const issuableAmountExcludingFees = wrappedTokenCapacity.sub(issuedAmount);
        const issueAPI = new DefaultIssueAPI(
            this.api,
            this.btcNetwork,
            this.electrsAPI,
            this.wrappedCurrency,
            this.collateralCurrency
        );
        const fees = await issueAPI.getFeesToPay(issuableAmountExcludingFees);
        return issuableAmountExcludingFees.sub(fees);
    }

    async getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        const issuedTokens = await this.tokensAPI.total(this.wrappedCurrency);
        return issuedTokens;
    }

    async getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        const perVaultIssuableAmounts = await Promise.all(
            (await this.list()).map(vault => vault.getIssuableTokens())
        );
        const totalIssuableAmount = perVaultIssuableAmounts.reduce((acc, v) => acc.add(v));
        const issuedAmountBtc = await this.getTotalIssuedAmount();
        return totalIssuableAmount.sub(issuedAmountBtc);
    }

    private async calculateCapacity<C extends CollateralUnit>(
        collateral: MonetaryAmount<Currency<C>, C>
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        try {
            const oracle = new DefaultOracleAPI(this.api, this.wrappedCurrency);
            const [exchangeRate, secureCollateralThreshold] = await Promise.all([
                oracle.getExchangeRate(collateral.currency),
                this.getSecureCollateralThreshold(collateral.currency as unknown as CollateralCurrency),
            ]);
            const unusedCollateral = collateral.div(secureCollateralThreshold);
            return exchangeRate.toBase(unusedCollateral);
        } catch (error) {
            return newMonetaryAmount(0, this.wrappedCurrency);
        }
    }

    async selectRandomVaultIssue(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<InterbtcPrimitivesVaultId> {
        const vaults = await this.getVaultsWithIssuableTokens();
        for (const [id, issuableAmount] of vaults) {
            if (issuableAmount.gte(amount)) {
                return id;
            }
        }
        return Promise.reject(new Error("Did not find vault with sufficient collateral"));
    }

    async selectRandomVaultRedeem(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<InterbtcPrimitivesVaultId> {
        // Selects the first vault with sufficient tokens
        const vaults = await this.list();
        for (const vault of vaults) {
            if (vault.issuedTokens.gte(amount)) {
                return vault.id;
            }
        }
        return Promise.reject(new Error("Did not find vault with sufficient locked BTC"));
    }

    async getPremiumRedeemVaults(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>> {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>> = new Map();
        const vaults = await this.list();
        const premiumRedeemVaultPredicates = await Promise.all(
            vaults.map(vault => {
                return new Promise((resolve, reject) => {
                    const redemableTokens = vault.getRedeemableTokens();
                    if(redemableTokens.isZero()) {
                        resolve(false);
                    } else {
                        this.isBelowPremiumThreshold(vault.id).then(resolve).catch(reject);
                    }
                });
            })
        );
        vaults
            .filter((_, index) => premiumRedeemVaultPredicates[index])
            .forEach(vault => map.set(vault.id, vault.getRedeemableTokens()));
        return map;
    }

    async getVaultsWithIssuableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>> {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>> = new Map();
        const vaults = await this.list();
        const issuableTokens = await Promise.all(
            vaults
                .map(
                    vault => {
                        return new Promise<[
                    MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
                    InterbtcPrimitivesVaultId
                ]>((resolve, _) => {
                    if (vault.status !== VaultStatusExt.Active) {
                        resolve(
                            [
                                newMonetaryAmount(0, currencyIdToMonetaryCurrency(vault.id.currencies.wrapped)),
                                vault.id
                            ]
                        );
                    }
                    vault.getIssuableTokens().then((amount) => resolve([amount, vault.id]));
                });
                    }
                ));
        issuableTokens.forEach(([amount, vaultId]) => {
            if (!amount.isZero()) {
                map.set(vaultId, amount);
            }
        });
        return map;
    }

    async getVaultsWithRedeemableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>> {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>> = new Map();
        (await this.list())
            .filter(vault => {
                // issuedTokens - toBeRedeemedTokens > 0
                return vault.issuedTokens.gt(vault.toBeRedeemedTokens);
            })
            .sort((vault1, vault2) => {
                // Descending order
                const vault1Redeemable = vault1.getRedeemableTokens().toBig();
                const vault2Redeemable = vault2.getRedeemableTokens().toBig();
                return vault2Redeemable.sub(vault1Redeemable).toNumber();
            })
            .forEach(vault => map.set(vault.id, vault.getRedeemableTokens()));
        return map;
    }

    async isVaultFlaggedForTheft(
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        btcTxId: string
    ): Promise<boolean> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrencyIdLiteral);
        const vaultId = newVaultId(
            this.api,
            vaultAccountId.toString(),
            currencyIdToMonetaryCurrency(collateralCurrencyId) as CollateralCurrency,
            this.wrappedCurrency
        );
        const theftReports = await this.api.query.relay.theftReports.at(head, vaultId, { content: btcTxId });
        return theftReports.isEmpty;
    }

    async getLiquidationCollateralThreshold(collateralCurrency: CollateralCurrency): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.liquidationCollateralThreshold.at(head, vaultCurrencyPair);
        if (!threshold.isSome) {
            return Promise.reject(`No liquidation threshold for currency ${collateralCurrency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getPremiumRedeemThreshold(collateralCurrency: CollateralCurrency): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.premiumRedeemThreshold.at(head, vaultCurrencyPair);
        if (!threshold.isSome) {
            return Promise.reject(`No premium redeem threshold for currency ${collateralCurrency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getSecureCollateralThreshold(collateralCurrency: CollateralCurrency): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold.at(head, vaultCurrencyPair);
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getAPY(vaultAccountId: AccountId, collateralCurrency: CollateralIdLiteral): Promise<Big> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        const [feesWrapped, lockedCollateral] = await Promise.all([
            await this.rewardsAPI.getFeesWrapped(
                vaultAccountId,
                collateralCurrency,
                tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker) as WrappedIdLiteral
            ),
            await this.tokensAPI.balanceLocked(
                currencyIdToMonetaryCurrency(vault.id.currencies.collateral) as Currency<CollateralUnit>,
                vaultAccountId
            ),
        ]);
        return this.feeAPI.calculateAPY(feesWrapped, lockedCollateral);
    }

    async getPunishmentFee(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fee = await this.api.query.fee.punishmentFee.at(head);
        return decodeFixedPointType(fee);
    }

    private wrapCurrency<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): BalanceWrapper {
        return this.api.createType(
            "BalanceWrapper",
            {
                amount: this.api.createType("u128", amount.toString()),
                currencyId: newCurrencyId(this.api, tickerToCurrencyIdLiteral(amount.currency.ticker))
            }
        );
    }

    private unwrapCurrency<C extends CollateralUnit>(wrappedBalance: BalanceWrapper): MonetaryAmount<Currency<C>, C> {
        return newMonetaryAmount(
            wrappedBalance.amount.toString(),
            currencyIdToMonetaryCurrency(
                wrappedBalance.currencyId
            )
        );
    }

    private parseVaultStatus(status: VaultRegistryVaultStatus): VaultStatusExt {
        if (status.isActive) {
            return status.asActive ? VaultStatusExt.Active : VaultStatusExt.Inactive;
        } else if (status.isLiquidated) {
            return VaultStatusExt.Liquidated;
        } else if (status.isCommittedTheft) {
            return VaultStatusExt.CommittedTheft;
        } else {
            throw new Error("Unknown vault status");
        }
    }

    async parseVault(vault: VaultRegistryVault, network: Network): Promise<VaultExt<BitcoinUnit>> {
        const collateralCurrency = currencyIdToMonetaryCurrency<CollateralUnit>(vault.id.currencies.collateral);
        const replaceCollateral = newMonetaryAmount(vault.replaceCollateral.toString(), collateralCurrency);
        const liquidatedCollateral = newMonetaryAmount(vault.liquidatedCollateral.toString(), collateralCurrency);
        const backingCollateral = await this.computeBackingCollateral(vault.id);
        return new VaultExt<BitcoinUnit>(
            this.api,
            parseWallet(vault.wallet, network),
            backingCollateral,
            vault.id,
            this.parseVaultStatus(vault.status),
            vault.bannedUntil.isSome ? (vault.bannedUntil.value as BlockNumber).toNumber() : undefined,
            newMonetaryAmount(vault.toBeIssuedTokens.toString(), this.wrappedCurrency),
            newMonetaryAmount(vault.issuedTokens.toString(), this.wrappedCurrency),
            newMonetaryAmount(vault.toBeRedeemedTokens.toString(), this.wrappedCurrency),
            newMonetaryAmount(vault.toBeReplacedTokens.toString(), this.wrappedCurrency),
            replaceCollateral,
            liquidatedCollateral,
        );
    }

    async reportVaultTheft(
        vaultAccountId: AccountId,
        btcTxId?: string,
        merkleProof?: Bytes,
        rawTx?: Bytes
    ): Promise<void> {
        [merkleProof, rawTx] = await getTxProof(this.electrsAPI, btcTxId, merkleProof, rawTx);
        const tx = this.api.tx.relay.reportVaultTheft(vaultAccountId, merkleProof, rawTx);
        await this.sendLogged(tx, this.api.events.relay.VaultTheft);
    }
}
