import { AccountId } from "@polkadot/types/interfaces";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api/promise";
import Big from "big.js";

import {
    computeLazyDistribution,
    currencyIdToMonetaryCurrency,
    decodeFixedPointType,
    newCurrencyId,
    newMonetaryAmount,
    newVaultCurrencyPair,
    newVaultId,
} from "../utils";
import { AssetRegistryAPI, InterbtcPrimitivesVaultId, LoansAPI } from "../parachain";
import { TransactionAPI } from "../parachain/transaction";
import { WrappedCurrency, GovernanceCurrency, CollateralCurrencyExt, CurrencyExt } from "../types";

export interface RewardsAPI {
    /**
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @param collateralCurrency Collateral currency used by the vault
     * @returns A Monetary.js amount object, representing the reward in the given currency
     */
    computeRewardInStakingPool(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrenc: CollateralCurrencyExt,
        rewardCurrency?: CurrencyExt,
        nonce?: number
    ): Promise<MonetaryAmount<CurrencyExt>>;
    /**
     * @param collateralCurrency The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns The stake, as a Big object
     */
    getStakingPoolStake(
        collateralCurrency: CollateralCurrencyExt,
        vaultId: AccountId,
        nominatorId: AccountId
    ): Promise<Big>;
    /**
     * Total stake for a vault
     * @param collateralCurrency The vault's collateral
     * @param vaultAccountId The vault's accountID
     * @param nonce The nonce of the rewards pool
     * @returns The stake, as a Big object
     */
    getStakingPoolTotalStake(
        collateralCurrency: CollateralCurrencyExt,
        vaultAccountId: AccountId,
        nonce?: number
    ): Promise<Big>;
    /**
     * @param rewardCurrency The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @param collateralCurrency Collateral currency used by the vault
     * @param nonce Nonce of the rewards pool
     * @returns The reward tally, as a Big object
     */
    getStakingPoolRewardTally(
        rewardCurrency: Currency,
        vaultId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        nonce?: number
    ): Promise<Big>;
    /**
     * @param rewardCurrency The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @param vaultId The account ID of the staking pool nominee
     * @param collateralCurrency Collateral currency used by the vault
     * @param nonce Nonce of the rewards pool
     * @returns The reward per token, as a Big object
     */
    getStakingPoolRewardPerToken(
        rewardCurrency: Currency,
        vaultId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        nonce?: number
    ): Promise<Big>;
    /**
     * @param currency The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @returns The current nonce of the staking pool
     */
    getStakingPoolNonce(currency: CurrencyExt, vaultId: AccountId): Promise<number>;
    /**
     * @param rewardCurrency The reward currency
     * @param vaultCollateral Collateral used by the vault
     * @param vaultAccountId The vault ID whose reward to compute
     * @returns A Monetary.js amount object, representing the reward in the given currency
     */
    computeRewardInRewardsPool(
        rewardCurrency: Currency,
        vaultCollateral: CollateralCurrencyExt,
        vaultAccountId: AccountId
    ): Promise<MonetaryAmount<Currency>>;
    /**
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the collateral in the given currency
     */
    computeCollateralInStakingPool(
        vaultId: InterbtcPrimitivesVaultId,
        nominatorId: AccountId
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     * @param currency The reward currency
     * @param accountId An account ID string
     * @returns The stake, as a Big object
     */
    getRewardsPoolStake(currency: Currency, accountId: AccountId): Promise<Big>;
    /**
     * @param rewardCurrency The reward currency
     * @param vaultCollateral Collateral used by the vault
     * @param vaultAccountId The vault ID whose reward pool to check
     * @returns The reward tally, as a Big object
     */
    getRewardsPoolRewardTally(
        rewardCurrency: Currency,
        vaultCollateral: CollateralCurrencyExt,
        vaultAccountId: AccountId
    ): Promise<Big>;
    /**
     * @param rewardCurrency The reward currency
     * @param collateralCurrency The colalteral currency
     * @returns The reward per token, as a Big object
     */
    getRewardsPoolRewardPerToken(rewardCurrency: Currency, collateralCurrency: CollateralCurrencyExt): Promise<Big>;
    /**
     * @param vaultId VaultId object
     * @param nonce Staking pool nonce
     * @remarks Withdraw all rewards from the current account in the `vaultId` staking pool.
     */
    withdrawRewards(vaultId: InterbtcPrimitivesVaultId, nonce?: number): Promise<void>;

    /**
     * Gets the vault annuity systemwide per-block reward.
     * @param governanceCurrency The ID of the currency the reward is paid out in.
     */
    getRewardPerBlock(governanceCurrency: GovernanceCurrency): Promise<MonetaryAmount<GovernanceCurrency>>;
}

export class DefaultRewardsAPI implements RewardsAPI {
    constructor(
        public api: ApiPromise,
        private wrappedCurrency: WrappedCurrency,
        private transactionAPI: TransactionAPI,
        private assetRegistry: AssetRegistryAPI,
        private loansAPI: LoansAPI
    ) {}

    async withdrawRewards(vaultId: InterbtcPrimitivesVaultId, nonce?: number): Promise<void> {
        const definedNonce = nonce
            ? nonce
            : await this.getStakingPoolNonce(
                  await currencyIdToMonetaryCurrency(this.assetRegistry, this.loansAPI, vaultId.currencies.collateral),
                  vaultId.accountId
              );
        const tx = this.api.tx.fee.withdrawRewards(vaultId, definedNonce.toString());
        await this.transactionAPI.sendLogged(tx, this.api.events.vaultStaking.WithdrawReward, true);
    }

    async computeRewardInStakingPool(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        rewardCurrency?: Currency,
        nonce?: number
    ): Promise<MonetaryAmount<Currency>> {
        rewardCurrency = rewardCurrency || this.wrappedCurrency;
        const [stake, rewardPerToken, rewardTally] = await Promise.all([
            this.getStakingPoolStake(collateralCurrency, vaultAccountId, nominatorId, nonce),
            this.getStakingPoolRewardPerToken(rewardCurrency, vaultAccountId, collateralCurrency, nonce),
            this.getStakingPoolRewardTally(rewardCurrency, vaultAccountId, nominatorId, collateralCurrency, nonce),
        ]);
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(rawLazyDistribution, rewardCurrency);
    }

    async getStakingPoolNonce(collateralCurrency: CollateralCurrencyExt, vaultAccountId: AccountId): Promise<number> {
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        const rawNonce = await this.api.query.vaultStaking.nonce(vaultId);
        return rawNonce.toNumber();
    }

    async getStakingPoolStake(
        collateralCurrency: CollateralCurrencyExt,
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrency, vaultAccountId);
        }
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        const rawStake = await this.api.query.vaultStaking.stake(nonce, [vaultId, nominatorId]);
        return decodeFixedPointType(rawStake);
    }

    async getStakingPoolTotalStake(
        collateralCurrency: CollateralCurrencyExt,
        vaultAccountId: AccountId,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrency, vaultAccountId);
        }
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        const rawTotalStake = await this.api.query.vaultStaking.totalCurrentStake(nonce, vaultId);
        return decodeFixedPointType(rawTotalStake);
    }

    async getStakingPoolRewardTally(
        rewardCurrency: Currency,
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrency, vaultAccountId);
        }
        const rewardCurrencyPrimitive = newCurrencyId(this.api, rewardCurrency);
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(
            await this.api.query.vaultStaking.rewardTally(rewardCurrencyPrimitive, [nonce, vaultId, nominatorId])
        );
    }

    async getStakingPoolRewardPerToken(
        wrappedCurrency: Currency,
        vaultAccountId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrency, vaultAccountId);
        }
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);

        const wrappedCurrencyId = newCurrencyId(this.api, wrappedCurrency);
        return decodeFixedPointType(
            await this.api.query.vaultStaking.rewardPerToken(wrappedCurrencyId, [nonce, vaultId])
        );
    }

    async computeCollateralInStakingPool(
        vaultId: InterbtcPrimitivesVaultId,
        nominatorId: AccountId
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const collateralCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistry,
            this.loansAPI,
            vaultId.currencies.collateral
        );
        const [stake, slashPerToken, slashTally] = await Promise.all([
            this.getStakingPoolStake(collateralCurrency, vaultId.accountId, nominatorId),
            this.getStakingPoolSlashPerToken(collateralCurrency, vaultId.accountId),
            this.getStakingPoolSlashTally(collateralCurrency, vaultId.accountId, nominatorId),
        ]);
        const toSlash = computeLazyDistribution(stake, slashPerToken, slashTally);
        return newMonetaryAmount(
            stake.sub(toSlash),
            await currencyIdToMonetaryCurrency(this.assetRegistry, this.loansAPI, vaultId.currencies.collateral)
        );
    }

    async getStakingPoolSlashPerToken(
        vaultCollateral: CollateralCurrencyExt,
        vaultAccountId: AccountId,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(vaultCollateral, vaultAccountId);
        }
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), vaultCollateral, this.wrappedCurrency);
        return decodeFixedPointType(await this.api.query.vaultStaking.slashPerToken(nonce, vaultId));
    }

    async getStakingPoolSlashTally(
        collateralCurrency: CollateralCurrencyExt,
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrency, vaultAccountId);
        }
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);

        return decodeFixedPointType(await this.api.query.vaultStaking.slashTally(nonce, [vaultId, nominatorId]));
    }

    async computeRewardInRewardsPool(
        rewardCurrency: Currency,
        vaultCollateral: CollateralCurrencyExt,
        vaultAccountId: AccountId
    ): Promise<MonetaryAmount<Currency>> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, vaultCollateral, this.wrappedCurrency);
        const params = {
            account_id: vaultAccountId,
            currencies: vaultCurrencyPair,
        };
        const reward = await this.api.rpc.reward.computeVaultReward(params, newCurrencyId(this.api, rewardCurrency));
        return newMonetaryAmount(reward.amount.toString(), rewardCurrency);
    }

    async getRewardsPoolStake(vaultCollateral: CollateralCurrencyExt, vaultAccountId: AccountId): Promise<Big> {
        const collateralCurrencyId = newCurrencyId(this.api, vaultCollateral);
        const collateralCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistry,
            this.loansAPI,
            collateralCurrencyId
        );
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(await this.api.query.vaultRewards.stake([collateralCurrencyId, vaultId]));
    }

    async getRewardsPoolRewardTally(
        rewardCurrency: Currency,
        vaultCollateral: CollateralCurrencyExt,
        vaultAccountId: AccountId
    ): Promise<Big> {
        const rewardCurrencyId = newCurrencyId(this.api, rewardCurrency);
        const collateralCurrencyId = newCurrencyId(this.api, vaultCollateral);
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), vaultCollateral, this.wrappedCurrency);
        return decodeFixedPointType(
            await this.api.query.vaultRewards.rewardTally(rewardCurrencyId, [collateralCurrencyId, vaultId])
        );
    }

    async getRewardsPoolRewardPerToken(
        rewardCurrency: Currency,
        collateralCurrency: CollateralCurrencyExt
    ): Promise<Big> {
        const rewardCurrencyId = newCurrencyId(this.api, rewardCurrency);
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrency);
        return decodeFixedPointType(
            await this.api.query.vaultRewards.rewardPerToken(rewardCurrencyId, collateralCurrencyId)
        );
    }

    async getRewardPerBlock(governanceCurrency: GovernanceCurrency): Promise<MonetaryAmount<GovernanceCurrency>> {
        const rawRewardPerBlock = await this.api.query.vaultAnnuity.rewardPerBlock();
        return newMonetaryAmount(rawRewardPerBlock.toString(), governanceCurrency);
    }
}
