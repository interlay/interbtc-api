import { Currency, KintsugiAmount, KintsugiUnit, MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import Big from "big.js";

import {
    createSubstrateAPI,
    DefaultEscrowAPI,
    DefaultSystemAPI,
    DefaultTransactionAPI,
    GovernanceUnit,
    newMonetaryAmount,
    tickerToMonetaryCurrency
} from "../../../src";
import { PARACHAIN_ENDPOINT } from "../../config";

const WEEK_IN_BLOCKS = 54000;
const MINIMUM_BLOCK_PERIOD = 6000; // 6s parachain constant
const MAX_PERIOD = 4838400; // Kintsugi max locking period

describe("Escrow", () => {
    let api: ApiPromise;
    let escrowApi: DefaultEscrowAPI;
    let kintCurrency: Currency<KintsugiUnit>;

    before(async () => {
        // FIXME: check if we can do this without running a chain locally
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const transactionApi = new DefaultTransactionAPI(api);
        kintCurrency = tickerToMonetaryCurrency(api, "KINT") as Currency<KintsugiUnit>;
        escrowApi = new DefaultEscrowAPI(
            api,
            kintCurrency,
            new DefaultSystemAPI(api, transactionApi),
            transactionApi
        );
    });

    after(async () => {
        api.disconnect();
    });

    it("should calculate rewards for the first staker with only the amount", () => {
        // user input
        const amountToLock = new KintsugiAmount(100, "KINT");

        // existing system
        const userStake = new Big(0);
        const totalStake = new Big(0);
        const blockReward = newMonetaryAmount(1, kintCurrency) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
            endBlock: 0
        };
        const currentBlockNumber = 1000;

        // expected outputs
        const amount = "0";
        const apy = "0";

        const resultAmount = escrowApi._computeRewardEstimate(
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
        const blockReward = newMonetaryAmount(1, kintCurrency) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
            endBlock: 0
        };
        const currentBlockNumber = 1000;

        // expected outputs
        const amount = "0";
        const apy = "0";

        const resultTime = escrowApi._computeRewardEstimate(
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
        const amountToLock = new KintsugiAmount(100, "KINT");
        const blockLockTimeExtension = 5 * WEEK_IN_BLOCKS; // 5 weeks lock

        // existing system
        const userStake = new Big(0);
        const totalStake = new Big(0);
        const blockReward = newMonetaryAmount(1, kintCurrency, true) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
            endBlock: 0
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

        const resultAmountAndTime = escrowApi._computeRewardEstimate(
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
        assert.isTrue(resultAmountAndTime.amount.toBig().gt(0), `${resultAmountAndTime.amount.toString()} not greater than 0`);
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
        const blockReward = newMonetaryAmount(1, kintCurrency, true) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
            endBlock: 0
        };
        const currentBlockNumber = 1000;

        // expected outputs
        // staker gets 100% of rewards
        const amount = "0";
        // projects block rewards for 1 year
        const apy = "0";

        const resultAmountAndTime = escrowApi._computeRewardEstimate(
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

        const resultAmount = escrowApi._computeRewardEstimate(
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

        const resultTime = escrowApi._computeRewardEstimate(
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

        const resultNoInput = escrowApi._computeRewardEstimate(
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
        const totalStake = new KintsugiAmount(100).toBig()
            .mul(5 * WEEK_IN_BLOCKS);
        const blockReward = newMonetaryAmount(1, kintCurrency, true) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
        const stakedBalance = {
            amount: newMonetaryAmount(0, kintCurrency) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
            endBlock: 0
        };
        const currentBlockNumber = 1000;

        // expected outputs
        // staker gets a share of the rewards
        const newUserStake = amountToLock.toBig(0)
            .mul(blockLockTimeExtension)
            .div(MAX_PERIOD);
        const amount = blockReward
            .mul(newUserStake) // user stake
            .div(newUserStake.add(totalStake)) // new total stake
            .mul(blockLockTimeExtension);
        // projects block rewards for 1 year
        const apy = amount
            .toBig()
            .div(blockLockTimeExtension)
            .mul(60 * 60 * 24 * 365 * 1000) // ms per year
            .div(MINIMUM_BLOCK_PERIOD * 2)
            .div(amountToLock.toBig())
            .mul(100)
            .round(0);

        const result = escrowApi._computeRewardEstimate(
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

        assert.equal(result.amount.toString(), amount.toString());
        assert.isTrue(result.amount.toBig().gt(0), `${result.amount.toString()} not greater than 0`);
        assert.equal(result.apy.round(0).toString(), apy.toString());
        assert.isTrue(result.apy.gt(0), `${result.apy.toString()} not greater than 0`);
    });

    it("should calculate rewards for increasing existing stake", () => {
        // user input
        const amountToLock = new KintsugiAmount(500, "KINT");
        const blockLockTimeExtension = 10 * WEEK_IN_BLOCKS; // 10 weeks lock

        // existing system
        const currentBlockNumber = 1000;
        // this user's stake is 100
        const stakedBalance = {
            amount: newMonetaryAmount(100, kintCurrency, true) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
            endBlock: 5 * WEEK_IN_BLOCKS
        };
        const userStake = stakedBalance.amount.toBig()
            .mul(stakedBalance.endBlock - currentBlockNumber)
            .div(MAX_PERIOD);
        // other users have locked an additional 500 locked for 5 weeks
        const totalStake = new KintsugiAmount(600, "KINT").toBig()
            .mul(5 * WEEK_IN_BLOCKS)
            .div(MAX_PERIOD);
        const blockReward = newMonetaryAmount(1, kintCurrency, true) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;

        // expected outputs
        // staker gets a share of the rewards
        const newLockDuration = stakedBalance.endBlock + blockLockTimeExtension - currentBlockNumber;
        const newUserStake = stakedBalance.amount.toBig()
            .add(amountToLock.toBig())
            .mul(newLockDuration)
            .div(MAX_PERIOD);
        const userStakeDifference = newUserStake.sub(userStake);
        const amount = blockReward
            .mul(newUserStake) // user stake
            .div(userStakeDifference.add(totalStake)) // new total stake
            .mul(newLockDuration);
        // projects block rewards for 1 year
        const apy = amount
            .toBig()
            .div(newLockDuration)
            .mul(60 * 60 * 24 * 365 * 1000) // ms per year
            .div(MINIMUM_BLOCK_PERIOD * 2)
            .div(stakedBalance.amount.toBig().add(amountToLock.toBig()))
            .mul(100);

        const result = escrowApi._computeRewardEstimate(
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

        assert.equal(result.amount.toString(), amount.toString());
        assert.isTrue(result.amount.toBig().gt(0), `${result.amount.toString()} not greater than 0`);
        assert.equal(result.apy.round(0).toString(), apy.round(0).toString());
        assert.isTrue(result.apy.gt(0), `${result.apy.toString()} not greater than 0`);
    });

    it("should calculate rewards for current staked amounts", () => {
        // existing system
        const currentBlockNumber = 1000;
        const blockReward = newMonetaryAmount(1, kintCurrency, true) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>;
        const stakedBalance = {
            amount: newMonetaryAmount(100, kintCurrency, true) as MonetaryAmount<Currency<GovernanceUnit>, GovernanceUnit>,
            endBlock: 5 * WEEK_IN_BLOCKS
        };
        // this user's stake is 100
        const userStake = stakedBalance.amount.toBig()
            .mul(stakedBalance.endBlock - currentBlockNumber)
            .div(MAX_PERIOD);
        // other users have locked an additional 500 locked for 5 weeks
        const totalStake = new KintsugiAmount(600, "KINT").toBig()
            .mul(5 * WEEK_IN_BLOCKS)
            .div(MAX_PERIOD);

        // expected outputs
        // staker gets a share of the rewards
        const amount = blockReward
            .mul(userStake) // user stake
            .div(totalStake) // total stake
            .mul(stakedBalance.endBlock - currentBlockNumber);
        // projects block rewards for 1 year
        const apy = amount
            .toBig()
            .div(stakedBalance.endBlock - currentBlockNumber)
            .mul(60 * 60 * 24 * 365 * 1000) // ms per year
            .div(MINIMUM_BLOCK_PERIOD * 2)
            .div(stakedBalance.amount.toBig())
            .mul(100);

        const result = escrowApi._computeRewardEstimate(
            userStake,
            totalStake,
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
