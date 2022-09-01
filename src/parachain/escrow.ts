import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import BN from "bn.js";
import Big from "big.js";

import {
    decodeFixedPointType,
    newCurrencyId,
    newMonetaryAmount,
    toVoting,
    estimateReward,
} from "../utils";
import {
    GovernanceCurrency,
    parseEscrowLockedBalance,
    StakedBalance,
    VotingCurrency,
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
    increaseAmount(amount: MonetaryAmount<GovernanceCurrency>): Promise<void>;
    /**
     * @param amount Governance token amount to lock (e.g. KINT or INTR)
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

    async createLock(amount: MonetaryAmount<GovernanceCurrency>, unlockHeight: number): Promise<void> {
        const tx = this.api.tx.escrow.createLock(amount.toString(true), unlockHeight);
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

    async increaseAmount(amount: MonetaryAmount<GovernanceCurrency>): Promise<void> {
        const tx = this.api.tx.escrow.increaseAmount(amount.toString(true));
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    async increaseUnlockHeight(unlockHeight: number): Promise<void> {
        const tx = this.api.tx.escrow.increaseUnlockHeight(unlockHeight);
        await this.transactionAPI.sendLogged(tx, this.api.events.escrow.Deposit, true);
    }

    async getRewards(accountId: AccountId): Promise<MonetaryAmount<GovernanceCurrency>> {
        const reward = await this.api.rpc.reward.computeEscrowReward(
            accountId,
            newCurrencyId(this.api, this.governanceCurrency)
        );
        return newMonetaryAmount(reward.amount.toString(), this.governanceCurrency);
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
        const maybeBlockNumber = blockNumber === undefined? null : blockNumber.toString();
        const balance = await this.api.rpc.escrow.balanceAt(accountId.toString(), maybeBlockNumber);
        return newMonetaryAmount(balance.amount.toString(), toVoting(this.governanceCurrency));
    }

    async totalVotingSupply(blockNumber?: number): Promise<MonetaryAmount<VotingCurrency>> {
        const maybeBlockNumber = blockNumber === undefined? null : blockNumber.toString();
        const supply = await this.api.rpc.escrow.totalSupply(maybeBlockNumber);
        return newMonetaryAmount(supply.amount.toString(), toVoting(this.governanceCurrency));
    }

    async getSpan(): Promise<BN> {
        return this.api.consts.escrow.span.toBn();
    }

    async getMaxPeriod(): Promise<BN> {
        return this.api.consts.escrow.maxPeriod.toBn();
    }
}
