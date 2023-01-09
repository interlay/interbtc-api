import { CurrencyExt } from "@interlay/interbtc/types";
import { MonetaryAmount } from "@interlay/monetary-js";
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
    // TODO
    public getTokenIndex(currency: CurrencyExt): number {
        //TODO
        throw new Error("Method not implemented.");
    }

    // TODO: rename to something like `calculateLiquidityDeposit`
    public calculateTokenAmount(
        amounts: Array<MonetaryAmount<CurrencyExt>>,
        deposit: boolean
    ): MonetaryAmount<CurrencyExt> {
        //TODO
        throw new Error("Method not implemented.");
    }

    public calculateRemoveLiquidityOneToken(
        tokenLPAmount: MonetaryAmount<LPToken>,
        outputCurrencyIndex: number
    ): [MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>] {
        //TODO
        throw new Error("Method not implemented.");
    }

    public calculateSwap(
        inputIndex: number,
        outputIndex: number,
        inputAmount: MonetaryAmount<CurrencyExt>
    ): MonetaryAmount<CurrencyExt> {
        // TODO
        throw new Error("Method not implemented.");
    }
}

export { StableLiquidityPool };
