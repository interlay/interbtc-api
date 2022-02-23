import { Currency, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import BN from "bn.js";

import { newMonetaryAmount, storageKeyToNthInner, toVoting } from "../utils";
import {
    GovernanceCurrency,
    GovernanceUnit,
    parseEscrowLockedBalance,
    parseEscrowPoint,
    RWEscrowPoint,
    StakedBalance,
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
     * @param amountToLock New amount to add to the current stake
     * @returns The estimated reward, as amount and percentage (APY)
     */
    getRewardEstimate<U extends GovernanceUnit>(
        accountId: AccountId,
        amountToLock?: MonetaryAmount<Currency<U>, U>
    ): Promise<{
            amount: MonetaryAmount<Currency<U>, U>,
            apy: number
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
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit);
    }

    async withdraw(): Promise<void> {
        const tx = this.api.tx.escrow.withdraw();
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Withdraw);
    }

    async withdrawRewards(): Promise<void> {
        const tx = this.api.tx.escrowAnnuity.withdrawRewards();
        await this.transactionAPI.sendLogged(tx, this.api.events.escrowRewards.WithdrawReward);
    }

    async increaseAmount<U extends GovernanceUnit>(amount: MonetaryAmount<Currency<U>, U>): Promise<void> {
        const tx = this.api.tx.escrow.increaseAmount(amount.toString(amount.currency.rawBase));
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit);
    }

    async increaseUnlockHeight(unlockHeight: number): Promise<void> {
        const tx = this.api.tx.escrow.increaseUnlockHeight(unlockHeight);
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit);
    }

    async getRewardEstimate<U extends GovernanceUnit>(
        accountId: AccountId,
        amountToLock?: MonetaryAmount<Currency<U>, U>
    ): Promise<{
            amount: MonetaryAmount<Currency<U>, U>,
            apy: number
    }> {
        const [userStake, totalStake, blockReward, stakedBalance, currentBlockNumber] = await Promise.all([
            this.getEscrowStake(accountId),
            this.getEscrowTotalStake(),
            this.getRewardPerBlock(),
            this.getStakedBalance(accountId),
            this.systemAPI.getCurrentBlockNumber()
        ]);
        const definedAmountToLock =
            (
                amountToLock
                || newMonetaryAmount(0, this.governanceCurrency as Currency<GovernanceUnit>)
            ) as typeof userStake;
        const newUserStake = userStake.add(definedAmountToLock);

        const newAmountLocked = stakedBalance.amount.add(definedAmountToLock);
        const newTotalStake = totalStake.add(definedAmountToLock);
        const lockDuration = stakedBalance.endBlock - currentBlockNumber;

        // If there is nothing staked in the system or
        // no rewards are paid, the rewards are 0
        if (newTotalStake.isZero() || blockReward.isZero()) {
            return {
                amount: newMonetaryAmount(
                    0,
                    this.governanceCurrency as Currency<GovernanceUnit>
                ) as unknown as MonetaryAmount<Currency<U>, U>,
                apy: 0
            };
        }

        const rewardAmount = newUserStake
            .div(newTotalStake.toBig())
            .mul(blockReward.toBig())
            .mul(lockDuration) as unknown as MonetaryAmount<Currency<U>, U>;

        return {
            amount: rewardAmount,
            apy: rewardAmount.toBig().div(newAmountLocked.toBig()).toNumber()
        };
    }

    async getEscrowStake(accountId: AccountId): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawStake = await this.api.query.escrowRewards.stake.at(head, accountId);
        return newMonetaryAmount(rawStake.toString(), this.governanceCurrency as Currency<GovernanceUnit>);
    }

    async getEscrowTotalStake(): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawTotalStake = await this.api.query.escrowRewards.totalStake.at(head);
        return newMonetaryAmount(rawTotalStake.toString(), this.governanceCurrency as Currency<GovernanceUnit>);
    }

    async getRewardPerBlock(): Promise<MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawRewardPerBlock = await this.api.query.escrowAnnuity.rewardPerBlock.at(head);
        return newMonetaryAmount(rawRewardPerBlock.toString(), this.governanceCurrency as Currency<GovernanceUnit>);
    }

    async getStakedBalance(accountId: AccountId): Promise<StakedBalance<GovernanceUnit>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const rawStakedBalance = await this.api.query.escrow.locked.at(head, accountId);
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
