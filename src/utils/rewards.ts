import { RewardCurrency, StakedBalance } from "../types";
import Big from "big.js";
import { MonetaryAmount } from "@interlay/monetary-js";
import { ATOMIC_UNIT, newMonetaryAmount } from "./currency";

// TODO: simplify this, perhaps use builder?
export function estimateReward(
    currency: RewardCurrency,
    atomicUserStake: Big,
    atomicTotalStake: Big,
    blockReward: MonetaryAmount<RewardCurrency>,
    stakedBalance: StakedBalance,
    currentBlockNumber: number,
    minimumBlockPeriod: number,
    maxPeriod: number,
    amountToLock: MonetaryAmount<RewardCurrency> = newMonetaryAmount(0, currency),
    blockLockTimeExtension: number = 0
): {
    amount: MonetaryAmount<RewardCurrency>;
    apy: Big;
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
    const newStakedBalance = {
        amount: stakedBalance.amount,
        endBlock: stakedBalance.endBlock,
    };

    const monetaryAddedStake = newMonetaryAmount(amountToLock.toBig(ATOMIC_UNIT), currency);

    // User staking for the first time; only case 2 relevant otherwise rewards should be 0
    if (stakedBalance.amount.isZero()) {
        newStakedBalance.amount = monetaryAddedStake;
        newStakedBalance.endBlock = currentBlockNumber + blockLockTimeExtension;
        // User increasing stake or locking amount or none (cases 1 - 4)
    } else {
        // might add 0 to either amount or endBlock
        newStakedBalance.amount = stakedBalance.amount.add(monetaryAddedStake);
        newStakedBalance.endBlock = stakedBalance.endBlock + blockLockTimeExtension;
    }
    let newLockDuration = 0;
    if (newStakedBalance.endBlock - currentBlockNumber > 0) {
        newLockDuration = newStakedBalance.endBlock - currentBlockNumber;
    }

    const atomicNewUserStake = newStakedBalance.amount.toBig(ATOMIC_UNIT).mul(newLockDuration).div(maxPeriod);
    const atomicUserStakeDifference = atomicNewUserStake.sub(atomicUserStake);
    const atomicNewTotalStake = atomicTotalStake.add(atomicUserStakeDifference);

    // Catch 0 values
    if (newLockDuration == 0 || atomicNewTotalStake.eq(0) || newStakedBalance.amount.isZero()) {
        return {
            amount: newMonetaryAmount(0, currency),
            apy: new Big(0),
        };
    }
    // Reward amount for the entire time is the newUserStake / netTotalStake * blockReward * lock duration
    const atomicRewardAmount = atomicNewUserStake
        .div(atomicNewTotalStake)
        .mul(blockReward.toBig(ATOMIC_UNIT))
        .mul(newLockDuration);

    const monetaryRewardAmount = newMonetaryAmount(atomicRewardAmount, currency);

    // TODO: move this to a util function so we can use it across the codebase
    // normalize APY to 1 year
    const blockTime = minimumBlockPeriod * 2; // ms
    const blocksPerYear = (60 * 60 * 24 * 365 * 1000) / blockTime;
    const atomicAnnualisedReward = atomicRewardAmount.div(newLockDuration).mul(blocksPerYear);

    const apy = atomicAnnualisedReward.div(newStakedBalance.amount.toBig(ATOMIC_UNIT)).mul(100);

    return {
        amount: monetaryRewardAmount,
        apy: apy,
    };
}
