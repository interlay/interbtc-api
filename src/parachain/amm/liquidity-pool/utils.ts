import { CurrencyExt, StableLPToken } from "../../../types";
import { isCurrencyEqual } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import {
    isStablePlainMultiPathElement,
    MultiPathElementStable,
    MultiPathElementStableMeta,
    MultiPathElementStablePlain,
    MultiPathElementType,
} from "../trade/types";
import { StableLiquidityPool } from "./stable";
import { isStablePool, isStandardPool, LiquidityPool, TradingPair } from "./types";

/**
 * Get all trading pairs based on provided pools.
 *
 * @param pools All standard and stable pools.
 * @returns {Array<TradingPair>} All trading pairs.
 */
const getAllTradingPairs = (pools: Array<LiquidityPool>): Array<TradingPair> => {
    const stablePools = pools.filter(isStablePool);
    const pairs: Array<TradingPair> = [];

    pools.forEach((pool) => {
        if (isStandardPool(pool)) {
            // Exclude pool in Bootstrap status
            if (pool.isTradingActive) {
                pairs.push(pool);
            }
        } else {
            const stablePairs = convertStablePoolToTradingPairs(pool, stablePools);
            pairs.push(...stablePairs);
        }
    });

    return pairs;
};

function generateOutputFunction<Path extends MultiPathElementStable>(pathOf: (currency: CurrencyExt) => Path) {
    return (inputAmount: MonetaryAmount<CurrencyExt>): MonetaryAmount<CurrencyExt> =>
        getStableSwapOutputAmount(pathOf(inputAmount.currency), inputAmount);
}

function convertPoolToTradingPair(pool: StableLiquidityPool, token0: CurrencyExt, token1: CurrencyExt): TradingPair {
    if (!(pool.involvesToken(token0) && pool.involvesToken(token1))) {
        throw new Error("converPoolToTradingPair: provided currencies are not part of pool.");
    }

    const pathOf = (currency: CurrencyExt): MultiPathElementStablePlain => ({
        type: MultiPathElementType.STABLE_PLAIN,
        input: currency,
        output: isCurrencyEqual(currency, token0) ? token1 : token0,
        pool: pool,
    });

    return {
        token0,
        token1,
        reserve0: pool.pooledCurrencies[pool.getTokenIndex(token0)],
        reserve1: pool.pooledCurrencies[pool.getTokenIndex(token1)],
        getOutputAmount: generateOutputFunction(pathOf),
        pathOf,
    };
}

function convertPoolAndBaseToTradingPair(
    basePool: StableLiquidityPool,
    pool: StableLiquidityPool,
    token0: CurrencyExt,
    token1: CurrencyExt
): TradingPair {
    if (!(basePool.involvesToken(token0) && pool.involvesToken(token1))) {
        throw new Error("converPoolAndBaseToTradingPair: incorrect tokens provided");
    }

    const pathOf = (currency: CurrencyExt): MultiPathElementStableMeta => ({
        type: MultiPathElementType.STABLE_META,
        input: currency,
        output: isCurrencyEqual(currency, token0) ? token1 : token0,
        pool: pool,
        basePool: basePool,
        fromBase: !!isCurrencyEqual(currency, token0),
    });

    return {
        token0,
        token1,
        reserve0: basePool.pooledCurrencies[basePool.getTokenIndex(token0)],
        reserve1: pool.pooledCurrencies[pool.getTokenIndex(token1)],
        getOutputAmount: generateOutputFunction(pathOf),
        pathOf,
    };
}

const convertStablePoolToTradingPairs = (
    pool: StableLiquidityPool,
    stablePools: Array<StableLiquidityPool>
): Array<TradingPair> => {
    const pairs: Array<TradingPair> = [];
    const relatedPools = stablePools.filter((otherPool) => otherPool.involvesToken(pool.lpToken));

    for (let j = 0; j < pool.pooledCurrencies.length; j++) {
        for (let k = j + 1; k < pool.pooledCurrencies.length; k++) {
            const token0 = pool.pooledCurrencies[j].currency;
            const token1 = pool.pooledCurrencies[k].currency;

            pairs.push(convertPoolToTradingPair(pool, token0, token1));
        }

        if (!relatedPools.length) continue;

        for (const otherPool of relatedPools) {
            for (const { currency } of otherPool.pooledCurrencies) {
                if (isCurrencyEqual(currency, pool.lpToken)) continue;

                const token0 = pool.pooledCurrencies[j].currency;
                const token1 = currency;

                pairs.push(convertPoolAndBaseToTradingPair(pool, otherPool, token0, token1));
            }
        }
    }

    return pairs;
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
    amount: MonetaryAmount<StableLPToken>
): MonetaryAmount<CurrencyExt> => {
    const baseToken = basePool.lpToken;
    const baseTokenIndex = pool.getTokenIndex(baseToken);
    let tokenLPAmount = amount;

    if (baseTokenIndex !== tokenIndexFrom) {
        tokenLPAmount = pool.calculateSwap(tokenIndexFrom, baseTokenIndex, amount) as MonetaryAmount<StableLPToken>;
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

        outputAmount = calculateStableSwapToBase(
            path.pool,
            path.basePool,
            fromIndex,
            toIndex,
            inputAmount as MonetaryAmount<StableLPToken>
        );
    }

    return outputAmount;
};

export { getAllTradingPairs, getStableSwapOutputAmount };
