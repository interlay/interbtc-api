import { StableLpToken } from "../../../types";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { PooledCurrencies, PoolType } from "../types";
import { StableLiquidityPool } from "./stable";

class StableLiquidityMetaPool extends StableLiquidityPool {
    constructor(
        lpToken: StableLpToken,
        metaPooledCurrencies: PooledCurrencies,
        pooledCurrencies: PooledCurrencies,
        apr: Big,
        tradingFee: Big,
        poolId: number,
        amplificationCoefficient: Big,
        totalSupply: MonetaryAmount<StableLpToken>,
        public basePool: StableLiquidityPool // Contains base pool object.
    ) {
        super(
            PoolType.STABLE_META,
            lpToken,
            metaPooledCurrencies,
            pooledCurrencies,
            apr,
            tradingFee,
            poolId,
            amplificationCoefficient,
            totalSupply
        );
    }
}

export { StableLiquidityMetaPool };
