import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import BN from "bn.js";
import Big from "big.js";

import {
    decodeFixedPointType,
    newCurrencyId,
    newMonetaryAmount,
    storageKeyToNthInner,
    toVoting,
    estimateReward,
} from "../utils";
import {
    GovernanceCurrency,
    parseEscrowLockedBalance,
    parseEscrowPoint,
    RWEscrowPoint,
    StakedBalance,
    VotingCurrency,
} from "../types";
import { SystemAPI } from "./system";
import { TransactionAPI } from ".";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

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
    votingBalance(accountId: AccountId, blockNumber?: number): Promise<MonetaryAmount<GovernanceCurrency>>;
    /**
     * @param blockNumber The number of block to query state at
     * @returns The voting balance
     * @remarks
     * - Expect poor performance from this function as more blocks are appended to the parachain.
     * It is not recommended to call this directly, but rather to query through the indexer (currently `interbtc-index`).
     * - Logic is duplicated from Escrow pallet in the parachain
     */
    totalVotingSupply(blockNumber?: number): Promise<MonetaryAmount<GovernanceCurrency>>;
    /**
     * Build a create lock extrinsic without sending it.
     *
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
     * @param unlockHeight Block number to lock until
     * @returns A create lock submittable extrinsic.
     */
    buildCreateLockExtrinsic(
        amount: MonetaryAmount<GovernanceCurrency>,
        unlockHeight: number
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;
    /**
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
     * @param unlockHeight Block number to lock until
     * @remarks The amount can't be less than the max period (`getMaxPeriod` getter) to prevent rounding errors
     */
    createLock(amount: MonetaryAmount<GovernanceCurrency>, unlockHeight: number): Promise<void>;
    /**
     * @param accountId ID of the user whose stake to fetch
     * @returns The staked amount and end block
     */
    getStakedBalance(accountId: AccountId): Promise<StakedBalance>;
    /**
     * @returns The total amount of locked governance tokens
     * @remarks
     * - Expect poor performance from this function as more blocks are appended to the parachain.
     * It is not recommended to call this directly, but rather to query through interbtc-squid once implemented.
     */
    getTotalStakedBalance(): Promise<MonetaryAmount<GovernanceCurrency>>;
    /**
     * Build a withdraw extrinsic without sending it.
     *
     * @remarks Withdraws all locked governance currency
     * @returns A withdraw submittable extrinsic.
     */
    buildWithdrawExtrinsic(): SubmittableExtrinsic<"promise", ISubmittableResult>;
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
     * Build a withdraw rewards extrinsic without sending it.
     *
     * @remarks Withdraws stake-to-vote rewards
     * @returns A withdraw rewards submittable extrinsic.
     */
    buildWithdrawRewardsExtrinsic(): SubmittableExtrinsic<"promise", ISubmittableResult>;
    /**
     * @remarks Withdraws stake-to-vote rewards
     */
    withdrawRewards(): Promise<void>;
    /**
     * Build an increase amount extrinsic without sending it.
     *
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
     * @returns An increase amount submittable extrinsic.
     */
    buildIncreaseAmountExtrinsic(
        amount: MonetaryAmount<GovernanceCurrency>
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;
    /**
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
     */
    increaseAmount(amount: MonetaryAmount<GovernanceCurrency>): Promise<void>;
    /**
     * Build an increase unlock height extrinsic without sending it.
     *
     * @param unlockHeight The unlock height to increase by.
     * @returns An increase unlock height submittable extrinsic.
     */
    buildIncreaseUnlockHeightExtrinsic(unlockHeight: number): SubmittableExtrinsic<"promise", ISubmittableResult>;
    /**
     * @param unlockHeight The unlock height to increase by.
     */
    increaseUnlockHeight(unlockHeight: number): Promise<void>;
    /**
     * @param accountId User account ID
     * @returns The rewards that can be withdrawn by the account
     * @remarks Implements https://spec.interlay.io/spec/reward.html#computereward
     */
    getRewards(accountId: AccountId): Promise<MonetaryAmount<GovernanceCurrency>>;
    /**
     * @param accountId User account ID
     * @param amountToLock New amount to add to the current stake
     * @param blockLockTimeExtension Amount of blocks the stake will be locked for
     * @returns The estimated reward, as amount and percentage (APY)
     */
    getRewardEstimate(
        accountId: AccountId,
        amountToLock?: MonetaryAmount<GovernanceCurrency>,
        blockLockTimeExtension?: number
    ): Promise<{
        amount: MonetaryAmount<GovernanceCurrency>;
        apy: Big;
    }>;
}

export class DefaultEscrowAPI implements EscrowAPI {
    constructor(
        private api: ApiPromise,
        private governanceCurrency: GovernanceCurrency,
        private systemAPI: SystemAPI,
        private transactionAPI: TransactionAPI
    ) {}

    buildCreateLockExtrinsic(
        amount: MonetaryAmount<GovernanceCurrency>,
        unlockHeight: number
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        return this.api.tx.escrow.createLock(amount.toString(true), unlockHeight);
    }

    async createLock(amount: MonetaryAmount<GovernanceCurrency>, unlockHeight: number): Promise<void> {
        const tx = this.buildCreateLockExtrinsic(amount, unlockHeight);
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    buildWithdrawExtrinsic(): SubmittableExtrinsic<"promise", ISubmittableResult> {
        return this.api.tx.escrow.withdraw();
    }

    async withdraw(): Promise<void> {
        const tx = this.buildWithdrawExtrinsic();
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Withdraw, true);
    }

    buildWithdrawRewardsExtrinsic(): SubmittableExtrinsic<"promise", ISubmittableResult> {
        return this.api.tx.escrow.withdrawRewards();
    }

    async withdrawRewards(): Promise<void> {
        const tx = this.buildWithdrawRewardsExtrinsic();
        await this.transactionAPI.sendLogged(tx, this.api.events.escrowRewards.WithdrawReward, true);
    }

    buildIncreaseAmountExtrinsic(
        amount: MonetaryAmount<GovernanceCurrency>
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        return this.api.tx.escrow.increaseAmount(amount.toString(true));
    }

    async increaseAmount(amount: MonetaryAmount<GovernanceCurrency>): Promise<void> {
        const tx = this.buildIncreaseAmountExtrinsic(amount);
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    buildIncreaseUnlockHeightExtrinsic(unlockHeight: number): SubmittableExtrinsic<"promise", ISubmittableResult> {
        return this.api.tx.escrow.increaseUnlockHeight(unlockHeight);
    }

    async increaseUnlockHeight(unlockHeight: number): Promise<void> {
        const tx = this.buildIncreaseUnlockHeightExtrinsic(unlockHeight);
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    async getRewards(accountId: AccountId): Promise<MonetaryAmount<GovernanceCurrency>> {
        // Step 1. Get amount in reward pool for the account ID
        const [rewardStake, rewardPerToken, rewardTally] = await Promise.all([
            this.getEscrowStake(accountId),
            this.getRewardPerToken(),
            this.getRewardTally(accountId),
        ]);
        // Step 2. Calculate the rewards that can be withdrawn at the moment
        // Stake[currencyId, accountId] * RewardPerToken[currencyId] - RewardTally[currencyId, accountId]
        const rewards = rewardStake.mul(rewardPerToken).sub(rewardTally);
        return newMonetaryAmount(rewards, this.governanceCurrency);
    }

    async getRewardEstimate(
        accountId: AccountId,
        amountToLock?: MonetaryAmount<GovernanceCurrency>,
        blockLockTimeExtension?: number
    ): Promise<{
        amount: MonetaryAmount<GovernanceCurrency>;
        apy: Big;
    }> {
        const [userStake, totalStake, blockReward, stakedBalance, currentBlockNumber, minimumBlockPeriod, maxPeriod] =
            await Promise.all([
                this.getEscrowStake(accountId),
                this.getEscrowTotalStake(),
                this.getRewardPerBlock(),
                this.getStakedBalance(accountId),
                this.systemAPI.getCurrentBlockNumber(),
                this.api.consts.timestamp.minimumPeriod,
                this.getMaxPeriod(),
            ]);

        return estimateReward(
            this.governanceCurrency,
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

    async getEscrowStake(accountId: AccountId): Promise<Big> {
        const rawStake = await this.api.query.escrowRewards.stake(accountId);
        return decodeFixedPointType(rawStake);
    }

    async getEscrowTotalStake(): Promise<Big> {
        const rawTotalStake = await this.api.query.escrowRewards.totalStake();
        return decodeFixedPointType(rawTotalStake);
    }

    async getRewardTally(accountId: AccountId): Promise<Big> {
        const governanceCurrencyId = newCurrencyId(this.api, this.governanceCurrency);
        const rawRewardTally = await this.api.query.escrowRewards.rewardTally(governanceCurrencyId, accountId);
        return decodeFixedPointType(rawRewardTally);
    }

    async getRewardPerToken(): Promise<Big> {
        const governanceCurrencyId = newCurrencyId(this.api, this.governanceCurrency);
        const rawRewardPerToken = await this.api.query.escrowRewards.rewardPerToken(governanceCurrencyId);
        return decodeFixedPointType(rawRewardPerToken);
    }

    async getRewardPerBlock(): Promise<MonetaryAmount<GovernanceCurrency>> {
        const rawRewardPerBlock = await this.api.query.escrowAnnuity.rewardPerBlock();
        return newMonetaryAmount(rawRewardPerBlock.toString(), this.governanceCurrency);
    }

    async getStakedBalance(accountId: AccountId): Promise<StakedBalance> {
        const rawStakedBalance = await this.api.query.escrow.locked(accountId);
        return parseEscrowLockedBalance(this.governanceCurrency, rawStakedBalance);
    }

    async getTotalStakedBalance(): Promise<MonetaryAmount<GovernanceCurrency>> {
        const govCcy = this.governanceCurrency;
        const rawStakedBalances = await this.api.query.escrow.locked.entries();

        const totalCurrentAmount = rawStakedBalances
            .map(([_, rawStakedBalance]) => parseEscrowLockedBalance(govCcy, rawStakedBalance).amount)
            .reduce((acc, amount) => acc.add(amount), newMonetaryAmount(0, govCcy));

        return totalCurrentAmount;
    }

    async votingBalance(accountId: AccountId, blockNumber?: number): Promise<MonetaryAmount<GovernanceCurrency>> {
        const height = blockNumber || (await this.systemAPI.getCurrentBlockNumber());
        const userPointEpoch = await this.api.query.escrow.userPointEpoch(accountId);
        const lastPoint = await this.api.query.escrow.userPointHistory(accountId, userPointEpoch);
        const rawBalance = this.rawBalanceAt(parseEscrowPoint(lastPoint), height);

        // `rawBalance.toString()` is used to convert the BN to a BigSource type
        return newMonetaryAmount(rawBalance.toString(), toVoting(this.governanceCurrency));
    }

    /*
        Rust reference implementation:
        https://github.com/interlay/interbtc/blob/0302612ae5f8ddf1f556042ca347c6104704ad83/crates/escrow/src/lib.rs#L524
    */
    private rawBalanceAt(escrowPoint: RWEscrowPoint, height: number): BN {
        const heightDiff = this.saturatingSub(new BN(height), escrowPoint.ts);
        return this.saturatingSub(escrowPoint.bias, escrowPoint.slope.mul(heightDiff));
    }

    async totalVotingSupply(blockNumber?: number): Promise<MonetaryAmount<VotingCurrency>> {
        let block;
        let epoch;

        if (blockNumber) {
            block = new BN(blockNumber);
            const maxEpoch = await this.api.query.escrow.epoch();
            epoch = await this.findBlockEpoch(block, maxEpoch.toBn());
        } else {
            const [currentBlock, currentEpoch] = await Promise.all([
                this.systemAPI.getCurrentBlockNumber(),
                this.api.query.escrow.epoch(),
            ]);
            block = new BN(currentBlock);
            epoch = currentEpoch.toBn();
        }
        return this.totalVotingSupplyAt(block, epoch);
    }

    private async totalVotingSupplyAt(block: BN, epoch: BN): Promise<MonetaryAmount<VotingCurrency>> {
        const [span, rawSlopeChanges] = await Promise.all([
            this.getSpan(),
            this.api.query.escrow.slopeChanges.entries(),
        ]);
        const slopeChanges = new Map<BN, BN>();
        rawSlopeChanges.forEach(([id, value]) => slopeChanges.set(storageKeyToNthInner(id).toBn(), value.toBn()));

        const lastPoint = await this.api.query.escrow.pointHistory(epoch);
        const rawSupply = this.rawSupplyAt(parseEscrowPoint(lastPoint), block, span, slopeChanges);
        // `rawSupply.toString()` is used to convert the BN to a BigSource type
        return newMonetaryAmount(rawSupply.toString(), toVoting(this.governanceCurrency));
    }

    /*
        Vyper reference implementation:
        https://github.com/curvefi/curve-dao-contracts/blob/4e428823c8ae9c0f8a669d796006fade11edb141/contracts/VotingEscrow.vy#L502
    */
    private async findBlockEpoch(block: BN, maxEpoch: BN): Promise<BN> {
        let min = new BN(0);
        let max = maxEpoch;

        for (let i = 0; i < 128; i++) {
            if (min.gte(max)) {
                break;
            }
            const mid = min.add(max).addn(1).divn(2);
            const point = parseEscrowPoint(await this.api.query.escrow.pointHistory(mid));
            if (point.ts.lte(block)) {
                min = mid;
            } else {
                max = mid.subn(1);
            }
        }

        return min;
    }

    /*
        Rust reference implementation:
        https://github.com/interlay/interbtc/blob/0302612ae5f8ddf1f556042ca347c6104704ad83/crates/escrow/src/lib.rs#L530
    */
    private rawSupplyAt(escrowPoint: RWEscrowPoint, height: BN, escrowSpan: BN, slopeChanges: Map<BN, BN>): BN {
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
            lastPoint.bias = this.saturatingSub(lastPoint.bias, lastPoint.slope.mul(heightDiff));

            if (t_i.eq(height)) {
                break;
            }

            lastPoint.slope = lastPoint.slope.add(d_slope);
            lastPoint.ts = t_i;
        }

        return lastPoint.bias;
    }

    async getSpan(): Promise<BN> {
        return this.api.consts.escrow.span.toBn();
    }

    async getMaxPeriod(): Promise<BN> {
        return this.api.consts.escrow.maxPeriod.toBn();
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
