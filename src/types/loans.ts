import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { CurrencyExt, WrappedCurrency } from "./currency";

interface LoanPosition {
    amount: MonetaryAmount<CurrencyExt>;
}

interface CollateralPosition extends LoanPosition {
    isCollateral: boolean;
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

type AccountLiquidity = {
    liquidity: MonetaryAmount<WrappedCurrency>;
    shortfall: MonetaryAmount<WrappedCurrency>;
};

type UndercollateralizedPosition = {
    shortfall: MonetaryAmount<WrappedCurrency>;
    collateralPositions: Array<LoanPosition>,
    borrowPositions: Array<BorrowPosition>,
}

export type { LoanPosition, CollateralPosition, BorrowPosition, LoanAsset, TickerToData, LoanMarket, AccountLiquidity };
