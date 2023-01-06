import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { AccountId } from "@polkadot/types/interfaces";
import { CurrencyExt } from "../types";
import { LiquidityPool } from "./amm/liquidity-pool/types";
import { getAllTradingPairs } from "./amm/liquidity-pool/utils";
import { Trade } from "./amm/trade/trade";
import { LPToken, PooledCurrencies, PoolType } from "./amm/types";
import { findBestTradeRecursively } from "./amm/utils";

const HOP_LIMIT = 4; // TODO: add as parameter?

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
     * @returns {Promise<Array<LiquidityPool>>} All liquidity pools.
     */
    getLiquidityPools(): Promise<Array<LiquidityPool>>;

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
     * @param {LiquidityPool} pool Liquidity pool to remove from.
     * @param customCurrenciesProportion Optional parameter that allows to specify proportion
     *        of pooled currencies in which the liquidity should be withdrawn.
     * @note Removes `amount` of liquidity in LP token, breaks it down and transfers to account.
     */
    removeLiquidity(
        amount: MonetaryAmount<LPToken>,
        pool: LiquidityPool,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<void>;
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

        return findBestTradeRecursively(inputAmount, outputCurrency, pairs, HOP_LIMIT);
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
    removeLiquidity(
        amount: MonetaryAmount<LPToken>,
        pool: LiquidityPool,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<void> {
        return new Promise(function () {
            //
        });
    }
}
