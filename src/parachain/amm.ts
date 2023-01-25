import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { u128 } from "@polkadot/types";
import { AddressOrPair, ApiTypes, AugmentedEvent, SubmittableExtrinsic } from "@polkadot/api/types";
import { AccountId } from "@polkadot/types/interfaces";
import {
    ZenlinkProtocolPrimitivesBootstrapParameter,
    ZenlinkProtocolPrimitivesPairMetadata,
    ZenlinkProtocolPrimitivesPairStatus,
    ZenlinkStableAmmPrimitivesBasePool,
    ZenlinkStableAmmPrimitivesMetaPool,
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
    isStandardPool,
    newCurrencyId,
    isCurrencyEqual,
    PoolType,
    isStableMetaPool,
    isStableLpToken,
    monetaryAmountToRawString,
} from "..";
import { StableLiquidityMetaPool } from "./amm/liquidity-pool/stable-meta";

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
    static getStablePoolInfo(poolData: ZenlinkStableAmmPrimitivesPool): ZenlinkStableAmmPrimitivesBasePool | null {
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
        const allLpTokens = await this.getLpTokens();
        const accountBalances = await Promise.all(
            allLpTokens.map((lpToken) => this.tokensAPI.balance(lpToken, accountId))
        );
        // Adds free and staked balances together.
        return accountBalances.map((balance) => <MonetaryAmount<LpCurrency>>balance.free.add(balance.reserved));
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
            if (!poolData.isSome) {
                return null;
            }
            const poolBase = DefaultAMMAPI.getStablePoolInfo(poolData.unwrap());
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
                lpToken.isSome
                    ? this._getStandardLiquidityPool(
                          storageKeyToNthInner(pairKey),
                          lpToken.unwrap(),
                          pairStatuses[index]
                      )
                    : null
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
        // TODO: refactor when RPC call is added to node
        // const rawA = await this.api.rpc.zenlinkStableAmm.getA(poolId);
        // return decodeNumberOrHex(rawA);
        const poolData = await this.api.query.zenlinkStableAmm.pools(poolId);
        if (poolData.isSome) {
            const rawA = DefaultAMMAPI.getStablePoolInfo(poolData.unwrap())?.futureA;
            if (rawA !== undefined) {
                return Big(rawA.toString());
            }
        }

        throw new Error(`_getStablePoolAmplificationCoefficient: Invalid pool id ${poolId}.`);
    }

    private _getStableBasePooledCurrenciesAdjustedToLpTokenAmount(
        basePooledCurrencies: PooledCurrencies,
        lpTokenTotalSupply: MonetaryAmount<StableLpToken>,
        metaPoolLpTokenAmount: MonetaryAmount<StableLpToken>
    ) {
        const changeCoefficient = metaPoolLpTokenAmount.div(lpTokenTotalSupply.toBig()).toBig();
        return basePooledCurrencies.map((amount) => amount.mul(changeCoefficient));
    }

    private async _getStableLiquidityPoolData(
        poolId: number,
        poolData: ZenlinkStableAmmPrimitivesPool,
        metaPoolLpTokenAmount?: MonetaryAmount<StableLpToken>
    ) {
        const poolInfo = DefaultAMMAPI.getStablePoolInfo(poolData);
        if (poolInfo === null) {
            return null;
        }

        const [pooledCurrencyIds, pooledCurrencyBalances, tradingFee] = [
            poolInfo.currencyIds,
            poolInfo.balances,
            // TODO: check number base for fee
            decodeFixedPointType(poolInfo.fee),
        ];
        const lpToken = DefaultAMMAPI.getStableLpTokenFromPoolData(poolId, poolInfo);
        const [pooledCurrenciesBase, apr, amplificationCoefficient, totalSupply] = await Promise.all([
            this._getStablePoolPooledCurrencies(pooledCurrencyIds, pooledCurrencyBalances),
            this._getStablePoolAPR(poolId),
            this._getStablePoolAmplificationCoefficient(poolId),
            this.tokensAPI.total(lpToken),
        ]);

        // Adjust currency amounts based on LP token amount of metapool.
        const actuallyPooledCurrencies =
            metaPoolLpTokenAmount !== undefined
                ? this._getStableBasePooledCurrenciesAdjustedToLpTokenAmount(
                      pooledCurrenciesBase,
                      totalSupply,
                      metaPoolLpTokenAmount
                  )
                : pooledCurrenciesBase;

        return { lpToken, actuallyPooledCurrencies, apr, amplificationCoefficient, totalSupply, tradingFee };
    }

    private async _getStableMetaPoolBasePool(
        poolData: ZenlinkStableAmmPrimitivesMetaPool,
        pooledCurrencies: PooledCurrencies
    ): Promise<StableLiquidityPool> {
        const basePoolId = poolData.basePoolId;
        const basePoolData = await this.api.query.zenlinkStableAmm.pools(basePoolId);
        const pooledLpTokenAmount = <MonetaryAmount<StableLpToken>>(
            pooledCurrencies.find((amount) => isStableLpToken(amount.currency))
        );

        if (basePoolData.isSome) {
            if (basePoolData.unwrap().isMeta) {
                throw new Error("Nested metapools are not supported.");
            }

            const basePool = await this._getStableLiquidityPool(
                basePoolId.toNumber(),
                basePoolData.unwrap(),
                pooledLpTokenAmount
            );
            if (basePool === null) {
                throw new Error("Metapool's base pool data are not valid.");
            }
            return basePool;
        }
        throw new Error(`Base pool with id ${basePoolId} does not exist.`);
    }

    private async _getStableLiquidityPool(
        poolId: number,
        poolData: ZenlinkStableAmmPrimitivesPool,
        metaPoolLpTokenAmount?: MonetaryAmount<StableLpToken>
    ): Promise<StableLiquidityPool | null> {
        const processedPoolData = await this._getStableLiquidityPoolData(poolId, poolData, metaPoolLpTokenAmount);
        if (processedPoolData === null) {
            return null;
        }
        const { lpToken, actuallyPooledCurrencies, apr, tradingFee, amplificationCoefficient, totalSupply } =
            processedPoolData;

        if (poolData.isBase) {
            return new StableLiquidityPool(
                PoolType.STABLE_PLAIN,
                lpToken,
                actuallyPooledCurrencies,
                actuallyPooledCurrencies,
                apr,
                tradingFee,
                poolId,
                amplificationCoefficient,
                totalSupply
            );
        }

        // When pool is metapool, nested base pool instance is created.
        const basePool = await this._getStableMetaPoolBasePool(poolData.asMeta, actuallyPooledCurrencies);
        const pooledCurrencies = actuallyPooledCurrencies.reduce(
            (result: PooledCurrencies, currentAmount) =>
                isStableLpToken(currentAmount.currency)
                    ? [...result, ...basePool.pooledCurrencies]
                    : [...result, currentAmount],
            []
        );

        return new StableLiquidityMetaPool(
            lpToken,
            actuallyPooledCurrencies,
            pooledCurrencies,
            apr,
            tradingFee,
            poolId,
            amplificationCoefficient,
            totalSupply,
            basePool
        );
    }

    public async getStableLiquidityPools(): Promise<Array<StableLiquidityPool>> {
        const poolEntries = await this.api.query.zenlinkStableAmm.pools.entries();
        const rawPoolsData = poolEntries.filter(([_, pool]) => pool.isSome);
        const pools = await Promise.all(
            rawPoolsData.map(([poolId, poolData]) =>
                poolData.isSome
                    ? this._getStableLiquidityPool(storageKeyToNthInner(poolId).toNumber(), poolData.unwrap())
                    : null
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

    private async _getLiquidityDepositStandardPoolParams(
        amounts: PooledCurrencies,
        pool: StandardLiquidityPool,
        maxSlippageComplement: number,
        deadline: number
    ): Promise<[SubmittableExtrinsic<ApiTypes>, AugmentedEvent<ApiTypes>]> {
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

        return [addLiquidityToStandardPoolExtrinsic, this.api.events.zenlinkProtocol.LiquidityAdded];
    }

    private async _getLiquidityDepositStablePoolParams(
        amounts: PooledCurrencies,
        pool: StableLiquidityPool,
        maxSlippageComplement: number,
        deadline: number,
        recipient: AddressOrPair
    ): Promise<[SubmittableExtrinsic<ApiTypes>, AugmentedEvent<ApiTypes>]> {
        const minAmounts = amounts.map((amount) => amount.mul(maxSlippageComplement));
        const minimumLpTokenOut = pool.calculateTokenAmount(minAmounts, true).toString(true);
        const recipientAccount = addressOrPairAsAccountId(this.api, recipient);

        if (!isStableMetaPool(pool)) {
            amounts.forEach((amount, index) => {
                if (!isCurrencyEqual(pool.pooledCurrencies[index].currency, amount.currency)) {
                    throw new Error(
                        `Invalid input amounts, currency ${amount.currency.ticker} is not at index ${index} of pool.`
                    );
                }
            });

            const rawAmounts = amounts.map(monetaryAmountToRawString);
            const addLiquidityToStablePoolExtrinsic = this.api.tx.zenlinkStableAmm.addLiquidity(
                pool.poolId,
                rawAmounts,
                minimumLpTokenOut,
                recipientAccount,
                deadline
            );

            return [addLiquidityToStablePoolExtrinsic, this.api.events.zenlinkStableAmm.AddLiquidity];
        }

        const metaAmounts = amounts.filter((amount) => pool.involvesToken(amount.currency));
        const rawMetaAmounts = metaAmounts.map(monetaryAmountToRawString);

        const baseAmounts = amounts.filter((amount) => pool.basePool.involvesToken(amount.currency));
        const rawBaseAmounts = baseAmounts.map(monetaryAmountToRawString);

        if (metaAmounts.length + baseAmounts.length !== amounts.length) {
            throw new Error("Invalid input amounts.");
        }

        const addLiquidityToStableMetaPoolExtrinsic = this.api.tx.zenlinkStableAmm.addPoolAndBasePoolLiquidity(
            pool.poolId,
            pool.basePool.poolId,
            rawMetaAmounts,
            rawBaseAmounts,
            minimumLpTokenOut,
            recipientAccount,
            deadline
        );

        return [addLiquidityToStableMetaPoolExtrinsic, this.api.events.zenlinkStableAmm.AddLiquidity];
    }

    async addLiquidity(
        amounts: PooledCurrencies,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): Promise<void> {
        const maxSlippageComplement = 1 - maxSlippage / 100;

        let depositExtrinsic: SubmittableExtrinsic<ApiTypes>;
        let depositEvent: AugmentedEvent<ApiTypes>;
        if (isStandardPool(pool)) {
            [depositExtrinsic, depositEvent] = await this._getLiquidityDepositStandardPoolParams(
                amounts,
                pool,
                maxSlippageComplement,
                deadline
            );
        } else {
            [depositExtrinsic, depositEvent] = await this._getLiquidityDepositStablePoolParams(
                amounts,
                pool,
                maxSlippageComplement,
                deadline,
                recipient
            );
        }

        // TODO: add farm deposit extrinsic
        let farmDepositExtrinsic: SubmittableExtrinsic<ApiTypes>;
        const batchedExtrinsics = this.api.tx.utility.batchAll([depositExtrinsic]);

        await this.transactionAPI.sendLogged(batchedExtrinsics, depositEvent, true);
    }

    private async _getLiquidityWithdrawalStandardPoolParams(
        amount: MonetaryAmount<StandardLpToken>,
        pool: StandardLiquidityPool,
        maxSlippageComplement: number,
        recipient: AddressOrPair,
        deadline: number
    ): Promise<[SubmittableExtrinsic<ApiTypes>, AugmentedEvent<ApiTypes>]> {
        const outputAmounts = pool.getLiquidityWithdrawalPooledCurrencyAmounts(amount);
        const minAmounts = outputAmounts.map((amount) => amount.mul(maxSlippageComplement).toString(true));
        const recipientAccount = addressOrPairAsAccountId(this.api, recipient);

        const withdrawalExtrinsic = this.api.tx.zenlinkProtocol.removeLiquidity(
            newCurrencyId(this.api, pool.token0),
            newCurrencyId(this.api, pool.token1),
            amount.toString(true),
            minAmounts[0],
            minAmounts[1],
            recipientAccount,
            deadline
        );

        return [withdrawalExtrinsic, this.api.events.zenlinkProtocol.LiquidityRemoved];
    }

    private async _getLiquidityWithdrawalStablePoolParams(
        amount: MonetaryAmount<StableLpToken>,
        pool: StableLiquidityPool,
        maxSlippageComplement: number,
        recipient: AddressOrPair,
        deadline: number
    ): Promise<[SubmittableExtrinsic<ApiTypes>, AugmentedEvent<ApiTypes>]> {
        const outputAmounts = pool.getLiquidityWithdrawalPooledCurrencyAmounts(amount);
        const minAmounts = outputAmounts.map((amount) => amount.mul(maxSlippageComplement));
        const poolId = pool.poolId;
        const lpTokenAmount = amount.toString(true);
        const recipientAccount = addressOrPairAsAccountId(this.api, recipient);

        if (isStableMetaPool(pool)) {
            const basePoolId = pool.basePool.poolId;
            const minAmountsMeta = minAmounts
                .filter((amount) => pool.involvesToken(amount.currency))
                .map(monetaryAmountToRawString);
            const minAmountsBase = minAmounts
                .filter((amount) => pool.basePool.involvesToken(amount.currency))
                .map(monetaryAmountToRawString);

            const withdrawLiquidityExtrinsic = this.api.tx.zenlinkStableAmm.removePoolAndBasePoolLiquidity(
                poolId,
                basePoolId,
                lpTokenAmount,
                minAmountsMeta,
                minAmountsBase,
                recipientAccount,
                deadline
            );

            return [withdrawLiquidityExtrinsic, this.api.events.zenlinkStableAmm.RemoveLiquidity];
        }

        const minAmountsRaw = minAmounts.map(monetaryAmountToRawString);
        const withdrawLiquidityExtrinsic = this.api.tx.zenlinkStableAmm.removeLiquidity(
            poolId,
            lpTokenAmount,
            minAmountsRaw,
            recipientAccount,
            deadline
        );

        return [withdrawLiquidityExtrinsic, this.api.events.zenlinkStableAmm.RemoveLiquidity];
    }

    async removeLiquidity(
        amount: MonetaryAmount<LpCurrency>,
        pool: LiquidityPool,
        maxSlippage: number, // Percentage.
        deadline: number,
        recipient: AddressOrPair
    ): Promise<void> {
        if (isCurrencyEqual(amount.currency, pool.lpToken)) {
            throw new Error(
                `Input amount and pool lp token should be same but are: [${amount.currency.ticker}, ${pool.lpToken.ticker}].`
            );
        }
        const maxSlippageComplement = 1 - maxSlippage / 100;
        let withdrawalExtrinsic: SubmittableExtrinsic<ApiTypes>;
        let withdrawalEvent: AugmentedEvent<ApiTypes>;

        if (isStandardPool(pool)) {
            [withdrawalExtrinsic, withdrawalEvent] = await this._getLiquidityWithdrawalStandardPoolParams(
                amount as MonetaryAmount<StandardLpToken>,
                pool,
                maxSlippageComplement,
                recipient,
                deadline
            );
        } else {
            [withdrawalExtrinsic, withdrawalEvent] = await this._getLiquidityWithdrawalStablePoolParams(
                amount as MonetaryAmount<StableLpToken>,
                pool,
                maxSlippageComplement,
                recipient,
                deadline
            );
        }

        // TODO: add farm deposit extrinsic
        let farmDepositExtrinsic: SubmittableExtrinsic<ApiTypes>;
        const batchedExtrinsics = this.api.tx.utility.batchAll([withdrawalExtrinsic]);

        await this.transactionAPI.sendLogged(batchedExtrinsics, withdrawalEvent, true);
    }
}
