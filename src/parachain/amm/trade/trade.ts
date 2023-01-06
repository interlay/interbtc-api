import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { CurrencyExt, isCurrencyEqual } from "../../..";
import { StableLiquidityPool } from "../liquidity-pool/stable";
import { TradingPair } from "../liquidity-pool/types";
import { computePriceImpact } from "./utils";

interface MultiPathElement {
    stable: boolean;
    input: CurrencyExt;
    output: CurrencyExt;
    pair: TradingPair;
    pool?: StableLiquidityPool;
    basePool?: StableLiquidityPool;
    fromBase?: boolean;
}

type MultiPath = Array<MultiPathElement>;

class Trade {
    public executionPrice: MonetaryAmount<CurrencyExt>;
    public priceImpact: string; // Percentage.
    constructor(
        public path: MultiPath, // Is empty array if no path was found.
        public inputAmount: MonetaryAmount<CurrencyExt>,
        public outputAmount: MonetaryAmount<CurrencyExt>
    ) {
        const rawPrice = outputAmount.toBig().div(inputAmount.toBig());
        this.executionPrice = new MonetaryAmount(outputAmount.currency, rawPrice);
        this.priceImpact = computePriceImpact(path, inputAmount, outputAmount);
    }

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

        // TODO: extend comparator in case of same output amount but different paths,
        //       prefer trade with lower price impact
        return this.outputAmount.gte(anotherTrade.outputAmount);
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
export type { MultiPath, MultiPathElement, TradingPair };
