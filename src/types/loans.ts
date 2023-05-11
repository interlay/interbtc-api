import { Bitcoin, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
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

/**
 * The liquidity status of an account, based on the value of its collateral and loans.
 * * `liquidity` is `max(totalCollateralValueAsWrapped - totalBorrowedValueAsWrapped, 0)`, where each
 * item in the `totalCollateralValueAsWrapped` sum is first scaled down by the collateralization
 * required by that market (e.g `100 satoshi * 0.75 + 150 satoshi * 0.8`, where `0.75` and `0.8`
 * are the collateralization thresholds).
 * * `shortfall` is very similar to liquidity: `max(totalBorrowedValueAsWrapped - totalCollateralValueAsWrapped, 0)`
 * so it is only positive when the total borrowed amount exceeds what the collateral can cover.
 */
type AccountLiquidity = {
    liquidity: MonetaryAmount<WrappedCurrency>;
    shortfall: MonetaryAmount<WrappedCurrency>;
};

type UndercollateralizedPosition = {
    accountId: AccountId;
    shortfall: MonetaryAmount<WrappedCurrency>;
    collateralPositions: Array<CollateralPosition>;
    borrowPositions: Array<BorrowPosition>;
};

interface AccruedRewards {
    total: MonetaryAmount<CurrencyExt>;
    perMarket: TickerToData<{
        lend: MonetaryAmount<CurrencyExt> | null;
        borrow: MonetaryAmount<CurrencyExt> | null;
    }>;
}

export type {
    AccruedRewards,
    LoanPosition,
    CollateralPosition,
    BorrowPosition,
    LoanAsset,
    TickerToData,
    LoanMarket,
    LendingStats,
    LoanAction,
    AccountLiquidity,
    UndercollateralizedPosition,
};
