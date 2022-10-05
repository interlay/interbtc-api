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
}

interface SupplyPosition extends LoanPosition {
    isCollateral: boolean;
    earnedInterest: MonetaryAmount<CurrencyExt>;
    earnedReward: MonetaryAmount<CurrencyExt>;
}

type BorrowPosition = LoanPosition;

interface LoanAsset {
    currency: CurrencyExt;
    supplyApy: Big;
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

export type { SupplyPosition, BorrowPosition, LoanAsset, TickerToData };