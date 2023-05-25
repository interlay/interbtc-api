import { MonetaryAmount } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { u128 } from "@polkadot/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { AddressOrPair, ApiTypes, AugmentedEvent, SubmittableExtrinsic } from "@polkadot/api/types";
import { AccountId } from "@polkadot/types/interfaces";
import {
    DexStablePrimitivesMetaPool,
    DexStablePrimitivesPool,
    DexGeneralPrimitivesBootstrapParameter,
    DexGeneralPrimitivesPairMetadata,
    DexGeneralPrimitivesPairStatus,
    DexStablePrimitivesBasePool,
} from "@polkadot/types/lookup";
import { TokensAPI } from "./tokens";
import { InterbtcPrimitivesCurrencyId } from "../interfaces";
import { CurrencyExt, LpCurrency, StableLpToken, StandardLpToken } from "../types";
import {
    addressOrPairAsAccountId,
    calculateAnnualizedRewardAmount,
    currencyIdToMonetaryCurrency,
    decodeBytesAsString,
    decodeFixedPointType,
    getStandardLpTokenFromCurrencyId,
    isCurrencyEqual,
    isStableLpToken,
    monetaryAmountToRawString,
    newCurrencyId,
    newMonetaryAmount,
    storageKeyToNthInner,
} from "../utils";
import Big from "big.js";
import {
    LiquidityPool,
    Trade,
    PooledCurrencies,
    getAllTradingPairs,
    findBestTradeRecursively,
    StandardLiquidityPool,
    StableLiquidityPool,
    PoolType,
    encodeSwapParamsForStandardPoolsOnly,
    encodeSwapParamsForStandardAndStablePools,
    isStableMultiPathElement,
    isStableMetaPool,
    isStandardPool,
    StableLiquidityMetaPool,
} from "./amm/";
import { ExtrinsicData } from "../types/extrinsic";

const HOP_LIMIT = 4;
const FEE_MULTIPLIER_STANDARD = 10000;
const FEE_MULTIPLIER_STABLE = 10000000000;

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
     * Get claimable farming reward amounts for all farmed liquidity provided by account.
     *
     * @param accountId Account id for which to get claimable rewards.
     * @param accountLiquidity Amount of liquidity the account has provided.
     * @param pools All liquidity pools.
     * @returns Map of LpCurrency -> Array of reward monetary amounts.
     */
    getClaimableFarmingRewards(
        accountId: AccountId,
        accountLiquidity: Array<MonetaryAmount<LpCurrency>>,
        pools: Array<LiquidityPool>
    ): Promise<Map<LpCurrency, Array<MonetaryAmount<CurrencyExt>>>>;

    /**
     * Swap assets.
     *
     * @param {Trade} trade Trade object containing information about the trade.
     * @param {MonetaryAmount<CurrencyExt>} minimumAmountOut Minimum output amount to be received.
     * @param {AddressOrPair} recipient Recipient address.
     * @param {number | string} deadline Deadline block for the swap transaction.
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    swap(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): ExtrinsicData;

    /**
     * Adds liquidity to liquidity pool
     *
     * @param {PooledCurrencies} amounts Array of monetary amounts of pooled currencies
     * sorted in the same order as in the pool.
     * @param {LiquidityPool} pool Type of liquidity pool.
     * @param {number} maxSlippage Maximum allowed slippage.
     * @param {number} deadline Deadline block number.
     * @param {AddressOrPair} recipient Recipient of the liquidity pool token.
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    addLiquidity(
        amounts: PooledCurrencies,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): ExtrinsicData;

    /**
     * Removes liquidity from pool.
     *
     * @param {MonetaryAmount<LpCurrency>} amount Amount of LP token to be removed
     * @param {LiquidityPool} pool Liquidity pool to remove from.
     * @param {number} maxSlippage Maximum allowed slippage.
     * @param {number} deadline Deadline block number.
     * @param {AddressOrPair} recipient Recipient of the pooled currencies.
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     * @note Removes `amount` of liquidity in LP token, breaks it down and transfers to account.
     */
    removeLiquidity(
        amount: MonetaryAmount<LpCurrency>,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): ExtrinsicData;

    /**
     * Claim all pending farming rewards.
     *
     * @param claimableRewards Map of LpToken -> Array of reward monetary amounts -> supposed to be
     *                         output of `getClaimableFarmingRewards`
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    claimFarmingRewards(claimableRewards: Map<LpCurrency, Array<MonetaryAmount<CurrencyExt>>>): ExtrinsicData;
}

export class DefaultAMMAPI implements AMMAPI {
    static getStablePoolInfo(poolData: DexStablePrimitivesPool): DexStablePrimitivesBasePool | null {
        if (poolData.isBase) {
            return poolData.asBase;
        }
        if (poolData.isMeta) {
            return poolData.asMeta.info;
        }
        return null;
    }

    static getStableLpTokenFromPoolData(poolId: number, basePoolData: DexStablePrimitivesBasePool): StableLpToken {
        const [ticker, decimals] = [
            decodeBytesAsString(basePoolData.lpCurrencySymbol),
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

    constructor(private api: ApiPromise, private tokensAPI: TokensAPI) { }

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
        const standardPools = await this.api.query.dexGeneral.liquidityPairs.entries();
        const standardLpTokens = await Promise.all(
            standardPools.map(([_, lpTokenCurrencyId]) =>
                getStandardLpTokenFromCurrencyId(this.api, lpTokenCurrencyId.unwrap())
            )
        );

        return standardLpTokens;
    }

    private async _getStableLpTokens(): Promise<Array<StableLpToken>> {
        const stablePools = await this.api.query.dexStable.pools.entries();
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

    private _poolHasZeroLiquidity(pooledCurrencies: PooledCurrencies): boolean {
        return pooledCurrencies.some((amount) => amount.isZero());
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

    private async _getPoolRewardAmountsYearly(lpTokenCurrencyId: InterbtcPrimitivesCurrencyId, blockTimeMs: number) {
        const rewardPeriod = this.api.consts.farming.rewardPeriod;
        const rewardsRaw = await this.api.query.farming.rewardSchedules.entries(lpTokenCurrencyId);

        const rewardAmountsYearly = await Promise.all(
            rewardsRaw.map(async ([key, value]) => {
                const rewardCurrencyId = storageKeyToNthInner(key, 1);
                const rewardCurrency = await currencyIdToMonetaryCurrency(this.api, rewardCurrencyId);
                const amountPerBlock = Big(value.perPeriod.toString()).div(rewardPeriod.toNumber());
                const annualizedRewardAmount = calculateAnnualizedRewardAmount(amountPerBlock, blockTimeMs);
                return newMonetaryAmount(annualizedRewardAmount, rewardCurrency);
            })
        );

        return rewardAmountsYearly;
    }

    private async _getStandardLiquidityPool(
        pairCurrencies: [InterbtcPrimitivesCurrencyId, InterbtcPrimitivesCurrencyId],
        lpTokenCurrencyId: InterbtcPrimitivesCurrencyId,
        pairStatus: DexGeneralPrimitivesPairStatus,
        blockTimeMs: number
    ): Promise<StandardLiquidityPool | null> {
        let typedPairStatus: DexGeneralPrimitivesPairMetadata | DexGeneralPrimitivesBootstrapParameter;
        let isTradingActive: boolean;
        let tradingFee: Big;
        let totalSupplyAmount: Big;

        if (pairStatus.isTrading) {
            typedPairStatus = pairStatus.asTrading;
            isTradingActive = true;
            tradingFee = Big(typedPairStatus.feeRate.toString()).div(FEE_MULTIPLIER_STANDARD);
            // NOTE: this is a hacky way to convert totalSupply since it assumes
            // we always use a precision of 18 for lpTokens, refactor this
            totalSupplyAmount = decodeFixedPointType(typedPairStatus.totalSupply);
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

        const [lpToken, pooledCurrencies, yearlyRewards] = await Promise.all([
            getStandardLpTokenFromCurrencyId(this.api, lpTokenCurrencyId),
            this._getStandardPoolReserveBalances(token0, token1, pairAccount),
            this._getPoolRewardAmountsYearly(lpTokenCurrencyId, blockTimeMs),
        ]);

        const isEmpty = this._poolHasZeroLiquidity(pooledCurrencies);
        const totalSupply = new MonetaryAmount(lpToken, totalSupplyAmount);

        return new StandardLiquidityPool(
            lpToken,
            pooledCurrencies,
            yearlyRewards,
            tradingFee,
            isTradingActive,
            totalSupply,
            isEmpty
        );
    }

    public async getStandardLiquidityPools(blockTimeMs: number): Promise<Array<StandardLiquidityPool>> {
        const pairEntries = await this.api.query.dexGeneral.liquidityPairs.entries();
        const pairs = pairEntries.filter(([_, lpToken]) => lpToken.isSome);
        const pairStatuses = await Promise.all(
            pairs.map(([pairKey]) => this.api.query.dexGeneral.pairStatuses(storageKeyToNthInner(pairKey)))
        );
        const pools = await Promise.all(
            pairs.map(([pairKey, lpToken], index) =>
                this._getStandardLiquidityPool(
                    storageKeyToNthInner(pairKey),
                    lpToken.unwrap(),
                    pairStatuses[index],
                    blockTimeMs
                )
            )
        );

        return pools.filter((pool) => pool !== null) as Array<StandardLiquidityPool>;
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
        // const rawA = await this.api.rpc.dexStable.getA(poolId);
        // return decodeNumberOrHex(rawA);
        const poolData = await this.api.query.dexStable.pools(poolId);
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
        poolData: DexStablePrimitivesPool,
        blockTimeMs: number,
        metaPoolLpTokenAmount?: MonetaryAmount<StableLpToken>
    ) {
        const poolInfo = DefaultAMMAPI.getStablePoolInfo(poolData);
        if (poolInfo === null) {
            return null;
        }

        const [pooledCurrencyIds, pooledCurrencyBalances, tradingFee, lpTokenCurrencyId] = [
            poolInfo.currencyIds,
            poolInfo.balances,
            Big(poolInfo.fee.toString()).div(FEE_MULTIPLIER_STABLE),
            poolInfo.lpCurrencyId,
        ];
        const lpToken = DefaultAMMAPI.getStableLpTokenFromPoolData(poolId, poolInfo);
        const [pooledCurrenciesBase, yearlyRewards, amplificationCoefficient, totalSupply] = await Promise.all([
            this._getStablePoolPooledCurrencies(pooledCurrencyIds, pooledCurrencyBalances),
            this._getPoolRewardAmountsYearly(lpTokenCurrencyId, blockTimeMs),
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

        return { lpToken, actuallyPooledCurrencies, yearlyRewards, amplificationCoefficient, totalSupply, tradingFee };
    }

    private async _getStableMetaPoolBasePool(
        poolData: DexStablePrimitivesMetaPool,
        pooledCurrencies: PooledCurrencies,
        blockTimeMs: number
    ): Promise<StableLiquidityPool> {
        const basePoolId = poolData.basePoolId;
        const basePoolData = await this.api.query.dexStable.pools(basePoolId);
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
                blockTimeMs,
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
        poolData: DexStablePrimitivesPool,
        blockTimeMs: number,
        metaPoolLpTokenAmount?: MonetaryAmount<StableLpToken>
    ): Promise<StableLiquidityPool | null> {
        const processedPoolData = await this._getStableLiquidityPoolData(
            poolId,
            poolData,
            blockTimeMs,
            metaPoolLpTokenAmount
        );
        if (processedPoolData === null) {
            return null;
        }
        const { lpToken, actuallyPooledCurrencies, yearlyRewards, tradingFee, amplificationCoefficient, totalSupply } =
            processedPoolData;
        const isEmpty = this._poolHasZeroLiquidity(actuallyPooledCurrencies);

        if (poolData.isBase) {
            return new StableLiquidityPool(
                PoolType.STABLE_PLAIN,
                lpToken,
                actuallyPooledCurrencies,
                actuallyPooledCurrencies,
                yearlyRewards,
                tradingFee,
                poolId,
                amplificationCoefficient,
                totalSupply,
                isEmpty
            );
        }

        // When pool is metapool, nested base pool instance is created.
        const basePool = await this._getStableMetaPoolBasePool(poolData.asMeta, actuallyPooledCurrencies, blockTimeMs);
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
            yearlyRewards,
            tradingFee,
            poolId,
            amplificationCoefficient,
            totalSupply,
            isEmpty,
            basePool
        );
    }

    public async getStableLiquidityPools(blockTimeMs: number): Promise<Array<StableLiquidityPool>> {
        const poolEntries = await this.api.query.dexStable.pools.entries();
        const rawPoolsData = poolEntries.filter(([_, pool]) => pool.isSome);
        const pools = await Promise.all(
            rawPoolsData.map(([poolId, poolData]) =>
                this._getStableLiquidityPool(storageKeyToNthInner(poolId).toNumber(), poolData.unwrap(), blockTimeMs)
            )
        );

        return pools.filter((pool) => pool !== null) as Array<StableLiquidityPool>;
    }

    async getLiquidityPools(): Promise<Array<LiquidityPool>> {
        const blockTimeMs = (await this.api.call.auraApi.slotDuration()).toNumber();
        const [standardPools, stablePools] = await Promise.all([
            this.getStandardLiquidityPools(blockTimeMs),
            this.getStableLiquidityPools(blockTimeMs),
        ]);

        return [...standardPools, ...stablePools];
    }

    private _swapThroughStandardPoolsOnly(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): ExtrinsicData {
        const { amountIn, amountOutMin, path } = encodeSwapParamsForStandardPoolsOnly(
            this.api,
            trade,
            minimumAmountOut
        );
        const swapExtrinsic = this.api.tx.dexGeneral.swapExactAssetsForAssets(
            amountIn,
            amountOutMin,
            path,
            addressOrPairAsAccountId(this.api, recipient),
            deadline
        );
        const swapEvent = this.api.events.dexGeneral.AssetSwap;

        return { extrinsic: swapExtrinsic, event: swapEvent };
    }

    private _swapThroughStandardAndStablePools(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): ExtrinsicData {
        const { amountIn, amountOutMin, path } = encodeSwapParamsForStandardAndStablePools(
            this.api,
            trade,
            minimumAmountOut
        );
        const swapExtrinsic = this.api.tx.dexSwapRouter.swapExactTokenForTokensThroughStablePool(
            amountIn,
            amountOutMin,
            path,
            addressOrPairAsAccountId(this.api, recipient),
            deadline
        );

        return { extrinsic: swapExtrinsic, event: this.api.events.dexStable.CurrencyExchange };
    }

    private async _getClaimableFarmingRewardsByPool(
        accountId: AccountId,
        lpToken: LpCurrency,
        pool: LiquidityPool
    ): Promise<Array<MonetaryAmount<CurrencyExt>>> {
        const lpTokenCurrencyId = newCurrencyId(this.api, lpToken);
        const rewardCurrencyIds = pool.rewardAmountsYearly.map(({ currency: rewardCurrency }) =>
            newCurrencyId(this.api, rewardCurrency)
        );
        const farmingRewards = await Promise.all(
            rewardCurrencyIds.map((rewardCurrencyId) =>
                this.api.rpc.reward.computeFarmingReward(accountId, lpTokenCurrencyId, rewardCurrencyId)
            )
        );
        const rewardAmounts = pool.rewardAmountsYearly.map(({ currency: rewardCurrency }, index) =>
            newMonetaryAmount(farmingRewards[index].amount.toString(), rewardCurrency)
        );

        return rewardAmounts;
    }

    async getClaimableFarmingRewards(
        accountId: AccountId,
        accountLiquidity: MonetaryAmount<LpCurrency>[],
        pools: LiquidityPool[]
    ): Promise<Map<LpCurrency, Array<MonetaryAmount<CurrencyExt>>>> {
        const rewardAmounts = await Promise.all(
            accountLiquidity.map(({ currency }) => {
                const pool = pools.find((poolData) => isCurrencyEqual(poolData.lpToken, currency));
                if (pool === undefined) {
                    // Return empty array for pools without liquidity.
                    return [];
                }
                return this._getClaimableFarmingRewardsByPool(accountId, currency, pool);
            })
        );

        const claimableRewards = new Map<LpCurrency, Array<MonetaryAmount<CurrencyExt>>>();
        rewardAmounts.forEach((rewards, index) => {
            const lpToken = accountLiquidity[index].currency;
            claimableRewards.set(lpToken, rewards);
        });

        return claimableRewards;
    }

    public swap(
        trade: Trade,
        minimumAmountOut: MonetaryAmount<CurrencyExt>,
        recipient: AddressOrPair,
        deadline: number | string
    ): ExtrinsicData {
        const containsStablePool = trade.path.some(isStableMultiPathElement);
        if (containsStablePool) {
            return this._swapThroughStandardAndStablePools(trade, minimumAmountOut, recipient, deadline);
        } else {
            return this._swapThroughStandardPoolsOnly(trade, minimumAmountOut, recipient, deadline);
        }
    }

    private _getLiquidityDepositStandardPoolParams(
        amounts: PooledCurrencies,
        pool: StandardLiquidityPool,
        maxSlippageComplement: number,
        deadline: number
    ): ExtrinsicData {
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

        const addLiquidityToStandardPoolExtrinsic = this.api.tx.dexGeneral.addLiquidity(
            asset0,
            asset1,
            amount0Desired,
            amount1Desired,
            amount0Min,
            amount1Min,
            deadline
        );

        return { extrinsic: addLiquidityToStandardPoolExtrinsic, event: this.api.events.dexGeneral.LiquidityAdded };
    }

    private _getLiquidityDepositStablePoolParams(
        amounts: PooledCurrencies,
        pool: StableLiquidityPool,
        maxSlippageComplement: number,
        deadline: number,
        recipient: AddressOrPair
    ): ExtrinsicData {
        const minAmounts = amounts.map((amount) => amount.mul(maxSlippageComplement));
        const minimumLpTokenOut = pool.getLiquidityDepositLpTokenAmount(minAmounts[0]).toString(true);
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
            const addLiquidityToStablePoolExtrinsic = this.api.tx.dexStable.addLiquidity(
                pool.poolId,
                rawAmounts,
                minimumLpTokenOut,
                recipientAccount,
                deadline
            );

            return { extrinsic: addLiquidityToStablePoolExtrinsic, event: this.api.events.dexStable.AddLiquidity };
        }

        // Pass 0 for LP token amount - this will be automatically changed base on how much
        // liquidity is really added to base pool.
        const metaAmounts = pool.actuallyPooledCurrencies.map(
            (actuallyPooledCurrency) =>
                amounts.find((amount) => isCurrencyEqual(amount.currency, actuallyPooledCurrency.currency)) ||
                new MonetaryAmount(actuallyPooledCurrency.currency, 0)
        );
        const rawMetaAmounts = metaAmounts.map(monetaryAmountToRawString);

        const baseAmounts = amounts.filter((amount) => pool.basePool.involvesToken(amount.currency));
        const rawBaseAmounts = baseAmounts.map(monetaryAmountToRawString);

        if (
            metaAmounts.length + baseAmounts.length !==
            pool.actuallyPooledCurrencies.length + pool.basePool.actuallyPooledCurrencies.length
        ) {
            throw new Error("Invalid input amounts.");
        }

        const addLiquidityToStableMetaPoolExtrinsic = this.api.tx.dexStable.addPoolAndBasePoolLiquidity(
            pool.poolId,
            pool.basePool.poolId,
            rawMetaAmounts,
            rawBaseAmounts,
            minimumLpTokenOut,
            recipientAccount,
            deadline
        );

        return { extrinsic: addLiquidityToStableMetaPoolExtrinsic, event: this.api.events.dexStable.AddLiquidity };
    }

    public addLiquidity(
        amounts: PooledCurrencies,
        pool: LiquidityPool,
        maxSlippage: number,
        deadline: number,
        recipient: AddressOrPair
    ): ExtrinsicData {
        const maxSlippageComplement = 1 - maxSlippage / 100;

        let depositExtrinsic: SubmittableExtrinsic<ApiTypes>;
        let depositEvent: AugmentedEvent<ApiTypes> | undefined;
        if (isStandardPool(pool)) {
            ({ extrinsic: depositExtrinsic, event: depositEvent } = this._getLiquidityDepositStandardPoolParams(
                amounts,
                pool,
                maxSlippageComplement,
                deadline
            ));
        } else {
            ({ extrinsic: depositExtrinsic, event: depositEvent } = this._getLiquidityDepositStablePoolParams(
                amounts,
                pool,
                maxSlippageComplement,
                deadline,
                recipient
            ));
        }

        const lpTokenCurrencyId = newCurrencyId(this.api, pool.lpToken);
        const farmDepositExtrinsic = this.api.tx.farming.deposit(lpTokenCurrencyId, 123);
        const batchedExtrinsics = this.api.tx.utility.batchAll([depositExtrinsic, farmDepositExtrinsic]);

        return { extrinsic: batchedExtrinsics, event: depositEvent };
    }

    private _getLiquidityWithdrawalStandardPoolParams(
        amount: MonetaryAmount<StandardLpToken>,
        pool: StandardLiquidityPool,
        maxSlippageComplement: number,
        recipient: AddressOrPair,
        deadline: number
    ): ExtrinsicData {
        const outputAmounts = pool.getLiquidityWithdrawalPooledCurrencyAmounts(amount);
        const minAmounts = outputAmounts.map((amount) => amount.mul(maxSlippageComplement).toString(true));
        const recipientAccount = addressOrPairAsAccountId(this.api, recipient);

        const withdrawalExtrinsic = this.api.tx.dexGeneral.removeLiquidity(
            newCurrencyId(this.api, pool.token0),
            newCurrencyId(this.api, pool.token1),
            amount.toString(true),
            minAmounts[0],
            minAmounts[1],
            recipientAccount,
            deadline
        );

        return { extrinsic: withdrawalExtrinsic, event: this.api.events.dexGeneral.LiquidityRemoved };
    }

    private _getLiquidityWithdrawalStablePoolParams(
        amount: MonetaryAmount<StableLpToken>,
        pool: StableLiquidityPool,
        maxSlippageComplement: number,
        recipient: AddressOrPair,
        deadline: number
    ): ExtrinsicData {
        const outputAmounts = pool.getLiquidityWithdrawalPooledCurrencyAmounts(amount);
        const minAmounts = outputAmounts.map((amount) => amount.mul(maxSlippageComplement));
        const poolId = pool.poolId;
        const lpTokenAmount = amount.toString(true);
        const recipientAccount = addressOrPairAsAccountId(this.api, recipient);

        if (isStableMetaPool(pool)) {
            const basePoolId = pool.basePool.poolId;
            const minAmountsMeta = pool.actuallyPooledCurrencies
                .map(
                    (actuallyPooledCurrency) =>
                        minAmounts.find((amount) =>
                            isCurrencyEqual(amount.currency, actuallyPooledCurrency.currency)
                        ) || new MonetaryAmount(actuallyPooledCurrency.currency, 0)
                )
                .map(monetaryAmountToRawString);
            const minAmountsBase = minAmounts
                .filter((amount) => pool.basePool.involvesToken(amount.currency))
                .map(monetaryAmountToRawString);

            const withdrawLiquidityExtrinsic = this.api.tx.dexStable.removePoolAndBasePoolLiquidity(
                poolId,
                basePoolId,
                lpTokenAmount,
                minAmountsMeta,
                minAmountsBase,
                recipientAccount,
                deadline
            );

            return { extrinsic: withdrawLiquidityExtrinsic, event: this.api.events.dexStable.RemoveLiquidity };
        }

        const minAmountsRaw = minAmounts.map(monetaryAmountToRawString);
        const withdrawLiquidityExtrinsic = this.api.tx.dexStable.removeLiquidity(
            poolId,
            lpTokenAmount,
            minAmountsRaw,
            recipientAccount,
            deadline
        );

        return { extrinsic: withdrawLiquidityExtrinsic, event: this.api.events.dexStable.RemoveLiquidity };
    }

    public removeLiquidity(
        amount: MonetaryAmount<LpCurrency>,
        pool: LiquidityPool,
        maxSlippage: number, // Percentage.
        deadline: number,
        recipient: AddressOrPair
    ): ExtrinsicData {
        if (!isCurrencyEqual(amount.currency, pool.lpToken)) {
            throw new Error(
                `Input amount and pool lp token should be same but are: [${amount.currency.ticker}, ${pool.lpToken.ticker}].`
            );
        }
        const maxSlippageComplement = 1 - maxSlippage / 100;
        let withdrawalExtrinsic: SubmittableExtrinsic<ApiTypes>;
        let withdrawalEvent: AugmentedEvent<ApiTypes> | undefined;

        if (isStandardPool(pool)) {
            ({ extrinsic: withdrawalExtrinsic, event: withdrawalEvent } =
                this._getLiquidityWithdrawalStandardPoolParams(
                    amount as MonetaryAmount<StandardLpToken>,
                    pool,
                    maxSlippageComplement,
                    recipient,
                    deadline
                ));
        } else {
            ({ extrinsic: withdrawalExtrinsic, event: withdrawalEvent } = this._getLiquidityWithdrawalStablePoolParams(
                amount as MonetaryAmount<StableLpToken>,
                pool,
                maxSlippageComplement,
                recipient,
                deadline
            ));
        }

        const lpTokenCurrencyId = newCurrencyId(this.api, pool.lpToken);
        const farmWithdrawalExtrinsic = this.api.tx.farming.withdraw(lpTokenCurrencyId, amount.toString(true), 123);

        const batchedExtrinsics = this.api.tx.utility.batchAll([farmWithdrawalExtrinsic, withdrawalExtrinsic]);

        return { extrinsic: batchedExtrinsics, event: withdrawalEvent };
    }

    public claimFarmingRewards(claimableRewards: Map<LpCurrency, MonetaryAmount<CurrencyExt>[]>): ExtrinsicData {
        const claimExtrinsics: Array<SubmittableExtrinsic<"promise", ISubmittableResult>> = [];
        for (const [lpToken, rewards] of claimableRewards.entries()) {
            const lpTokenId = newCurrencyId(this.api, lpToken);
            rewards.forEach((rewardAmount) => {
                if (rewardAmount.toBig().gt(0)) {
                    const rewardCurrencyId = newCurrencyId(this.api, rewardAmount.currency);
                    const claimExtrinsic = this.api.tx.farming.claim(lpTokenId, rewardCurrencyId);
                    claimExtrinsics.push(claimExtrinsic);
                }
            });
        }

        const batchedExtrinsics = this.api.tx.utility.batchAll(claimExtrinsics);

        return { extrinsic: batchedExtrinsics, event: this.api.events.farming.RewardClaimed };
    }
}
