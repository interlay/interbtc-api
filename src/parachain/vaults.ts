import { ApiPromise } from "@polkadot/api";
import { AccountId, BlockNumber, BlockHash } from "@polkadot/types/interfaces";
import Big from "big.js";
import { MonetaryAmount, Currency } from "@interlay/monetary-js";
import { Option } from "@polkadot/types";
import {
    VaultRegistryVaultStatus,
    VaultRegistrySystemVault,
    InterbtcPrimitivesVaultId,
    VaultRegistryVault,
    InterbtcPrimitivesVaultCurrencyPair,
} from "@polkadot/types/lookup";

import {
    decodeFixedPointType,
    newMonetaryAmount,
    parseSystemVault,
    newCurrencyId,
    newVaultId,
    newVaultCurrencyPair,
    addHexPrefix,
    currencyIdToMonetaryCurrency,
    decodeRpcVaultId,
    addressOrPairAsAccountId,
    storageKeyToNthInner,
} from "../utils";
import { TokensAPI } from "./tokens";
import { OracleAPI } from "./oracle";
import { FeeAPI } from "./fee";
import { TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import {
    VaultExt,
    SystemVaultExt,
    VaultStatusExt,
    CollateralCurrencyExt,
    WrappedCurrency,
    GovernanceCurrency,
    ExtrinsicData,
} from "../types";
import { RewardsAPI } from "./rewards";
import { UnsignedFixedPoint } from "../interfaces";
import { SystemAPI, DefaultNominationAPI } from "./index";
import { ApiTypes, AugmentedEvent, SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult, AnyTuple } from "@polkadot/types/types";

/**
 * @category BTC Bridge
 */
export interface VaultsAPI {
    /**
     * @returns An array containing the vaults with non-zero backing collateral
     */
    list(atBlock?: BlockHash): Promise<VaultExt[]>;
    /**
     * Get a vault by account ID and collateral currency.
     * Does not reject if the vault does not exist, but returns null instead.
     * @param vaultAccountId The ID of the vault to fetch
     * @param collateralCurrency Collateral used by vault
     * @returns A vault object, or null if no vault with the given ID and currency pair exists
     */
    getOrNull(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<VaultExt | null>;
    /**
     * Get a vault by account ID and collateral currency. Rejects if no vault exists.
     * @param vaultAccountId The ID of the vault to fetch
     * @param collateralCurrency Collateral used by vault
     * @returns A vault object, rejects if no vault with the given ID and currency pair exists
     */
    get(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<VaultExt>;
    /**
     * Get the collateralization of a single vault measured by dividing the value of issued (wrapped) tokens
     * by the value of total locked collateral.
     *
     * @remarks Undefined collateralization is handled as infinite collateralization in the UI.
     * If no tokens have been issued, the `collateralFunds / issuedFunds` ratio divides by zero,
     * which means collateralization is infinite.
     * @param vaultAccountId the vault account id
     * @param collateralCurrency Collateral used by vault
     * @param newCollateral use this instead of the vault's actual collateral
     * @param onlyIssued optional, defaults to `false`. Specifies whether the collateralization
     * should only include the issued tokens, leaving out unsettled ("to-be-issued") tokens
     * @returns the vault collateralization
     */
    getVaultCollateralization(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        newCollateral?: MonetaryAmount<CollateralCurrencyExt>,
        onlyIssued?: boolean
    ): Promise<Big | undefined>;
    /**
     * Get the total system collateralization measured by dividing the value of issued (wrapped) tokens
     * by the value of total locked collateral.
     *
     * @returns The total system collateralization
     */
    getSystemCollateralization(): Promise<Big | undefined>;
    /**
     * Get the amount of collateral required for the given vault to be at the
     * current SecureCollateralThreshold with the current exchange rate
     *
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object or `ForeignAsset`
     * @returns The required collateral the vault needs to deposit to stay
     * above the threshold limit
     */
    getRequiredCollateralForVault(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     * Get the minimum secured collateral amount required to activate a vault
     * @param collateralCurrency The currency specification, a `Monetary.js` object or `ForeignAsset`
     * @returns the minimum collateral to register a vault
     */
    getMinimumCollateral(collateralCurrency: CollateralCurrencyExt): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object or `ForeignAsset
     * @returns The amount of wrapped tokens issued by the given vault
     */
    getIssuedAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @returns The total amount of wrapped tokens issued by the vaults
     */
    getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @returns The total amount of wrapped tokens that can be issued, considering the collateral
     * locked by the vaults
     */
    getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @param collateral Amount of collateral to calculate issuable capacity for
     * @returns Issuable amount by the vault, given the collateral amount
     */
    calculateCapacity(collateral: MonetaryAmount<CollateralCurrencyExt>): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @param amount Wrapped tokens amount to issue
     * @returns A vault that has sufficient collateral to issue the given amount
     */
    selectRandomVaultIssue(amount: MonetaryAmount<WrappedCurrency>): Promise<InterbtcPrimitivesVaultId>;
    /**
     * @param amount Wrapped tokens amount to redeem
     * @returns A vault that has issued sufficient wrapped tokens to redeem the given amount
     */
    selectRandomVaultRedeem(amount: MonetaryAmount<WrappedCurrency>): Promise<InterbtcPrimitivesVaultId>;
    /**
     * @returns Vaults below the premium redeem threshold, sorted in descending order of their redeemable tokens
     */
    getPremiumRedeemVaults(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>>;
    /**
     * @returns Vaults with issuable tokens, not sorted in any particular order.
     * @remarks The result is not sorted as an attempt to randomize the assignment of requests to vaults.
     */
    getVaultsWithIssuableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>>;
    /**
     * @returns Vaults with redeemable tokens, sorted in descending order.
     */
    getVaultsWithRedeemableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>>;
    /**
     * @param vaultId The vault ID
     * @param btcTxId ID of the Bitcoin transaction to check
     * @returns A bollean value
     */
    isVaultFlaggedForTheft(vaultId: InterbtcPrimitivesVaultId, btcTxId: string): Promise<boolean>;
    /**
     * @param collateralCurrency
     * @returns The lower bound for vault collateralization.
     * If a Vault’s collateral rate
     * drops below this, automatic liquidation (forced Redeem) is triggered.
     */
    getLiquidationCollateralThreshold(collateralCurrency: CollateralCurrencyExt): Promise<Big>;
    /**
     * @param collateralCurrency
     * @returns The collateral rate at which users receive
     * a premium allocated from the Vault’s collateral, when performing a redeem with this Vault.
     */
    getPremiumRedeemThreshold(collateralCurrency: CollateralCurrencyExt): Promise<Big>;
    /**
     * Get the global secure collateral threshold.
     * @param collateralCurrency
     * @returns The global over-collateralization rate for collateral locked
     * by Vaults, necessary for issuing wrapped tokens
     */
    getSecureCollateralThreshold(collateralCurrency: CollateralCurrencyExt): Promise<Big>;
    /**
     * Get the total APY for a vault based on the income in wrapped and collateral tokens
     * divided by the locked collateral.
     *
     * @note this does not account for interest compounding
     *
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object or `ForeignAsset`
     * @param governanceCurrency The governance currency we're using for block rewards
     * @returns the APY as a percentage string
     */
    getAPY(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<Big>;
    /**
     * Gets the estimated APY for just the block rewards (in governance tokens).
     * @param vaultAccountId: the vault account ID
     * @param collateralCurrency: the vault's collateral currency
     * @returns the APY as a percentage
     */
    getBlockRewardAPY(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<Big>;
    /**
     * @returns Fee that a Vault has to pay, as a percentage, if it fails to execute
     * redeem or replace requests (for redeem, on top of the slashed wrapped-token-to-collateral
     * value of the request). The fee is paid in collateral currency based on the wrapped token
     * amount at the current exchange rate.
     */
    getPunishmentFee(): Promise<Big>;

    /**
     * Build withdraw collateral extrinsic (transaction) without sending it.
     *
     * @param amount The amount of collateral to withdraw
     * @returns A withdraw collateral submittable extrinsic as promise.
     */
    buildWithdrawCollateralExtrinsic(
        amount: MonetaryAmount<CollateralCurrencyExt>
    ): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>>;

    /**
     * @param amount The amount of collateral to withdraw
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    withdrawCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): Promise<ExtrinsicData>;

    /**
     * Build deposit collateral extrinsic (transaction) without sending it.
     *
     * @param amount The amount of extra collateral to lock
     * @returns A deposit collateral submittable extrinsic.
     */
    buildDepositCollateralExtrinsic(
        amount: MonetaryAmount<CollateralCurrencyExt>
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;

    /**
     * @param amount The amount of extra collateral to lock
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    depositCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): ExtrinsicData;
    /**
     * @param collateralCurrency
     * @returns A vault object representing the liquidation vault
     */
    getLiquidationVault(collateralCurrency: CollateralCurrencyExt): Promise<SystemVaultExt>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object or `ForeignAsset`
     * @returns The collateral of a vault, taking slashes into account.
     */
    getCollateral(
        vaultId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     * Returns issuable amount for a given vault
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object or `ForeignAsset`
     * @returns The issuable amount of a vault
     */
    getIssuableTokensFromVault(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @param collateralCurrency The collateral currency specification, a `Monetary.js` object or `ForeignAsset`
     * @returns The maximum collateral a vault can accept as nomination, as a ratio of its own collateral
     */
    getMaxNominationRatio(collateralCurrency: CollateralCurrencyExt): Promise<Big>;
    /**
     * @param vaultAccountId The vault account ID
     * @param collateralCurrency The currency specification, a `Monetary.js` object or `ForeignAsset`
     * @returns Staking capacity, as a collateral currency (e.g. DOT)
     */
    getStakingCapacity(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     * @param vaultId Vault ID object
     * @param nonce Nonce of the staking pool
     * @returns The entire collateral backing a vault's issued tokens.
     */
    computeBackingCollateral(
        vaultId: InterbtcPrimitivesVaultId,
        nonce?: number
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;

    /**
     * @returns The wrapped currency issued by the vaults
     */
    getWrappedCurrency(): WrappedCurrency;
    /**
     * Compute the total reward, including the staking (local) pool and the rewards (global) pool
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param vaultCollateral Collateral used by the vault. This is the currency used as
     * stake in the `staking` and `rewards` pools.
     * @param rewardCurrency The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @returns A Monetary.js amount object, representing the total reward in the given currency
     */
    computeReward(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        rewardCurrency: Currency
    ): Promise<MonetaryAmount<Currency>>;
    /**
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param vaultCollateral Collateral used by the vault
     * @param rewardCurrency The fee reward currency
     * @returns The total reward collected by the vault
     */
    getWrappedReward(
        vaultAccountId: AccountId,
        vaultCollateral: CollateralCurrencyExt,
        rewardCurrency: WrappedCurrency
    ): Promise<MonetaryAmount<WrappedCurrency>>;
    /**
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param vaultCollateral Collateral used by the vault
     * @param governanceCurrency The fee reward currency
     * @returns The total reward collected by the vault
     */
    getGovernanceReward(
        vaultAccountId: AccountId,
        vaultCollateral: CollateralCurrencyExt,
        governanceCurrency: GovernanceCurrency
    ): Promise<MonetaryAmount<GovernanceCurrency>>;

    /**
     * Build accept new issues extrinsic without sending it.
     *
     * @param collateralCurrency the collateral currency for which to change the accepting status,
     * @param acceptNewIssues Boolean denoting whether issuing should be enabled or not
     * @returns An accept new issues submittable extrinsic.
     */
    buildAcceptNewIssuesExtrinsic(
        collateralCurrency: CollateralCurrencyExt,
        acceptNewIssues: boolean
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;

    /**
     * Enables or disables issue requests for given vault
     * @param vaultId The vault ID whose issuing will be toggled
     * @param acceptNewIssues Boolean denoting whether issuing should be enabled or not
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    toggleIssueRequests(vaultId: InterbtcPrimitivesVaultId, acceptNewIssues: boolean): Promise<ExtrinsicData>;

    /**
     * Build extrinsic to register a public key.
     *
     * This extrinsic can be used together with a register vault extrinsic (see: {@link buildRegisterVaultExtrinsic})
     * to register the first vault for the logged in account id.
     *
     * Registering the public key should only be done once per account id when it is not associated with a running vault, yet.
     *
     * @param publicKey The BTC public key of the vault to derive deposit keys with
     * the {@link https://spec.interlay.io/security_performance/xclaim-security.html#okd | On-Chain Key Derivation Scheme}.
     * @returns A register vault submittable extrinsic.
     */
    buildRegisterPublicKeyExtrinsic(publicKey: string): SubmittableExtrinsic<"promise", ISubmittableResult>;

    /**
     * Build extrinsic to register a new vault.
     *
     * @param collateralAmount The collateral amount to register the vault with - in the new collateral currency.
     * @returns A register vault submittable extrinsic.
     */
    buildRegisterVaultExtrinsic(
        collateralAmount: MonetaryAmount<CollateralCurrencyExt>
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;

    /**
     * Registers a new vault for the current account ID with a new collateral amount.
     * Only applicable if the connected account ID already has a running vault with a different collateral currency.
     *
     * Rejects with an Error if unable to register.
     *
     * @param collateralAmount The collateral amount to register the vault with - in the new collateral currency
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    registerNewCollateralVault(collateralAmount: MonetaryAmount<CollateralCurrencyExt>): ExtrinsicData;
    /**
     * Get the target exchange rate at which a vault will be forced to liquidate, given its
     * current locked collateral and issued as well as to be issued tokens.
     *
     * @param vaultAccountId The vault's account ID
     * @param collateralCurrency The collateral currency for the vault with the account id above
     * @returns The theoretical collateral per wrapped currency rate below which the vault would be liquidated.
     *  Returns undefined if a value cannot be calculated, eg. if the vault has no issued tokens.
     */
    getExchangeRateForLiquidation(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<Big | undefined>;
}

export const NO_LIQUIDATION_VAULT_FOUND_REJECTION = "No liquidation vault found";

export class DefaultVaultsAPI implements VaultsAPI {
    constructor(
        private api: ApiPromise,
        private electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        private governanceCurrency: GovernanceCurrency,
        private tokensAPI: TokensAPI,
        private oracleAPI: OracleAPI,
        private feeAPI: FeeAPI,
        private rewardsAPI: RewardsAPI,
        private systemAPI: SystemAPI,
        private transactionAPI: TransactionAPI
    ) {}

    getWrappedCurrency(): WrappedCurrency {
        return this.wrappedCurrency;
    }

    registerNewCollateralVault(collateralAmount: MonetaryAmount<CollateralCurrencyExt>): ExtrinsicData {
        // check the vault account is set
        const vaultAccount = this.transactionAPI.getAccount();
        if (vaultAccount === undefined) {
            throw new Error("Failed to read account in vaults API; account must be set in interbtc API");
        }

        const extrinsic = this.buildRegisterVaultExtrinsic(collateralAmount);
        const registerVaultEvent = this.getRegisterVaultEvent();
        return { extrinsic, event: registerVaultEvent };
    }

    // helper method; mainly for easier mocking in unit tests without an active ApiPromise instance
    getRegisterVaultEvent(): AugmentedEvent<ApiTypes, AnyTuple> {
        return this.api.events.vaultRegistry.RegisterVault;
    }

    buildRegisterVaultExtrinsic(
        collateralAmount: MonetaryAmount<CollateralCurrencyExt>
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        const currencyPair = newVaultCurrencyPair(this.api, collateralAmount.currency, this.getWrappedCurrency());
        const amountAtomicUnit = this.api.createType("Balance", collateralAmount.toString(true));
        return this.api.tx.vaultRegistry.registerVault(currencyPair, amountAtomicUnit);
    }

    buildRegisterPublicKeyExtrinsic(publicKey: string): SubmittableExtrinsic<"promise", ISubmittableResult> {
        return this.api.tx.vaultRegistry.registerPublicKey(publicKey);
    }

    async buildWithdrawCollateralExtrinsic(
        amount: MonetaryAmount<CollateralCurrencyExt>
    ): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
        const account = this.transactionAPI.getAccount();
        if (account == undefined) {
            throw new Error("Account must be connected to create a collateral withdrawal request.");
        }
        const vaultAccountId = addressOrPairAsAccountId(this.api, account);

        return await DefaultNominationAPI.buildWithdrawCollateralExtrinsic(
            this.api,
            this.rewardsAPI,
            vaultAccountId,
            amount,
            this.wrappedCurrency
        );
    }

    async withdrawCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): Promise<ExtrinsicData> {
        const tx = await this.buildWithdrawCollateralExtrinsic(amount);
        return { extrinsic: tx, event: this.api.events.vaultRegistry.WithdrawCollateral };
    }

    buildDepositCollateralExtrinsic(
        amount: MonetaryAmount<CollateralCurrencyExt>
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        const account = this.transactionAPI.getAccount();
        if (account == undefined) {
            throw new Error("Account must be connected to create a collateral deposit request.");
        }
        const vaultAccountId = addressOrPairAsAccountId(this.api, account);

        return DefaultNominationAPI.buildDepositCollateralExtrinsic(
            this.api,
            vaultAccountId,
            amount,
            this.wrappedCurrency
        );
    }

    depositCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): ExtrinsicData {
        const tx = this.buildDepositCollateralExtrinsic(amount);
        return { extrinsic: tx, event: this.api.events.vaultRegistry.DepositCollateral };
    }

    async list(atBlock?: BlockHash): Promise<VaultExt[]> {
        const vaultsMap = await (atBlock
            ? (await this.api.at(atBlock)).query.vaultRegistry.vaults.entries()
            : this.api.query.vaultRegistry.vaults.entries());
        return Promise.all(vaultsMap.filter((v) => v[1].isSome).map((v) => this.parseVault(v[1].value)));
    }

    async getOrNull(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<VaultExt | null> {
        try {
            const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
            const vault = await this.api.query.vaultRegistry.vaults<Option<VaultRegistryVault>>(vaultId);
            if (!vault.isSome) {
                return null;
            }
            return this.parseVault(vault.value);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async get(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<VaultExt> {
        const vault = await this.getOrNull(vaultAccountId, collateralCurrency);

        if (vault === null) {
            return Promise.reject(
                new Error(`Vault does not exist for id '${vaultAccountId}' and collateral '${collateralCurrency.name}'`)
            );
        }
        return vault;
    }

    async getCollateral(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        return this.rewardsAPI.computeCollateralInStakingPool(
            newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency),
            vaultAccountId
        );
    }

    async getMinimumCollateral(
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrency);
        const minimumCollateral = await this.api.query.vaultRegistry.minimumCollateralVault(collateralCurrencyId);

        return newMonetaryAmount(minimumCollateral.toString(), collateralCurrency);
    }

    async getMaxNominationRatio(collateralCurrency: CollateralCurrencyExt): Promise<Big> {
        const [premiumRedeemThreshold, secureCollateralThreshold] = await Promise.all([
            this.getPremiumRedeemThreshold(collateralCurrency),
            this.getSecureCollateralThreshold(collateralCurrency),
        ]);
        return secureCollateralThreshold.div(premiumRedeemThreshold);
    }

    async computeBackingCollateral(
        vaultId: InterbtcPrimitivesVaultId,
        nonce?: number
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const collateralCurrency = await currencyIdToMonetaryCurrency(this.api, vaultId.currencies.collateral);
        if (nonce === undefined) {
            nonce = await this.rewardsAPI.getStakingPoolNonce(collateralCurrency, vaultId.accountId);
        }

        const rawBackingCollateral = await this.api.query.vaultStaking.totalCurrentStake(nonce, vaultId);
        return newMonetaryAmount(decodeFixedPointType(rawBackingCollateral), collateralCurrency);
    }

    async backingCollateralProportion(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<Big> {
        const vault = await this.get(vaultAccountId, collateralCurrency);

        const nominatorCollateral = await this.rewardsAPI.computeCollateralInStakingPool(
            newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency),
            nominatorId
        );

        // short-circuit a potential 0 div 0 scenario where
        // the nominator is equal to the vault and has zero collateral
        if (nominatorCollateral.isZero()) {
            return nominatorCollateral.toBig();
        }

        const backingCollateral = vault.backingCollateral.toBig();
        if (backingCollateral.eq(0)) {
            return Promise.reject(new Error("No backing collateral"));
        }

        return nominatorCollateral.toBig().div(backingCollateral);
    }

    async getBlockRewardAPY(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<Big> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const vaultIdParam = {
            account_id: vaultAccountId,
            currencies: vaultCurrencyPair,
        };

        // get estimated annual rewards as rate (ie. not percent)
        const rawRewardRate = await this.api.rpc.reward.estimateVaultRewardRate(vaultIdParam);
        const annualRewardRate = decodeFixedPointType(rawRewardRate);
        return annualRewardRate.mul(100);
    }

    async computeReward(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        rewardCurrency: Currency
    ): Promise<MonetaryAmount<Currency>> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const params = {
            account_id: vaultAccountId,
            currencies: vaultCurrencyPair,
        };
        const reward = await this.api.rpc.reward.computeVaultReward(params, newCurrencyId(this.api, rewardCurrency));
        return newMonetaryAmount(reward.amount.toString(), rewardCurrency);
    }

    async getWrappedReward(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        return await this.computeReward(vaultAccountId, collateralCurrency, this.wrappedCurrency);
    }

    async getGovernanceReward(
        vaultAccountId: AccountId,
        vaultCollateral: CollateralCurrencyExt,
        governanceCurrency: GovernanceCurrency
    ): Promise<MonetaryAmount<GovernanceCurrency>> {
        return await this.computeReward(vaultAccountId, vaultCollateral, governanceCurrency);
    }

    async getStakingCapacity(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        const [collateral, maxNominationRatio] = await Promise.all([
            this.getCollateral(vaultAccountId, collateralCurrency),
            this.getMaxNominationRatio(await currencyIdToMonetaryCurrency(this.api, vault.id.currencies.collateral)),
        ]);
        return collateral.mul(maxNominationRatio).sub(vault.backingCollateral);
    }

    async getLiquidationVault(collateralCurrency: CollateralCurrencyExt): Promise<SystemVaultExt> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const liquidationVault = await this.api.query.vaultRegistry.liquidationVault(vaultCurrencyPair);
        if (!liquidationVault.isSome) {
            return Promise.reject(NO_LIQUIDATION_VAULT_FOUND_REJECTION);
        }

        return await parseSystemVault(
            this.api,
            liquidationVault.value as VaultRegistrySystemVault,
            this.wrappedCurrency,
            collateralCurrency
        );
    }

    private isNoTokensIssuedError(e: string): boolean {
        return e !== undefined && e.includes("No tokens issued");
    }

    async isBelowPremiumThreshold(vaultId: InterbtcPrimitivesVaultId): Promise<boolean> {
        const [premiumRedeemThreshold, vaultCollateralization] = await Promise.all([
            this.getPremiumRedeemThreshold(await currencyIdToMonetaryCurrency(this.api, vaultId.currencies.collateral)),
            this.getCollateralizationFromVault(vaultId),
        ]);
        return vaultCollateralization.lt(premiumRedeemThreshold);
    }

    async getVaultCollateralization(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        newCollateral?: MonetaryAmount<CollateralCurrencyExt>,
        onlyIssued = false
    ): Promise<Big | undefined> {
        let collateralization = undefined;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
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
            if (this.isNoTokensIssuedError(e as string)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error(`Error during collateralization computation: ${e}`));
        }
        if (!collateralization) {
            return Promise.resolve(undefined);
        }
        return collateralization;
    }

    async getCollateralizationFromVault(vaultId: InterbtcPrimitivesVaultId, onlyIssued = false): Promise<Big> {
        const collateral = await this.computeBackingCollateral(vaultId);
        return this.getCollateralizationFromVaultAndCollateral(vaultId, collateral, onlyIssued);
    }

    async getCollateralizationFromVaultAndCollateral(
        vaultId: InterbtcPrimitivesVaultId,
        newCollateral: MonetaryAmount<CollateralCurrencyExt>,
        onlyIssued: boolean
    ): Promise<Big> {
        const vault = await this.get(
            vaultId.accountId,
            await currencyIdToMonetaryCurrency(this.api, vaultId.currencies.collateral)
        );
        const issuedTokens = await (onlyIssued ? Promise.resolve(vault.issuedTokens) : vault.getBackedTokens());
        if (issuedTokens.isZero()) {
            return Promise.reject("No tokens issued");
        }
        const collateralInWrapped = await this.oracleAPI.convertCollateralToWrapped(newCollateral);
        return collateralInWrapped.toBig().div(issuedTokens.toBig());
    }

    async getSystemCollateralization(): Promise<Big | undefined> {
        const issuedTokens = await this.tokensAPI.total(this.wrappedCurrency);
        const totalCollateralEntries = await this.api.query.vaultRegistry.totalUserVaultCollateral.entries();
        const totalWrappedEntries = await Promise.all(totalCollateralEntries
            .map(([key, value]): [InterbtcPrimitivesVaultCurrencyPair, string] => [storageKeyToNthInner(key), value.toString()])
            .map(async ([currencyPair, balance]) => {
                const collateralCurrency = await currencyIdToMonetaryCurrency(
                    this.assetRegistryAPI,
                    this.loansAPI,
                    currencyPair.collateral
                );
                const collateralAmount = newMonetaryAmount(balance, collateralCurrency);
                // TODO: we can probably use multiQuery for this
                return this.oracleAPI.convertCollateralToWrapped(collateralAmount);
            }));
        const totalCollateralAsWrapped = totalWrappedEntries
            .reduce((prev, curr) => prev.add(curr), newMonetaryAmount(0, this.wrappedCurrency));
        return totalCollateralAsWrapped.div(issuedTokens.toBig()).toBig();
    }

    async getRequiredCollateralForVault(
        vaultAccountId: AccountId,
        currency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const vault = await this.get(vaultAccountId, currency);
        const issuedTokens = vault.getBackedTokens();
        return await this.getRequiredCollateralForWrapped(issuedTokens, currency);
    }

    async getRequiredCollateralForWrapped(
        wrappedAmount: MonetaryAmount<WrappedCurrency>,
        currency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const secureCollateralThreshold = await this.getSecureCollateralThreshold(currency);
        const requiredCollateralInWrappedCurrency = wrappedAmount.mul(secureCollateralThreshold);
        return await this.oracleAPI.convertWrappedToCurrency(requiredCollateralInWrappedCurrency, currency);
    }

    async getIssuedAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        return vault.issuedTokens;
    }

    async getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency>> {
        const issuedTokens = await this.tokensAPI.total(this.wrappedCurrency);
        return issuedTokens;
    }

    async getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency>> {
        const issuableVaults = await this.api.rpc.vaultRegistry.getVaultsWithIssuableTokens();
        const totalBalanceAtomic = issuableVaults.reduce(
            (acc, [_, balanceWrapper]) => acc.add(balanceWrapper.amount.toString()),
            new Big(0)
        );
        const wrappedCurrency = this.getWrappedCurrency();

        return newMonetaryAmount(totalBalanceAtomic, wrappedCurrency);
    }

    async calculateCapacity(
        collateral: MonetaryAmount<CollateralCurrencyExt>
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        try {
            const [exchangeRate, secureCollateralThreshold] = await Promise.all([
                this.oracleAPI.getExchangeRate(collateral.currency),
                this.getSecureCollateralThreshold(collateral.currency),
            ]);
            const unusedCollateral = collateral.div(secureCollateralThreshold);
            return exchangeRate.toBase(unusedCollateral);
        } catch (error) {
            return newMonetaryAmount(0, this.wrappedCurrency);
        }
    }

    async getIssuableTokensFromVault(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.getWrappedCurrency());
        const balance = await this.api.rpc.vaultRegistry.getIssueableTokensFromVault({
            account_id: vaultId.accountId,
            currencies: vaultId.currencies,
        });
        const wrappedCurrencyPrimitive = newCurrencyId(this.api, this.getWrappedCurrency());
        const currency = await currencyIdToMonetaryCurrency(this.api, wrappedCurrencyPrimitive);
        const amount = newMonetaryAmount(balance.amount.toString(), currency);
        return amount;
    }

    async selectRandomVaultIssue(amount: MonetaryAmount<WrappedCurrency>): Promise<InterbtcPrimitivesVaultId> {
        const vaults = await this.getVaultsWithIssuableTokens();
        for (const [id, issuableAmount] of vaults) {
            if (issuableAmount.gte(amount)) {
                return id;
            }
        }
        return Promise.reject(new Error("Did not find vault with sufficient collateral"));
    }

    async selectRandomVaultRedeem(amount: MonetaryAmount<WrappedCurrency>): Promise<InterbtcPrimitivesVaultId> {
        // Selects the first vault with sufficient tokens
        const vaults = await this.list();
        for (const vault of vaults) {
            if (vault.issuedTokens.gte(amount)) {
                return vault.id;
            }
        }
        return Promise.reject(new Error("Did not find vault with sufficient locked BTC"));
    }

    async getPremiumRedeemVaults(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>> {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>> = new Map();
        const premiumRedeemVaults = await this.api.rpc.vaultRegistry.getPremiumRedeemVaults();

        for (const [vaultId, balanceWrapper] of premiumRedeemVaults) {
            const amount = newMonetaryAmount(balanceWrapper.amount.toString(), this.getWrappedCurrency());

            const ibtcPrimitivesVaultId = await decodeRpcVaultId(this.api, vaultId);
            map.set(ibtcPrimitivesVaultId, amount);
        }
        return map;
    }

    async getVaultsWithIssuableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>> {
        const issuableVaults = await this.api.rpc.vaultRegistry.getVaultsWithIssuableTokens();
        const vaultIdsToAmountsMap: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>> = new Map();
        for (const [vaultId, balanceWrapper] of issuableVaults) {
            const amount = newMonetaryAmount(balanceWrapper.amount.toString(), this.getWrappedCurrency());

            const ibtcPrimitivesVaultId = await decodeRpcVaultId(this.api, vaultId);
            vaultIdsToAmountsMap.set(ibtcPrimitivesVaultId, amount);
        }

        return vaultIdsToAmountsMap;
    }

    private isVaultEligibleForRedeem(vault: VaultExt, activeBlockNumber: number): boolean {
        const bannedUntilBlockNumber = vault.bannedUntil || 0;
        return (
            (vault.status === VaultStatusExt.Active || vault.status === VaultStatusExt.Inactive) &&
            vault.issuedTokens.gt(vault.toBeRedeemedTokens) &&
            bannedUntilBlockNumber < activeBlockNumber
        );
    }

    private async getVaultsEligibleForRedeeming(): Promise<VaultExt[]> {
        const [vaults, activeBlockNumber] = await Promise.all([
            this.list(),
            this.systemAPI.getCurrentActiveBlockNumber(),
        ]);

        // only non-banned, non-liquidated vaults with liquidity are eligible for redeems
        const redeemVaults = vaults.filter((vault) => {
            return this.isVaultEligibleForRedeem(vault, activeBlockNumber);
        });

        return redeemVaults;
    }

    async getVaultsWithRedeemableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>> {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>> = new Map();
        const vaults = await this.getVaultsEligibleForRedeeming();
        vaults
            .sort((vault1, vault2) => {
                // Descending order
                const vault1Redeemable = vault1.getRedeemableTokens().toBig();
                const vault2Redeemable = vault2.getRedeemableTokens().toBig();
                return vault2Redeemable.sub(vault1Redeemable).toNumber();
            })
            .forEach((vault) => map.set(vault.id, vault.getRedeemableTokens()));
        return map;
    }

    async isVaultFlaggedForTheft(vaultId: InterbtcPrimitivesVaultId, btcTxId: string): Promise<boolean> {
        const theftReports = await this.api.query.relay.theftReports(vaultId, {
            content: addHexPrefix(btcTxId),
        });
        return theftReports.isEmpty;
    }

    async getLiquidationCollateralThreshold(collateralCurrency: CollateralCurrencyExt): Promise<Big> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.liquidationCollateralThreshold(vaultCurrencyPair);
        if (!threshold.isSome) {
            return Promise.reject(`No liquidation threshold for currency ${collateralCurrency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getPremiumRedeemThreshold(collateralCurrency: CollateralCurrencyExt): Promise<Big> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.premiumRedeemThreshold(vaultCurrencyPair);
        if (!threshold.isSome) {
            return Promise.reject(`No premium redeem threshold for currency ${collateralCurrency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getSecureCollateralThreshold(collateralCurrency: CollateralCurrencyExt): Promise<Big> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold(vaultCurrencyPair);
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getAPY(vaultAccountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<Big> {
        const [feesWrapped, lockedCollateral, blockRewardsAPY] = await Promise.all([
            this.getWrappedReward(vaultAccountId, collateralCurrency),
            this.getCollateral(vaultAccountId, collateralCurrency),
            this.getBlockRewardAPY(vaultAccountId, collateralCurrency),
        ]);
        return (await this.feeAPI.calculateAPY(feesWrapped, lockedCollateral)).add(blockRewardsAPY);
    }

    async getPunishmentFee(): Promise<Big> {
        const fee = await this.api.query.fee.punishmentFee();
        return decodeFixedPointType(fee);
    }

    private parseVaultStatus(status: VaultRegistryVaultStatus): VaultStatusExt {
        if (status.isActive) {
            return status.asActive.isTrue ? VaultStatusExt.Active : VaultStatusExt.Inactive;
        } else if (status.isLiquidated) {
            return VaultStatusExt.Liquidated;
        } else {
            throw new Error("Unknown vault status");
        }
    }

    async parseVault(vault: VaultRegistryVault): Promise<VaultExt> {
        const collateralCurrency = await currencyIdToMonetaryCurrency(this.api, vault.id.currencies.collateral);
        const replaceCollateral = newMonetaryAmount(vault.replaceCollateral.toString(), collateralCurrency);
        const liquidatedCollateral = newMonetaryAmount(vault.liquidatedCollateral.toString(), collateralCurrency);
        const backingCollateral = await this.computeBackingCollateral(vault.id);

        const secureThreshold = vault.secureCollateralThreshold.isSome
            ? decodeFixedPointType(vault.secureCollateralThreshold.unwrap())
            : await this.getSecureCollateralThreshold(collateralCurrency);

        return new VaultExt(
            this.api,
            this.oracleAPI,
            this.systemAPI,
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
            secureThreshold
        );
    }

    buildAcceptNewIssuesExtrinsic(
        collateralCurrency: CollateralCurrencyExt,
        acceptNewIssues: boolean
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        return this.api.tx.vaultRegistry.acceptNewIssues(vaultCurrencyPair, acceptNewIssues);
    }

    async toggleIssueRequests(vaultId: InterbtcPrimitivesVaultId, acceptNewIssues: boolean): Promise<ExtrinsicData> {
        const collateralCurrency = await currencyIdToMonetaryCurrency(this.api, vaultId.currencies.collateral);
        const tx = this.buildAcceptNewIssuesExtrinsic(collateralCurrency, acceptNewIssues);
        return { extrinsic: tx, event: this.api.events.system.ExtrinsicSuccess };
    }

    async getExchangeRateForLiquidation(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<Big | undefined> {
        const [vaultExt, liquidationRateThreshold, lockedCollateral] = await Promise.all([
            this.get(vaultAccountId, collateralCurrency),
            this.getLiquidationCollateralThreshold(collateralCurrency),
            this.getCollateral(vaultAccountId, collateralCurrency),
        ]);

        if (liquidationRateThreshold.eq(0)) {
            return undefined;
        }

        const issuedTokens = vaultExt.getBackedTokens();

        if (issuedTokens.toBig().eq(0)) {
            return undefined;
        }

        // calculate the theoretical exchange rate at which the vault would be (close to) liquidated
        const liquidationRateCollateralPerWrapped = lockedCollateral
            .toBig()
            .div(issuedTokens.toBig().mul(liquidationRateThreshold));
        return liquidationRateCollateralPerWrapped;
    }
}
