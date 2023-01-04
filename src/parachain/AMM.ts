import { BitcoinAmount, MonetaryAmount } from "@interlay/monetary-js";
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

// TODO: remove this class
export class MultiRoute {
    public readonly inputCurrency: CurrencyExt;
    public readonly inputAmount: MonetaryAmount<CurrencyExt>;
    public readonly outputCurrency: CurrencyExt;
    public readonly routePath: MultiPathElement[];
    public readonly currencyPath: CurrencyExt[];

    // TODO: needed for price impact computation
    // public get midPrice(): Price {
    //     const prices: Price[] = [];
    //     let currentAmount = this.inputAmount;

    //     for (const [i, path] of this.routePath.entries()) {
    //         let price: Price;

    //         if (path.stable) {
    //             // TODO
    //             //   const outputAmount = getStableSwapOutputAmount(path, currentAmount);
    //             //   price = new Price(
    //             //     path.input,
    //             //     path.output,
    //             //     JSBI.multiply(ONE, currentAmount.decimalScale),
    //             //     JSBI.multiply(ONE, outputAmount.decimalScale)
    //             //   );
    //             //   currentAmount = outputAmount;
    //         } else {
    //             const pair = path.pair;

    //             price = this.currencyPath[i].equals(pair.token0)
    //                 ? new Price(pair.reserve0.token, pair.reserve1.token, pair.reserve0.raw, pair.reserve1.raw)
    //                 : new Price(pair.reserve1.token, pair.reserve0.token, pair.reserve1.raw, pair.reserve0.raw);
    //             currentAmount = this.currencyPath[i].equals(pair.token0)
    //                 ? new TokenAmount(pair.token1, currentAmount.multiply(price).raw)
    //                 : new TokenAmount(pair.token0, currentAmount.multiply(price).raw);
    //         }

    //         prices.push(price);
    //     }

    //     return prices.slice(1).reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0]);
    // }

    public constructor(path: MultiPath, inputAmount: MonetaryAmount<CurrencyExt>, outputCurrency: CurrencyExt) {
        // TODO: decide if these checks are needed or not
        //   invariant(paths.length > 0, 'POOLS');
        //   invariant(paths[0].input.equals(inputAmount.token), 'INPUT');
        //   invariant(typeof output === 'undefined' || paths[paths.length - 1].output.equals(output), 'OUTPUT');

        const currencyPath: CurrencyExt[] = [inputAmount.currency];

        for (const [i, pathElement] of path.entries()) {
            const currentInput = currencyPath[i];

            if (!isCurrencyEqual(pathElement.input, currentInput)) {
                throw new Error(
                    `MultiRoute: Invalid sequence of currencies, expected ${currentInput.name}, but got ${pathElement.input.name}!`
                );
            }
            currencyPath.push(pathElement.output);
        }

        this.routePath = path;
        this.currencyPath = currencyPath;
        this.inputCurrency = inputAmount.currency;
        this.inputAmount = inputAmount;
        this.outputCurrency = outputCurrency ?? path[path.length - 1].output;
    }
}
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

// TODO: Consider creating class for Trade object.
class Trade {
    public executionPrice: Big;
    public priceImpact: string; // Percentage.
    public estimatedOutputAmount: MonetaryAmount<CurrencyExt>;
    constructor(
        public path: MultiPath // Is empty array if no path was found.
    ) {
        this.executionPrice = Big(0); // TODO
        this.priceImpact = "0%"; // TODO
        this.estimatedOutputAmount = BitcoinAmount.zero(); // TODO
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

const MAX_HOPS = 4; // TODO: add as parameter?

const findBestTradeWithHopLimit = (
    inputAmount: MonetaryAmount<CurrencyExt>,
    outputCurrency: CurrencyExt,
    pairs: Array<TradingPair>,
    hopLimit: number,
    path: MultiPath,
    originalInputCurrency = inputAmount.currency,
    result: Array<Trade> = []
) => {
    if (hopLimit <= 0) {
        throw new Error("findBestTradeWithHopLimit: Invalid hop limit.");
    }
    if (inputAmount.currency === originalInputCurrency && path.length === 0) {
        throw new Error("findBestTradeWithHopLimit: Invalid recursion.");
    }

    const inputCurrency = inputAmount.currency;

    for (const [index, pair] of pairs.entries()) {
        const isInputCurrencyInPair =
            isCurrencyEqual(inputCurrency, pair.token0) || isCurrencyEqual(inputCurrency, pair.token1);
        if (!isInputCurrencyInPair) {
            continue;
        }
        const [amountOut, pool] = pair.getOutputAmount(inputAmount);

        // Complete path is found
        if (isCurrencyEqual(outputCurrency, amountOut.currency)) {
            const tradePath = [...path, pair.pathOf(inputCurrency)];
            const multiRoute = new MultiRoute(tradePath, inputAmount, outputCurrency);
        }
    }
};

const findBestRoute = (
    inputAmount: MonetaryAmount<CurrencyExt>,
    outputCurrency: CurrencyExt,
    pools: Array<LiquidityPool>
): Trade | null => {
    const pairs = getAllTradingPairs(pools);

    if (pairs.length === 0 || inputAmount.isZero()) {
        return null;
    }

    for (let hopLimit = 1; hopLimit <= MAX_HOPS; hopLimit++) {}
};

export interface AMMAPI {
    /**
     * Get optimal trade for provided trade type and amount.
     *
     * @param {MonetaryAmount<CurrencyExt>} amount Amount to be exchanged.
     * @param {Array<LiquidityPool>} pools Array of all liquidity pools.
     * @returns {Promise<Trade>} Data about optimal trade.
     */
    getOptimalTrade(amount: MonetaryAmount<CurrencyExt>, pools: Array<LiquidityPool>): Promise<Trade>;

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
     * @param {TradePath} path Trade path.
     * @param {MonetaryAmount<CurrencyExt>} amount Amount to be swapped for.
     * @param {MonetaryAmount<CurrencyExt>} minimumAmountOut Other amount limit.
     * @param {AddressOrPair} recipient Recipient address.
     * @param {number | string} deadline Deadline block for the swap transaction.
     */
    swap(
        amount: MonetaryAmount<CurrencyExt>,
        path: TradePath,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): Promise<void>;

    /**
     * Adds liquidity to liquidity pool
     *
     * @param {PooledCurrencies} pooledTokens Array of monetary amounts of pooled tokens.
     * @param {PoolType} type Type of liquidity pool.
     */
    addLiquidity(pooledTokens: PooledCurrencies, type: PoolType): Promise<void>;

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
    getOptimalTrade(type: TradeType, amount: MonetaryAmount<CurrencyExt>, pools: Array<LiquidityPool>): Promise<Trade> {
        throw new Error("Method not implemented.");
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
        type: TradeType,
        path: TradePath,
        amount: MonetaryAmount<CurrencyExt>,
        otherLimitAmount: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: string | number
    ): Promise<void> {
        return new Promise(function () {
            //
        });
    }
    addLiquidity(pooledTokens: PooledCurrencies, type: PoolType): Promise<void> {
        return new Promise(function () {
            //
        });
    }
    removeLiquidity(amount: MonetaryAmount<CurrencyExt>, customCurrenciesProportion?: PooledCurrencies): Promise<void> {
        return new Promise(function () {
            //
        });
    }
}
