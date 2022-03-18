import { Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import BN from "bn.js";
import Big from "big.js";

import { decodeFixedPointType, newCurrencyId, newMonetaryAmount, storageKeyToNthInner, toVoting } from "../utils";
import {
    GovernanceCurrency,
    GovernanceUnit,
    parseEscrowLockedBalance,
    parseEscrowPoint,
    RWEscrowPoint,
    StakedBalance,
    tickerToCurrencyIdLiteral,
    VoteUnit
} from "../types";
import { SystemAPI } from "./system";
import { TransactionAPI } from ".";

/**
 * @category BTC Bridge
 */
export interface EscrowAPI {
    /**
     * @param accountId Account whose voting balance to fetch
     * @param blockNumber The number of block to query state at
     * @returns The voting balance
     * @remarks Logic is duplicated from Escrow pallet in the parachain
     */
    votingBalance(
        accountId: AccountId,
        blockNumber?: number
    ): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>>;
    /**
     * @param blockNumber The number of block to query state at
     * @returns The voting balance
     * @remarks
     * - Expect poor performance from this function as more blocks are appended to the parachain.
     * It is not recommended to call this directly, but rather to query through the indexer (currently `interbtc-index`).
     * - Logic is duplicated from Escrow pallet in the parachain
     */
    totalVotingSupply(
        blockNumber?: number
    ): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>>;
    /**
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
     * @param unlockHeight Block number to lock until
     * @remarks The amount can't be less than the max period (`getMaxPeriod` getter) to prevent rounding errors
     */
    createLock<U extends GovernanceUnit>(
        amount: MonetaryAmount<Currency<U>, U>,
        unlockHeight: number
    ): Promise<void>;
    /**
     * @param accountId ID of the user whose stake to fetch
     * @returns The staked amount and end block
     */
    getStakedBalance(accountId: AccountId): Promise<StakedBalance<GovernanceUnit>>;
    /**
     * @remarks Withdraws all locked governance currency
     */
    withdraw(): Promise<void>;
    /**
     * @returns All future times are rounded by this.
     */
    getSpan(): Promise<BN>;
    /**
     * @returns The maximum time for locks.
     */
    getMaxPeriod(): Promise<BN>;
    /**
     * @remarks Withdraws stake-to-vote rewards
     */
    withdrawRewards(): Promise<void>;
    /**
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
     */
    increaseAmount<U extends GovernanceUnit>(
        amount: MonetaryAmount<Currency<U>, U>,
    ): Promise<void>;
    /**
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
     */
    increaseUnlockHeight(
        unlockHeight: number
    ): Promise<void>;
    /**
     * @param accountId User account ID
     * @returns The rewards that can be withdrawn by the account
     * @remarks Implements https://spec.interlay.io/spec/reward.html#computereward
     */
    getRewards<U extends GovernanceUnit>(
        accountId: AccountId,
    ): Promise<MonetaryAmount<Currency<U>, U>>;
    /**
     * @param accountId User account ID
     * @param amountToLock New amount to add to the current stake
     * @param blockLockTimeExtension Amount of blocks the stake will be locked for
     * @returns The estimated reward, as amount and percentage (APY)
     */
    getRewardEstimate<U extends GovernanceUnit>(
        accountId: AccountId,
        amountToLock?: MonetaryAmount<Currency<U>, U>,
        blockLockTimeExtension?: number
    ): Promise<{
            amount: MonetaryAmount<Currency<U>, U>,
            apy: Big
    }>;
}

export class DefaultEscrowAPI implements EscrowAPI {

    constructor(
        private api: ApiPromise,
        private governanceCurrency: GovernanceCurrency,
        private systemAPI: SystemAPI,
        private transactionAPI: TransactionAPI
    ) {}

    async createLock<U extends GovernanceUnit>(
        amount: MonetaryAmount<Currency<U>, U>,
        unlockHeight: number
    ): Promise<void> {
        const tx = this.api.tx.escrow.createLock(amount.toString(amount.currency.rawBase), unlockHeight);
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    async withdraw(): Promise<void> {
        const tx = this.api.tx.escrow.withdraw();
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Withdraw, true);
    }

    async withdrawRewards(): Promise<void> {
        const tx = this.api.tx.escrowAnnuity.withdrawRewards();
        await this.transactionAPI.sendLogged(tx, this.api.events.escrowRewards.WithdrawReward, true);
    }

    async increaseAmount<U extends GovernanceUnit>(amount: MonetaryAmount<Currency<U>, U>): Promise<void> {
        const tx = this.api.tx.escrow.increaseAmount(amount.toString(amount.currency.rawBase));
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    async increaseUnlockHeight(unlockHeight: number): Promise<void> {
        const tx = this.api.tx.escrow.increaseUnlockHeight(unlockHeight);
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    async getRewards<U extends GovernanceUnit>(accountId: AccountId): Promise<MonetaryAmount<Currency<U>, U>> {
        // Step 1. Get amount in reward pool for the account ID
        const [rewardStake, rewardPerToken, rewardTally] = await Promise.all([
            this.getEscrowStake(accountId),
            this.getRewardPerToken(),
            this.getRewardTally(accountId)
        ]);
        // Step 2. Calculate the rewards that can be withdrawn at the moment
        // Stake[currencyId, accountId] * RewardPerToken[currencyId] - RewardTally[currencyId, accountId]
        const rewards = rewardStake.mul(rewardPerToken).sub(rewardTally);
        return newMonetaryAmount(
            rewards,
            this.governanceCurrency as unknown as Currency<U>
        );
    }

    async getRewardEstimate<U extends GovernanceUnit>(
        accountId: AccountId,
        amountToLock?: MonetaryAmount<Currency<U>, U>,
        blockLockTimeExtension?: number
    ): Promise<{
            amount: MonetaryAmount<Currency<U>, U>,
            apy: Big
    }> {
        const [userStake, totalStake, blockReward, stakedBalance, currentBlockNumber, minimumBlockPeriod, maxPeriod] = await Promise.all([
            this.getEscrowStake(accountId),
            this.getEscrowTotalStake(),
            this.getRewardPerBlock(),
            this.getStakedBalance(accountId),
            this.systemAPI.getCurrentBlockNumber(),
            this.api.consts.timestamp.minimumPeriod,
            this.getMaxPeriod()
        ]);

        return this._computeRewardEstimate<U>(
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            minimumBlockPeriod.toNumber(),
            maxPeriod.toNumber(),
            amountToLock,
            blockLockTimeExtension
        );

    }

    _computeRewardEstimate<U extends GovernanceUnit>(
        userStake: Big,
        totalStake: Big,
        blockReward: MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
        stakedBalance: StakedBalance<GovernanceUnit>,
        currentBlockNumber: number,
        minimumBlockPeriod: number,
        maxPeriod: number,
        amountToLock: MonetaryAmount<Currency<U>, U> = newMonetaryAmount(0, this.governanceCurrency as unknown as Currency<U>),
        blockLockTimeExtension: number = 0
    ): {
        amount: MonetaryAmount<Currency<U>, U>,
        apy: Big
    } {
        // Note: the parachain uses the balance_at which combines the staked amount
        // and staked time divided by the maximum period to calculate the share in the reward pool
        // like `amountLocked * unlockHeight / maxPeriod`
        // https://github.com/interlay/interbtc/blob/1.7.3/crates/escrow/src/lib.rs#L525
        // We need to differentiate four cases:
        // 1. The user does not add any new stake/extend their lock time
        // 2. The user extends the locktime and increases the stake
        // 3. The user increases only their stake
        // 4. The user extends only the locktime

        // Note: on first time staking the user has to provide both a increased stake and a locktime
        // otherwise, the rewards will be 0.
        let newStakedBalance = {
            amount: stakedBalance.amount,
            endBlock: stakedBalance.endBlock
        };

        const monetaryAddedStake = newMonetaryAmount(amountToLock.toBig(), this.governanceCurrency as Currency<GovernanceUnit>)
        // User staking for the first time; only case 2 relevant otherwise rewards should be 0
        if (stakedBalance.amount.isZero()) {
            newStakedBalance.amount = monetaryAddedStake;
            newStakedBalance.endBlock = currentBlockNumber + blockLockTimeExtension;
        // User increasing stake or locking amount or none (cases 1 - 4)
        } else {
            // might add 0 to either amount or endBlock
            newStakedBalance.amount = stakedBalance.amount.add(monetaryAddedStake);
            newStakedBalance.endBlock = stakedBalance.endBlock + blockLockTimeExtension;
        };
        let newLockDuration = 0;
        if (newStakedBalance.endBlock - currentBlockNumber > 0) {
            newLockDuration = newStakedBalance.endBlock - currentBlockNumber;
        };

        const newUserStake = newStakedBalance.amount.toBig()
            .mul(newLockDuration)
            .div(maxPeriod);
        const userStakeDifference = newUserStake.sub(userStake);
        const newTotalStake = totalStake.add(userStakeDifference);

        // Catch 0 values
        if (
            newLockDuration == 0 ||
            newTotalStake.eq(0) ||
            newStakedBalance.amount.isZero()
        ) {
            return {
                amount: newMonetaryAmount(
                    0,
                    this.governanceCurrency as unknown as Currency<U>
                ),
                apy: new Big(0)
            };
        };
        // Reward amount for the entire time is the newUserStake / netTotalStake * blockReward * lock duration
        const rewardAmount = newUserStake
            .div(newTotalStake)
            .mul(blockReward.toBig())
            .mul(newLockDuration);

        const monetaryRewardAmount = newMonetaryAmount(rewardAmount, this.governanceCurrency as unknown as Currency<U>);

        // TODO: move this to a util function so we can use it across the codebase
        // normalize APY to 1 year
        const blockTime = minimumBlockPeriod * 2; // ms
        const blocksPerYear = (86400 * 365 * 1000) / blockTime;
        const annualisedReward = rewardAmount
            .div(newLockDuration)
            .mul(blocksPerYear);

        const apy = annualisedReward
            .div(newStakedBalance.amount.toBig())
            .mul(100);

        return {
            amount: monetaryRewardAmount,
            apy: apy
        };
    }

    async getEscrowStake(accountId: AccountId): Promise<Big> {
        const rawStake = await this.api.query.escrowRewards.stake(accountId);
        return decodeFixedPointType(rawStake);
    }

    async getEscrowTotalStake(): Promise<Big> {
        const rawTotalStake = await this.api.query.escrowRewards.totalStake();
        return decodeFixedPointType(rawTotalStake);
    }

    async getRewardTally(accountId: AccountId): Promise<Big> {
        const governanceCurrencyId = newCurrencyId(
            this.api,
            tickerToCurrencyIdLiteral(
                this.governanceCurrency.ticker
            )
        );
        const rawRewardTally = await this.api.query.escrowRewards.rewardTally(governanceCurrencyId, accountId);
        return decodeFixedPointType(rawRewardTally);
    }

    async getRewardPerToken(): Promise<Big> {
        const governanceCurrencyId = newCurrencyId(
            this.api,
            tickerToCurrencyIdLiteral(
                this.governanceCurrency.ticker
            )
        );
        const rawRewardPerToken = await this.api.query.escrowRewards.rewardPerToken(governanceCurrencyId);
        return decodeFixedPointType(rawRewardPerToken);
    }

    async getRewardPerBlock(): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>> {
        const rawRewardPerBlock = await this.api.query.escrowAnnuity.rewardPerBlock();
        return newMonetaryAmount(rawRewardPerBlock.toString(), this.governanceCurrency as Currency<GovernanceUnit>);
    }

    async getStakedBalance(accountId: AccountId): Promise<StakedBalance<GovernanceUnit>> {
        const rawStakedBalance = await this.api.query.escrow.locked(accountId);
        return parseEscrowLockedBalance(this.governanceCurrency as Currency<GovernanceUnit>, rawStakedBalance);
    }

    async votingBalance(
        accountId: AccountId,
        blockNumber?: number
    ): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>> {
        const height = blockNumber || await this.systemAPI.getCurrentBlockNumber();
        const userPointEpoch = await this.api.query.escrow.userPointEpoch(accountId);
        const lastPoint = await this.api.query.escrow.userPointHistory(accountId, userPointEpoch);
        const rawBalance = this.rawBalanceAt(parseEscrowPoint(lastPoint), height);

        // `rawBalance.toString()` is used to convert the BN to a BigSource type
        return newMonetaryAmount(
            rawBalance.toString(),
            toVoting(this.governanceCurrency)
        );
    }

    private rawBalanceAt(escrowPoint: RWEscrowPoint, height: number): BN {
    /*
        Rust reference implementation:
        https://github.com/interlay/interbtc/blob/0302612ae5f8ddf1f556042ca347c6104704ad83/crates/escrow/src/lib.rs#L524
    */
        const heightDiff = this.saturatingSub(
            new BN(height),
            escrowPoint.ts
        );
        return this.saturatingSub(
            escrowPoint.bias,
            escrowPoint.slope.mul(heightDiff)
        );
    }

    async totalVotingSupply(
        blockNumber?: number
    ): Promise<MonetaryAmount<Currency<VoteUnit>, VoteUnit>> {
        const [currentBlockNumber, epoch, span, rawSlopeChanges] = await Promise.all([
            this.systemAPI.getCurrentBlockNumber(),
            this.api.query.escrow.epoch(),
            this.getSpan(),
            this.api.query.escrow.slopeChanges.entries()
        ]);
        const height = blockNumber || currentBlockNumber;
        const slopeChanges = new Map<BN, BN>();
        rawSlopeChanges.forEach(
            ([id, value]) => slopeChanges.set(storageKeyToNthInner(id).toBn(), value.toBn())
        );

        const lastPoint = await this.api.query.escrow.pointHistory(epoch);
        const rawSupply = this.rawSupplyAt(parseEscrowPoint(lastPoint), new BN(height), span, slopeChanges);
        // `rawSupply.toString()` is used to convert the BN to a BigSource type
        return newMonetaryAmount(rawSupply.toString(), toVoting(this.governanceCurrency));
    }

    private rawSupplyAt(escrowPoint: RWEscrowPoint, height: BN, escrowSpan: BN, slopeChanges: Map<BN, BN>): BN {
        /*
            Rust reference implementation:
            https://github.com/interlay/interbtc/blob/0302612ae5f8ddf1f556042ca347c6104704ad83/crates/escrow/src/lib.rs#L530
        */
        const lastPoint = escrowPoint;
        let t_i = this.roundHeight(lastPoint.ts, escrowSpan);
        while (t_i.lt(height)) {
            t_i = t_i.add(escrowSpan);
            // The BN type is handled by polkadot-js in the api call
            let d_slope;
            if (t_i.gt(height)) {
                t_i = height;
                d_slope = new BN(0);
            } else {
                d_slope = this.getSlopeChange(slopeChanges, t_i);
            }

            const heightDiff = this.saturatingSub(t_i, lastPoint.ts);
            lastPoint.bias = this.saturatingSub(
                lastPoint.bias,
                lastPoint.slope.mul(heightDiff)
            );

            if (t_i.eq(height)) {
                break;
            }

            lastPoint.slope = lastPoint.slope.add(d_slope);
            lastPoint.ts = t_i;
        }

        return lastPoint.bias;
    }

    async getSpan(): Promise<BN> {
        return (await this.api.consts.escrow.span).toBn();
    }

    async getMaxPeriod(): Promise<BN> {
        return (await this.api.consts.escrow.maxPeriod).toBn();
    }

    private roundHeight(height: BN, span: BN): BN {
        return height.div(span).mul(span);
    }

    private getSlopeChange(slopeChanges: Map<BN, BN>, key: BN) {
        let d_slope = slopeChanges.get(key);
        if (d_slope === undefined) {
            d_slope = new BN(0);
        }
        return d_slope;
    }

    private saturatingSub(x: BN, y: BN): BN {
        return BN.max(x.sub(y), new BN(0));
    }

}
