import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { CurrencyExt } from "./currency";

interface LoanPosition {
    currency: CurrencyExt;
    amount: MonetaryAmount<CurrencyExt>;
    earnedReward: MonetaryAmount<CurrencyExt> | null; // null if rewards are not enabled.
}

interface LendPosition extends LoanPosition {
    isCollateral: boolean;
    earnedInterest: MonetaryAmount<CurrencyExt>;
}

interface BorrowPosition extends LoanPosition {
    accumulatedDebt: MonetaryAmount<CurrencyExt>;
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
}

// Enables easier access to data by asset ticker key.
type TickerToData<T> = {
    [ticker: string]: T;
};

interface LoanMarket {
    lendTokenId: number;
}

export type { LoanPosition, LendPosition, BorrowPosition, LoanAsset, TickerToData, LoanMarket };
