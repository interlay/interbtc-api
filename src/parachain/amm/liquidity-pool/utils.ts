import { CurrencyExt } from "../../../types";
import { isCurrencyEqual } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import { isStablePlainMultiPathElement, MultiPathElementStable } from "../trade/types";
import { StableLiquidityPool } from "./stable";
import { isStandardPool, LiquidityPool, TradingPair } from "./types";

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
// when swapping through metapool base->lpToken
const calculateStableSwapFromBase = (
    pool: StableLiquidityPool,
    basePool: StableLiquidityPool,
    tokenIndexFrom: number,
    tokenIndexTo: number,
    amount: MonetaryAmount<CurrencyExt>
): MonetaryAmount<CurrencyExt> => {
    const baseToken = basePool.lpToken;
    const baseTokenIndex = pool.getTokenIndex(baseToken);
    const baseAmounts = basePool.pooledCurrencies.map((amount) => new MonetaryAmount(amount.currency, 0));

    baseAmounts[tokenIndexFrom] = amount;
    const baseLpAmount = basePool.calculateTokenAmount(baseAmounts, true);

    if (baseTokenIndex === tokenIndexTo) {
        return baseLpAmount;
    }

    return pool.calculateSwap(baseTokenIndex, tokenIndexTo, baseLpAmount);
};

// when swapping through metapool lpToken->base
const calculateStableSwapToBase = (
    pool: StableLiquidityPool,
    basePool: StableLiquidityPool,
    tokenIndexFrom: number,
    tokenIndexTo: number,
    amount: MonetaryAmount<CurrencyExt>
): MonetaryAmount<CurrencyExt> => {
    const baseToken = basePool.lpToken;
    const baseTokenIndex = pool.getTokenIndex(baseToken);
    let tokenLPAmount = amount;

    if (baseTokenIndex !== tokenIndexFrom) {
        tokenLPAmount = pool.calculateSwap(tokenIndexFrom, baseTokenIndex, amount);
    }

    return basePool.calculateRemoveLiquidityOneToken(tokenLPAmount, tokenIndexTo)[0];
};

const getStableSwapOutputAmount = (
    path: MultiPathElementStable,
    inputAmount: MonetaryAmount<CurrencyExt>
): MonetaryAmount<CurrencyExt> => {
    if (!isCurrencyEqual(inputAmount.currency, path.input)) {
        throw new Error("getStableSwapOutputAmount: currencies of input amount and path element are different.");
    }
    let outputAmount: MonetaryAmount<CurrencyExt>;

    if (isStablePlainMultiPathElement(path)) {
        const fromIndex = path.pool.getTokenIndex(path.input);
        const toIndex = path.pool.getTokenIndex(path.output);

        outputAmount = path.pool.calculateSwap(fromIndex, toIndex, inputAmount);
    } else if (path.fromBase) {
        const fromIndex = path.basePool.getTokenIndex(path.input);
        const toIndex = path.pool.getTokenIndex(path.output);

        outputAmount = calculateStableSwapFromBase(path.pool, path.basePool, fromIndex, toIndex, inputAmount);
    } else {
        const fromIndex = path.pool.getTokenIndex(path.input);
        const toIndex = path.basePool.getTokenIndex(path.output);

        outputAmount = calculateStableSwapToBase(path.pool, path.basePool, fromIndex, toIndex, inputAmount);
    }

    return outputAmount;
};

export { getAllTradingPairs, getStableSwapOutputAmount };
