import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { CurrencyExt } from "./currency";

interface LoanReward{
    currency: CurrencyExt;
    apy: Big;
}

interface LoanPosition {
    currency: CurrencyExt;
    amount: MonetaryAmount<CurrencyExt>;
    earnedReward: MonetaryAmount<CurrencyExt>;
}

interface LendPosition extends LoanPosition {
    isCollateral: boolean;
    earnedInterest: MonetaryAmount<CurrencyExt>;
}

type BorrowPosition = LoanPosition;

interface LoanAsset {
    currency: CurrencyExt;
    lendApy: Big;
    borrowApy: Big;
    reward: LoanReward | null;
    totalLiquidity: MonetaryAmount<CurrencyExt>;
    availableCapacity: MonetaryAmount<CurrencyExt>;
    liquidationThreshold: Big;
}

// Enables easier access to data by asset ticker key.
type TickerToData<T> = {
    [ticker: string]: T
}

export type { LendPosition, BorrowPosition, LoanAsset, TickerToData };