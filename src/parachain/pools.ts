import { Bitcoin, BTCAmount, Currency, MonetaryAmount, PolkadotUnit } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api/promise";
import Big from "big.js";
import {
    CollateralUnit,
    computeLazyDistribution,
    CurrencyIdLiteral,
    CurrencyUnit,
    decodeFixedPointType,
    newMonetaryAmount,
    tickerToCurrencyIdLiteral,
} from "../";

export interface PoolsAPI {
    /**
     * @param currency The currency to compute rewards for, a Monetary.js currency object
     * @param nomineeId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the reward in the given currency
     */
    computeRewardInStakingPool<C extends CurrencyUnit>(
        currency: Currency<C>,
        nomineeId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param currencyId The staked currency
     * @param nomineeId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns The stake, as a Big object
     */
    getStakingPoolStake(
        currencyId: CurrencyIdLiteral,
        nomineeId: string,
        nominatorId: string
    ): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param nomineeId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns The reward tally, as a Big object
     */
    getStakingPoolRewardTally(
        currencyId: CurrencyIdLiteral,
        nomineeId: string,
        nominatorId: string
    ): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param nomineeId The account ID of the staking pool nominee
     * @returns The reward per token, as a Big object
     */
    getStakingPoolRewardPerToken(currencyId: CurrencyIdLiteral, nomineeId: string): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param nomineeId The account ID of the staking pool nominee
     * @returns The current nonce of the staking pool
     */
    getStakingPoolNonce(currencyId: CurrencyIdLiteral, nomineeId: string): Promise<number>;
    /**
     * @param currencyId The reward currency
     * @param accountId The account ID whose reward to compute
     * @returns A Monetary.js amount object, representing the reward in the given currency
     */
    computeRewardInRewardsPool<C extends CurrencyUnit>(
        currency: Currency<C>,
        accountId: string
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param currency The currency to compute remaining collateral for, a Monetary.js currency object
     * @param nomineeId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the collateral in the given currency
     */
    computeCollateralInStakingPool<C extends CurrencyUnit>(
        currency: Currency<C>,
        nomineeId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param currencyId The reward currency
     * @param accountId An account ID string
     * @returns The stake, as a Big object
     */
    getRewardsPoolStake(currencyId: CurrencyIdLiteral, accountId: string): Promise<Big>;
    /**
     * @param currencyId The reward currency
     * @param accountId An account ID string
     * @returns The reward tally, as a Big object
     */
    getRewardsPoolRewardTally(currencyId: CurrencyIdLiteral, accountId: string): Promise<Big>;
    /**
     * @param currencyId The reward currency
     * @returns The reward per token, as a Big object
     */
    getRewardsPoolRewardPerToken(currencyId: CurrencyIdLiteral): Promise<Big>;
    /**
     * Compute the total reward, including the staking (local) pool and the rewards (global) pool
     * @param currency The currency specification, a `Monetary.js` object
     * @param nomineeId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the total reward in the given currency
     */
    computeReward<C extends CurrencyUnit>(
        currency: Currency<C>,
        nomineeId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param vaultId The vault account ID
     * @returns The total InterBTC reward collected by the vault
     */
    getFeesWrapped(vaultId: string): Promise<BTCAmount>;
    /**
     * @param vaultId The vault account ID
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The total DOT reward collected by the vault
     */
    getFeesCollateral<C extends CollateralUnit>(
        vaultId: string,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
}

export class DefaultPoolsAPI implements PoolsAPI {
    constructor(public api: ApiPromise) {}

    async computeRewardInStakingPool<C extends CurrencyUnit>(
        currency: Currency<C>,
        nomineeId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const currencyId = tickerToCurrencyIdLiteral(currency.ticker);
        const stake = await this.getStakingPoolStake(currencyId, nomineeId, nominatorId);
        const rewardPerToken = await this.getStakingPoolRewardPerToken(currencyId, nomineeId);
        const rewardTally = await this.getStakingPoolRewardTally(currencyId, nomineeId, nominatorId);
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(rawLazyDistribution, currency);
    }

    async getStakingPoolNonce(currencyId: CurrencyIdLiteral, nomineeId: string): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawNonce = await this.api.query.staking.nonce.at(head, currencyId, nomineeId);
        return rawNonce.toNumber();
    }

    async getStakingPoolStake(
        currencyId: CurrencyIdLiteral,
        nomineeId: string,
        nominatorId: string,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, nomineeId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.staking.stake.at(head, currencyId, [nonce, nomineeId, nominatorId]));
    }

    async getStakingPoolRewardTally(
        currencyId: CurrencyIdLiteral,
        nomineeId: string,
        nominatorId: string,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, nomineeId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(
            await this.api.query.staking.rewardTally.at(head, currencyId, [nonce, nomineeId, nominatorId])
        );
    }

    async getStakingPoolRewardPerToken(currencyId: CurrencyIdLiteral, nomineeId: string, nonce?: number): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, nomineeId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.staking.rewardPerToken.at(head, currencyId, [nonce, nomineeId]));
    }

    async computeCollateralInStakingPool<C extends CurrencyUnit>(
        currency: Currency<C>,
        nomineeId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const currencyId = tickerToCurrencyIdLiteral(Bitcoin.ticker);
        const stake = await this.getStakingPoolStake(currencyId, nomineeId, nominatorId);
        const slashPerToken = await this.getStakingPoolSlashPerToken(currencyId, nomineeId);
        const slashTally = await this.getStakingPoolSlashTally(currencyId, nomineeId, nominatorId);
        const toSlash = computeLazyDistribution(stake, slashPerToken, slashTally);
        return newMonetaryAmount(stake.sub(toSlash), currency);
    }

    async getStakingPoolSlashPerToken(currencyId: CurrencyIdLiteral, nomineeId: string, nonce?: number): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, nomineeId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.staking.slashPerToken.at(head, currencyId, [nonce, nomineeId]));
    }

    async getStakingPoolSlashTally(
        currencyId: CurrencyIdLiteral,
        nomineeId: string,
        nominatorId: string,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, nomineeId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(
            await this.api.query.staking.slashTally.at(head, currencyId, [nonce, nomineeId, nominatorId])
        );
    }

    async computeRewardInRewardsPool<C extends CurrencyUnit>(
        currency: Currency<C>,
        accountId: string
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const currencyId = tickerToCurrencyIdLiteral(currency.ticker);
        const stake = await this.getRewardsPoolStake(currencyId, accountId);
        const rewardPerToken = await this.getRewardsPoolRewardPerToken(currencyId);
        const rewardTally = await this.getRewardsPoolRewardTally(currencyId, accountId);
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(rawLazyDistribution, currency);
    }

    async getRewardsPoolStake(currencyId: CurrencyIdLiteral, accountId: string): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.rewards.stake.at(head, currencyId, accountId));
    }

    async getRewardsPoolRewardTally(currencyId: CurrencyIdLiteral, accountId: string): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.rewards.rewardTally.at(head, currencyId, accountId));
    }

    async getRewardsPoolRewardPerToken(currencyId: CurrencyIdLiteral): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.rewards.rewardPerToken.at(head, currencyId));
    }

    async computeReward<C extends CurrencyUnit>(
        currency: Currency<C>,
        nomineeId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const globalReward = await this.computeRewardInRewardsPool(currency, nomineeId);
        const localReward = await this.computeRewardInStakingPool(currency, nomineeId, nominatorId);
        return globalReward.add(localReward);
    }

    async getFeesWrapped(vaultId: string): Promise<BTCAmount> {
        return await this.computeReward(Bitcoin, vaultId, vaultId);
    }

    async getFeesCollateral<C extends CollateralUnit = PolkadotUnit>(
        vaultId: string,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        return await this.computeReward(currency, vaultId, vaultId);
    }
}
