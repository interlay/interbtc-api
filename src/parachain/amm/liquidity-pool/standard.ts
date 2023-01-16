import { CurrencyExt, StandardLPToken } from "../../../types";
import { isCurrencyEqual } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { MultiPathElementStandard, MultiPathElementType } from "../trade/types";
import { PoolType, PooledCurrencies } from "../types";
import { LiquidityPoolBase, TradingPair } from "./types";

class StandardLiquidityPool implements LiquidityPoolBase, TradingPair {
    public type = PoolType.STANDARD;
    public token0: CurrencyExt;
    public token1: CurrencyExt;
    public reserve0: MonetaryAmount<CurrencyExt>;
    public reserve1: MonetaryAmount<CurrencyExt>;
    constructor(
        public lpToken: StandardLPToken,
        public pooledCurrencies: PooledCurrencies,
        public apr: string,
        public tradingFee: Big,
        public isTradingActive: boolean // True if in `Trading` state, false if in `Bootstrap` state
    ) {
        if (pooledCurrencies.length !== 2) {
            throw new Error("Standard liquidity pool has to always consist of 2 currencies!");
        }
        this.token0 = pooledCurrencies[0].currency;
        this.token1 = pooledCurrencies[1].currency;
        this.reserve0 = pooledCurrencies[0];
        this.reserve1 = pooledCurrencies[1];
    }

    public pathOf(inputCurrency: CurrencyExt): MultiPathElementStandard {
        return {
            type: MultiPathElementType.STANDARD,
            input: inputCurrency,
            output: isCurrencyEqual(inputCurrency, this.token0) ? this.token1 : this.token0,
            pair: this,
        };
    }

    /**
     * Get output amount of pool after swap of `inputAmount` is made.
     *
     * @param {MonetaryAmount<CurrencyExt>} inputAmount Input amount of currency to swap.
     * @returns {MonetaryAmount<CurrencyExt>} Output amount after swap of `inputAmount` is made.
     */
    public getOutputAmount(inputAmount: MonetaryAmount<CurrencyExt>): MonetaryAmount<CurrencyExt> {
        let inputReserve: MonetaryAmount<CurrencyExt>;
        let outputReserve: MonetaryAmount<CurrencyExt>;
        let outputCurrency: CurrencyExt;

        if (isCurrencyEqual(inputAmount.currency, this.token0)) {
            [inputReserve, outputReserve, outputCurrency] = [this.reserve0, this.reserve1, this.token1];
        } else if (isCurrencyEqual(inputAmount.currency, this.token1)) {
            [inputReserve, outputReserve, outputCurrency] = [this.reserve1, this.reserve0, this.token0];
        } else {
            throw new Error(
                `StandardLiquidityPool: getOutputAmount: input currency ${inputAmount.currency.name} is not part of the pool.`
            );
        }

        if (this.reserve0.isZero() || this.reserve1.isZero()) {
            return new MonetaryAmount(outputCurrency, 0);
        }

        const inputAmountAfterTradingFee = inputAmount.toBig().mul(Big(1).sub(this.tradingFee));
        const numerator = inputAmountAfterTradingFee.mul(outputReserve.toBig());
        const denominator = inputReserve.toBig().add(inputAmountAfterTradingFee);
        const outputAmount = numerator.div(denominator);

        return new MonetaryAmount(outputCurrency, outputAmount);
    }
}

export { StandardLiquidityPool };
