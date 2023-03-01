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
    newVaultId,
} from "../utils";
import { AssetRegistryAPI, InterbtcPrimitivesVaultId, LoansAPI } from "../parachain";
import { TransactionAPI } from "../parachain/transaction";
import { WrappedCurrency, CollateralCurrencyExt, CurrencyExt } from "../types";

export interface RewardsAPI {
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
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the collateral in the given currency
     */
    computeCollateralInStakingPool(
        vaultId: InterbtcPrimitivesVaultId,
        nominatorId: AccountId
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     * @param vaultId VaultId object
     * @param nonce Staking pool nonce
     * @remarks Withdraw all rewards from the current account in the `vaultId` staking pool.
     */
    withdrawRewards(vaultId: InterbtcPrimitivesVaultId, nonce?: number): Promise<void>;
}

export class DefaultRewardsAPI implements RewardsAPI {
    constructor(
        public api: ApiPromise,
        private wrappedCurrency: WrappedCurrency,
        private transactionAPI: TransactionAPI,
        private assetRegistry: AssetRegistryAPI,
        private loansAPI: LoansAPI
    ) { }

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
}
