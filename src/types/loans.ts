import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { CurrencyExt } from "./currency";

interface LoanReward{
    currency: CurrencyExt;
    apy: Big; // percentage
}

interface LoanPosition {
    currency: CurrencyExt;
    amount: MonetaryAmount<CurrencyExt>;
    earnedReward: MonetaryAmount<CurrencyExt> | null; // null if rewards are not enabled.
}

interface LendPosition extends LoanPosition {
    isCollateral: boolean;
    earnedInterest: MonetaryAmount<CurrencyExt>;
}

type BorrowPosition = LoanPosition;

interface LoanAsset {
    currency: CurrencyExt;
    lendApy: Big; // percentage
    borrowApy: Big; // percentage
    lendReward: LoanReward | null; // null if rewards are not enabled.
    borrowReward: LoanReward | null; // null if rewards are not enabled.
    totalLiquidity: MonetaryAmount<CurrencyExt>;
    availableCapacity: MonetaryAmount<CurrencyExt>;
    liquidationThreshold: Big;
}

// Enables easier access to data by asset ticker key.
type TickerToData<T> = {
    [ticker: string]: T
}

export type { LoanPosition, LendPosition, BorrowPosition, LoanAsset, TickerToData };
