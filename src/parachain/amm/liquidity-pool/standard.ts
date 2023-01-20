import { CurrencyExt, StandardLpToken } from "../../../types";
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
        public lpToken: StandardLpToken,
        public pooledCurrencies: PooledCurrencies,
        public apr: Big,
        public tradingFee: Big,
        public isTradingActive: boolean, // True if in `Trading` state, false if in `Bootstrap` state
        public totalSupply: MonetaryAmount<StandardLpToken>
    ) {
        if (pooledCurrencies.length !== 2) {
            throw new Error("Standard liquidity pool has to always consist of 2 currencies!");
        }
        this.token0 = pooledCurrencies[0].currency;
        this.token1 = pooledCurrencies[1].currency;
        this.reserve0 = pooledCurrencies[0];
        this.reserve1 = pooledCurrencies[1];
    }

    // Returns reserves of passed token and other token.
    private _getReservesByCurrency(currency: CurrencyExt): [MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>] {
        if (isCurrencyEqual(currency, this.token0)) {
            return [this.reserve0, this.reserve1];
        }
        if (isCurrencyEqual(currency, this.token1)) {
            return [this.reserve1, this.reserve0];
        }

        throw new Error(`Currency ${currency.ticker} is not part of this pool!`);
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

    /**
     * Calculates how much of other pooled currency needs to be deposited
     * into pool with `amount`.
     *
     * @param amount Amount of token0 or token1 to compute other amount for.
     * @returns Monetary amount of other currency based on current ratio of
     * currencies in pool.
     */
    public getLiquidityDepositOtherCurrencyAmount(amount: MonetaryAmount<CurrencyExt>): MonetaryAmount<CurrencyExt> {
        const [reserve, otherReserve] = this._getReservesByCurrency(amount.currency);

        const ratio = amount.toBig().div(reserve.toBig());

        return otherReserve.mul(ratio);
    }

    /**
     * Calculates expected amount of LP token account will get after depositing
     * `amount` of pooled currency into pool.
     *
     * @param amount Amount of token0 or token1 to be deposited into the pool.
     * @returns Expected amount of lp token that will be received after `amount` is added to pool.
     */
    public getExpectedLiquidityDepositAmount(amount: MonetaryAmount<CurrencyExt>): MonetaryAmount<StandardLpToken> {
        const [currencyReserveAmount] = this._getReservesByCurrency(amount.currency);
        const changeCoefficient = amount.div(currencyReserveAmount.toBig()).toBig();
        const newLpTokenAmount = this.totalSupply.mul(changeCoefficient);

        return newLpTokenAmount;
    }

    /**
     * Calculates expected amount of pooled currencies account will get
     * after withdrawing `amount` of LP token.
     *
     * @param amount Amount of liquidity in LP token to be withdrawn.
     * @returns Amount of pooled tokens to be returned to account.
     */
    public getExpectedLiquidityWithdrawalAmount(
        amount: MonetaryAmount<StandardLpToken>
    ): [MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>] {
        const changeCoefficient = amount.div(this.totalSupply.toBig()).toBig();
        const token0OutAmount = this.reserve0.mul(changeCoefficient);
        const token1OutAmount = this.reserve1.mul(changeCoefficient);

        return [token0OutAmount, token1OutAmount];
    }
}

export { StandardLiquidityPool };
