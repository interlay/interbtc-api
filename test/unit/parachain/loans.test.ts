import { ApiPromise } from "@polkadot/api";
import {
    CurrencyExt,
    DefaultLoansAPI,
    DefaultOracleAPI,
    DefaultTransactionAPI,
    newMonetaryAmount,
} from "../../../src/";
import { getAPITypes } from "../../../src/factory";
import Big from "big.js";
import { expect } from "chai";
import { Interlay, MonetaryAmount, Polkadot } from "@interlay/monetary-js";
import { getWrappedCurrencyForTest } from "test/utils/helpers";

describe("DefaultLoansAPI", () => {
    let api: ApiPromise;
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
        const transactionAPI = new DefaultTransactionAPI(api);
        const wrappedCurrency = getWrappedCurrencyForTest(api);
        const oracleAPI = new DefaultOracleAPI(api, wrappedCurrency, transactionAPI);
        loansApi = new DefaultLoansAPI(api, transactionAPI, oracleAPI);
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
