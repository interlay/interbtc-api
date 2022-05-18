import { ApiPromise } from "@polkadot/api";
import { AccountId, BlockNumber, BlockHash } from "@polkadot/types/interfaces";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import { MonetaryAmount, Currency, BitcoinUnit } from "@interlay/monetary-js";
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
    parseWallet,
    parseSystemVault,
    getTxProof,
    newCurrencyId,
    newVaultId,
    newVaultCurrencyPair,
} from "../utils";
import { TokensAPI } from "./tokens";
import { OracleAPI } from "./oracle";
import { FeeAPI } from "./fee";
import { TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import {
    CollateralUnit,
    tickerToCurrencyIdLiteral,
    VaultExt,
    SystemVaultExt,
    VaultStatusExt,
    currencyIdToMonetaryCurrency,
    CollateralCurrency,
    WrappedCurrency,
    CurrencyIdLiteral,
    WrappedIdLiteral,
    CollateralIdLiteral,
    currencyIdToLiteral,
    tickerToMonetaryCurrency,
    currencyIdLiteralToMonetaryCurrency,
    GovernanceUnit,
    CurrencyUnit,
    GovernanceIdLiteral,
    GovernanceCurrency,
} from "../types";
import { RewardsAPI } from "./rewards";
import { BalanceWrapper, UnsignedFixedPoint } from "../interfaces";
import { SystemAPI } from ".";

/**
 * @category BTC Bridge
 */
export interface VaultsAPI {
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
     * @returns The total amount of wrapped tokens issued by the vaults
     */
    getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @returns The total amount of wrapped tokens that can be issued, considering the collateral
     * locked by the vaults
     */
    getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @param collateral Amount of collateral to calculate issuable capacity for
     * @returns Issuable amount by the vault, given the collateral amount
     */
    calculateCapacity<C extends CollateralUnit>(
        collateral: MonetaryAmount<Currency<C>, C>
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>;
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
     * @returns Vaults with issuable tokens, not sorted in any particular order.
     * @remarks The result is not sorted as an attempt to randomize the assignment of requests to vaults.
     */
    getVaultsWithIssuableTokens(): Promise<
        Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>
    >;
    /**
     * @returns Vaults with redeemable tokens, sorted in descending order.
     */
    getVaultsWithRedeemableTokens(): Promise<
        Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>
    >;
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
     * @param governanceCurrency The governance currency we're using for block rewards
     * @returns the APY as a percentage string
     */
    getAPY(vaultAccountId: AccountId, collateralCurrency: CurrencyIdLiteral): Promise<Big>;
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
        collateralCurrency: CollateralIdLiteral,
        governanceCurrency: GovernanceIdLiteral
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
     * @param btcTxId Bitcoin transaction ID
     */
    reportVaultTheft(vaultAccountId: AccountId, btcTxId: string): Promise<void>;
    /**
     * @returns The wrapped currency issued by the vaults
     */
    getWrappedCurrency(): WrappedCurrency;
    /**
     * Compute the total reward, including the staking (local) pool and the rewards (global) pool
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param nominatorId The account ID of the staking pool nominator
     * @param vaultCollateralIdLiteral Collateral used by the vault. This is the currency used as
     * stake in the `staking` and `rewards` pools.
     * @param rewardCurrencyIdLiteral The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @returns A Monetary.js amount object, representing the total reward in the given currency
     */
    computeReward(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>>;
    /**
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param vaultCollateralIdLiteral Collateral used by the vault
     * @param rewardCurrencyIdLiteral The fee reward currency
     * @returns The total reward collected by the vault
     */
    getWrappedReward(
        vaultAccountId: AccountId,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        rewardCurrencyIdLiteral: WrappedIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>;
    /**
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param vaultCollateralIdLiteral Collateral used by the vault
     * @param governanceCurrencyIdLiteral The fee reward currency
     * @returns The total reward collected by the vault
     */
    getGovernanceReward(
        vaultAccountId: AccountId,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        governanceCurrencyIdLiteral: GovernanceIdLiteral
    ): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>>;
    /**
     * Enables or disables issue requests for given vault
     * @param vaultAccountId The vault ID whose issuing will be toggled
     * @param acceptNewIssues Boolean denoting whether issuing should be enabled or not
     */
    toggleIssueRequests(vaultAccountId: InterbtcPrimitivesVaultId, acceptNewIssues: boolean): Promise<void>;
}

export class DefaultVaultsAPI implements VaultsAPI {
    constructor(
        private api: ApiPromise,
        private btcNetwork: Network,
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

    async register<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>, publicKey: string): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString());
        const currencyPair = newVaultCurrencyPair(
            this.api,
            tickerToMonetaryCurrency(this.api, amount.currency.ticker) as CollateralCurrency,
            this.wrappedCurrency
        );
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

    async withdrawCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString());
        const currencyPair = newVaultCurrencyPair(
            this.api,
            tickerToMonetaryCurrency(this.api, amount.currency.ticker) as CollateralCurrency,
            this.wrappedCurrency
        );
        const tx = this.api.tx.vaultRegistry.withdrawCollateral(currencyPair, amountAtomicUnit);
        await this.transactionAPI.sendLogged(tx, this.api.events.vaultRegistry.WithdrawCollateral, true);
    }

    async depositCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const currencyPair = newVaultCurrencyPair(
            this.api,
            tickerToMonetaryCurrency(this.api, amount.currency.ticker) as CollateralCurrency,
            this.wrappedCurrency
        );
        const tx = this.api.tx.vaultRegistry.depositCollateral(currencyPair, amountAsPlanck);
        await this.transactionAPI.sendLogged(tx, this.api.events.vaultRegistry.DepositCollateral, true);
    }

    async list(atBlock?: BlockHash): Promise<VaultExt<BitcoinUnit>[]> {
        const vaultsMap = await (atBlock
            ? this.api.query.vaultRegistry.vaults.entriesAt(atBlock)
            : this.api.query.vaultRegistry.vaults.entries());
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
            const collateralCurrency = currencyIdLiteralToMonetaryCurrency(
                this.api,
                collateralCurrencyIdLiteral
            ) as CollateralCurrency;
            const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
            const vault = await this.api.query.vaultRegistry.vaults<Option<VaultRegistryVault>>(vaultId);
            if (!vault.isSome) {
                return Promise.reject(`No vault registered with id ${vaultId}`);
            }
            return this.parseVault(vault.value as VaultRegistryVault, this.btcNetwork);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getCollateral(
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const collateralCurrency = currencyIdLiteralToMonetaryCurrency(
            this.api,
            collateralCurrencyIdLiteral
        ) as CollateralCurrency;
        return this.rewardsAPI.computeCollateralInStakingPool(
            newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency),
            vaultAccountId
        );
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

    async backingCollateralProportion(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral
    ): Promise<Big> {
        const vault = await this.get(vaultAccountId, collateralCurrencyIdLiteral);
        const collateralCurrency = currencyIdLiteralToMonetaryCurrency(
            this.api,
            collateralCurrencyIdLiteral
        ) as CollateralCurrency;
        const nominatorCollateral = await this.rewardsAPI.computeCollateralInStakingPool(
            newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency),
            nominatorId
        );
        return nominatorCollateral.toBig().div(vault.backingCollateral.toBig());
    }

    async getBlockRewardAPY(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralIdLiteral,
        governanceCurrency: GovernanceIdLiteral
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
                        currencyIdToMonetaryCurrency(vault.id.currencies.collateral) as Currency<CollateralUnit>,
                        vaultAccountId
                    )
                ).reserved,
                this.api.consts.timestamp.minimumPeriod,
            ]);
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
        collateralCurrencyId: CollateralIdLiteral,
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>> {
        const [totalGlobalReward, globalRewardShare] = await Promise.all([
            this.rewardsAPI.computeRewardInRewardsPool(rewardCurrencyIdLiteral, collateralCurrencyId, vaultAccountId),
            this.backingCollateralProportion(vaultAccountId, nominatorId, collateralCurrencyId),
        ]);
        const ownGlobalReward = totalGlobalReward.mul(globalRewardShare);
        const localReward = await this.rewardsAPI.computeRewardInStakingPool(
            vaultAccountId,
            nominatorId,
            collateralCurrencyId,
            rewardCurrencyIdLiteral,
            nonce
        );
        return ownGlobalReward.add(localReward);
    }

    async getWrappedReward(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        return (await this.computeReward(
            vaultAccountId,
            vaultAccountId,
            collateralCurrency,
            tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker)
        )) as MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>;
    }

    async getGovernanceReward(
        vaultAccountId: AccountId,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        governanceCurrencyIdLiteral: GovernanceIdLiteral
    ): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>> {
        return (await this.computeReward(
            vaultAccountId,
            vaultAccountId,
            vaultCollateralIdLiteral,
            governanceCurrencyIdLiteral
        )) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
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
            ),
        ]);
        return collateral.mul(maxNominationRatio).sub(vault.backingCollateral);
    }

    async getLiquidationVault(collateralCurrency: CollateralCurrency): Promise<SystemVaultExt<BitcoinUnit>> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const liquidationVault = await this.api.query.vaultRegistry.liquidationVault(vaultCurrencyPair);
        if (!liquidationVault.isSome) {
            return Promise.reject("System vault could not be fetched");
        }
        return parseSystemVault(
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
                currencyIdToMonetaryCurrency(vaultId.currencies.collateral) as CollateralCurrency
            ),
            this.getCollateralizationFromVault(vaultId),
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
            if (this.isNoTokensIssuedError(e as string)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error(`Error during collateralization computation: ${(e)}`));
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

    async getCollateralizationFromVaultAndCollateral<C extends CollateralUnit>(
        vaultId: InterbtcPrimitivesVaultId,
        newCollateral: MonetaryAmount<Currency<C>, C>,
        onlyIssued: boolean
    ): Promise<Big> {
        const vault = await this.get(
            vaultId.accountId,
            currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral
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

    async getRequiredCollateralForVault<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const vault = await this.get(vaultAccountId, tickerToCurrencyIdLiteral(currency.ticker) as CollateralIdLiteral);
        const issuedTokens = vault.getBackedTokens();
        return await this.getRequiredCollateralForWrapped(issuedTokens, currency);
    }

    async getRequiredCollateralForWrapped<C extends CollateralUnit>(
        wrappedAmount: MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const secureCollateralThreshold = await this.getSecureCollateralThreshold(
            currency as unknown as CollateralCurrency
        );
        const requiredCollateralInWrappedCurrency = wrappedAmount.mul(secureCollateralThreshold);
        return await this.oracleAPI.convertWrappedToCurrency(requiredCollateralInWrappedCurrency, currency);
    }

    async getIssuedAmount(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        return vault.issuedTokens;
    }

    async getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        const issuedTokens = await this.tokensAPI.total(this.wrappedCurrency);
        return issuedTokens;
    }

    async getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        // get [[wrapped, collateral], amount][] map
        const perCurrencyPairCollateralAmounts = await this.api.query.vaultRegistry.totalUserVaultCollateral.entries();
        // filter for wrapped === this.wrapped, as only one wrapped currency is handled at a time currently
        const perWrappedCurrencyCollateralAmounts = perCurrencyPairCollateralAmounts.filter(
            ([key, _val]) => currencyIdToMonetaryCurrency(key.args[0].wrapped).name === this.wrappedCurrency.name
        );
        // reduce from [[this.wrapped, collateral], amount][] pairs to [collateral, sumAmount][] map
        const perCollateralCurrencyCollateralAmounts = perWrappedCurrencyCollateralAmounts.reduce(
            (amounts, [key, amount]) => {
                const collateralCurrency = currencyIdToMonetaryCurrency<CollateralUnit>(key.args[0].collateral);
                let collateralAmount = newMonetaryAmount(amount.toString(), collateralCurrency);
                if (amounts.has(collateralCurrency)) {
                    // .has() is true, hence non-null
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    collateralAmount = collateralAmount.add(amounts.get(collateralCurrency)!);
                }
                amounts.set(collateralCurrency, collateralAmount);
                return amounts;
            },
            new Map<Currency<CollateralUnit>, MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>()
        );
        // finally convert the CollateralAmount sums to issuable amounts and sum those to get the total
        const [perCollateralCurrencyIssuableAmounts, issuedAmountBtc] = await Promise.all([
            Promise.all(
                [...perCollateralCurrencyCollateralAmounts.values()].map((collateralAmount) =>
                    this.calculateCapacity(collateralAmount)
                )
            ),
            this.getTotalIssuedAmount(),
        ]);
        const totalIssuableAmount = perCollateralCurrencyIssuableAmounts.reduce((acc, v) => acc.add(v));
        return totalIssuableAmount.sub(issuedAmountBtc);
    }

    async calculateCapacity<C extends CollateralUnit>(
        collateral: MonetaryAmount<Currency<C>, C>
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        try {
            const [exchangeRate, secureCollateralThreshold] = await Promise.all([
                this.oracleAPI.getExchangeRate(collateral.currency),
                this.getSecureCollateralThreshold(collateral.currency as unknown as CollateralCurrency),
            ]);
            const unusedCollateral = collateral.div(secureCollateralThreshold);
            return exchangeRate.toBase(unusedCollateral);
        } catch (error) {
            return newMonetaryAmount(0, this.wrappedCurrency);
        }
    }

    async selectRandomVaultIssue(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>
    ): Promise<InterbtcPrimitivesVaultId> {
        const vaults = await this.getVaultsWithIssuableTokens();
        for (const [id, issuableAmount] of vaults) {
            if (issuableAmount.gte(amount)) {
                return id;
            }
        }
        return Promise.reject(new Error("Did not find vault with sufficient collateral"));
    }

    async selectRandomVaultRedeem(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>
    ): Promise<InterbtcPrimitivesVaultId> {
        // Selects the first vault with sufficient tokens
        const vaults = await this.list();
        for (const vault of vaults) {
            if (vault.issuedTokens.gte(amount)) {
                return vault.id;
            }
        }
        return Promise.reject(new Error("Did not find vault with sufficient locked BTC"));
    }

    async getPremiumRedeemVaults(): Promise<
        Map<InterbtcPrimitivesVaultId, MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>
        > {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>> = new Map();
        const vaults = await this.getVaultsEligibleForRedeeming();
        
        const premiumRedeemVaultPredicates = await Promise.all(
            vaults
                .map((vault) => this.isBelowPremiumThreshold(vault.id))
        );
        vaults
            .filter((_, index) => premiumRedeemVaultPredicates[index])
            .forEach((vault) => map.set(vault.id, vault.getRedeemableTokens()));
        return map;
    }

    async getVaultsWithIssuableTokens(): Promise<
        Map<InterbtcPrimitivesVaultId, MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>
        > {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>> = new Map();
        const [vaults, activeBlockNumber] = await Promise.all([
            this.list(),
            this.systemAPI.getCurrentActiveBlockNumber(),
        ]);
        const issuableTokens = await Promise.all(
            vaults
                .filter((vault) => {
                    const bannedUntilBlockNumber = vault.bannedUntil || 0;
                    return vault.status === VaultStatusExt.Active && bannedUntilBlockNumber < activeBlockNumber;
                })
                .map((vault) => {
                    return new Promise<[MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>, InterbtcPrimitivesVaultId]>(
                        (resolve, _) => vault.getIssuableTokens().then((amount) => resolve([amount, vault.id]))
                    );
                })
        );
        issuableTokens.forEach(([amount, vaultId]) => map.set(vaultId, amount));
        return map;
    }

    private isVaultEligibleForRedeem(vault: VaultExt<BitcoinUnit>, activeBlockNumber: number): boolean {
        const bannedUntilBlockNumber = vault.bannedUntil || 0;
        return (
            (vault.status === VaultStatusExt.Active || vault.status === VaultStatusExt.Inactive) &&
            vault.issuedTokens.gt(vault.toBeRedeemedTokens) &&
            bannedUntilBlockNumber < activeBlockNumber
        );
    }

    private async getVaultsEligibleForRedeeming(): Promise<VaultExt<BitcoinUnit>[]> {
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

    async getVaultsWithRedeemableTokens(): Promise<
        Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>
        > {
        const map: Map<InterbtcPrimitivesVaultId, MonetaryAmount<WrappedCurrency, BitcoinUnit>> = new Map();
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

    async isVaultFlaggedForTheft(
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        btcTxId: string
    ): Promise<boolean> {
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrencyIdLiteral);
        const vaultId = newVaultId(
            this.api,
            vaultAccountId.toString(),
            currencyIdToMonetaryCurrency(collateralCurrencyId) as CollateralCurrency,
            this.wrappedCurrency
        );
        const theftReports = await this.api.query.relay.theftReports(vaultId, { content: btcTxId });
        return theftReports.isEmpty;
    }

    async getLiquidationCollateralThreshold(collateralCurrency: CollateralCurrency): Promise<Big> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.liquidationCollateralThreshold(vaultCurrencyPair);
        if (!threshold.isSome) {
            return Promise.reject(`No liquidation threshold for currency ${collateralCurrency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getPremiumRedeemThreshold(collateralCurrency: CollateralCurrency): Promise<Big> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.premiumRedeemThreshold(vaultCurrencyPair);
        if (!threshold.isSome) {
            return Promise.reject(`No premium redeem threshold for currency ${collateralCurrency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getSecureCollateralThreshold(collateralCurrency: CollateralCurrency): Promise<Big> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold(vaultCurrencyPair);
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getAPY(vaultAccountId: AccountId, collateralCurrency: CollateralIdLiteral): Promise<Big> {
        const vault = await this.get(vaultAccountId, collateralCurrency);
        const [feesWrapped, lockedCollateral, blockRewardsAPY] = await Promise.all([
            await this.getWrappedReward(vaultAccountId, collateralCurrency),
            (
                await this.tokensAPI.balance(
                    currencyIdToMonetaryCurrency(vault.id.currencies.collateral) as Currency<CollateralUnit>,
                    vaultAccountId
                )
            ).reserved,
            this.getBlockRewardAPY(
                vaultAccountId,
                vaultAccountId,
                collateralCurrency,
                tickerToCurrencyIdLiteral(this.governanceCurrency.ticker) as GovernanceIdLiteral
            ),
        ]);
        return (await this.feeAPI.calculateAPY(feesWrapped, lockedCollateral)).add(blockRewardsAPY);
    }

    async getPunishmentFee(): Promise<Big> {
        const fee = await this.api.query.fee.punishmentFee();
        return decodeFixedPointType(fee);
    }

    private wrapCurrency<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): BalanceWrapper {
        return this.api.createType("BalanceWrapper", {
            amount: this.api.createType("u128", amount.toString()),
            currencyId: newCurrencyId(this.api, tickerToCurrencyIdLiteral(amount.currency.ticker)),
        });
    }

    private unwrapCurrency<C extends CollateralUnit>(wrappedBalance: BalanceWrapper): MonetaryAmount<Currency<C>, C> {
        return newMonetaryAmount(
            wrappedBalance.amount.toString(),
            currencyIdToMonetaryCurrency(wrappedBalance.currencyId)
        );
    }

    private parseVaultStatus(status: VaultRegistryVaultStatus): VaultStatusExt {
        if (status.isActive) {
            return status.asActive.isTrue ? VaultStatusExt.Active : VaultStatusExt.Inactive;
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
            this.oracleAPI,
            this.systemAPI,
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
            liquidatedCollateral
        );
    }

    async reportVaultTheft(vaultAccountId: AccountId, btcTxId: string): Promise<void> {
        const txInclusionDetails = await getTxProof(this.electrsAPI, btcTxId);
        const tx = this.api.tx.relay.reportVaultTheft(
            vaultAccountId,
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
