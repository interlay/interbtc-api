/* eslint-disable max-len */
import { ApiPromise } from "@polkadot/api";
import {
    BorrowPosition,
    CurrencyExt,
    DefaultLoansAPI,
    DefaultOracleAPI,
    CollateralPosition,
    LoanAsset,
    TickerToData,
    newMonetaryAmount,
} from "../../../src/";
import { getAPITypes } from "../../../src/factory";
import Big from "big.js";
import { expect } from "chai";
import { Bitcoin, ExchangeRate, InterBtc, Interlay, KBtc, MonetaryAmount, Polkadot } from "@interlay/monetary-js";

describe("DefaultLoansAPI", () => {
    let api: ApiPromise;
    let loansApi: DefaultLoansAPI;
    const wrappedCurrency = InterBtc;
    const testGovernanceCurrency = Interlay;
    const testRelayCurrency = Polkadot;

    beforeAll(() => {
        api = new ApiPromise();
        // disconnect immediately to avoid printing errors
        // we only need the instance to create variables
        api.disconnect();
        api.registerTypes(getAPITypes());
    });

    beforeEach(() => {
        const oracleAPI = new DefaultOracleAPI(api, wrappedCurrency);
        loansApi = new DefaultLoansAPI(api, KBtc, oracleAPI);
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

        it(
            "should return zero available capacity if borrow is equal to issuance times exchange rate",
            () => {
                const borrowAll = testTotalIssuance.mul(testExchangeRate);
                const borrowAllAtomicAmount = borrowAll.toBig(0);
                const [_, actualAvailableCapacity] = loansApi._calculateLiquidityAndCapacityAmounts(
                    testUnderlying,
                    testIssuanceAtomicAmount,
                    borrowAllAtomicAmount,
                    testExchangeRate
                );

                expect(actualAvailableCapacity.toBig().toNumber()).to.eq(0);
            }
        );
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

    describe("getLendingStats", () => {
        const mockLendPosition = (
            amount: MonetaryAmount<CurrencyExt>,
            isCollateral: boolean = true
        ): CollateralPosition => ({
            amount,
            isCollateral,
            vaultCollateralAmount: newMonetaryAmount(0, amount.currency),
        });
        const mockBorrowPosition = (amount: MonetaryAmount<CurrencyExt>): BorrowPosition => ({
            amount,
            accumulatedDebt: newMonetaryAmount(0, amount.currency),
        });
        const mockLoanAsset = (
            currency: CurrencyExt,
            liquidationThreshold: Big,
            collateralThreshold: Big,
            exchangeRate: Big
        ): LoanAsset => ({
            currency: currency,
            lendApy: Big(0),
            borrowApy: Big(0),
            lendReward: new MonetaryAmount(currency, 0),
            borrowReward: new MonetaryAmount(currency, 0),
            totalLiquidity: new MonetaryAmount(currency, 100),
            availableCapacity: new MonetaryAmount(currency, 0),
            totalBorrows: new MonetaryAmount(currency, 0),
            liquidationThreshold,
            collateralThreshold,
            isActive: true,
            supplyCap: new MonetaryAmount(currency, 100000),
            borrowCap: new MonetaryAmount(currency, 100000),
            exchangeRate: new ExchangeRate(Bitcoin, currency, exchangeRate, Bitcoin.decimals, currency.decimals),
        });
        const liquidationThresholdGovernanceCurrency = Big(0.5);
        const liquidationThresholdRelayCurrency = Big(0.25);
        const liquidationThresholdWrappedCurrency = Big(0.75);

        const collateralThresholdGovernanceCurrency = Big(0.75);
        const collateralThresholdRelayCurrency = Big(0.5);
        const collateralThresholdWrappedCurrency = Big(0.9);

        const exchangeRateGovernanceCurrency = Big(200); // 200 GovCurrency/BTC
        const exchangeRateRelayCurrency = Big(20); // 20 RelayCurrency/BTC
        const exchangeRateWrappedCurrency = Big(1);

        const loanAssets: TickerToData<LoanAsset> = {
            [testGovernanceCurrency.ticker]: mockLoanAsset(
                testGovernanceCurrency,
                liquidationThresholdGovernanceCurrency,
                collateralThresholdGovernanceCurrency,
                exchangeRateGovernanceCurrency
            ),
            [testRelayCurrency.ticker]: mockLoanAsset(
                testRelayCurrency,
                liquidationThresholdRelayCurrency,
                collateralThresholdRelayCurrency,
                exchangeRateRelayCurrency
            ),
            [wrappedCurrency.ticker]: mockLoanAsset(
                wrappedCurrency,
                liquidationThresholdWrappedCurrency,
                collateralThresholdWrappedCurrency,
                exchangeRateWrappedCurrency
            ),
        };

        it("should return correct amounts in BTC", () => {
            const governanceCurrencyLentAmount = new MonetaryAmount(testGovernanceCurrency, Big(100));
            const relayCurrencyBorrowedAmount = new MonetaryAmount(testRelayCurrency, Big(1));
            const lendPositions = [mockLendPosition(governanceCurrencyLentAmount)];
            const borrowPositions = [mockBorrowPosition(relayCurrencyBorrowedAmount)];

            const expectedTotalLentBtc = governanceCurrencyLentAmount.toBig().div(exchangeRateGovernanceCurrency);
            const expectedTotalBorrowedBtc = relayCurrencyBorrowedAmount.toBig().div(exchangeRateRelayCurrency);
            const expectedBorrowLimitBtc = expectedTotalLentBtc
                .mul(collateralThresholdGovernanceCurrency)
                .sub(expectedTotalBorrowedBtc);

            const { totalLentBtc, totalBorrowedBtc, totalCollateralBtc, borrowLimitBtc } = loansApi.getLendingStats(
                lendPositions,
                borrowPositions,
                loanAssets
            );

            expect(
                totalLentBtc.toBig().eq(expectedTotalLentBtc),
                `Total lent amount: ${totalLentBtc
                    .toBig()
                    .toString()} doesn't match expected amount ${expectedTotalLentBtc.toString()}`
            ).to.be.true;
            expect(
                totalBorrowedBtc.toBig().eq(expectedTotalBorrowedBtc),
                `Total borrowed amount: ${totalBorrowedBtc.toString()} doesn't match expected amount ${expectedTotalBorrowedBtc.toString()}`
            ).to.be.true;
            expect(
                totalCollateralBtc.toBig().eq(expectedTotalLentBtc),
                `Collateral amount: ${totalCollateralBtc.toString()} doesn't match expected amount ${expectedTotalLentBtc.toString()}`
            ).to.be.true;
            expect(
                borrowLimitBtc.toBig().eq(expectedBorrowLimitBtc),
                `Borrow limit amount: ${borrowLimitBtc.toString()} doesn't match expected amount ${expectedBorrowLimitBtc.toString()}`
            ).to.be.true;
        });

        it("should compute correct LTV and average thresholds", () => {
            const governanceCurrencyLentAmount = new MonetaryAmount(testGovernanceCurrency, Big(100));
            const wrappedCurrencyLentAmount = new MonetaryAmount(wrappedCurrency, Big(2));
            const relayCurrencyLentAmount = new MonetaryAmount(testRelayCurrency, Big(1000)); // Should not affect the computation since it won't be enabled as collateral.

            const governanceCurrencyBorrowedAmount = new MonetaryAmount(testGovernanceCurrency, Big(10));
            const relayCurrencyBorrowedAmount = new MonetaryAmount(testRelayCurrency, Big(10));

            const governanceCurrencyCollateralBtc = governanceCurrencyLentAmount
                .toBig()
                .div(exchangeRateGovernanceCurrency);
            const wrappedCurrencyCollateralBtc = wrappedCurrencyLentAmount.toBig().div(exchangeRateWrappedCurrency);
            const totalCollateralAmountBtc = governanceCurrencyCollateralBtc.add(wrappedCurrencyCollateralBtc);

            const governanceCurrencyBorrowedBtc = governanceCurrencyBorrowedAmount
                .toBig()
                .div(exchangeRateGovernanceCurrency);
            const relayCurrencyBorrowedBtc = relayCurrencyBorrowedAmount.toBig().div(exchangeRateRelayCurrency);
            const totalBorrowedAmountBtc = governanceCurrencyBorrowedBtc.add(relayCurrencyBorrowedBtc);

            const totalCollateralThresholdAdjustedCollateralAmountBtc = governanceCurrencyCollateralBtc
                .mul(collateralThresholdGovernanceCurrency)
                .add(wrappedCurrencyCollateralBtc.mul(collateralThresholdWrappedCurrency));
            const totalLiquidationThresholdAdjustedCollateralAmountBtc = governanceCurrencyCollateralBtc
                .mul(liquidationThresholdGovernanceCurrency)
                .add(wrappedCurrencyCollateralBtc.mul(liquidationThresholdWrappedCurrency));

            const lendPositions = [
                mockLendPosition(governanceCurrencyLentAmount),
                mockLendPosition(relayCurrencyLentAmount, false),
                mockLendPosition(wrappedCurrencyLentAmount),
            ];
            const borrowPositions = [
                mockBorrowPosition(relayCurrencyBorrowedAmount),
                mockBorrowPosition(governanceCurrencyBorrowedAmount),
            ];

            const { ltv, collateralThresholdWeightedAverage, liquidationThresholdWeightedAverage } =
                loansApi.getLendingStats(lendPositions, borrowPositions, loanAssets);

            const expectedLtv = totalBorrowedAmountBtc.div(totalCollateralAmountBtc);
            const expectedAverageCollateralThreshold =
                totalCollateralThresholdAdjustedCollateralAmountBtc.div(totalCollateralAmountBtc);
            const expectedAverageLiquidationThreshold =
                totalLiquidationThresholdAdjustedCollateralAmountBtc.div(totalCollateralAmountBtc);

            expect(ltv.eq(expectedLtv), `LTV: ${ltv.toString()} does not match expected LTV: ${expectedLtv.toString()}`)
                .to.be.true;
            expect(
                collateralThresholdWeightedAverage.eq(expectedAverageCollateralThreshold),
                `Average collateral threshold: ${collateralThresholdWeightedAverage.toString()} does not match expected threshold: ${expectedAverageCollateralThreshold.toString()}`
            ).to.be.true;
            expect(
                liquidationThresholdWeightedAverage.eq(expectedAverageLiquidationThreshold),
                `Average liquidation threshold: ${liquidationThresholdWeightedAverage.toString()} does not match expected threshold: ${expectedAverageLiquidationThreshold.toString()}`
            ).to.be.true;
        });

        it("should not throw when there are no positions", () => {
            expect(() => loansApi.getLendingStats([], [], loanAssets)).to.not.throw;
        });

        it("should not throw when there are no borrow positions", () => {
            const lendPositions = [mockLendPosition(new MonetaryAmount(testGovernanceCurrency, 1))];
            expect(() => loansApi.getLendingStats(lendPositions, [], loanAssets)).to.not.throw;
        });

        it("should throw when loan assets are empty", () => {
            const lendPositions = [mockLendPosition(new MonetaryAmount(testGovernanceCurrency, 1))];
            const borrowPositions = [mockBorrowPosition(new MonetaryAmount(testGovernanceCurrency, 0.1))];
            expect(() => loansApi.getLendingStats(lendPositions, borrowPositions, {})).to.throw;
        });
    });
});
