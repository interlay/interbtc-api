import { isCurrencyEqual } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { CurrencyExt } from "../../../types";
import { MultiPath } from "./types";
import { computePriceImpact } from "./utils";

class Trade {
    public executionPrice: MonetaryAmount<CurrencyExt>;
    public priceImpact: Big; // Percentage.
    constructor(
        public path: MultiPath, // Is empty array if no path was found.
        public inputAmount: MonetaryAmount<CurrencyExt>,
        public outputAmount: MonetaryAmount<CurrencyExt>
    ) {
        const rawPrice = outputAmount.toBig().div(inputAmount.toBig());
        this.executionPrice = new MonetaryAmount(outputAmount.currency, rawPrice);
        this.priceImpact = computePriceImpact(path, inputAmount, outputAmount);
    }

    /**
     * Comparator for 2 trades with same input and output.
     *
     * @param anotherTrade Trade to compare.
     * @returns true if `this` trade is better, false if `anotherTrade` is better.
     * @throws When provided trade has different input or output currency.
     */
    public isBetter(anotherTrade: Trade | null): boolean {
        if (anotherTrade === null) {
            return true;
        }

        if (
            !this.inputAmount.eq(anotherTrade.inputAmount) ||
            !isCurrencyEqual(this.outputAmount.currency, anotherTrade.outputAmount.currency)
        ) {
            throw new Error("Trade: isBetterThan: Comparing 2 different trades is not possible.");
        }

        if (!this.outputAmount.eq(anotherTrade.outputAmount)) {
            return this.outputAmount.gt(anotherTrade.outputAmount);
        }
        return this.priceImpact.lte(anotherTrade.priceImpact);
    }

    /**
     * Get minimum output amount for trade with provided maximum allowed slippage.
     *
     * @param {number} maxSlippage Maximum slippage in percentage.
     * @returns {MonetaryAmount<CurrencyExt>} Minimum output amount of trade allowed with provided slippage.
     */
    public getMinimumOutputAmount(maxSlippage: number): MonetaryAmount<CurrencyExt> {
        const maxSlippageInDecimal = maxSlippage / 100;
        const amount = Big(1).sub(maxSlippageInDecimal).mul(this.outputAmount.toBig());
        const minimumAmountOut = new MonetaryAmount(this.outputAmount.currency, amount);

        return minimumAmountOut;
    }
}

export { Trade };
