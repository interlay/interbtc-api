import { TradingPair } from "../trade/trade";
import { StableLiquidityPool } from "./stable";
import { isStandardPool, LiquidityPool } from "./types";

const convertStablePoolToTradingPairs = (pool: StableLiquidityPool): Array<TradingPair> => {
    // TODO
    return [];
};

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

export { getAllTradingPairs };
