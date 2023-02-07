import { LpCurrency, CurrencyExt } from "../../../types";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { MultiPathElement } from "../trade/types";
import { PoolType, PooledCurrencies } from "../types";
import { StableLiquidityPool } from "./stable";
import { StandardLiquidityPool } from "./standard";
import { StableLiquidityMetaPool } from "./stable-meta";

interface TradingPair {
    token0: CurrencyExt;
    token1: CurrencyExt;
    reserve0: MonetaryAmount<CurrencyExt>;
    reserve1: MonetaryAmount<CurrencyExt>;
    getOutputAmount: (inputAmount: MonetaryAmount<CurrencyExt>) => MonetaryAmount<CurrencyExt>;
    pathOf: (inputCurrency: CurrencyExt) => MultiPathElement;
}

interface LiquidityPoolBase {
    type: PoolType;
    lpToken: LpCurrency;
    pooledCurrencies: PooledCurrencies; // Array of 2 for standard pools, array of 2+ for stable pools.
    tradingFee: Big; // Decimal.
    totalSupply: MonetaryAmount<LpCurrency>; //Array of monetary amounts containing reward per 1 LP token per year.
    rewardAmountsYearly: Array<MonetaryAmount<CurrencyExt>>;
}

type LiquidityPool = StandardLiquidityPool | StableLiquidityPool | StableLiquidityMetaPool;

const isStandardPool = (pool: LiquidityPool): pool is StandardLiquidityPool => pool.type === PoolType.STANDARD;
const isStablePool = (pool: LiquidityPool): pool is StableLiquidityPool | StableLiquidityMetaPool =>
    pool.type === PoolType.STABLE_PLAIN || pool.type === PoolType.STABLE_META;
const isStableMetaPool = (pool: LiquidityPool): pool is StableLiquidityMetaPool => pool.type === PoolType.STABLE_META;

export { isStablePool, isStandardPool, isStableMetaPool };
export type { LiquidityPoolBase, LiquidityPool, TradingPair };
