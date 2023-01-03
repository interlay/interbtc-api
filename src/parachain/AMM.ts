import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { AccountId } from "@polkadot/types/interfaces";
import Big from "big.js";
import { CurrencyExt } from "../types";

// TODO: move type definitions to separate file later

enum PoolType {
    STANDARD = "STANDARD",
    STABLE = "STABLE",
}

enum TradeType {
    EXACT_OUTPUT = "EXACT_OUTPUT",
    EXACT_INPUT = "EXACT_INPUT",
}

type LPToken = CurrencyExt; // TODO: specify when the currencies are refactored to have LP token type

type PooledCurrencies = Array<MonetaryAmount<CurrencyExt>>;

interface LiquidityPool {
    type: PoolType;
    lpToken: LPToken;
    pooledCurrencies: PooledCurrencies; // Array of 2 for standard pools, array of 2+ for stable pools.
    apr: string; // Percentage.
    tradingFee: string; // Percentage.
    poolId: number;
}

interface PathElement {
    tokenIn: CurrencyExt;
    tokenOut: CurrencyExt;
    poolType: PoolType;
    poolId: number;
}

type TradePath = Array<PathElement>;

// TODO: Consider creating class for OptimalTrade object.
interface OptimalTrade {
    path: TradePath; // Is empty array if no path was found.
    executionPrice: Big;
    priceImpact: string; // Percentage.
    estimatedOtherAmount: MonetaryAmount<CurrencyExt>;
}

export interface AMMAPI {
    /**
     * Get optimal trade for provided trade type and amount.
     *
     * @param type Type of trade.
     * @param amount Amount to be exchanged.
     * @returns {Promise<OptimalTrade>} Data about optimal trade.
     */
    getOptimalTrade(type: TradeType, amount: MonetaryAmount<CurrencyExt>): Promise<OptimalTrade>;

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
     * @returns {Promise<Array<LiquidityPool>>} All liquidity pools.
     */
    getLiquidityPools(): Promise<Array<LiquidityPool>>;

    /**
     * Swap assets.
     *
     * @param {TradeType} type Type of trade.
     * @param {TradePath} path Trade path.
     * @param {MonetaryAmount<CurrencyExt>} amount Amount to be exchanged.
     * @param {MonetaryAmount<CurrencyExt>} otherLimitAmount Other amount limit.
     * @param {AddressOrPair} recipient Recipient address.
     * @param {number | string} deadline Deadline block for the swap transaction.
     */
    swap(
        type: TradeType,
        path: TradePath,
        amount: MonetaryAmount<CurrencyExt>,
        otherLimitAmount: MonetaryAmount<CurrencyExt>,
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
    getOptimalTrade(type: TradeType, amount: MonetaryAmount<CurrencyExt>): Promise<OptimalTrade> {
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
    getLiquidityPools(): Promise<Array<LiquidityPool>> {
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
