import Big from "big.js";
import { PoolType, LPToken, PooledCurrencies } from "../types";
import { LiquidityPoolBase } from "./types";

class StableLiquidityPool implements LiquidityPoolBase {
    public type = PoolType.STABLE;
    constructor(
        public lpToken: LPToken,
        public pooledCurrencies: PooledCurrencies,
        public apr: string,
        public tradingFee: Big,
        public poolId: number
    ) {}
}

export { StableLiquidityPool };
