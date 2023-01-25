import { CurrencyExt } from "../../../types";
import { isCurrencyEqual } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { getStableSwapOutputAmount } from "../liquidity-pool/utils";
import { isStableMultiPathElement, MultiPath } from "./types";

// TODO: improve, simplify, verify computation
// SOURCE: @zenlink-dex/sdk-core
const computeMiddlePrice = (path: MultiPath, inputAmount: MonetaryAmount<CurrencyExt>): Big => {
    const prices: Big[] = [];
    const currencyPath = [inputAmount.currency, ...path.map((pathElement) => pathElement.output)];

    let currentInputAmount = inputAmount;
    for (const [i, pathElement] of path.entries()) {
        let currentPrice: Big;
        if (isStableMultiPathElement(pathElement)) {
            // TODO: Is this a correct way to compute middle price for curve pool?
            //       Won't this always show 0% price impact for curve-pool only trades?
            const outputAmount = getStableSwapOutputAmount(pathElement, currentInputAmount);
            currentPrice = outputAmount.toBig().div(currentInputAmount.toBig());
            currentInputAmount = outputAmount;
        } else {
            const pair = pathElement.pair;
            if (isCurrencyEqual(currencyPath[i], pair.token0)) {
                currentPrice = pair.reserve1.toBig().div(pair.reserve0.toBig());
                currentInputAmount = new MonetaryAmount(pair.token1, currentInputAmount.mul(currentPrice).toBig());
            } else {
                currentPrice = pair.reserve0.toBig().div(pair.reserve1.toBig());
                currentInputAmount = new MonetaryAmount(pair.token0, currentInputAmount.mul(currentPrice).toBig());
            }
        }

        prices.push(currentPrice);
    }

    return prices.slice(1).reduce((accumulator, currentValue) => accumulator.mul(currentValue), prices[0]);
};

const computePriceImpact = (
    path: MultiPath,
    inputAmount: MonetaryAmount<CurrencyExt>,
    outputAmount: MonetaryAmount<CurrencyExt>
): string => {
    const middlePrice = computeMiddlePrice(path, inputAmount);
    const exactQuote = middlePrice.mul(inputAmount.toBig());
    // calculate priceImpact := (exactQuote - outputAmount) / exactQuote
    const priceImpact = exactQuote.sub(outputAmount.toBig()).div(exactQuote);
    // Return percentage.
    return priceImpact.mul(100).toString();
};

export { computePriceImpact };
