import { Currency, Kintsugi, KintsugiAmount } from "@interlay/monetary-js";
import { assert } from "chai";
import Big from "big.js";
import { newMonetaryAmount, atomicToBaseAmount, ATOMIC_UNIT } from "../../../src";
import { estimateReward } from "../../../src/utils/rewards";

const WEEK_IN_BLOCKS = 54000;
const MINIMUM_BLOCK_PERIOD = 6000; // 6s parachain constant
const MAX_PERIOD = 4838400; // Kintsugi max locking period

describe("Escrow", () => {
    let kintCurrency: Currency;

    before(async () => {
        kintCurrency = Kintsugi;
    });

    it("should calculate rewards for the first staker with only the amount", () => {
        // user input
        const amountToLock = new KintsugiAmount(100);

        // existing system
        const userStake = new Big(0);
        const totalStake = new Big(0);
        const blockReward = newMonetaryAmount(1, kintCurrency);
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency),
            endBlock: 0,
        };
        const currentBlockNumber = 1000;

        // expected outputs
        const amount = "0";
        const apy = "0";

        const resultAmount = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            amountToLock,
            undefined
        );
        assert.equal(resultAmount.amount.toString(), amount);
        assert.equal(resultAmount.apy.toString(), apy);
    });

    it("should calculate rewards for the first staker with only a locktime extension", () => {
        // user input
        const blockLockTimeExtension = 5 * WEEK_IN_BLOCKS; // 5 weeks lock

        // existing system
        const userStake = new Big(0);
        const totalStake = new Big(0);
        const blockReward = newMonetaryAmount(1, kintCurrency);
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency),
            endBlock: 0,
        };
        const currentBlockNumber = 1000;

        // expected outputs
        const amount = "0";
        const apy = "0";

        const resultTime = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            undefined,
            blockLockTimeExtension
        );
        assert.equal(resultTime.amount.toString(), amount);
        assert.equal(resultTime.apy.toString(), apy);
    });

    it("should calculate rewards for the first staker with an amount and a locktime extension", () => {
        // user input
        const amountToLock = new KintsugiAmount(100);
        const blockLockTimeExtension = 5 * WEEK_IN_BLOCKS; // 5 weeks lock

        // existing system
        const userStake = new Big(0);
        const totalStake = new Big(0);
        const blockReward = newMonetaryAmount(1, kintCurrency);
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency),
            endBlock: 0,
        };
        const currentBlockNumber = 1000;

        // expected outputs
        // staker gets 100% of rewards
        const amount = blockReward.mul(blockLockTimeExtension);
        // projects block rewards for 1 year
        const apy = blockReward
            .mul(60 * 60 * 24 * 365 * 1000) // ms per year
            .div(MINIMUM_BLOCK_PERIOD * 2)
            .div(amountToLock.toBig())
            .mul(100);

        const resultAmountAndTime = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            amountToLock,
            blockLockTimeExtension
        );

        assert.equal(resultAmountAndTime.amount.toString(), amount.toString());
        assert.isTrue(
            resultAmountAndTime.amount.toBig().gt(0),
            `${resultAmountAndTime.amount.toString()} not greater than 0`
        );
        assert.equal(resultAmountAndTime.apy.toString(), apy.toBig().toString());
        assert.isTrue(resultAmountAndTime.apy.gt(0), `${resultAmountAndTime.apy.toString()} not greater than 0`);
    });

    it("should return 0 rewards", () => {
        // user input
        const amountToLock = new KintsugiAmount(0);
        const blockLockTimeExtension = 0;

        // existing system
        const userStake = new Big(0);
        const totalStake = new Big(20000000);
        const blockReward = newMonetaryAmount(1, kintCurrency, true);
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency),
            endBlock: 0,
        };
        const currentBlockNumber = 1000;

        // expected outputs
        // staker gets 100% of rewards
        const amount = "0";
        // projects block rewards for 1 year
        const apy = "0";

        const resultAmountAndTime = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            amountToLock,
            blockLockTimeExtension
        );
        assert.equal(resultAmountAndTime.amount.toString(), amount);
        assert.equal(resultAmountAndTime.apy.toString(), apy);

        const resultAmount = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            amountToLock,
            undefined
        );
        assert.equal(resultAmount.amount.toString(), amount);
        assert.equal(resultAmount.apy.toString(), apy);

        const resultTime = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            undefined,
            blockLockTimeExtension
        );
        assert.equal(resultTime.amount.toString(), amount);
        assert.equal(resultTime.apy.toString(), apy);

        const resultNoInput = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD
        );
        assert.equal(resultNoInput.amount.toString(), amount);
        assert.equal(resultNoInput.apy.toString(), apy);
    });

    it("should calculate rewards for the next staker", () => {
        // user input
        const amountToLock = new KintsugiAmount(500);
        const blockLockTimeExtension = 10 * WEEK_IN_BLOCKS; // 10 weeks lock

        // existing system
        // this user's stake
        const userStake = new Big(0); // this user has 0
        // other users have 100 locked for 5 weeks
        const totalStake = new KintsugiAmount(100).toBig().mul(5 * WEEK_IN_BLOCKS);
        const blockReward = newMonetaryAmount(1, kintCurrency, true);
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency),
            endBlock: 0,
        };
        const currentBlockNumber = 1000;

        // expected outputs
        // staker gets a share of the rewards
        const newUserStake = amountToLock.toBig(0).mul(blockLockTimeExtension).div(MAX_PERIOD);
        const amount = newUserStake
            .div(newUserStake.add(totalStake)) // new total stake
            .mul(blockReward.toBig())
            .mul(blockLockTimeExtension);

        const blockTime = MINIMUM_BLOCK_PERIOD * 2; // ms
        const blocksPerYear = (60 * 60 * 24 * 365 * 1000) / blockTime;

        // projects block rewards for 1 year
        const apy = amount.div(blockLockTimeExtension).mul(blocksPerYear).div(amountToLock.toBig()).mul(100);

        const result = estimateReward(
            kintCurrency,
            userStake,
            totalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            amountToLock,
            blockLockTimeExtension
        );

        assert.equal(result.amount.toString(), amount.round(kintCurrency.decimals, 0).toString());
        assert.isTrue(result.amount.toBig().gt(0), `${result.amount.toString()} not greater than 0`);
        assert.equal(result.apy.round(0).toString(), apy.round(0).toString());
        assert.isTrue(result.apy.gt(0), `${result.apy.toString()} not greater than 0`);
    });

    it("should calculate rewards for increasing existing stake", () => {
        // user input
        const baseAmountToLock = atomicToBaseAmount(500, Kintsugi);
        const amountToLock = new KintsugiAmount(baseAmountToLock);
        const blockLockTimeExtension = 10 * WEEK_IN_BLOCKS; // 10 weeks lock

        // existing system
        const currentBlockNumber = 1000;
        // this user's stake is 100
        const stakedBalance = {
            amount: newMonetaryAmount(100, kintCurrency, true),
            endBlock: 5 * WEEK_IN_BLOCKS,
        };
        const atomicUserStake = stakedBalance.amount
            .toBig(ATOMIC_UNIT)
            .mul(stakedBalance.endBlock - currentBlockNumber)
            .div(MAX_PERIOD);
        // other users have locked an additional 500 locked for 5 weeks
        const atomicTotalStake = new KintsugiAmount(atomicToBaseAmount(500, Kintsugi))
            .toBig(ATOMIC_UNIT)
            .mul(5 * WEEK_IN_BLOCKS)
            .div(MAX_PERIOD);
        const blockReward = newMonetaryAmount(1, kintCurrency, true);

        // expected outputs
        // staker gets a share of the rewards
        const newLockDuration = stakedBalance.endBlock + blockLockTimeExtension - currentBlockNumber;
        const newUserStake = stakedBalance.amount
            .toBig(ATOMIC_UNIT)
            .add(amountToLock.toBig(ATOMIC_UNIT))
            .mul(newLockDuration)
            .div(MAX_PERIOD);
        const userStakeDifference = newUserStake.sub(atomicUserStake);
        const amount = blockReward
            .mul(newUserStake) // user stake
            .div(userStakeDifference.add(atomicTotalStake)) // new total stake
            .mul(newLockDuration);
        // projects block rewards for 1 year
        const apy = amount
            .toBig()
            .div(newLockDuration)
            .mul(60 * 60 * 24 * 365 * 1000) // ms per year
            .div(MINIMUM_BLOCK_PERIOD * 2)
            .div(stakedBalance.amount.add(amountToLock).toBig())
            .mul(100);

        const result = estimateReward(
            kintCurrency,
            atomicUserStake,
            atomicTotalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD,
            amountToLock,
            blockLockTimeExtension
        );

        assert.equal(result.amount.toString(), amount.toString());
        assert.isTrue(result.amount.toBig().gt(0), `${result.amount.toString()} not greater than 0`);
        assert.equal(result.apy.round(0).toString(), apy.round(0).toString());
        assert.isTrue(result.apy.gt(0), `${result.apy.toString()} not greater than 0`);
    });

    it("should calculate rewards for current staked amounts", () => {
        // existing system
        const currentBlockNumber = 1000;
        const blockReward = newMonetaryAmount(1, kintCurrency, true);
        const stakedBalance = {
            amount: newMonetaryAmount(100, kintCurrency, true),
            endBlock: 5 * WEEK_IN_BLOCKS,
        };
        // this user's stake is 100
        const atomicUserStake = stakedBalance.amount
            .toBig(ATOMIC_UNIT)
            .mul(stakedBalance.endBlock - currentBlockNumber)
            .div(MAX_PERIOD);
        // other users have locked an additional 500 locked for 5 weeks
        const atomicTotalStake = new KintsugiAmount(600)
            .toBig(ATOMIC_UNIT)
            .mul(5 * WEEK_IN_BLOCKS)
            .div(MAX_PERIOD);

        // expected outputs
        // staker gets a share of the rewards
        const amount = blockReward
            .mul(atomicUserStake) // user stake
            .div(atomicTotalStake) // total stake
            .mul(stakedBalance.endBlock - currentBlockNumber);
        // projects block rewards for 1 year
        const apy = amount
            .toBig()
            .div(stakedBalance.endBlock - currentBlockNumber)
            .mul(60 * 60 * 24 * 365 * 1000) // ms per year
            .div(MINIMUM_BLOCK_PERIOD * 2)
            .div(stakedBalance.amount.toBig())
            .mul(100);

        const result = estimateReward(
            kintCurrency,
            atomicUserStake,
            atomicTotalStake,
            blockReward,
            stakedBalance,
            currentBlockNumber,
            MINIMUM_BLOCK_PERIOD,
            MAX_PERIOD
        );

        assert.equal(result.amount.toString(), amount.toString());
        assert.isTrue(result.amount.toBig().gt(0), `${result.amount.toString()} not greater than 0`);
        assert.equal(result.apy.round(2).toString(), apy.round(2).toString());
        assert.isTrue(result.apy.gt(0), `${result.apy.toString()} not greater than 0`);
    });
});
