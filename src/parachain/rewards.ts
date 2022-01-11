import { AccountId } from "@polkadot/types/interfaces";
import { BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api/promise";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import {
    ElectrsAPI,
} from "../external";
import {
    computeLazyDistribution,
    decodeFixedPointType,
    newCurrencyId,
    newMonetaryAmount,
    newVaultId,
} from "../utils";
import {
    DefaultVaultsAPI,
} from "../parachain";
import {
    tickerToCurrencyIdLiteral,
    CurrencyIdLiteral,
    CollateralUnit,
    CollateralCurrency,
    CollateralIdLiteral,
    currencyIdToMonetaryCurrency,
    WrappedCurrency,
    WrappedIdLiteral,
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
        collateralCurrencyId: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @returns The stake, as a Big object
     */
    getStakingPoolStake(currencyId: CurrencyIdLiteral, vaultId: AccountId, nominatorId: AccountId): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @param collateralCurrencyId Collateral currency used by the vault
     * @param nonce Nonce of the rewards pool
     * @returns The reward tally, as a Big object
     */
    getStakingPoolRewardTally(
        currencyId: WrappedIdLiteral,
        vaultId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        nonce?: number
    ): Promise<Big>;
    /**
     * @param currencyId The staked currency
     * @param vaultId The account ID of the staking pool nominee
     * @param collateralCurrencyId Collateral currency used by the vault
     * @param nonce Nonce of the rewards pool
     * @returns The reward per token, as a Big object
     */
     getStakingPoolRewardPerToken(
        wrappedCurrencyId: WrappedIdLiteral,
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
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>;
    /**
     * @param vaultId The account ID of the staking pool nominee
     * @param nominatorId The account ID of the staking pool nominator
     * @param collateralCurrencyIdLiteral Collateral used by the vault
     * @returns A Monetary.js amount object, representing the collateral in the given currency
     */
    computeCollateralInStakingPool(
        vaultId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral
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
     * Compute the total reward, including the staking (local) pool and the rewards (global) pool
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param nominatorId The account ID of the staking pool nominator
     * @param vaultCollateralIdLiteral Collateral used by the vault
     * @param rewardCurrencyIdLiteral The reward currency
     * @returns A Monetary.js amount object, representing the total reward in the given currency
     */
    computeReward(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        rewardCurrencyIdLiteral: WrappedIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>;
    /**
     * @param vaultAccountId The vault ID whose reward pool to check
     * @param vaultCollateralIdLiteral Collateral used by the vault
     * @param rewardCurrencyIdLiteral The reward currency
     * @returns The total wrapped token reward collected by the vault
     */
    getFeesWrapped(
        vaultAccountId: AccountId,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        rewardCurrencyIdLiteral: WrappedIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>;
}

export class DefaultRewardsAPI implements RewardsAPI {
    constructor(
        public api: ApiPromise,
        private btcNetwork: Network,
        private electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        private collateralCurrency: CollateralCurrency
    ) {}

    async computeRewardInStakingPool(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const wrappedCurrencyId = tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker) as WrappedIdLiteral;
        const [stake, rewardPerToken, rewardTally] = await Promise.all([
            this.getStakingPoolStake(collateralCurrencyId, vaultAccountId, nominatorId, nonce),
            this.getStakingPoolRewardPerToken(wrappedCurrencyId, vaultAccountId, collateralCurrencyId, nonce),
            this.getStakingPoolRewardTally(wrappedCurrencyId, vaultAccountId, nominatorId, collateralCurrencyId, nonce),
        ]);
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(rawLazyDistribution, this.wrappedCurrency);
    }

    async getStakingPoolNonce(
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<number> {
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, collateralCurrencyIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawNonce = await this.api.query.vaultStaking.nonce.at(head, vaultId);
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
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawStake = await this.api.query.vaultStaking.stake.at(head, nonce, [vaultId, nominatorId]);
        return decodeFixedPointType(rawStake);
    }

    async getStakingPoolRewardTally(
        currencyId: WrappedIdLiteral,
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral,
        nonce?: number
    ): Promise<Big> {
        if (nonce === undefined) {
            nonce = await this.getStakingPoolNonce(collateralCurrencyIdLiteral, vaultAccountId);
        }
        const head = await this.api.rpc.chain.getFinalizedHead();
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrencyIdLiteral);
        const collateralCurrency = currencyIdToMonetaryCurrency(
            collateralCurrencyId
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(
            await this.api.query.vaultStaking.rewardTally.at(head, collateralCurrencyId, [nonce, vaultId, nominatorId])
        );
    }

    async getStakingPoolRewardPerToken(
        wrappedCurrencyIdLiteral: WrappedIdLiteral,
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
        const head = await this.api.rpc.chain.getFinalizedHead();
        const wrappedCurrencyId = newCurrencyId(this.api, wrappedCurrencyIdLiteral);
        return decodeFixedPointType(await this.api.query.vaultStaking.rewardPerToken.at(
            head,
            wrappedCurrencyId,
            [nonce, vaultId])
        );
    }

    async computeCollateralInStakingPool(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const vaultsAPI = new DefaultVaultsAPI(
            this.api,
            this.btcNetwork,
            this.electrsAPI,
            this.wrappedCurrency,
            this.collateralCurrency
        );
        const [vault, stake, slashPerToken, slashTally] = await Promise.all([
            vaultsAPI.get(vaultAccountId, collateralCurrencyIdLiteral),
            this.getStakingPoolStake(collateralCurrencyIdLiteral, vaultAccountId, nominatorId),
            this.getStakingPoolSlashPerToken(collateralCurrencyIdLiteral, vaultAccountId),
            this.getStakingPoolSlashTally(collateralCurrencyIdLiteral, vaultAccountId, nominatorId),
        ]);
        const toSlash = computeLazyDistribution(stake, slashPerToken, slashTally);
        return newMonetaryAmount(stake.sub(toSlash), currencyIdToMonetaryCurrency(vault.id.currencies.collateral));
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
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.vaultStaking.slashPerToken.at(head, nonce, vaultId));
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
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(await this.api.query.vaultStaking.slashTally.at(head, nonce, [vaultId, nominatorId]));
    }

    async computeRewardInRewardsPool(
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const currencyId = tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker);
        const stake = await this.getRewardsPoolStake(vaultCollateralIdLiteral, vaultAccountId);
        const rewardPerToken = await this.getRewardsPoolRewardPerToken(currencyId);
        const rewardTally = await this.getRewardsPoolRewardTally(
            rewardCurrencyIdLiteral,
            vaultCollateralIdLiteral,
            vaultAccountId
        );
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(rawLazyDistribution, this.wrappedCurrency);
    }

    async getRewardsPoolStake(vaultCollateralIdLiteral: CollateralIdLiteral, vaultAccountId: AccountId): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, vaultCollateralIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(await this.api.query.vaultRewards.stake.at(head, vaultId));
    }

    async getRewardsPoolRewardTally(
        rewardCurrencyIdLiteral: CurrencyIdLiteral,
        vaultCollateralIdLiteral: CollateralIdLiteral,
        vaultAccountId: AccountId
    ): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rewardCurrencyId = newCurrencyId(this.api, rewardCurrencyIdLiteral);
        currencyIdToMonetaryCurrency(newCurrencyId(this.api, rewardCurrencyIdLiteral)) as CollateralCurrency;
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, vaultCollateralIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, vaultAccountId.toString(), collateralCurrency, this.wrappedCurrency);
        return decodeFixedPointType(await this.api.query.vaultRewards.rewardTally.at(head, rewardCurrencyId, vaultId));
    }

    async getRewardsPoolRewardPerToken(currencyId: CurrencyIdLiteral): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return decodeFixedPointType(
            await this.api.query.vaultRewards.rewardPerToken.at(head, newCurrencyId(this.api, currencyId))
        );
    }

    async backingCollateralProportion(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyIdLiteral: CollateralIdLiteral
    ): Promise<Big> {
        const vaultsAPI = new DefaultVaultsAPI(
            this.api,
            this.btcNetwork,
            this.electrsAPI,
            this.wrappedCurrency,
            this.collateralCurrency
        );
        const vault = await vaultsAPI.get(vaultAccountId, collateralCurrencyIdLiteral);
        const nominatorCollateral = await this.computeCollateralInStakingPool(
            vaultAccountId,
            nominatorId,
            collateralCurrencyIdLiteral
        );
        return nominatorCollateral.toBig().div(vault.backingCollateral.toBig());
    }

    async computeReward(
        vaultAccountId: AccountId,
        nominatorId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        rewardCurrencyId: WrappedIdLiteral,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const [totalGlobalReward, globalRewardShare] = await Promise.all([
            this.computeRewardInRewardsPool(rewardCurrencyId, collateralCurrencyId, vaultAccountId),
            this.backingCollateralProportion(vaultAccountId, nominatorId, collateralCurrencyId),
        ]);
        const ownGlobalReward = totalGlobalReward.mul(globalRewardShare);
        const localReward = await this.computeRewardInStakingPool(vaultAccountId, nominatorId, collateralCurrencyId, nonce);
        return ownGlobalReward.add(localReward);
    }

    async getFeesWrapped(
        vaultAccountId: AccountId,
        collateralCurrency: CollateralIdLiteral
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        return await this.computeReward(
            vaultAccountId,
            vaultAccountId,
            collateralCurrency,
            tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker) as WrappedIdLiteral
        );
    }
}
