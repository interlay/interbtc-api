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
import { CurrencyExt, LpCurrency, StableLpToken, StandardLpToken } from "../types";
import { currencyIdToMonetaryCurrency, newMonetaryAmount } from "../utils";
import { TransactionAPI } from "./transaction";
import Big from "big.js";
import {
    LiquidityPool,
    Trade,
    PooledCurrencies,
    getAllTradingPairs,
    findBestTradeRecursively,
    StandardLiquidityPool,
    StableLiquidityPool,
    getStandardLpTokenFromCurrencyId,
    storageKeyToNthInner,
    isStableMultiPathElement,
    encodeSwapParamsForStandardPoolsOnly,
    encodeSwapParamsForStandardAndStablePools,
    addressOrPairAsAccountId,
    decodeFixedPointType,
    decodeNumberOrHex,
    isStandardPool,
    newCurrencyId,
    isCurrencyEqual,
} from "..";

const HOP_LIMIT = 4; // TODO: add as parameter?

export interface AMMAPI {
    /**
     * Get all LP tokens.
     *
     * @returns {Promise<Array<LpCurrency>>} Array of all standard and stable LP tokens.
     */
    getLpTokens(): Promise<Array<LpCurrency>>;

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
     * Get liquidity provided by account.
     *
     * @param {AccountId} accountId Account to get provided liquidity information about.
     * @returns {Promise<Array<MonetaryAmount<LpCurrency>>>} Array of LP token amounts that represent
     *          account's positions in respective liquidity pools.
     */
    getLiquidityProvidedByAccount(accountId: AccountId): Promise<Array<MonetaryAmount<LpCurrency>>>;

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
     * @param {PooledCurrencies} amounts Array of monetary amounts of pooled currencies
     * sorted in the same order as in the pool.
     * @param {LiquidityPool} pool Type of liquidity pool.
     * @param {number} maxSlippage Maximum allowed slippage.
     * @param {number} deadline Deadline block number.
     * @param {AddressOrPair} recipient Recipient of the liquidity pool token.
     */
    addLiquidity(
        amounts: PooledCurrencies,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): Promise<void>;

    /**
     * Removes liquidity from pool.
     *
     * @param {MonetaryAmount<LpCurrency>} amount Amount of LP token to be removed
     * @param {LiquidityPool} pool Liquidity pool to remove from.
     * @param {number} maxSlippage Maximum allowed slippage.
     * @param {number} deadline Deadline block number.
     * @param {AddressOrPair} recipient Recipient of the pooled currencies.
     * @note Removes `amount` of liquidity in LP token, breaks it down and transfers to account.
     */
    removeLiquidity(
        amount: MonetaryAmount<LpCurrency>,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): Promise<void>;
}

export class DefaultAMMAPI implements AMMAPI {
    static getStableBasePool(poolData: ZenlinkStableAmmPrimitivesPool): ZenlinkStableAmmPrimitivesBasePool | null {
        if (poolData.isBase) {
            return poolData.asBase;
        }
        if (poolData.isMeta) {
            return poolData.asMeta.info;
        }
        return null;
    }

    static getStableLpTokenFromPoolData(
        poolId: number,
        basePoolData: ZenlinkStableAmmPrimitivesBasePool
    ): StableLpToken {
        const [ticker, decimals] = [
            basePoolData.lpCurrencySymbol.toString(),
            basePoolData.lpCurrencyDecimal.toNumber(),
        ];
        return {
            name: ticker,
            ticker,
            decimals,
            stableLpToken: {
                poolId,
            },
        };
    }

    constructor(private api: ApiPromise, private tokensAPI: TokensAPI, private transactionAPI: TransactionAPI) {}

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

    public async getLiquidityProvidedByAccount(accountId: AccountId): Promise<Array<MonetaryAmount<LpCurrency>>> {
        throw new Error("Method not implemented.");
    }

    private async _getStandardLpTokens(): Promise<Array<StandardLpToken>> {
        const standardPools = await this.api.query.zenlinkProtocol.liquidityPairs.entries();
        const standardLpTokens = await Promise.all(
            standardPools.map(([_, lpTokenCurrencyId]) =>
                getStandardLpTokenFromCurrencyId(this.api, lpTokenCurrencyId.unwrap())
            )
        );

        return standardLpTokens;
    }

    private async _getStableLpTokens(): Promise<Array<StableLpToken>> {
        const stablePools = await this.api.query.zenlinkStableAmm.pools.entries();
        const stableLpTokens = stablePools.map(([key, poolData]) => {
            const poolBase = DefaultAMMAPI.getStableBasePool(poolData.unwrap());
            if (poolBase === null) {
                return null;
            }
            return DefaultAMMAPI.getStableLpTokenFromPoolData(storageKeyToNthInner(key).toNumber(), poolBase);
        });
        return stableLpTokens.filter((token) => token !== null) as Array<StableLpToken>;
    }

    public async getLpTokens(): Promise<Array<LpCurrency>> {
        const [standardLpTokens, stableLpTokens] = await Promise.all([
            this._getStandardLpTokens(),
            this._getStableLpTokens(),
        ]);

        return [...standardLpTokens, ...stableLpTokens];
    }

    private async _getStandardPoolReserveBalances(
        token0: CurrencyExt,
        token1: CurrencyExt,
        pairAccount: AccountId
    ): Promise<[MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>]> {
        const [token0Balance, token1Balance] = await Promise.all([
            this.tokensAPI.balance(token0, pairAccount),
            this.tokensAPI.balance(token1, pairAccount),
        ]);
        const token0MonetaryAmount = token0Balance.free;
        const token1MonetaryAmount = token1Balance.free;

        return [token0MonetaryAmount, token1MonetaryAmount];
    }

    private async _getStandardPoolAPR(
        pairCurrencies: [InterbtcPrimitivesCurrencyId, InterbtcPrimitivesCurrencyId]
    ): Promise<Big> {
        // TODO: Implement when farming pallet is added to runtime
        return Big(0);
    }

    private async _getStandardLiquidityPool(
        pairCurrencies: [InterbtcPrimitivesCurrencyId, InterbtcPrimitivesCurrencyId],
        lpTokenCurrencyId: InterbtcPrimitivesCurrencyId,
        pairStatus: ZenlinkProtocolPrimitivesPairStatus
    ): Promise<StandardLiquidityPool | null> {
        let typedPairStatus: ZenlinkProtocolPrimitivesPairMetadata | ZenlinkProtocolPrimitivesBootstrapParameter;
        let isTradingActive: boolean;
        let tradingFee: Big;
        let totalSupplyAmount: Big;

        if (pairStatus.isTrading) {
            typedPairStatus = pairStatus.asTrading;
            isTradingActive = true;
            tradingFee = decodeFixedPointType(typedPairStatus.feeRate);
            totalSupplyAmount = Big(typedPairStatus.totalSupply.toString());
        } else if (pairStatus.isBootstrap) {
            typedPairStatus = pairStatus.asBootstrap;
            isTradingActive = false;
            tradingFee = Big(0);
            totalSupplyAmount = Big(0);
        } else {
            return null;
        }

        const pairAccount = typedPairStatus.pairAccount;
        const [token0, token1] = await Promise.all(
            pairCurrencies.map((currency) => currencyIdToMonetaryCurrency(this.api, currency))
        );

        const [lpToken, pooledCurrencies, apr] = await Promise.all([
            getStandardLpTokenFromCurrencyId(this.api, lpTokenCurrencyId),
            this._getStandardPoolReserveBalances(token0, token1, pairAccount),
            this._getStandardPoolAPR(pairCurrencies),
        ]);

        const totalSupply = new MonetaryAmount(lpToken, totalSupplyAmount);

        return new StandardLiquidityPool(lpToken, pooledCurrencies, apr, tradingFee, isTradingActive, totalSupply);
    }

    public async getStandardLiquidityPools(): Promise<Array<StandardLiquidityPool>> {
        const pairEntries = await this.api.query.zenlinkProtocol.liquidityPairs.entries();
        const pairs = pairEntries.filter(([_, lpToken]) => lpToken.isSome);
        const pairStatuses = await Promise.all(
            pairs.map(([pairKey]) => this.api.query.zenlinkProtocol.pairStatuses(storageKeyToNthInner(pairKey)))
        );
        const pools = await Promise.all(
            pairs.map(([pairKey, lpToken], index) =>
                this._getStandardLiquidityPool(storageKeyToNthInner(pairKey), lpToken.unwrap(), pairStatuses[index])
            )
        );

        return pools.filter((pool) => pool !== null) as Array<StandardLiquidityPool>;
    }

    private async _getStablePoolAPR(poolId: number): Promise<Big> {
        // TODO: Implement when farming pallet is added to runtime
        return Big(0);
    }

    private async _getStablePoolPooledCurrencies(
        currencyIds: Array<InterbtcPrimitivesCurrencyId>,
        balances: Array<u128>
    ): Promise<Array<MonetaryAmount<CurrencyExt>>> {
        const pooledMonetaryCurrencies = await Promise.all(
            currencyIds.map((currencyId) => currencyIdToMonetaryCurrency(this.api, currencyId))
        );

        const pooledCurrencies = pooledMonetaryCurrencies.map((currency, index) =>
            newMonetaryAmount(Big(balances[index].toString()), currency)
        );

        return pooledCurrencies;
    }

    private async _getStablePoolAmplificationCoefficient(poolId: number): Promise<Big> {
        // TODO: fix 'getA is not a function'
        return Big(1);
        const rawA = await this.api.rpc.zenlinkStableAmm.getA(poolId);

        return decodeNumberOrHex(rawA);
    }

    private async _getStableLiquidityPool(
        poolId: number,
        poolData: ZenlinkStableAmmPrimitivesPool
    ): Promise<StableLiquidityPool | null> {
        const poolBase = DefaultAMMAPI.getStableBasePool(poolData);
        if (poolBase === null) {
            return null;
        }

        const [pooledCurrencyIds, pooledCurrencyBalances, tradingFee] = [
            poolBase.currencyIds,
            poolBase.balances,
            // TODO: check number base for fee
            decodeFixedPointType(poolBase.fee),
        ];

        const lpToken = DefaultAMMAPI.getStableLpTokenFromPoolData(poolId, poolBase);

        const [pooledCurrencies, apr, A, totalSupply] = await Promise.all([
            this._getStablePoolPooledCurrencies(pooledCurrencyIds, pooledCurrencyBalances),
            this._getStablePoolAPR(poolId),
            this._getStablePoolAmplificationCoefficient(poolId),
            this.tokensAPI.total(lpToken),
        ]);

        return new StableLiquidityPool(lpToken, pooledCurrencies, apr, tradingFee, poolId, A, totalSupply);
    }

    public async getStableLiquidityPools(): Promise<Array<StableLiquidityPool>> {
        const poolEntries = await this.api.query.zenlinkStableAmm.pools.entries();
        const rawPoolsData = poolEntries.filter(([_, pool]) => pool.isSome);
        const pools = await Promise.all(
            rawPoolsData.map(([poolId, poolData]) =>
                this._getStableLiquidityPool(storageKeyToNthInner(poolId).toNumber(), poolData.unwrap())
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

    private async _swapThroughStandardPoolsOnly(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): Promise<void> {
        const { amountIn, amountOutMin, path } = encodeSwapParamsForStandardPoolsOnly(
            this.api,
            trade,
            minimumAmountOut
        );
        const swapExtrinsic = this.api.tx.zenlinkProtocol.swapExactAssetsForAssets(
            amountIn,
            amountOutMin,
            path,
            addressOrPairAsAccountId(this.api, recipient),
            deadline
        );

        await this.transactionAPI.sendLogged(swapExtrinsic, this.api.events.zenlinkProtocol.AssetSwap, true);
    }

    private async _swapThroughStandardAndStablePools(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): Promise<void> {
        const { amountIn, amountOutMin, path } = encodeSwapParamsForStandardAndStablePools(
            this.api,
            trade,
            minimumAmountOut
        );
        const swapExtrinsic = this.api.tx.zenlinkSwapRouter.swapExactTokenForTokensThroughStablePool(
            amountIn,
            amountOutMin,
            path,
            addressOrPairAsAccountId(this.api, recipient),
            deadline
        );

        await this.transactionAPI.sendLogged(swapExtrinsic, this.api.events.zenlinkStableAmm.CurrencyExchange, true);
    }

    async swap(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): Promise<void> {
        const containsStablePool = trade.path.some(isStableMultiPathElement);
        if (containsStablePool) {
            await this._swapThroughStandardAndStablePools(trade, minimumAmountOut, recipient, deadline);
        } else {
            await this._swapThroughStandardPoolsOnly(trade, minimumAmountOut, recipient, deadline);
        }
    }

    private async _addLiquidityStandardPool(
        amounts: PooledCurrencies,
        pool: StandardLiquidityPool,
        maxSlippageComplement: number,
        deadline: number
    ): Promise<void> {
        if (amounts.length !== 2) {
            throw new Error("Invalid count of input amounts.");
        }
        if (!isCurrencyEqual(pool.token0, amounts[0].currency) || !isCurrencyEqual(pool.token1, amounts[1].currency)) {
            throw new Error("Input currencies and pool currencies differ.");
        }

        const minAmounts = amounts.map((amount) => amount.mul(maxSlippageComplement));
        const [asset0, asset1, amount0Desired, amount1Desired, amount0Min, amount1Min] = [
            newCurrencyId(this.api, amounts[0].currency),
            newCurrencyId(this.api, amounts[1].currency),
            amounts[0].toString(true),
            amounts[1].toString(true),
            minAmounts[0].toString(true),
            minAmounts[1].toString(true),
        ];

        const addLiquidityToStandardPoolExtrinsic = this.api.tx.zenlinkProtocol.addLiquidity(
            asset0,
            asset1,
            amount0Desired,
            amount1Desired,
            amount0Min,
            amount1Min,
            deadline
        );

        await this.transactionAPI.sendLogged(
            addLiquidityToStandardPoolExtrinsic,
            this.api.events.zenlinkProtocol.LiquidityAdded,
            true
        );
    }

    // TODO: add support for meta pools
    private async _addLiquidityStablePool(
        amounts: PooledCurrencies,
        pool: StableLiquidityPool,
        maxSlippageComplement: number,
        deadline: number,
        recipient: AddressOrPair
    ): Promise<void> {
        amounts.forEach((amount, index) => {
            if (!isCurrencyEqual(pool.pooledCurrencies[index].currency, amount.currency)) {
                throw new Error(
                    `Invalid input amounts, currency ${amount.currency.ticker} is not at index ${index} of pool.`
                );
            }
        });

        const minAmounts = amounts.map((amount) => amount.mul(maxSlippageComplement));
        const minimumLpTokenOut = pool.calculateTokenAmount(minAmounts, true).toString(true);
        const recipientAccount = addressOrPairAsAccountId(this.api, recipient);
        const rawAmounts = amounts.map((amount) => amount.toString(true));

        const addLiquidityToStablePoolExtrinsic = this.api.tx.zenlinkStableAmm.addLiquidity(
            pool.poolId,
            rawAmounts,
            minimumLpTokenOut,
            recipientAccount,
            deadline
        );

        await this.transactionAPI.sendLogged(
            addLiquidityToStablePoolExtrinsic,
            this.api.events.zenlinkStableAmm.AddLiquidity,
            true
        );
    }

    async addLiquidity(
        amounts: PooledCurrencies,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): Promise<void> {
        const maxSlippageComplement = 1 - maxSlippage / 100;

        if (isStandardPool(pool)) {
            await this._addLiquidityStandardPool(amounts, pool, maxSlippageComplement, deadline);
        } else {
            await this._addLiquidityStablePool(amounts, pool, maxSlippageComplement, deadline, recipient);
        }
        // TODO: add to farming, batch
    }

    async removeLiquidity(
        amount: MonetaryAmount<LpCurrency>,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): Promise<void> {
        //TODO
        throw new Error("Method not implemented.");
    }
}
