import { AccountId } from "@polkadot/types/interfaces";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api/promise";
import Big from "big.js";

import {
    computeLazyDistribution,
    decodeFixedPointType,
    newCurrencyId,
    newMonetaryAmount,
    newVaultId,
} from "../utils";
import { InterbtcPrimitivesVaultId } from "../parachain";
import { TransactionAPI } from "../parachain/transaction";
import {
    tickerToCurrencyIdLiteral,
    CurrencyIdLiteral,
    CollateralUnit,
    CollateralCurrency,
    CollateralIdLiteral,
    currencyIdToMonetaryCurrency,
    WrappedCurrency,
    WrappedIdLiteral,
    currencyIdToLiteral,
    CurrencyUnit,
    currencyIdLiteralToMonetaryCurrency,
} from "../types";

export interface RewardsAPI {
    /**
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @param collateralCurrencyId Collateral currency used by the vault
     * @returns A Monetary.js amount object, representing the reward in the given currency
     */
    computeRewardInStakingPool(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        rewardCurrencyId?: CurrencyIdLiteral,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>>;
    /**
     * @param collateralCurrencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns The stake, as a Big object
     */
    getStakingPoolStake(collateralCurrencyId: CollateralIdLiteral, vaultId: AccountId, nominatorId: AccountId): Promise<Big>;
    /**
     * @param rewardCurrencyId The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @param collateralCurrencyId Collateral currency used by the vault
     * @param nonce Nonce of the rewards pool
     * @returns The reward tally, as a Big object
     */
    getStakingPoolRewardTally(
        rewardCurrencyId: CurrencyIdLiteral,
        vaultId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        nonce?: number
    ): Promise<Big>;
    /**
     * @param rewardCurrencyId The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @param vaultId The account ID of the staking pool nominee
     * @param collateralCurrencyId Collateral currency used by the vault
     * @param nonce Nonce of the rewards pool
     * @returns The reward per token, as a Big object
     */
     getStakingPoolRewardPerToken(
        rewardCurrencyId: CurrencyIdLiteral,
        vaultId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        nonce?: number
    ): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @returns The current nonce of the staking pool
     */
    getStakingPoolNonce(currencyId: CollateralIdLiteral, vaultId: AccountId): Promise<number>;
    /**
     * @param rewardCurrencyIdLiteral The reward currency
     * @param vaultCollateralIdLiteral Collateral used by the vault
     * @param vaultAccountId The vault ID whose reward to compute
     * @returns A Monetary.js amount object, representing the reward in the given currency
     */
    computeRewardInRewardsPool(
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>>;
    /**
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @param collateralCurrencyIdLiteral Collateral used by the vault
     * @returns A Monetary.js amount object, representing the collateral in the given currency
     */
    computeCollateralInStakingPool(
        vaultId: InterbtcPrimitivesVaultId,
        nominatorId: AccountId,
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * @param currencyId The reward currency
     * @param accountId An account ID string
     * @returns The stake, as a Big object
     */
    getRewardsPoolStake(currencyId: CurrencyIdLiteral, accountId: AccountId): Promise<Big>;
    /**
     * @param rewardCurrencyIdLiteral The reward currency
     * @param vaultCollateralIdLiteral Collateral used by the vault
     * @param vaultAccountId The vault ID whose reward pool to check
     * @returns The reward tally, as a Big object
     */
    getRewardsPoolRewardTally(
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<Big>;
    /**
     * @param currencyId The reward currency
     * @returns The reward per token, as a Big object
     */
    getRewardsPoolRewardPerToken(currencyId: CurrencyIdLiteral): Promise<Big>;
    /**
     * @param vaultId VaultId object
     * @param nonce Staking pool nonce
     * @remarks Withdraw all rewards from the current account in the `vaultId` staking pool.
     */
    withdrawRewards(
        vaultId: InterbtcPrimitivesVaultId,
        nonce?: number,
    ): Promise<void>;
}

export class DefaultRewardsAPI implements RewardsAPI {
    constructor(
        public api: ApiPromise,
        private wrappedCurrency: WrappedCurrency,
        private transactionAPI: TransactionAPI
    ) {}

    async withdrawRewards(
        vaultId: InterbtcPrimitivesVaultId,
        nonce?: number,
    ): Promise<void> {
        const definedNonce = nonce
            ? nonce
            : await this.getStakingPoolNonce(
                currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral,
                vaultId.accountId
            );
        const tx = this.api.tx.fee.withdrawRewards(vaultId, definedNonce.toString());
        await this.transactionAPI.sendLogged(tx, this.api.events.vaultStaking.WithdrawReward, true);
    }

    async computeRewardInStakingPool(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        rewardCurrencyId?: CurrencyIdLiteral,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>> {
        const wrappedCurrencyId = tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker) as WrappedIdLiteral;
        rewardCurrencyId = (rewardCurrencyId ? rewardCurrencyId : wrappedCurrencyId) as CurrencyIdLiteral;
        const [stake, rewardPerToken, rewardTally] = await Promise.all([
            this.getStakingPoolStake(collateralCurrencyId, vaultAccountId, nominatorId, nonce),
            this.getStakingPoolRewardPerToken(rewardCurrencyId, vaultAccountId, collateralCurrencyId, nonce),
            this.getStakingPoolRewardTally(rewardCurrencyId, vaultAccountId, nominatorId, collateralCurrencyId, nonce),
        ]);
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(
            rawLazyDistribution,
            currencyIdLiteralToMonetaryCurrency(this.api, rewardCurrencyId)
        );
    }

    async getStakingPoolNonce(
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<number> {
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, collateralCurrencyIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        const rawNonce = await this.api.query.vaultStaking.nonce(vaultId);
        return rawNonce.toNumber();
    }

    async getStakingPoolStake(
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrencyIdLiteral, vaultAccountId);
        }
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, collateralCurrencyIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        const rawStake = await this.api.query.vaultStaking.stake(nonce, [vaultId, nominatorId]);
        return decodeFixedPointType(rawStake);
    }

    async getStakingPoolRewardTally(
        rewardCurrencyId: CurrencyIdLiteral,
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrencyIdLiteral, vaultAccountId);
        }

        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrencyIdLiteral);
        const collateralCurrency = currencyIdToMonetaryCurrency(
            collateralCurrencyId
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(
            await this.api.query.vaultStaking.rewardTally(collateralCurrencyId, [nonce, vaultId, nominatorId])
        );
    }

    async getStakingPoolRewardPerToken(
        wrappedCurrencyIdLiteral: CurrencyIdLiteral,
        vaultAccountId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrencyIdLiteral, vaultAccountId);
        }
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, collateralCurrencyIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);

        const wrappedCurrencyId = newCurrencyId(this.api, wrappedCurrencyIdLiteral);
        return decodeFixedPointType(await this.api.query.vaultStaking.rewardPerToken(
            wrappedCurrencyId,
            [nonce, vaultId])
        );
    }

    async computeCollateralInStakingPool(
        vaultId: InterbtcPrimitivesVaultId,
        nominatorId: AccountId,
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const collateralCurrencyIdLiteral = currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral;
        const [stake, slashPerToken, slashTally] = await Promise.all([
            this.getStakingPoolStake(collateralCurrencyIdLiteral, vaultId.accountId, nominatorId),
            this.getStakingPoolSlashPerToken(collateralCurrencyIdLiteral, vaultId.accountId),
            this.getStakingPoolSlashTally(collateralCurrencyIdLiteral, vaultId.accountId, nominatorId),
        ]);
        const toSlash = computeLazyDistribution(stake, slashPerToken, slashTally);
        return newMonetaryAmount(stake.sub(toSlash), currencyIdToMonetaryCurrency(vaultId.currencies.collateral));
    }

    async getStakingPoolSlashPerToken(
        vaultCollateralIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(vaultCollateralIdLiteral, vaultAccountId);
        }
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, vaultCollateralIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(await this.api.query.vaultStaking.slashPerToken(nonce, vaultId));
    }

    async getStakingPoolSlashTally(
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrencyIdLiteral, vaultAccountId);
        }
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, collateralCurrencyIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);

        return decodeFixedPointType(await this.api.query.vaultStaking.slashTally(nonce, [vaultId, nominatorId]));
    }

    async computeRewardInRewardsPool(
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>> {
        const currencyId = tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker);
        const stake = await this.getRewardsPoolStake(vaultCollateralIdLiteral, vaultAccountId);
        const rewardPerToken = await this.getRewardsPoolRewardPerToken(currencyId);
        const rewardTally = await this.getRewardsPoolRewardTally(
            rewardCurrencyIdLiteral,
            vaultCollateralIdLiteral,
            vaultAccountId
        );
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(
            rawLazyDistribution,
            currencyIdLiteralToMonetaryCurrency(this.api, rewardCurrencyIdLiteral)
        );
    }

    async getRewardsPoolStake(vaultCollateralIdLiteral: CollateralIdLiteral, vaultAccountId: AccountId): Promise<Big> {

        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, vaultCollateralIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(await this.api.query.vaultRewards.stake(vaultId));
    }

    async getRewardsPoolRewardTally(
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<Big> {

        const rewardCurrencyId = newCurrencyId(this.api, rewardCurrencyIdLiteral);
        currencyIdToMonetaryCurrency(newCurrencyId(this.api, rewardCurrencyIdLiteral)) as CollateralCurrency;
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, vaultCollateralIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(await this.api.query.vaultRewards.rewardTally(rewardCurrencyId, vaultId));
    }

    async getRewardsPoolRewardPerToken(currencyId: CurrencyIdLiteral): Promise<Big> {

        return decodeFixedPointType(
            await this.api.query.vaultRewards.rewardPerToken(newCurrencyId(this.api, currencyId))
        );
    }
}
