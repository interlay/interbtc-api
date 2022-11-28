import sinon from "sinon";
import { ApiPromise } from "@polkadot/api";
import {
    CurrencyExt,
    DefaultAssetRegistryAPI,
    DefaultLoansAPI,
    DefaultTransactionAPI,
    newMonetaryAmount,
} from "../../../src/";
import { getAPITypes } from "../../../src/factory";
import Big from "big.js";
import { expect } from "chai";
import { Interlay, MonetaryAmount, Polkadot } from "@interlay/monetary-js";

describe("DefaultLoansAPI", () => {
    let api: ApiPromise;
    let stubbedAssetRegistry: sinon.SinonStubbedInstance<DefaultAssetRegistryAPI>;
    let loansApi: DefaultLoansAPI;
    const testGovernanceCurrency = Interlay;

    before(() => {
        api = new ApiPromise();
        // disconnect immediately to avoid printing errors
        // we only need the instance to create variables
        api.disconnect();
        api.registerTypes(getAPITypes());
    });

    beforeEach(() => {
        stubbedAssetRegistry = sinon.createStubInstance(DefaultAssetRegistryAPI);
        const transactionAPI = new DefaultTransactionAPI(api);
        loansApi = new DefaultLoansAPI(api, stubbedAssetRegistry, transactionAPI);
    });

    describe("getLendPositionsOfAccount", () => {
        // TODO: add tests
    });

    describe("getBorrowPositionsOfAccount", () => {
        // TODO: add tests
    });

    describe("getLoanAssets", () => {
        // TODO: add tests
    });

    describe("_calculateAnnualizedRewardAmount", () => {
        it("should calculate annulized amount correctly", () => {
            const secsPerYear = 365 * 24 * 60 * 60;
            // this can and will fail if block times change
            // (and that's a good thing)
            const assumedBlockDurationSecs = 12;

            const amountPerBlock = Big(0.042);

            const expectedRewardAmount = amountPerBlock.mul(secsPerYear).div(assumedBlockDurationSecs);
            const actualRewardAmount = loansApi._calculateAnnualizedRewardAmount(
                amountPerBlock,
                assumedBlockDurationSecs * 1000
            );

            expect(actualRewardAmount.eq(expectedRewardAmount)).to.eq(
                true,
                `Expected result to be equal to ${expectedRewardAmount.toString()} but was: ${actualRewardAmount.toString()}`
            );
        });

        it("should throw if blockTimeMs is zero", () => {
            expect(() => loansApi._calculateAnnualizedRewardAmount(Big(1), 0)).to.throw("Division by zero");
        });

        it("should return zero if reward per block is zero", () => {
            const actualRewardAmount = loansApi._calculateAnnualizedRewardAmount(Big(0), 12 * 1000);

            expect(actualRewardAmount.toNumber()).to.be.eq(0);
        });
    });

    describe("_calculateLiquidityAndCapacityAmounts", () => {
        const testUnderlying: CurrencyExt = Polkadot;
        const testExchangeRate = Big(4.2);
        const testTotalIssuance = new MonetaryAmount(testUnderlying, 100000);
        const testTotalBorrows = new MonetaryAmount(testUnderlying, 100);

        const testIssuanceAtomicAmount = testTotalIssuance.toBig(0);
        const testBorrowsAtomicAmount = testTotalBorrows.toBig(0);

        it("should calculate amounts as expected", () => {
            const expectedTotalLiquidityAmount = testTotalIssuance.mul(testExchangeRate);
            const expectedAvailableCapacityAmount = expectedTotalLiquidityAmount.sub(testTotalBorrows);

            const [actualTotalLiquidity, actualAvailableCapacity] = loansApi._calculateLiquidityAndCapacityAmounts(
                testUnderlying,
                testIssuanceAtomicAmount,
                testBorrowsAtomicAmount,
                testExchangeRate
            );

            expect(actualTotalLiquidity.toString()).to.be.eq(expectedTotalLiquidityAmount.toString());
            expect(actualAvailableCapacity.toString()).to.be.eq(expectedAvailableCapacityAmount.toString());
        });

        it("should return zero total liquidity if exchange rate is zero", () => {
            const zeroExchangeRate = Big(0);
            const [actualTotalLiquidity] = loansApi._calculateLiquidityAndCapacityAmounts(
                testUnderlying,
                testIssuanceAtomicAmount,
                testBorrowsAtomicAmount,
                zeroExchangeRate
            );

            expect(actualTotalLiquidity.toBig().toNumber()).to.eq(0);
        });

        it("should return zero total liquidity if total issuance is zero", () => {
            const zeroIssuance = Big(0);
            const [actualTotalLiquidity] = loansApi._calculateLiquidityAndCapacityAmounts(
                testUnderlying,
                zeroIssuance,
                testBorrowsAtomicAmount,
                testExchangeRate
            );

            expect(actualTotalLiquidity.toBig().toNumber()).to.eq(0);
        });

        it("should return zero available capacity if borrow is equal to issuance times exchange rate", () => {
            const borrowAll = testTotalIssuance.mul(testExchangeRate);
            const borrowAllAtomicAmount = borrowAll.toBig(0);
            const [_, actualAvailableCapacity] = loansApi._calculateLiquidityAndCapacityAmounts(
                testUnderlying,
                testIssuanceAtomicAmount,
                borrowAllAtomicAmount,
                testExchangeRate
            );

            expect(actualAvailableCapacity.toBig().toNumber()).to.eq(0);
        });
    });

    describe("_getSubsidyReward", () => {
        it("should return MonetaryAmount as expected", () => {
            const testAmountAtomic = 42e10;

            const expectedAmount = newMonetaryAmount(testAmountAtomic, testGovernanceCurrency);

            const actualReward = loansApi._getSubsidyReward(Big(testAmountAtomic), testGovernanceCurrency);

            expect(actualReward).to.not.be.null;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expect(expectedAmount.toBig().eq(actualReward!.toBig())).to.be.eq(
                true,
                `Expected total amount (atomic value) to equal ${expectedAmount.toString(true)} 
                but was: ${actualReward?.toString(true)}`
            );
            expect(actualReward?.currency).to.eq(testGovernanceCurrency);
        });

        it("should return null if the amount is zero", () => {
            expect(loansApi._getSubsidyReward(Big(0), testGovernanceCurrency)).to.be.null;
        });
    });
});
