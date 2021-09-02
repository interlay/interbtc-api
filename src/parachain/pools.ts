import { BTCAmount, BTCUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api/promise";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import {
    CollateralUnit,
    computeLazyDistribution,
    CurrencyIdLiteral,
    CurrencyUnit,
    decodeFixedPointType,
    DefaultVaultsAPI,
    ElectrsAPI,
    newMonetaryAmount,
    tickerToCurrencyIdLiteral,
} from "../";
import { WrappedCurrency } from "../types";
import { newAccountId } from "../utils";

export interface PoolsAPI {
    /**
     * @param wrappedCurrency The currency to compute rewards for, a Monetary.js currency object
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the reward in the given currency
     */
    computeRewardInStakingPool(
        wrappedCurrency: WrappedCurrency,
        vaultId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<BTCUnit>, BTCUnit>>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns The stake, as a Big object
     */
    getStakingPoolStake(currencyId: CurrencyIdLiteral, vaultId: string, nominatorId: string): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns The reward tally, as a Big object
     */
    getStakingPoolRewardTally(currencyId: CurrencyIdLiteral, vaultId: string, nominatorId: string): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @returns The reward per token, as a Big object
     */
    getStakingPoolRewardPerToken(currencyId: CurrencyIdLiteral, vaultId: string): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @returns The current nonce of the staking pool
     */
    getStakingPoolNonce(currencyId: CurrencyIdLiteral, vaultId: string): Promise<number>;
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
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the collateral in the given currency
     */
    computeCollateralInStakingPool(
        currency: WrappedCurrency,
        vaultId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
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
     * @param wrappedCurrency The currency to compute rewards for, a Monetary.js currency object
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns A Monetary.js amount object, representing the total reward in the given currency
     */
    computeReward(
        wrappedCurrency: WrappedCurrency,
        vaultId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<BTCUnit>, BTCUnit>>;
    /**
     * @param wrappedCurrency The wrapped currency specification (a `Monetary.js` object) for which to compute fees
     * @param vaultId The vault account ID
     * @returns The total InterBTC reward collected by the vault
     */
    getFeesWrapped(wrappedCurrency: WrappedCurrency, vaultId: string): Promise<BTCAmount>;
}

export class DefaultPoolsAPI implements PoolsAPI {
    constructor(public api: ApiPromise, private btcNetwork: Network, private electrsAPI: ElectrsAPI) {}

    async computeRewardInStakingPool(
        wrappedCurrency: WrappedCurrency,
        vaultId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<BTCUnit>, BTCUnit>> {
        const currencyId = tickerToCurrencyIdLiteral(wrappedCurrency.ticker);
        const stake = await this.getStakingPoolStake(currencyId, vaultId, nominatorId);
        const rewardPerToken = await this.getStakingPoolRewardPerToken(currencyId, vaultId);
        const rewardTally = await this.getStakingPoolRewardTally(currencyId, vaultId, nominatorId);
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(rawLazyDistribution, wrappedCurrency);
    }

    async getStakingPoolNonce(currencyId: CurrencyIdLiteral, vaultId: string): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawNonce = await this.api.query.staking.nonce.at(head, currencyId, vaultId);
        return rawNonce.toNumber();
    }

    async getStakingPoolStake(
        currencyId: CurrencyIdLiteral,
        vaultId: string,
        nominatorId: string,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, vaultId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(
            await this.api.query.staking.stake.at(head, currencyId, [nonce, vaultId, nominatorId])
        );
    }

    async getStakingPoolRewardTally(
        currencyId: CurrencyIdLiteral,
        vaultId: string,
        nominatorId: string,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, vaultId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(
            await this.api.query.staking.rewardTally.at(head, currencyId, [nonce, vaultId, nominatorId])
        );
    }

    async getStakingPoolRewardPerToken(currencyId: CurrencyIdLiteral, vaultId: string, nonce?: number): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, vaultId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.staking.rewardPerToken.at(head, currencyId, [nonce, vaultId]));
    }

    async computeCollateralInStakingPool(
        wrappedCurrency: WrappedCurrency,
        vaultId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const vaultsAPI = new DefaultVaultsAPI(this.api, this.btcNetwork, this.electrsAPI);
        const currencyId = tickerToCurrencyIdLiteral(wrappedCurrency.ticker);
        const [vault, stake, slashPerToken, slashTally] = await Promise.all([
            vaultsAPI.get(newAccountId(this.api, vaultId)),
            this.getStakingPoolStake(currencyId, vaultId, nominatorId),
            this.getStakingPoolSlashPerToken(currencyId, vaultId),
            this.getStakingPoolSlashTally(currencyId, vaultId, nominatorId),
        ]);
        const toSlash = computeLazyDistribution(stake, slashPerToken, slashTally);
        return newMonetaryAmount(stake.sub(toSlash), vault.collateralCurrency);
    }

    async getStakingPoolSlashPerToken(currencyId: CurrencyIdLiteral, vaultId: string, nonce?: number): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, vaultId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.staking.slashPerToken.at(head, currencyId, [nonce, vaultId]));
    }

    async getStakingPoolSlashTally(
        currencyId: CurrencyIdLiteral,
        vaultId: string,
        nominatorId: string,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(currencyId, vaultId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(
            await this.api.query.staking.slashTally.at(head, currencyId, [nonce, vaultId, nominatorId])
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

    async backingCollateralProportion(
        wrappedCurrency: WrappedCurrency,
        vaultId: string,
        nominatorId: string
    ): Promise<Big> {
        const vaultsAPI = new DefaultVaultsAPI(this.api, this.btcNetwork, this.electrsAPI);
        const vault = await vaultsAPI.get(newAccountId(this.api, vaultId));
        const backingCollateralForWrapped = DefaultVaultsAPI.getBackingCollateral(wrappedCurrency, vault);
        const nominatorCollateral = await this.computeCollateralInStakingPool(wrappedCurrency, vaultId, nominatorId);
        return nominatorCollateral.toBig().div(backingCollateralForWrapped.toBig());
    }

    async computeReward(
        wrappedCurrency: WrappedCurrency,
        vaultId: string,
        nominatorId: string
    ): Promise<MonetaryAmount<Currency<BTCUnit>, BTCUnit>> {
        const totalGlobalReward = await this.computeRewardInRewardsPool(wrappedCurrency, vaultId);
        const globalRewardShare = await this.backingCollateralProportion(wrappedCurrency, vaultId, nominatorId);
        const ownGlobalReward = totalGlobalReward.mul(globalRewardShare);
        const localReward = await this.computeRewardInStakingPool(wrappedCurrency, vaultId, nominatorId);
        return ownGlobalReward.add(localReward);
    }

    async getFeesWrapped(
        wrappedCurrency: WrappedCurrency,
        vaultId: string
    ): Promise<MonetaryAmount<Currency<BTCUnit>, BTCUnit>> {
        return await this.computeReward(wrappedCurrency, vaultId, vaultId);
    }
}
