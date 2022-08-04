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
} from "@polkadot/types/lookup";

import {
    decodeFixedPointType,
    newMonetaryAmount,
    parseSystemVault,
    getTxProof,
    newCurrencyId,
    newVaultId,
    newVaultCurrencyPair,
    addHexPrefix,
    currencyIdToMonetaryCurrency,
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
} from "../types";
import { RewardsAPI } from "./rewards";
import { BalanceWrapper, UnsignedFixedPoint } from "../interfaces";
import { AssetRegistryAPI, SystemAPI } from "./index";

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
     * @returns the collateral value as a percentage string
     */
    getMinimumCollateral(collateralCurrency: CollateralCurrencyExt): Promise<Big>;
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
     * @param collateralCurrency
     * @returns The over-collateralization rate for collateral locked
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
     * @param nominatorId: an account nominating this vault
     * @param collateralCurrency: the vault's collateral currency
     * @param governanceCurrency: the governance token that block rewards are paid in
     * @returns the APY as a percentage string
     */
    getBlockRewardAPY(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        governanceCurrency: GovernanceCurrency
    ): Promise<Big>;
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
    withdrawCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): Promise<void>;
    /**
     * @param amount The amount of extra collateral to lock
     */
    depositCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): Promise<void>;
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
    getIssueableTokensFromVault(
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
     * A relayer may report Vault misbehavior by providing a fraud proof
     * (malicious Bitcoin transaction and transaction inclusion proof).
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param vaultId The vault ID of the vault to be reported.
     * @param btcTxId Bitcoin transaction ID
     */
    reportVaultTheft(vaultId: InterbtcPrimitivesVaultId, btcTxId: string): Promise<void>;

    /**
     * @returns The wrapped currency issued by the vaults
     */
    getWrappedCurrency(): WrappedCurrency;
    /**
     * Compute the total reward, including the staking (local) pool and the rewards (global) pool
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param nominatorId The account ID of the staking pool nominator
     * @param vaultCollateral Collateral used by the vault. This is the currency used as
     * stake in the `staking` and `rewards` pools.
     * @param rewardCurrency The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @returns A Monetary.js amount object, representing the total reward in the given currency
     */
    computeReward(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        rewardCurrency: Currency,
        nonce?: number
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
     * Enables or disables issue requests for given vault
     * @param vaultId The vault ID whose issuing will be toggled
     * @param acceptNewIssues Boolean denoting whether issuing should be enabled or not
     */
    toggleIssueRequests(vaultId: InterbtcPrimitivesVaultId, acceptNewIssues: boolean): Promise<void>;
}

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
        private transactionAPI: TransactionAPI,
        private assetRegistryAPI: AssetRegistryAPI
    ) {}

    getWrappedCurrency(): WrappedCurrency {
        return this.wrappedCurrency;
    }

    async register(amount: MonetaryAmount<CollateralCurrencyExt>, publicKey: string): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString(true));
        const currencyPair = newVaultCurrencyPair(this.api, amount.currency, this.wrappedCurrency);
        await Promise.all([
            this.transactionAPI.sendLogged(
                this.api.tx.vaultRegistry.registerPublicKey(publicKey),
                this.api.events.vaultRegistry.UpdatePublicKey,
                true
            ),
            this.transactionAPI.sendLogged(
                this.api.tx.vaultRegistry.registerVault(currencyPair, amountAtomicUnit),
                this.api.events.vaultRegistry.RegisterVault,
                true
            ),
        ]);
    }

    async withdrawCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString(true));
        const currencyPair = newVaultCurrencyPair(this.api, amount.currency, this.wrappedCurrency);
        const tx = this.api.tx.vaultRegistry.withdrawCollateral(currencyPair, amountAtomicUnit);
        await this.transactionAPI.sendLogged(tx, this.api.events.vaultRegistry.WithdrawCollateral, true);
    }

    async depositCollateral(amount: MonetaryAmount<CollateralCurrencyExt>): Promise<void> {
        const amountAsPlanck = this.api.createType("Balance", amount.toString(true));
        const currencyPair = newVaultCurrencyPair(this.api, amount.currency, this.wrappedCurrency);
        const tx = this.api.tx.vaultRegistry.depositCollateral(currencyPair, amountAsPlanck);
        await this.transactionAPI.sendLogged(tx, this.api.events.vaultRegistry.DepositCollateral, true);
    }

    async list(atBlock?: BlockHash): Promise<VaultExt[]> {
        const vaultsMap = await (atBlock
            ? this.api.query.vaultRegistry.vaults.entriesAt(atBlock)
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

    async getMinimumCollateral(collateralCurrency: CollateralCurrencyExt): Promise<Big> {
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrency);
        const minimumCollateral = await this.api.query.vaultRegistry.minimumCollateralVault(collateralCurrencyId);

        return decodeFixedPointType(minimumCollateral);
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
        const collateralCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistryAPI,
            vaultId.currencies.collateral
        );
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

    async getBlockRewardAPY(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        governanceCurrency: GovernanceCurrency
    ): Promise<Big> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        const [globalRewardPerBlock, globalStake, vaultStake, vaultRewardShare, lockedCollateral, minimumBlockPeriod] =
            await Promise.all([
                this.rewardsAPI.getRewardPerBlock(governanceCurrency),
                this.getTotalIssuedAmount(),
                this.getIssuedAmount(vaultAccountId, collateralCurrency),
                this.backingCollateralProportion(vaultAccountId, nominatorId, collateralCurrency),
                (
                    await this.tokensAPI.balance(
                        await currencyIdToMonetaryCurrency(this.assetRegistryAPI, vault.id.currencies.collateral),
                        vaultAccountId
                    )
                ).reserved,
                this.api.consts.timestamp.minimumPeriod,
            ]);

        if (globalStake.toBig().eq(0)) {
            return Promise.reject(new Error("No issued kBTC"));
        }

        const globalRewardShare = vaultStake.toBig().div(globalStake.toBig());
        const vaultRewardPerBlock = globalRewardPerBlock.mul(globalRewardShare);
        const ownRewardPerBlock = vaultRewardPerBlock.mul(vaultRewardShare);
        const rewardAsWrapped = await this.oracleAPI.convertCollateralToWrapped(ownRewardPerBlock);
        const blockTime = minimumBlockPeriod.toNumber() * 2; // ms
        const blocksPerYear = (86400 * 365 * 1000) / blockTime;
        const annualisedReward = rewardAsWrapped.mul(blocksPerYear);
        return this.feeAPI.calculateAPY(annualisedReward, lockedCollateral);
    }

    async computeReward(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        rewardCurrency: Currency,
        nonce?: number
    ): Promise<MonetaryAmount<Currency>> {
        const [totalGlobalReward, globalRewardShare] = await Promise.all([
            this.rewardsAPI.computeRewardInRewardsPool(rewardCurrency, collateralCurrency, vaultAccountId),
            this.backingCollateralProportion(vaultAccountId, nominatorId, collateralCurrency),
        ]);
        const ownGlobalReward = totalGlobalReward.mul(globalRewardShare);
        const localReward = await this.rewardsAPI.computeRewardInStakingPool(
            vaultAccountId,
            nominatorId,
            collateralCurrency,
            rewardCurrency,
            nonce
        );
        return ownGlobalReward.add(localReward);
    }

    async getWrappedReward(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        return await this.computeReward(vaultAccountId, vaultAccountId, collateralCurrency, this.wrappedCurrency);
    }

    async getGovernanceReward(
        vaultAccountId: AccountId,
        vaultCollateral: CollateralCurrencyExt,
        governanceCurrency: GovernanceCurrency
    ): Promise<MonetaryAmount<GovernanceCurrency>> {
        return await this.computeReward(vaultAccountId, vaultAccountId, vaultCollateral, governanceCurrency);
    }

    async getStakingCapacity(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        const [collateral, maxNominationRatio] = await Promise.all([
            this.getCollateral(vaultAccountId, collateralCurrency),
            this.getMaxNominationRatio(
                await currencyIdToMonetaryCurrency(this.assetRegistryAPI, vault.id.currencies.collateral)
            ),
        ]);
        return collateral.mul(maxNominationRatio).sub(vault.backingCollateral);
    }

    async getLiquidationVault(collateralCurrency: CollateralCurrencyExt): Promise<SystemVaultExt> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const liquidationVault = await this.api.query.vaultRegistry.liquidationVault(vaultCurrencyPair);
        if (!liquidationVault.isSome) {
            return Promise.reject("System vault could not be fetched");
        }
        return await parseSystemVault(
            this.assetRegistryAPI,
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
            this.getPremiumRedeemThreshold(
                await currencyIdToMonetaryCurrency(this.assetRegistryAPI, vaultId.currencies.collateral)
            ),
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
            await currencyIdToMonetaryCurrency(this.assetRegistryAPI, vaultId.currencies.collateral)
        );
        const issuedTokens = await (onlyIssued ? Promise.resolve(vault.issuedTokens) : vault.getBackedTokens());
        if (issuedTokens.isZero()) {
            return Promise.reject("No tokens issued");
        }
        const collateralInWrapped = await this.oracleAPI.convertCollateralToWrapped(newCollateral);
        return collateralInWrapped.toBig().div(issuedTokens.toBig());
    }

    async getSystemCollateralization(): Promise<Big | undefined> {
        // TODO: Implement once method of calculation is decided on
        return Promise.resolve(undefined);
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

    async getIssueableTokensFromVault(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<MonetaryAmount<WrappedCurrency>> {
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.getWrappedCurrency());
        const balance = await this.api.rpc.vaultRegistry.getIssueableTokensFromVault(vaultId);
        const currency = await currencyIdToMonetaryCurrency(this.assetRegistryAPI, balance.currencyId);
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
        const vaults = await this.getVaultsEligibleForRedeeming();

        const premiumRedeemVaultPredicates = await Promise.all(
            vaults.map((vault) => this.isBelowPremiumThreshold(vault.id))
        );
        vaults
            .filter((_, index) => premiumRedeemVaultPredicates[index])
            .forEach((vault) => map.set(vault.id, vault.getRedeemableTokens()));
        return map;
    }

    async getVaultsWithIssuableTokens(): Promise<Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>>> {
        const issuableVaults = await this.api.rpc.vaultRegistry.getVaultsWithIssuableTokens();
        const vaultIdsToAmountsMap: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency>> = new Map();
        for (const [vaultId, balanceWrapper] of issuableVaults) {
            const amount = newMonetaryAmount(balanceWrapper.amount.toString(), this.getWrappedCurrency());
            const [collateralCcy, wrappedCcy] = await Promise.all([
                currencyIdToMonetaryCurrency(this.assetRegistryAPI, vaultId.currencies.collateral),
                currencyIdToMonetaryCurrency(this.assetRegistryAPI, vaultId.currencies.wrapped),
            ]);

            const ibtcPrimitivesVaultId = newVaultId(
                this.api,
                vaultId.account_id.toString(),
                collateralCcy,
                wrappedCcy
            );

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
        const vault = await this.get(vaultAccountId, collateralCurrency);
        const [feesWrapped, lockedCollateral, blockRewardsAPY] = await Promise.all([
            await this.getWrappedReward(vaultAccountId, collateralCurrency),
            (
                await this.tokensAPI.balance(
                    await currencyIdToMonetaryCurrency(this.assetRegistryAPI, vault.id.currencies.collateral),
                    vaultAccountId
                )
            ).reserved,
            this.getBlockRewardAPY(vaultAccountId, vaultAccountId, collateralCurrency, this.governanceCurrency),
        ]);
        return (await this.feeAPI.calculateAPY(feesWrapped, lockedCollateral)).add(blockRewardsAPY);
    }

    async getPunishmentFee(): Promise<Big> {
        const fee = await this.api.query.fee.punishmentFee();
        return decodeFixedPointType(fee);
    }

    private wrapCurrency(amount: MonetaryAmount<CollateralCurrencyExt>): BalanceWrapper {
        return this.api.createType("BalanceWrapper", {
            amount: this.api.createType("u128", amount.toString(true)),
            currencyId: newCurrencyId(this.api, amount.currency),
        });
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
        const collateralCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistryAPI,
            vault.id.currencies.collateral
        );
        const replaceCollateral = newMonetaryAmount(vault.replaceCollateral.toString(), collateralCurrency);
        const liquidatedCollateral = newMonetaryAmount(vault.liquidatedCollateral.toString(), collateralCurrency);
        const backingCollateral = await this.computeBackingCollateral(vault.id);
        return new VaultExt(
            this.api,
            this.oracleAPI,
            this.systemAPI,
            this.assetRegistryAPI,
            backingCollateral,
            vault.id,
            this.parseVaultStatus(vault.status),
            vault.bannedUntil.isSome ? (vault.bannedUntil.value as BlockNumber).toNumber() : undefined,
            newMonetaryAmount(vault.toBeIssuedTokens.toString(), this.wrappedCurrency),
            newMonetaryAmount(vault.issuedTokens.toString(), this.wrappedCurrency),
            newMonetaryAmount(vault.toBeRedeemedTokens.toString(), this.wrappedCurrency),
            newMonetaryAmount(vault.toBeReplacedTokens.toString(), this.wrappedCurrency),
            replaceCollateral,
            liquidatedCollateral
        );
    }

    async reportVaultTheft(vaultId: InterbtcPrimitivesVaultId, btcTxId: string): Promise<void> {
        const txInclusionDetails = await getTxProof(this.electrsAPI, btcTxId);
        const tx = this.api.tx.relay.reportVaultTheft(
            vaultId,
            txInclusionDetails.merkleProof,
            txInclusionDetails.rawTx
        );
        await this.transactionAPI.sendLogged(tx, this.api.events.relay.VaultTheft, true);
    }

    async toggleIssueRequests(vaultId: InterbtcPrimitivesVaultId, acceptNewIssues: boolean): Promise<void> {
        const currencyPair = vaultId.currencies;
        const tx = this.api.tx.vaultRegistry.acceptNewIssues(currencyPair, acceptNewIssues);
        await this.transactionAPI.sendLogged(tx, this.api.events.system.ExtrinsicSuccess, true);
    }
}
