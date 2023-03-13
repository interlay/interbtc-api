import { CurrencyExt } from "../../../types";
import { isCurrencyEqual, newMonetaryAmount } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { getStableSwapOutputAmount } from "../liquidity-pool/utils";
import { isStableMultiPathElement, MultiPath, MultiPathElementStable } from "./types";

// SOURCE: Based on curvefi/curve-js middle price calculation method.
// https://github.com/curvefi/curve-js/blob/master/src/router.ts#L573
// @note Will always return 0% price impact for all amounts lower than 0.001
//       in the same way as curve-js implementation.
const computeStablePoolMiddlePrice = (
    currentInputAmount: MonetaryAmount<CurrencyExt>,
    pathElement: MultiPathElementStable
): [Big, MonetaryAmount<CurrencyExt>] => {
    const _getSmallAmountPrice = (amount: MonetaryAmount<CurrencyExt>) => {
        const decimalsToUse = amount.currency.decimals > 5 ? amount.currency.decimals - 3 : amount.currency.decimals;
        const smallAmount = Big(10).pow(decimalsToUse);
        const smallMonetaryAmount = newMonetaryAmount(smallAmount, amount.currency, false);
        if (smallMonetaryAmount.lte(amount)) {
            return smallMonetaryAmount;
        }
        return amount;
    };

    const smallInputAmount = _getSmallAmountPrice(currentInputAmount);
    const smallToCurrentRatio = currentInputAmount.div(smallInputAmount.toBig()).toBig();
    const smallOutputAmount = getStableSwapOutputAmount(pathElement, smallInputAmount);
    const smallPrice = smallOutputAmount.toBig().div(smallInputAmount.toBig());
    const outputAmount = smallOutputAmount.mul(smallToCurrentRatio);

    return [smallPrice, outputAmount];
};

// TODO: improve, simplify, verify computation
// SOURCE: @zenlink-dex/sdk-core
const computeMiddlePrice = (path: MultiPath, inputAmount: MonetaryAmount<CurrencyExt>): Big => {
    const prices: Big[] = [];
    const currencyPath = [inputAmount.currency, ...path.map((pathElement) => pathElement.output)];

    let currentInputAmount = inputAmount;
    for (const [i, pathElement] of path.entries()) {
        let currentPrice: Big;
        if (isStableMultiPathElement(pathElement)) {
            [currentPrice, currentInputAmount] = computeStablePoolMiddlePrice(currentInputAmount, pathElement);
        } else {
            const pair = pathElement.pair;
            const tradingFeeComplement = Big(1).sub(pathElement.pool.tradingFee);
            if (isCurrencyEqual(currencyPath[i], pair.token0)) {
                currentPrice = pair.reserve1.toBig().div(pair.reserve0.toBig()).mul(tradingFeeComplement);
                currentInputAmount = new MonetaryAmount(pair.token1, currentInputAmount.mul(currentPrice).toBig());
            } else {
                currentPrice = pair.reserve0.toBig().div(pair.reserve1.toBig()).mul(tradingFeeComplement);
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
): Big => {
    const middlePrice = computeMiddlePrice(path, inputAmount);
    const exactQuote = middlePrice.mul(inputAmount.toBig());
    // calculate priceImpact := (exactQuote - outputAmount) / exactQuote
    const priceImpact = exactQuote.sub(outputAmount.toBig()).div(exactQuote);
    // Return percentage.
    return priceImpact.mul(100);
};

export { computePriceImpact };
