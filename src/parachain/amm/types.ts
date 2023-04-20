import { MonetaryAmount } from "@interlay/monetary-js";
import { CurrencyExt } from "../../types";

import { LpCurrency } from "@interlay/interbtc-api/types";

import Big from "big.js";

interface LiquidityPoolBase {
    type: PoolType;
    lpToken: LpCurrency;
    pooledCurrencies: PooledCurrencies; // Array of 2 for standard pools, array of 2+ for stable pools.
    tradingFee: Big; // Decimal.
    totalSupply: MonetaryAmount<LpCurrency>;
    rewardAmountsYearly: Array<MonetaryAmount<CurrencyExt>>; // Array of monetary amounts containing reward per pool yearly.
    isEmpty: boolean;
}

enum PoolType {
    STANDARD = "STANDARD",
    STABLE_PLAIN = "STABLE_PLAIN",
    STABLE_META = "STABLE_META",
}

type PooledCurrencies = Array<MonetaryAmount<CurrencyExt>>;

export { PoolType };
export type { PooledCurrencies, LiquidityPoolBase };
