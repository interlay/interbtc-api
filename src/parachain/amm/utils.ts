import { MonetaryAmount } from "@interlay/monetary-js";
import { CurrencyExt, isCurrencyEqual } from "../..";
import { TradingPair } from "./liquidity-pool/types";
import { Trade } from "./trade/trade";
import { MultiPath } from "./trade/types";

/**
 * Recursive function to find best trade path for provided trading pairs,
 * input amount, output currencies and limited amount of hops between
 * pools.
 *
 * @param {MonetaryAmount<CurrencyExt>} inputAmount Input currency amount to be exchanged.
 * @param {CurrencyExt} outputCurrency Output currency to be received.
 * @param {Array<TradingPair>} pairs Array of all trading pairs to include in search.
 * @param {number} hopLimit Maximum number of hops between liquidity pools.
 * @param {MultiPath} path Recursively generated parameter containing current trading path.
 * @param {MonetaryAmount<CurrencyExt>} initialInputAmount Initial input amount.
 * @returns
 */
const findBestTradeRecursively = (
    inputAmount: MonetaryAmount<CurrencyExt>,
    outputCurrency: CurrencyExt,
    pairs: Array<TradingPair>,
    hopLimit: number,
    path: MultiPath = [],
    initialInputAmount = inputAmount
): Trade | null => {
    if (hopLimit <= 0) {
        return null;
    }
    const inputCurrency = inputAmount.currency;
    let bestTrade: Trade | null = null;

    for (const pair of pairs) {
        if (isCurrencyEqual(inputCurrency, pair.token0) || isCurrencyEqual(inputCurrency, pair.token1)) {
            // Skip iteration if input currency is not part of current pair.
            continue;
        }
        const outputAmount = pair.getOutputAmount(inputAmount);
        if (outputAmount.isZero()) {
            // Skip iteration of output amount is zero.
            continue;
        }

        const currentPath = [...path, pair.pathOf(inputCurrency)];
        // Complete path is found
        if (isCurrencyEqual(outputCurrency, outputAmount.currency)) {
            const trade = new Trade(currentPath, initialInputAmount, outputAmount);
            if (trade.isBetter(bestTrade)) {
                bestTrade = trade;
            }
        } else {
            // Recursively check starting from current pair with decreased hop amount.
            const trade = findBestTradeRecursively(
                outputAmount,
                outputCurrency,
                pairs,
                hopLimit - 1,
                currentPath,
                initialInputAmount
            );
            if (trade !== null && trade.isBetter(bestTrade)) {
                bestTrade = trade;
            }
        }
    }

    return bestTrade;
};

export { findBestTradeRecursively };
