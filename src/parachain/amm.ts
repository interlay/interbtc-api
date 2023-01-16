import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { u128 } from "@polkadot/types";
import { AddressOrPair } from "@polkadot/api/types";
import { AccountId } from "@polkadot/types/interfaces";
import {
    ZenlinkProtocolPrimitivesBootstrapParameter,
    ZenlinkProtocolPrimitivesPairMetadata,
    ZenlinkProtocolPrimitivesPairStatus,
    ZenlinkStableAmmPrimitivesBasePool,
    ZenlinkStableAmmPrimitivesPool,
} from "@polkadot/types/lookup";
import { TokensAPI } from "./tokens";
import { InterbtcPrimitivesCurrencyId } from "../interfaces";
import { CurrencyExt, LPToken, StableLPToken, StandardLPToken } from "../types";
import { currencyIdToMonetaryCurrency, newMonetaryAmount } from "../utils";
import { AssetRegistryAPI } from "./asset-registry";
import { LoansAPI } from "./loans";
import { TransactionAPI } from "./transaction";
import Big from "big.js";
import {
    LiquidityPool,
    Trade,
    PooledCurrencies,
    PoolType,
    getAllTradingPairs,
    findBestTradeRecursively,
    StandardLiquidityPool,
    StableLiquidityPool,
} from "..";

const HOP_LIMIT = 4; // TODO: add as parameter?

export interface AMMAPI {
    /**
     * Get standard LP token currency lib type from currencyId primitive.
     *
     * @param currencyId Id of standard LP token.
     * @returns {StandardLPToken} Lib type currency object for standard LP token.
     */
    getStandardLPToken(currencyId: InterbtcPrimitivesCurrencyId): Promise<StandardLPToken>;

    /**
     * Get stable LP token currency lib type from currencyId primitive.
     *
     * @param currencyId Id of stable LP token.
     * @returns {StableLPToken} Lib type currency object for stable LP token.
     */
    getStableLPToken(currencyId: InterbtcPrimitivesCurrencyId): Promise<StableLPToken>;
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
    constructor(
        private api: ApiPromise,
        private assetRegistryAPI: AssetRegistryAPI,
        private loansAPI: LoansAPI,
        private tokensAPI: TokensAPI,
        private transactionAPI: TransactionAPI
    ) {}

    public getOptimalTrade(
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

    public async getExpectedLiquidityDepositAmounts(
        pooledCurrencies: PooledCurrencies,
        poolType: PoolType,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<{
        minLPTokens: MonetaryAmount<LPToken>;
        slippage: number; // can be negative for slippage bonus
    }> {
        throw new Error("Method not implemented.");
    }

    public async getExpectedLiquidityWithdrawalAmounts(
        amount: MonetaryAmount<CurrencyExt>,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<{
        expectedPooledCurrencyAmounts: MonetaryAmount<CurrencyExt>;
        slippage: number; // can be negative for slippage bonus
    }> {
        throw new Error("Method not implemented.");
    }

    public async getLiquidityProvidedByAccount(accountId: AccountId): Promise<Array<MonetaryAmount<LPToken>>> {
        throw new Error("Method not implemented.");
    }

    public async getStandardLPToken(currencyId: InterbtcPrimitivesCurrencyId): Promise<StandardLPToken> {
        if (!currencyId.isLpToken) {
            throw new Error("Provided currencyId is not standard LP token.");
        }
        const standardLpTokenCurrencyId = currencyId.asLpToken;
        const [token0, token1] = await Promise.all(
            standardLpTokenCurrencyId.map((currencyId) =>
                currencyIdToMonetaryCurrency(
                    this.assetRegistryAPI,
                    this.loansAPI,
                    currencyId as InterbtcPrimitivesCurrencyId
                )
            )
        );

        return {
            name: `LP ${token0.ticker}-${token1.ticker}`, // TODO
            ticker: `LP ${token0.ticker}-${token1.ticker}`, // TODO
            decimals: 18, // TODO: check
            lpToken: {
                token0,
                token1,
            },
        };
    }

    private _getStableLPTokenFromPoolData(
        poolId: number,
        basePoolData: ZenlinkStableAmmPrimitivesBasePool
    ): StableLPToken {
        const [ticker, decimals] = [
            basePoolData.lpCurrencySymbol.toString(),
            basePoolData.lpCurrencyDecimal.toNumber(),
        ];
        return {
            // TODO: check if we are able to get any other name
            name: ticker,
            ticker,
            decimals,
            stableLpToken: {
                poolId,
            },
        };
    }

    public async getStableLPToken(currencyId: InterbtcPrimitivesCurrencyId): Promise<StableLPToken> {
        if (!currencyId.isStableLpToken) {
            throw new Error("Provided currencyId is not stable LP token.");
        }

        const poolId = await this.api.query.zenlinkStableAmm.lpCurrencies(currencyId);
        if (!poolId.isSome) {
            throw new Error(`getStableLPToken: Invalid pool id for currencyId ${currencyId.toString()}`);
        }

        const poolData = await this.api.query.zenlinkStableAmm.pools(poolId.unwrap());
        if (!poolData.isSome) {
            throw new Error(`getStableLPToken: Invalid pool data for currencyId ${currencyId.toString()}`);
        }

        const basePoolData = this._getStableBasePool(poolData.unwrap());
        if (basePoolData === null) {
            throw new Error("Provided currencyId is not active LP token.");
        }

        return this._getStableLPTokenFromPoolData(poolId.unwrap().toNumber(), basePoolData);
    }

    private async _getStandardPoolReserveBalances<Currency0 extends CurrencyExt, Currency1 extends CurrencyExt>(
        token0: Currency0,
        token1: Currency1,
        pairAccount: AccountId
    ): Promise<[MonetaryAmount<Currency0>, MonetaryAmount<Currency1>]> {
        // TODO
        throw new Error("Method not implemented.");
    }

    private async _getStandardPoolTradingFee(
        pairCurrencies: [InterbtcPrimitivesCurrencyId, InterbtcPrimitivesCurrencyId]
    ): Promise<Big> {
        // TODO
        throw new Error("Method not implemented.");
    }

    private async _getStandardPoolAPR(
        pairCurrencies: [InterbtcPrimitivesCurrencyId, InterbtcPrimitivesCurrencyId]
    ): Promise<string> {
        // TODO: return percentage APR for pool
        throw new Error("Method not implemented.");
    }

    private async _getStandardLiquidityPool(
        pairCurrencies: [InterbtcPrimitivesCurrencyId, InterbtcPrimitivesCurrencyId],
        lpTokenCurrencyId: InterbtcPrimitivesCurrencyId,
        pairStatus: ZenlinkProtocolPrimitivesPairStatus
    ): Promise<StandardLiquidityPool | null> {
        let typedPairStatus: ZenlinkProtocolPrimitivesPairMetadata | ZenlinkProtocolPrimitivesBootstrapParameter;
        let isTradingActive: boolean;
        if (pairStatus.isTrading || pairStatus.isBootstrap) {
            typedPairStatus = pairStatus.isTrading ? pairStatus.asTrading : pairStatus.asBootstrap;
            isTradingActive = pairStatus.isTrading;
        } else {
            return null;
        }

        const pairAccount = typedPairStatus.pairAccount;
        // TODO: update currency types to include LP tokens
        const [token0, token1] = await Promise.all(
            pairCurrencies.map((currency) =>
                currencyIdToMonetaryCurrency(this.assetRegistryAPI, this.loansAPI, currency)
            )
        );

        const [lpToken, pooledCurrencies, apr, tradingFee] = await Promise.all([
            this.getStandardLPToken(lpTokenCurrencyId),
            this._getStandardPoolReserveBalances(token0, token1, pairAccount),
            this._getStandardPoolAPR(pairCurrencies),
            this._getStandardPoolTradingFee(pairCurrencies),
        ]);

        return new StandardLiquidityPool(lpToken, pooledCurrencies, apr, tradingFee, isTradingActive);
    }

    public async getStandardLiquidityPools(): Promise<Array<StandardLiquidityPool>> {
        const pairEntries = await this.api.query.zenlinkProtocol.liquidityPairs.entries();
        const pairs = pairEntries.filter(([_, lpToken]) => lpToken.isSome);
        const pairStatuses = await Promise.all(
            pairs.map(([pairKey]) => this.api.query.zenlinkProtocol.pairStatuses(pairKey.args[0]))
        );
        const pools = await Promise.all(
            pairs.map(([pairKey, lpToken], index) =>
                this._getStandardLiquidityPool(pairKey.args[0], lpToken.unwrap(), pairStatuses[index])
            )
        );

        return pools.filter((pool) => pool !== null) as Array<StandardLiquidityPool>;
    }

    private _getStablePoolAPR(poolId: number): Promise<string> {
        // TODO: return percentage APR for pool
        throw new Error("Method not implemented.");
    }

    private _getStableBasePool(poolData: ZenlinkStableAmmPrimitivesPool): ZenlinkStableAmmPrimitivesBasePool | null {
        if (poolData.isBase) {
            return poolData.asBase;
        }
        if (poolData.isMeta) {
            return poolData.asMeta.info;
        }
        return null;
    }

    private async _getStablePoolPooledCurrencies(
        currencyIds: Array<InterbtcPrimitivesCurrencyId>,
        balances: Array<u128>
    ): Promise<Array<MonetaryAmount<CurrencyExt>>> {
        const pooledMonetaryCurrencies = await Promise.all(
            currencyIds.map((currencyId) =>
                currencyIdToMonetaryCurrency(this.assetRegistryAPI, this.loansAPI, currencyId)
            )
        );

        const pooledCurrencies = pooledMonetaryCurrencies.map((currency, index) =>
            newMonetaryAmount(Big(balances[index].toString()), currency)
        );

        return pooledCurrencies;
    }

    private async _getStablePoolAmplificationCoefficient(
        lpTokenCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<Big> {
        // TODO: Use rpc call rpc.zenlinkStableAmm.getA
        throw new Error("Method not implemented.");
    }

    private async _getStableLiquidityPool(
        poolId: number,
        poolData: ZenlinkStableAmmPrimitivesPool
    ): Promise<StableLiquidityPool | null> {
        const poolBase = this._getStableBasePool(poolData);
        if (poolBase === null) {
            return null;
        }

        const [pooledCurrencyIds, pooledCurrencyBalances, tradingFee, lpTokenCurrencyId] = [
            poolBase.currencyIds,
            poolBase.balances,
            // TODO: check number base for fee (is there a need to divide?)
            Big(poolBase.fee.toString()),
            poolBase.lpCurrencyId,
        ];

        const lpToken = this._getStableLPTokenFromPoolData(poolId, poolBase);

        const [pooledCurrencies, apr, A, totalSupply] = await Promise.all([
            this._getStablePoolPooledCurrencies(pooledCurrencyIds, pooledCurrencyBalances),
            this._getStablePoolAPR(poolId),
            this._getStablePoolAmplificationCoefficient(lpTokenCurrencyId),
            this.tokensAPI.total(lpToken),
        ]);

        return new StableLiquidityPool(lpToken, pooledCurrencies, apr, tradingFee, poolId, A, totalSupply);
    }

    public async getStableLiquidityPools(): Promise<Array<StableLiquidityPool>> {
        const poolEntries = await this.api.query.zenlinkStableAmm.pools.entries();
        const rawPoolsData = poolEntries.filter(([_, pool]) => pool.isSome);
        const pools = await Promise.all(
            rawPoolsData.map(([poolId, poolData]) =>
                this._getStableLiquidityPool(poolId.args[0].toNumber(), poolData.unwrap())
            )
        );

        return pools.filter((pool) => pool !== null) as Array<StableLiquidityPool>;
    }

    async getLiquidityPools(): Promise<Array<LiquidityPool>> {
        const [standardPools, stablePools] = await Promise.all([
            this.getStandardLiquidityPools(),
            this.getStableLiquidityPools(),
        ]);
        return [...standardPools, ...stablePools];
    }

    async swap(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): Promise<void> {
        //TODO
    }

    async addLiquidity(amounts: PooledCurrencies, pool: LiquidityPool): Promise<void> {
        //TODO
    }

    async removeLiquidity(
        amount: MonetaryAmount<LPToken>,
        pool: LiquidityPool,
        customCurrenciesProportion?: PooledCurrencies
    ): Promise<void> {
        //TODO
    }
}
