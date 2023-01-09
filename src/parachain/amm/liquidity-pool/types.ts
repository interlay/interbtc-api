import { CurrencyExt } from "@interlay/interbtc/types";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { MultiPathElement } from "../trade/types";
import { PoolType, LPToken, PooledCurrencies } from "../types";
import { StableLiquidityPool } from "./stable";
import { StandardLiquidityPool } from "./standard";

interface TradingPair {
    type: PoolType;
    token0: CurrencyExt;
    token1: CurrencyExt;
    reserve0: MonetaryAmount<CurrencyExt>;
    reserve1: MonetaryAmount<CurrencyExt>;
    getOutputAmount: (inputAmount: MonetaryAmount<CurrencyExt>) => MonetaryAmount<CurrencyExt>;
    pathOf: (inputCurrency: CurrencyExt) => MultiPathElement;
}

interface LiquidityPoolBase {
    type: PoolType;
    lpToken: LPToken;
    pooledCurrencies: PooledCurrencies; // Array of 2 for standard pools, array of 2+ for stable pools.
    apr: string; // Percentage.
    tradingFee: Big; // Decimal.
}

type LiquidityPool = StandardLiquidityPool | StableLiquidityPool;

const isStandardPool = (pool: LiquidityPoolBase): pool is StandardLiquidityPool => pool.type === PoolType.STANDARD;
const isStablePool = (pool: LiquidityPoolBase): pool is StableLiquidityPool => pool.type === PoolType.STABLE;

export { isStablePool, isStandardPool };
export type { LiquidityPoolBase, LiquidityPool, TradingPair };
