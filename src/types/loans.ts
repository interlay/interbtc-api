import { Bitcoin, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { CurrencyExt } from "./currency";

interface LoanPosition {
    currency: CurrencyExt;
    amount: MonetaryAmount<CurrencyExt>;
}

interface LendPosition extends LoanPosition {
    isCollateral: boolean;
}

interface BorrowPosition extends LoanPosition {
    accumulatedDebt: MonetaryAmount<CurrencyExt>;
}

type LoanAction = "lend" | "withdraw" | "borrow" | "repay";
interface LendingStats {
    totalLentBtc: MonetaryAmount<Bitcoin>; // Includes earned amount.
    totalBorrowedBtc: MonetaryAmount<Bitcoin>; // Includes debt.
    totalCollateralBtc: MonetaryAmount<Bitcoin>;
    borrowLimitBtc: MonetaryAmount<Bitcoin>;
    ltv: Big;
    collateralThresholdWeightedAverage: Big; // Decimal.
    liquidationThresholdWeightedAverage: Big; // Decimal.
    calculateBorrowLimitBtcChange: (action: LoanAction, amount: MonetaryAmount<CurrencyExt>) => MonetaryAmount<Bitcoin>;
    calculateLtvAndThresholdsChange: (
        action: LoanAction,
        amount: MonetaryAmount<CurrencyExt>
    ) => { ltv: Big; collateralThresholdWeightedAverage: Big; liquidationThresholdWeightedAverage: Big };
}

interface LoanAsset {
    currency: CurrencyExt;
    lendApy: Big; // percentage
    borrowApy: Big; // percentage
    lendReward: MonetaryAmount<CurrencyExt> | null; // Amount of rewards yearly, null if rewards are not enabled.
    borrowReward: MonetaryAmount<CurrencyExt> | null; // Amount of rewards yearly, null if rewards are not enabled.
    totalLiquidity: MonetaryAmount<CurrencyExt>;
    availableCapacity: MonetaryAmount<CurrencyExt>;
    totalBorrows: MonetaryAmount<CurrencyExt>;
    liquidationThreshold: Big; // decimal
    collateralThreshold: Big; // decimal
    isActive: boolean;
    supplyCap: MonetaryAmount<CurrencyExt>;
    borrowCap: MonetaryAmount<CurrencyExt>;
    exchangeRate: ExchangeRate<Bitcoin, CurrencyExt>;
}

// Enables easier access to data by asset ticker key.
type TickerToData<T> = {
    [ticker: string]: T;
};

interface LoanMarket {
    lendTokenId: number;
}

export type {
    LoanPosition,
    LendPosition,
    BorrowPosition,
    LoanAsset,
    TickerToData,
    LoanMarket,
    LendingStats,
    LoanAction,
};
