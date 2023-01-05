import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { AccountId } from "@polkadot/types/interfaces";
import Big from "big.js";
import { CurrencyExt } from "../types";
import { isCurrencyEqual } from "../utils";

// TODO: move type definitions to separate file later

enum PoolType {
    STANDARD = "STANDARD",
    STABLE = "STABLE",
}

type LPToken = CurrencyExt; // TODO: specify when the currencies are refactored to have LP token type

type PooledCurrencies = Array<MonetaryAmount<CurrencyExt>>;

interface LiquidityPoolBase {
    type: PoolType;
    lpToken: LPToken;
    pooledCurrencies: PooledCurrencies; // Array of 2 for standard pools, array of 2+ for stable pools.
    apr: string; // Percentage.
    tradingFee: string; // Percentage.
}

interface TradingPair {
    type: PoolType;
    token0: CurrencyExt;
    token1: CurrencyExt;
    reserve0: MonetaryAmount<CurrencyExt>;
    reserve1: MonetaryAmount<CurrencyExt>;
    // NOTE: do not throw here, rather return 0
    getOutputAmount: (inputAmount: MonetaryAmount<CurrencyExt>) => [MonetaryAmount<CurrencyExt>, LiquidityPool];
    pathOf: (inputCurrency: CurrencyExt) => MultiPathElement;
}

export interface MultiPathElement {
    stable: boolean;
    input: CurrencyExt;
    output: CurrencyExt;
    pair: TradingPair;
    pool?: StableLiquidityPool;
    basePool?: StableLiquidityPool;
    fromBase?: boolean;
}

type MultiPath = Array<MultiPathElement>;

class StandardLiquidityPool implements LiquidityPoolBase, TradingPair {
    public type = PoolType.STANDARD;
    public token0: CurrencyExt;
    public token1: CurrencyExt;
    public reserve0: MonetaryAmount<CurrencyExt>;
    public reserve1: MonetaryAmount<CurrencyExt>;
    constructor(
        public lpToken: LPToken,
        public pooledCurrencies: PooledCurrencies,
        public apr: string,
        public tradingFee: string
    ) {
        if (pooledCurrencies.length !== 2) {
            throw new Error("Standard liquidity pool has to always consist of 2 currencies!");
        }
        this.token0 = pooledCurrencies[0].currency;
        this.token1 = pooledCurrencies[1].currency;
        this.reserve0 = pooledCurrencies[0];
        this.reserve1 = pooledCurrencies[1];
    }

    public pathOf(inputCurrency: CurrencyExt): MultiPathElement {
        return {
            stable: false,
            input: inputCurrency,
            output: isCurrencyEqual(inputCurrency, this.token0) ? this.token1 : this.token0,
            pair: this,
        };
    }

    public getOutputAmount(
        inputAmount: MonetaryAmount<CurrencyExt>
    ): [MonetaryAmount<CurrencyExt>, StandardLiquidityPool] {
        // TODO
        return [] as any;
    }
}

class StableLiquidityPool implements LiquidityPoolBase {
    public type = PoolType.STABLE;
    constructor(
        public lpToken: LPToken,
        public pooledCurrencies: PooledCurrencies,
        public apr: string,
        public tradingFee: string,
        public poolId: number
    ) {}
}

type LiquidityPool = StandardLiquidityPool | StableLiquidityPool;

// TODO: improve, simplify, verify computation
const computeMiddlePrice = (path: MultiPath, inputAmount: MonetaryAmount<CurrencyExt>): Big => {
    const prices: Big[] = [];
    const currencyPath = [inputAmount.currency, ...path.map((pathElement) => pathElement.output)];

    let currentInputAmount = inputAmount;
    for (const [i, pathElement] of path.entries()) {
        let currentPrice: Big;
        if (pathElement.stable) {
            // TODO: how to compute middle price for curve pools?
            //
            // const outputAmount = getStableSwapOutputAmount(pathElement, currentInputAmount);
            // currentPrice = new Price(
            //     pathElement.input,
            //     pathElement.output,
            //     JSBI.multiply(ONE, currentInputAmount.decimalScale),
            //     JSBI.multiply(ONE, outputAmount.decimalScale)
            // );
            // currentInputAmount = outputAmount;
        } else {
            const pair = pathElement.pair;
            if (isCurrencyEqual(currencyPath[i], pair.token0)) {
                // TODO: can we put this into 1 monetary amount variable and use only that ??
                currentPrice = pair.reserve1.toBig().div(pair.reserve0.toBig());
                currentInputAmount = new MonetaryAmount(pair.token1, currentInputAmount.mul(currentPrice).toBig());
            } else {
                currentPrice = pair.reserve0.toBig().div(pair.reserve1.toBig());
                currentInputAmount = new MonetaryAmount(pair.token0, currentInputAmount.mul(currentPrice).toBig());
            }
        }

        prices.push(currentPrice);
    }

    return prices.slice(1).reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0]);
};

const computePriceImpact = (
    path: MultiPath,
    inputAmount: MonetaryAmount<CurrencyExt>,
    outputAmount: MonetaryAmount<CurrencyExt>
): string => {
    const midPrice = computeMiddlePrice(path, inputAmount);
    const exactQuote = midPrice.mul(inputAmount.toBig());
    // calculate priceImpact := (exactQuote - outputAmount) / exactQuote
    const priceImpact = exactQuote.sub(outputAmount.toBig()).div(exactQuote);
    // Return percentage.
    return priceImpact.mul(100).toString();
};

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

const isStandardPool = (pool: LiquidityPoolBase): pool is StandardLiquidityPool => pool.type === PoolType.STANDARD;
const isStablePool = (pool: LiquidityPoolBase): pool is StableLiquidityPool => pool.type === PoolType.STABLE;

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

const HOP_LIMIT = 4; // TODO: add as parameter?

const findBestTradeRecursively = (
    inputAmount: MonetaryAmount<CurrencyExt>,
    outputCurrency: CurrencyExt,
    pairs: Array<TradingPair>,
    hopLimit: number,
    path: MultiPath,
    originalInputAmount = inputAmount
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
        const [outputAmount] = pair.getOutputAmount(inputAmount);
        const currentPath = [...path, pair.pathOf(inputCurrency)];

        // Complete path is found
        if (isCurrencyEqual(outputCurrency, outputAmount.currency)) {
            const trade = new Trade(currentPath, originalInputAmount, outputAmount);
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
                originalInputAmount
            );
            if (trade !== null && trade.isBetter(bestTrade)) {
                bestTrade = trade;
            }
        }
    }

    return bestTrade;
};

export interface AMMAPI {
    /**
     * Get optimal trade for provided trade type and amount.
     *
     * @param {MonetaryAmount<CurrencyExt>} inputAmount Amount to be exchanged.
     * @param {CurrencyExt} outputCurrency Currency to purchase.
     * @param {Array<LiquidityPool>} pools Array of all liquidity pools.
     * @returns {Trade | null} Optimal trade information or null if the trade is not possible.
     */
    getOptimalTrade(
        inputAmount: MonetaryAmount<CurrencyExt>,
        outputCurrency: CurrencyExt,
        pools: Array<LiquidityPool>
    ): Trade | null;

    /**
     * Get expected amounts and slippage for deposit of liquidity to pool.
     *
     * @param {PooledCurrencies} pooledCurrencies Currencies to deposit into pool.
     * @param {PoolType} poolType Pool type.
     * @param customCurrenciesProportion Optional parameter to specify custom proportion of currencies to withdraw.
     */
    getExpectedLiquidityDepositAmounts(
        pooledCurrencies: PooledCurrencies,
        poolType: PoolType,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<{
        minLPTokens: MonetaryAmount<LPToken>;
        slippage: number; // can be negative for slippage bonus
    }>;

    /**
     * Get expected amounts and slippage for withdrawal of liquidity from pool.
     *
     * @param amount Amount of LP token to withdraw.
     * @param customCurrenciesProportion Optional parameter to specify custom proportion of currencies to withdraw.
     */
    getExpectedLiquidityWithdrawalAmounts(
        amount: MonetaryAmount<LPToken>,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<{
        expectedPooledCurrencyAmounts: MonetaryAmount<CurrencyExt>;
        slippage: number; // can be negative for slippage bonus
    }>;

    /**
     * Get liquidity provided by account.
     *
     * @param {AccountId} accountId Account to get provided liquidity information about.
     * @returns {Promise<Array<MonetaryAmount<LPToken>>>} Array of LP token amounts that represent
     *          account's positions in respective liquidity pools.
     */
    getLiquidityProvidedByAccount(accountId: AccountId): Promise<Array<MonetaryAmount<LPToken>>>;

    /**
     * Get all liquidity pools.
     *
     * @returns {Promise<Array<LiquidityPoolBase>>} All liquidity pools.
     */
    getLiquidityPools(): Promise<Array<LiquidityPoolBase>>;

    /**
     * Swap assets.
     *
     * @param {Trade} trade Trade object containing information about the trade.
     * @param {MonetaryAmount<CurrencyExt>} minimumAmountOut Minimum output amount to be received.
     * @param {AddressOrPair} recipient Recipient address.
     * @param {number | string} deadline Deadline block for the swap transaction.
     */
    swap(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): Promise<void>;

    /**
     * Adds liquidity to liquidity pool
     *
     * @param {PooledCurrencies} amounts Array of monetary amounts of pooled tokens.
     * @param {LiquidityPool} pool Type of liquidity pool.
     */
    addLiquidity(amounts: PooledCurrencies, pool: LiquidityPool): Promise<void>;

    /**
     * Removes liquidity from pool.
     *
     * @param {MonetaryAmount<LPToken>} amount Amount of LP token to be removed
     * @param customCurrenciesProportion Optional parameter that allows to specify proportion
     *        of pooled currencies in which the liquidity should be withdrawn.
     * @note Removes `amount` of liquidity in LP token, breaks it down and transfers to account.
     */
    removeLiquidity(amount: MonetaryAmount<LPToken>, customCurrenciesProportion?: PooledCurrencies): Promise<void>;
}

export class DefaultAMMAPI implements AMMAPI {
    constructor(private api: ApiPromise) {}

    getOptimalTrade(
        inputAmount: MonetaryAmount<CurrencyExt>,
        outputCurrency: CurrencyExt,
        pools: Array<LiquidityPool>
    ): Trade | null {
        const pairs = getAllTradingPairs(pools);

        if (pairs.length === 0 || inputAmount.isZero()) {
            return null;
        }

        return findBestTradeRecursively(inputAmount, outputCurrency, pairs, HOP_LIMIT, []);
    }

    getExpectedLiquidityDepositAmounts(
        pooledCurrencies: PooledCurrencies,
        poolType: PoolType,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<{
        minLPTokens: MonetaryAmount<CurrencyExt>;
        slippage: number; // can be negative for slippage bonus
    }> {
        throw new Error("Method not implemented.");
    }
    getExpectedLiquidityWithdrawalAmounts(
        amount: MonetaryAmount<CurrencyExt>,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<{
        expectedPooledCurrencyAmounts: MonetaryAmount<CurrencyExt>;
        slippage: number; // can be negative for slippage bonus
    }> {
        throw new Error("Method not implemented.");
    }
    getLiquidityProvidedByAccount(accountId: AccountId): Promise<MonetaryAmount<CurrencyExt>[]> {
        throw new Error("Method not implemented.");
    }
    getLiquidityPools(): Promise<Array<LiquidityPoolBase>> {
        throw new Error("Method not implemented.");
    }
    swap(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): Promise<void> {
        return new Promise(function () {
            //
        });
    }
    addLiquidity(amounts: PooledCurrencies, pool: LiquidityPool): Promise<void> {
        return new Promise(function () {
            //
        });
    }
    removeLiquidity(amount: MonetaryAmount<LPToken>, customCurrenciesProportion?: PooledCurrencies): Promise<void> {
        return new Promise(function () {
            //
        });
    }
}
