/* eslint-disable max-len */
import { ApiPromise } from "@polkadot/api";
import {
    BorrowPosition,
    CurrencyExt,
    DefaultLoansAPI,
    DefaultOracleAPI,
    DefaultTransactionAPI,
    LendPosition,
    LoanAsset,
    newMonetaryAmount,
    TickerToData,
} from "../../../src/";
import { getAPITypes } from "../../../src/factory";
import Big, { BigSource } from "big.js";
import { expect } from "chai";
import { Bitcoin, ExchangeRate, InterBtc, Interlay, MonetaryAmount, Polkadot } from "@interlay/monetary-js";

describe("DefaultLoansAPI", () => {
    let api: ApiPromise;
    let loansApi: DefaultLoansAPI;
    const wrappedCurrency = InterBtc;
    const testGovernanceCurrency = Interlay;
    const testRelayCurrency = Polkadot;

    before(() => {
        api = new ApiPromise();
        // disconnect immediately to avoid printing errors
        // we only need the instance to create variables
        api.disconnect();
        api.registerTypes(getAPITypes());
    });

    beforeEach(() => {
        const transactionAPI = new DefaultTransactionAPI(api);
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

    describe("getLoanCollateralInfo", () => {
        const mockLendPosition = (
            currency: CurrencyExt,
            amount: BigSource,
            isCollateral: boolean = true
        ): LendPosition => ({
            amount: newMonetaryAmount(amount, currency),
            currency,
            isCollateral,
        });
        const mockBorrowPosition = (currency: CurrencyExt, amount: BigSource): BorrowPosition => ({
            amount: newMonetaryAmount(amount, currency),
            currency,
            accumulatedDebt: newMonetaryAmount(0, currency),
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
            lendReward: newMonetaryAmount(0, currency),
            borrowReward: newMonetaryAmount(0, currency),
            totalLiquidity: newMonetaryAmount(100, currency),
            availableCapacity: newMonetaryAmount(0, currency),
            totalBorrows: newMonetaryAmount(0, currency),
            liquidationThreshold,
            collateralThreshold,
            isActive: true,
            supplyCap: newMonetaryAmount(100000, currency),
            borrowCap: newMonetaryAmount(100000, currency),
            exchangeRate: new ExchangeRate(Bitcoin, currency, exchangeRate.div(10 ** Bitcoin.decimals), 0, 0),
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
            const governanceCurrencyLentAmount = Big(100);
            const relayCurrencyBorrowedAmount = Big(1);
            const lendPositions = [mockLendPosition(testGovernanceCurrency, governanceCurrencyLentAmount)];
            const borrowPositions = [mockBorrowPosition(testRelayCurrency, relayCurrencyBorrowedAmount)];

            const expectedTotalLentBtc = governanceCurrencyLentAmount.div(exchangeRateGovernanceCurrency);
            const expectedTotalBorrowedBtc = relayCurrencyBorrowedAmount.div(exchangeRateRelayCurrency);
            const expectedTotalCollateralBtc = expectedTotalLentBtc;
            const expectedBorrowLimitBtc = expectedTotalCollateralBtc
                .mul(collateralThresholdGovernanceCurrency)
                .sub(expectedTotalBorrowedBtc);

            const { totalLentBtc, totalBorrowedBtc, totalCollateralBtc, borrowLimitBtc } =
                loansApi.getLoanCollateralInfo(lendPositions, borrowPositions, loanAssets);

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
                totalCollateralBtc.toBig().eq(expectedTotalCollateralBtc),
                `Collateral amount: ${totalCollateralBtc.toString()} doesn't match expected amount ${expectedTotalCollateralBtc.toString()}`
            ).to.be.true;
            expect(
                borrowLimitBtc.toBig().eq(expectedBorrowLimitBtc),
                `Borrow limit amount: ${borrowLimitBtc.toString()} doesn't match expected amount ${expectedBorrowLimitBtc.toString()}`
            ).to.be.true;
        });

        it("should compute correct LTV and average thresholds", () => {
            const governanceCurrencyLentAmount = Big(100);
            const wrappedCurrencyLentAmount = Big(2);
            const relayCurrencyLentAmount = Big(1000); // Should not affect the computation since it won't be enabled as collateral.

            const governanceCurrencyBorrowedAmount = Big(10);
            const relayCurrencyBorrowedAmount = Big(10);

            const governanceCurrencyCollateralBtc = governanceCurrencyLentAmount.div(exchangeRateGovernanceCurrency);
            const wrappedCurrencyCollateralBtc = wrappedCurrencyLentAmount.div(exchangeRateWrappedCurrency);
            const totalCollateralAmountBtc = governanceCurrencyCollateralBtc.add(wrappedCurrencyCollateralBtc);

            const governanceCurrencyBorrowedBtc = governanceCurrencyBorrowedAmount.div(exchangeRateGovernanceCurrency);
            const relayCurrencyBorrowedBtc = relayCurrencyBorrowedAmount.div(exchangeRateRelayCurrency);
            const totalBorrowedAmountBtc = governanceCurrencyBorrowedBtc.add(relayCurrencyBorrowedBtc);

            const totalCollateralThresholdAdjustedCollateralAmountBtc = governanceCurrencyCollateralBtc
                .mul(collateralThresholdGovernanceCurrency)
                .add(wrappedCurrencyCollateralBtc.mul(collateralThresholdWrappedCurrency));
            const totalLiquidationThresholdAdjustedCollateralAmountBtc = governanceCurrencyCollateralBtc
                .mul(liquidationThresholdGovernanceCurrency)
                .add(wrappedCurrencyCollateralBtc.mul(liquidationThresholdWrappedCurrency));

            const lendPositions = [
                mockLendPosition(testGovernanceCurrency, governanceCurrencyLentAmount),
                mockLendPosition(testRelayCurrency, relayCurrencyLentAmount, false),
                mockLendPosition(wrappedCurrency, wrappedCurrencyLentAmount),
            ];
            const borrowPositions = [
                mockBorrowPosition(testRelayCurrency, relayCurrencyBorrowedAmount),
                mockBorrowPosition(testGovernanceCurrency, governanceCurrencyBorrowedAmount),
            ];

            const { ltv, collateralThresholdWeightedAverage, liquidationThresholdWeightedAverage } =
                loansApi.getLoanCollateralInfo(lendPositions, borrowPositions, loanAssets);

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
            expect(loansApi.getLoanCollateralInfo([], [], loanAssets)).to.not.throw;
        });

        it("should not throw when there are no borrow positions", () => {
            const lendPositions = [mockLendPosition(testGovernanceCurrency, 1)];
            expect(loansApi.getLoanCollateralInfo(lendPositions, [], loanAssets)).to.not.throw;
        });
    });
});
