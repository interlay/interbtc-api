import { CurrencyExt } from "@interlay/interbtc/types";
import { MonetaryAmount } from "@interlay/monetary-js";
import { MultiPathElement, TradingPair } from "../trade/trade";
import { StableLiquidityPool } from "./stable";
import { isStandardPool, LiquidityPool } from "./types";

/**
 * Get all trading pairs based on provided pools.
 *
 * @param pools All standard and stable pools.
 * @returns {Array<TradingPair>} All trading pairs.
 */
const getAllTradingPairs = (pools: Array<LiquidityPool>): Array<TradingPair> => {
    const pairs: Array<TradingPair> = [];
    pools.forEach((pool) => {
        if (isStandardPool(pool)) {
            pairs.push(pool);
        } else {
            const stablePairs = convertStablePoolToTradingPairs(pool);
            pairs.push(...stablePairs);
        }
    });

    return pairs;
};

const convertStablePoolToTradingPairs = (pool: StableLiquidityPool): Array<TradingPair> => {
    // TODO
    return [];
};

// SOURCE: @zenlink-dex/sdk
const getStableSwapOutputAmount = (
    path: MultiPathElement,
    inputAmount: MonetaryAmount<CurrencyExt>
): MonetaryAmount<CurrencyExt> => {
    // TODO
    return new MonetaryAmount(inputAmount.currency, 0);
};

export { getAllTradingPairs, getStableSwapOutputAmount };
