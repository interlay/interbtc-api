import { AccountId } from "@polkadot/types/interfaces";
import { MonetaryAmount } from "@interlay/monetary-js";
import {
    BorrowPosition,
    CurrencyExt,
    LoanAsset,
    LendingStats,
    TickerToData,
    LendToken,
    LoanPosition,
    AccountLiquidity,
    WrappedCurrency,
    CollateralPosition,
    UndercollateralizedPosition,
    ExtrinsicData,
    AccruedRewards,
} from "../types";
import { ApiPromise } from "@polkadot/api";
import Big, { RoundingMode } from "big.js";
import {
    currencyIdToMonetaryCurrency,
    decodeFixedPointType,
    decodePermill,
    newCurrencyId,
    newMonetaryAmount,
    storageKeyToNthInner,
    calculateAnnualizedRewardAmount,
    adjustToThreshold,
    calculateBorrowLimit,
    getTotalAmountBtc,
    calculateLtv,
    calculateThreshold,
    calculateBorrowLimitBtcChangeFactory,
    calculateLtvAndThresholdsChangeFactory,
    newAccountId,
} from "../utils";
import { InterbtcPrimitivesCurrencyId, LoansMarket } from "@polkadot/types/lookup";
import { OracleAPI } from "./oracle";
import { CurrencyId } from "../interfaces";

/**
 * @category Lending protocol
 */

export interface LoansAPI {
    /**
     * Get the lend positions for given account.
     *
     * @param accountId the account Id for which to get supply positions
     * @returns Array of lend positions of account.
     */
    getLendPositionsOfAccount(accountId: AccountId): Promise<Array<CollateralPosition>>;

    /**
     * Get the borrow positions for given account.
     *
     * @param accountId the account Id for which to get borrow positions
     * @returns Array of borrow positions of account.
     */
    getBorrowPositionsOfAccount(accountId: AccountId): Promise<Array<BorrowPosition>>;

    /**
     * Get collateralization information about account's loans.
     *
     * @param lendPositions Lend positions of account.
     * @param borrowPositions Borrow positions of account.
     * @param loanAssets All loan assets data in TickerToData structure.
     * @return Collateral information about account based on passed positions.
     * @throws When `loanAssets` does not contain all of the loan positions currencies.
     */
    getLendingStats(
        lendPositions: Array<CollateralPosition>,
        borrowPositions: Array<BorrowPosition>,
        loanAssets: TickerToData<LoanAsset>
    ): LendingStats | undefined;

    /**
     * Get all loan assets.
     *
     * @returns Array of all assets that can be lent and borrowed.
     * @remarks Method could be refactored to compute APR in lib if we can get underlyingCurrency/rewardCurrency exchange rate,
     * but is it safe to assume that exchange rate for btc/underlyingCurrency will be
     * always fed to the oracle and available?
     */
    getLoanAssets(): Promise<TickerToData<LoanAsset>>;

    /**
     * Get all lend token currencies.
     *
     * @returns Array of all LendToken currencies.
     */
    getLendTokens(): Promise<Array<LendToken>>;

    /**
     * Get accrued subsidy rewards amounts for the account.
     *
     * @param accountId Account to get rewards for
     * @returns {Promise<AccruedRewards>} Total amount how much rewards the account can claim and rewards per market.
     */
    getAccruedRewardsOfAccount(accountId: AccountId): Promise<AccruedRewards>;

    /**
     * Lend currency to protocol for borrowing.
     *
     * @param {CurrencyExt} underlyingCurrency  Currency to lend.
     * @param {MonetaryAmount<CurrencyExt>} amount Amount of currency to lend.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     * @throws If there is not active market for `underlyingCurrency`.
     * @throws If `amount` is exceeding available balance of account.
     */
    lend(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData>;

    /**
     * Withdraw previously lent currency from protocol.
     *
     * @param {CurrencyExt} underlyingCurrency Currency to witdhraw.
     * @param {MonetaryAmount<CurrencyExt>} amount Amount of currency to withdraw.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     * @throws If there is not active market for `underlyingCurrency`.
     * @throws If `amount` is exceeding lent amount of account.
     * @throws If `underlyingCurrency` is used as collateral and withdrawal of
     * `amount` would bring account under collateral threshold.
     * @throws If there is not enough of underlying currency currently
     * available in the protocol.
     */
    withdraw(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData>;

    /**
     * Same as `withdraw`, but exits full position.
     *
     * @param underlyingCurrency Currency to fully withdraw.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    withdrawAll(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData>;

    /**
     * Enable lend position of account as collateral for borrowing.
     *
     * @param underlyingCurrency Currency to enable as collateral.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     * @throws If there is no existing lend position for `currency`.
     */
    enableAsCollateral(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData>;

    /**
     * Enable lend position of account as collateral for borrowing.
     *
     * @param underlyingCurrency Currency to enable as collateral.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     * @throws If there is no existing lend position for `currency`.
     * @throws If disabling lend position of `currency` would bring
     * account under collateral threshold.
     */
    disableAsCollateral(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData>;

    /**
     * Claim subsidy rewards for all markets available for account.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    claimAllSubsidyRewards(): ExtrinsicData;

    /**
     * Borrow currency from the protocol.
     *
     * @param underlyingCurrency Currency to borrow.
     * @param amount Amount of currency to borrow.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     * @throws If there is no active market for `underlyingCurrency`.
     * @throws If there is not enough collateral provided by account for
     * `amount` of `underlyingCurrency`.
     * @throws If `amount` is higher than available amount of `underlyingCurrency`
     * in the protocol.
     */
    borrow(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData>;

    /**
     * Repay borrowed loan.
     *
     * @param underlyingCurrency Currency to repay.
     * @param amount Amount of currency to repay.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     * @throws If there is no active market for `underlyingCurrency`.
     * @throws If `amount` is higher than available balance of account.
     * @throws If `amount` is higher than outstanding loan.
     */
    repay(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData>;

    /**
     * Same as `repay`, but repays full loan.
     *
     * @param underlyingCurrency Currency to repay.
     * @returns {Promise<ExtrinsicData>} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    repayAll(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData>;

    /**
     * Liquidates borrow position for exchange of collateral.
     *
     * @param borrower AccountId of borrower whose position will be liquidated.
     * @param liquidationCurrency Currency of position that will be liquidated.
     * @param repayAmount Amount to be repaid.
     * @param collateralCurrency Collateral currency which will be claimed by liquidator.
     * @returns {ExtrinsicData} A submittable extrinsic and an event that is emitted when extrinsic is submitted.
     */
    liquidateBorrowPosition(
        borrower: AccountId,
        liquidationCurrency: CurrencyExt,
        repayAmount: MonetaryAmount<CurrencyExt>,
        collateralCurrency: CurrencyExt
    ): ExtrinsicData;
    /**
     * @returns An array of `UndercollateralizedPosition`s, with all details needed to
     * liquidate them (accountId, shortfall - expressed in the wrapped currency, open borrow positions, collateral
     * deposits).
     */
    getUndercollateralizedBorrowers(): Promise<Array<UndercollateralizedPosition>>;
    /**
     * @return An array of `AccountId`s which historically borrowed from the lending protocol.
     * This includes accounts with zero outstanding debt.
     */
    getBorrowerAccountIds(): Promise<Array<AccountId>>;
    /**
     * @param accountId The account whose liquidity to query from the chain
     * @returns An `AccountLiquidity` object, which is valid even for accounts that didn't use the loans pallet at all
     */
    getLiquidationThresholdLiquidity(accountId: AccountId): Promise<AccountLiquidity>;
    /**
     * @returns An array of tuples denoting the underlying currency of a market, and the configuration of that market
     */
    getLoansMarkets(): Promise<[CurrencyExt, LoansMarket][]>;
}

export class DefaultLoansAPI implements LoansAPI {
    constructor(private api: ApiPromise, private wrappedCurrency: WrappedCurrency, private oracleAPI: OracleAPI) {}

    async getLoansMarkets(): Promise<[CurrencyExt, LoansMarket][]> {
        const entries = (await this.api.query.loans.markets.entries()).filter((entry) => entry[1].isSome);
        const parsedMarkets = await Promise.all(
            entries.map(async ([key, market]): Promise<[CurrencyExt, LoansMarket]> => {
                const underlyingCurrencyId = storageKeyToNthInner(key);
                const underlyingCurrency = await currencyIdToMonetaryCurrency(this.api, underlyingCurrencyId);
                return [underlyingCurrency, market.unwrap()];
            })
        );
        return parsedMarkets;
    }

    static getLendTokenFromUnderlyingCurrency(
        currency: CurrencyExt,
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): LendToken {
        return {
            name: `q${currency.name}`,
            ticker: `q${currency.ticker}`,
            decimals: currency.decimals,
            lendToken: {
                id: lendTokenId.asLendToken.toNumber(),
            },
        };
    }

    async getLendTokenIdFromUnderlyingCurrency(currency: CurrencyExt): Promise<InterbtcPrimitivesCurrencyId> {
        const currencyId = newCurrencyId(this.api, currency);
        const { value } = await this.api.query.loans.markets(currencyId);
        return value.lendTokenId;
    }

    async convertLendTokenToUnderlyingCurrency(
        amount: Big,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<Big> {
        const exchangeRate = await this.api.query.loans.exchangeRate(underlyingCurrencyId);
        const decodedExchangeRate = decodeFixedPointType(exchangeRate);

        return amount.mul(decodedExchangeRate);
    }

    /**
     * Get lend position amounts in both underlying and lend currencies.
     *
     * @param accountId AccountId to get position information about
     * @param lendTokenId LendToken CurrencyId of the position
     * @param underlyingCurrencyId Underlying CurrencyId of the position
     * @returns Lend position amounts in underlying currency and lend token
     */
    async getLendPositionAmounts(
        accountId: AccountId,
        lendTokenId: InterbtcPrimitivesCurrencyId,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<[Big, Big]> {
        const lendTokenBalance = await this.api.query.tokens.accounts(accountId, lendTokenId);
        const lendTokenBalanceTotal = lendTokenBalance.free.add(lendTokenBalance.reserved);
        const lendTokenBalanceInBig = Big(lendTokenBalanceTotal.toString());

        const amountInUnderlying = await this.convertLendTokenToUnderlyingCurrency(
            lendTokenBalanceInBig,
            underlyingCurrencyId
        );
        return [amountInUnderlying, lendTokenBalanceInBig];
    }

    async getLendTokens(): Promise<LendToken[]> {
        const marketEntries = await this.getLoansMarkets();
        return marketEntries.map(([currency, loansMarket]) =>
            DefaultLoansAPI.getLendTokenFromUnderlyingCurrency(currency, loansMarket.lendTokenId)
        );
    }

    async getBorrowerAccountIds(): Promise<Array<AccountId>> {
        const accountBorrows = await this.api.query.loans.accountBorrows.entries();
        return [
            // Even if two `AccountId`s store the same ID, the actual objects will not be equal when compared,
            // so need to use the string representation
            ...new Set(accountBorrows.map((key) => storageKeyToNthInner(key[0], 1).toString())),
        ].map((accountIdString, _index, _arr) => newAccountId(this.api, accountIdString));
    }

    async getUndercollateralizedBorrowers(): Promise<Array<UndercollateralizedPosition>> {
        const borrowers = await this.getBorrowerAccountIds();
        const [liquidity, borrows, collateral] = await Promise.all([
            Promise.all(borrowers.map(this.getLiquidationThresholdLiquidity.bind(this))),
            Promise.all(borrowers.map(this.getBorrowPositionsOfAccount.bind(this))),
            Promise.all(borrowers.map(this.getLendPositionsOfAccount.bind(this))),
        ]);
        const undercollateralizedPositions: Array<UndercollateralizedPosition> = [];
        for (let i = 0; i < borrowers.length; i++) {
            undercollateralizedPositions.push({
                accountId: borrowers[i],
                shortfall: liquidity[i].shortfall,
                collateralPositions: collateral[i].filter((position) => position.isCollateral),
                borrowPositions: borrows[i],
            });
        }
        return undercollateralizedPositions.filter((position) => !position.shortfall.isZero());
    }

    async getLiquidationThresholdLiquidity(accountId: AccountId): Promise<AccountLiquidity> {
        const [rawLiquidity, rawShortfall] = await this.api.rpc.loans.getLiquidationThresholdLiquidity(accountId);
        return {
            liquidity: newMonetaryAmount(decodeFixedPointType(rawLiquidity), this.wrappedCurrency, false),
            shortfall: newMonetaryAmount(decodeFixedPointType(rawShortfall), this.wrappedCurrency, false),
        };
    }

    async _getLendPosition(
        accountId: AccountId,
        underlyingCurrency: CurrencyExt,
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): Promise<CollateralPosition | null> {
        const [underlyingCurrencyAmount] = await this.getLendPositionAmounts(
            accountId,
            lendTokenId,
            newCurrencyId(this.api, underlyingCurrency)
        );
        // Returns null if position does not exist
        if (underlyingCurrencyAmount.eq(0)) {
            return null;
        }
        const accountDeposits = await this.api.query.loans.accountDeposits(lendTokenId, accountId);

        const isCollateral = !accountDeposits.isZero();

        return {
            amount: newMonetaryAmount(underlyingCurrencyAmount, underlyingCurrency),
            isCollateral,
        };
    }

    _calculateAccumulatedDebt(borrowedAmount: Big, snapshotBorrowIndex: Big, currentBorrowIndex: Big): Big {
        if (snapshotBorrowIndex.eq(0)) {
            return Big(0);
        }
        // @note Formula for computing total debt: https://docs.parallel.fi/parallel-finance/#2.6-interest-rate-index
        // To compute only earned debt, subtract 1 from factor
        const factor = currentBorrowIndex.div(snapshotBorrowIndex).sub(1);
        return borrowedAmount.mul(factor).round(0, RoundingMode.RoundUp);
    }

    async _getBorrowPosition(accountId: AccountId, underlyingCurrency: CurrencyExt): Promise<BorrowPosition | null> {
        const underlyingCurrencyPrimitive = newCurrencyId(this.api, underlyingCurrency);
        const [borrowSnapshot, marketStatus] = await Promise.all([
            this.api.query.loans.accountBorrows(underlyingCurrencyPrimitive, accountId),
            this.api.rpc.loans.getMarketStatus(underlyingCurrencyPrimitive),
        ]);

        const borrowedAmount = Big(borrowSnapshot.principal.toString());
        if (borrowedAmount.eq(0)) {
            return null;
        }
        const snapshotBorrowIndex = Big(decodeFixedPointType(borrowSnapshot.borrowIndex));
        const currentBorrowIndex = Big(decodeFixedPointType(marketStatus[6]));
        const accumulatedDebt = this._calculateAccumulatedDebt(borrowedAmount, snapshotBorrowIndex, currentBorrowIndex);

        return {
            amount: newMonetaryAmount(borrowedAmount, underlyingCurrency),
            accumulatedDebt: newMonetaryAmount(accumulatedDebt, underlyingCurrency),
        };
    }

    async _getPositionsOfAccount<Position extends LoanPosition>(
        accountId: AccountId,
        getSinglePosition: (
            accountId: AccountId,
            underlyingCurrency: CurrencyExt,
            lendTokenId: InterbtcPrimitivesCurrencyId
        ) => Promise<Position | null>
    ): Promise<Array<Position>> {
        const marketsEntries = await this.getLoansMarkets();
        return (
            await Promise.all(
                marketsEntries.map(([currency, loansMarket]) => {
                    return getSinglePosition(accountId, currency, loansMarket.lendTokenId);
                })
            )
        ).filter((position) => position !== null) as Array<Position>;
    }

    async getLendPositionsOfAccount(accountId: AccountId): Promise<Array<CollateralPosition>> {
        return this._getPositionsOfAccount(accountId, this._getLendPosition.bind(this));
    }

    async getBorrowPositionsOfAccount(accountId: AccountId): Promise<Array<BorrowPosition>> {
        return this._getPositionsOfAccount(accountId, this._getBorrowPosition.bind(this));
    }

    private _checkLoanAssetDataAvailability(positions: Array<LoanPosition>, loanAssets: TickerToData<LoanAsset>): void {
        for (const position of positions) {
            if (loanAssets[position.amount.currency.ticker] === undefined) {
                throw new Error(`No loan asset data found for currency ${position.amount.currency.name}.`);
            }
        }
    }

    getLendingStats(
        lendPositions: Array<CollateralPosition>,
        borrowPositions: Array<BorrowPosition>,
        loanAssets: TickerToData<LoanAsset>
    ): LendingStats {
        this._checkLoanAssetDataAvailability([...lendPositions, ...borrowPositions], loanAssets);

        const lendCollateralPositions = lendPositions.filter(({ isCollateral }) => isCollateral);
        const lendCollateralThresholdAdjustedPositions = lendCollateralPositions.map((position) => {
            const collateralTheshold = loanAssets[position.amount.currency.ticker].collateralThreshold;
            return {
                ...position,
                amount: adjustToThreshold(position.amount, collateralTheshold),
            };
        });
        const lendLiquidationThresholdAdjustedPositions = lendCollateralPositions.map((position) => {
            const liquidationThreshold = loanAssets[position.amount.currency.ticker].liquidationThreshold;
            return {
                ...position,
                amount: adjustToThreshold(position.amount, liquidationThreshold),
            };
        });

        const borrowPositionsWithDebt = borrowPositions.map(({ amount, accumulatedDebt, ...rest }) => ({
            ...rest,
            accumulatedDebt,
            amount: amount.add(accumulatedDebt),
        }));

        const totalLentBtc = getTotalAmountBtc(lendPositions, loanAssets);
        const totalBorrowedBtc = getTotalAmountBtc(borrowPositionsWithDebt, loanAssets);
        const totalCollateralBtc = getTotalAmountBtc(lendCollateralPositions, loanAssets);
        const totalCollateralThresholdAdjustedCollateralBtc = getTotalAmountBtc(
            lendCollateralThresholdAdjustedPositions,
            loanAssets
        );
        const totalLiquidationThresholdAdjustedCollateralBtc = getTotalAmountBtc(
            lendLiquidationThresholdAdjustedPositions,
            loanAssets
        );

        const borrowLimitBtc = calculateBorrowLimit(totalBorrowedBtc, totalCollateralThresholdAdjustedCollateralBtc);
        const ltv = calculateLtv(totalCollateralBtc, totalBorrowedBtc);
        const collateralThresholdWeightedAverage = calculateThreshold(
            totalCollateralBtc,
            totalCollateralThresholdAdjustedCollateralBtc
        );
        const liquidationThresholdWeightedAverage = calculateThreshold(
            totalCollateralBtc,
            totalLiquidationThresholdAdjustedCollateralBtc
        );

        const calculateBorrowLimitBtcChange = calculateBorrowLimitBtcChangeFactory(
            loanAssets,
            totalBorrowedBtc,
            totalCollateralThresholdAdjustedCollateralBtc
        );

        const calculateLtvAndThresholdsChange = calculateLtvAndThresholdsChangeFactory(
            loanAssets,
            totalBorrowedBtc,
            totalCollateralBtc,
            totalCollateralThresholdAdjustedCollateralBtc,
            totalLiquidationThresholdAdjustedCollateralBtc
        );

        return {
            totalBorrowedBtc,
            totalCollateralBtc,
            totalLentBtc,
            borrowLimitBtc,
            ltv,
            liquidationThresholdWeightedAverage,
            collateralThresholdWeightedAverage,
            calculateBorrowLimitBtcChange,
            calculateLtvAndThresholdsChange,
        };
    }

    async _getLendApy(underlyingCurrencyId: InterbtcPrimitivesCurrencyId): Promise<Big> {
        const rawLendApy = await this.api.query.loans.supplyRate(underlyingCurrencyId);

        // Return percentage
        return decodeFixedPointType(rawLendApy).mul(100);
    }

    async _getBorrowApy(underlyingCurrencyId: InterbtcPrimitivesCurrencyId): Promise<Big> {
        const rawBorrowApy = await this.api.query.loans.borrowRate(underlyingCurrencyId);

        // Return percentage
        return decodeFixedPointType(rawBorrowApy).mul(100);
    }

    async _getTotalLiquidityCapacityAndBorrows(
        underlyingCurrency: CurrencyExt,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<[MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>]> {
        const lendTokenId = await this.getLendTokenIdFromUnderlyingCurrency(underlyingCurrency);
        const [lendTokenTotalIssuance, totalBorrows, exchangeRate] = await Promise.all([
            this.api.query.tokens.totalIssuance(lendTokenId),
            this.api.query.loans.totalBorrows(underlyingCurrencyId),
            this.api.query.loans.exchangeRate(underlyingCurrencyId),
        ]);

        const [totalLiquidity, availableCapacity] = this._calculateLiquidityAndCapacityAmounts(
            underlyingCurrency,
            Big(lendTokenTotalIssuance.toString()),
            Big(totalBorrows.toString()),
            decodeFixedPointType(exchangeRate)
        );

        const totalBorrowsMonetary = newMonetaryAmount(totalBorrows.toString(), underlyingCurrency);

        return [totalLiquidity, availableCapacity, totalBorrowsMonetary];
    }

    _calculateLiquidityAndCapacityAmounts(
        underlyingCurrency: CurrencyExt,
        lendTokenTotalIssuance: Big,
        totalBorrows: Big,
        exchangeRate: Big
    ): [MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>] {
        const totalLiquidity = lendTokenTotalIssuance.mul(exchangeRate);
        // @note Available capacity to borrow is being computed in a different way
        // than in the runtime: https://docs.parallel.fi/parallel-finance/#2.1-internal-exchange-rate
        const availableCapacity = totalLiquidity.sub(totalBorrows);

        const totalLiquidityMonetary = newMonetaryAmount(totalLiquidity, underlyingCurrency);
        const availableCapacityMonetary = newMonetaryAmount(availableCapacity, underlyingCurrency);
        return [totalLiquidityMonetary, availableCapacityMonetary];
    }

    /**
     * Get the lend and borrow annual rewards for 1 UNIT of a given underlying currency id.
     *
     * @param underlyingCurrencyId currency id to get reward amounts for.
     * @returns Annualized lend and borrow rewards for 1 unit of the given underlying currency.
     */
    async _getLendAndBorrowYearlyRewardAmount(
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
        totalLiquidity: Big,
        totalBorrows: Big
    ): Promise<[Big, Big]> {
        const blockTimeMs = (await this.api.call.auraApi.slotDuration()).toNumber();

        const [lendRewardPerPool, borrowRewardPerPool] = (
            await Promise.all([
                this.api.query.loans.rewardSupplySpeed(underlyingCurrencyId),
                this.api.query.loans.rewardBorrowSpeed(underlyingCurrencyId),
            ])
        )
            .map((rewardSpeedRaw) => Big(rewardSpeedRaw.toString()))
            .map((rewardSpeed) => calculateAnnualizedRewardAmount(rewardSpeed, blockTimeMs));
        // @note could be refactored to compute APR in lib if we can get underlyingCurrency/rewardCurrency exchange rate,
        // but is it safe to assume that exchange rate for btc/underlyingCurrency will be
        // always fed to the oracle and available?

        // Return rate per 1 UNIT of underlying currency and compute APR
        // on UI where all exchange rates are available.
        const lendRewardPerUnit = totalLiquidity.eq(0) ? lendRewardPerPool : lendRewardPerPool.div(totalLiquidity);
        const borrowRewardPerUnit = totalBorrows.eq(0) ? borrowRewardPerPool : borrowRewardPerPool.div(totalBorrows);

        return [lendRewardPerUnit, borrowRewardPerUnit];
    }

    async _getRewardCurrency(): Promise<CurrencyExt> {
        const rewardCurrencyId = this.api.consts.loans.rewardAssetId;

        return currencyIdToMonetaryCurrency(this.api, rewardCurrencyId);
    }

    _getSubsidyReward(amount: Big, rewardCurrency: CurrencyExt): MonetaryAmount<CurrencyExt> | null {
        if (amount.eq(0)) {
            return null;
        }

        // Assumes native currency of parachain is always reward currency.
        return newMonetaryAmount(amount, rewardCurrency);
    }

    async _getLoanAsset(
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
        marketData: LoansMarket
    ): Promise<[CurrencyExt, LoanAsset]> {
        const underlyingCurrency = await currencyIdToMonetaryCurrency(this.api, underlyingCurrencyId);

        const [lendApy, borrowApy, [totalLiquidity, availableCapacity, totalBorrows], rewardCurrency, exchangeRate] =
            await Promise.all([
                this._getLendApy(underlyingCurrencyId),
                this._getBorrowApy(underlyingCurrencyId),
                this._getTotalLiquidityCapacityAndBorrows(underlyingCurrency, underlyingCurrencyId),
                this._getRewardCurrency(),
                this.oracleAPI.getExchangeRate(underlyingCurrency),
            ]);

        // Format data.
        const liquidationThreshold = decodePermill(marketData.liquidationThreshold);
        const collateralThreshold = decodePermill(marketData.collateralFactor);
        const supplyCap = newMonetaryAmount(marketData.supplyCap.toString(), underlyingCurrency);
        const borrowCap = newMonetaryAmount(marketData.borrowCap.toString(), underlyingCurrency);

        const [lendRewardAmountYearly, borrowRewardAmountYearly] = await this._getLendAndBorrowYearlyRewardAmount(
            underlyingCurrencyId,
            totalLiquidity.toBig(),
            totalBorrows.toBig()
        );
        const lendReward = this._getSubsidyReward(lendRewardAmountYearly, rewardCurrency);
        const borrowReward = this._getSubsidyReward(borrowRewardAmountYearly, rewardCurrency);

        return [
            underlyingCurrency,
            {
                isActive: marketData.state.isActive,
                lendApy,
                borrowApy,
                currency: underlyingCurrency,
                totalLiquidity,
                availableCapacity,
                totalBorrows,
                liquidationThreshold,
                collateralThreshold,
                lendReward,
                borrowReward,
                supplyCap,
                borrowCap,
                exchangeRate,
            },
        ];
    }

    async getLoanAssets(): Promise<TickerToData<LoanAsset>> {
        const marketsEntries = await this.getLoansMarkets();
        const loanAssetsArray = await Promise.all(
            marketsEntries.map(([currency, loansMarket]) =>
                this._getLoanAsset(newCurrencyId(this.api, currency), loansMarket)
            )
        );

        const loanAssets = loanAssetsArray.reduce(
            (result, [currency, loanAsset]) => ({ ...result, [currency.ticker]: loanAsset }),
            {}
        );

        return loanAssets;
    }

    async _getLatestSupplyIndex(
        underlyingCurrencyId: CurrencyId,
        lendTokenId: CurrencyId,
        currentBlockNumber: number
    ): Promise<Big> {
        const [marketSupplyState, marketSupplySpeed, totalIssuance] = await Promise.all([
            this.api.query.loans.rewardSupplyState(underlyingCurrencyId),
            // Total KINT / INTR tokens awarded per block to suppliers of this market
            this.api.query.loans.rewardSupplySpeed(underlyingCurrencyId),
            this.api.query.tokens.totalIssuance(lendTokenId),
        ]);
        const lastIndex = Big(marketSupplyState.index.toString());
        const supplyRewardSpeed = Big(marketSupplySpeed.toString());
        const totalSupply = Big(totalIssuance.toString());

        const deltaBlocks = currentBlockNumber - marketSupplyState.block.toNumber();
        const deltaIndex = supplyRewardSpeed.div(totalSupply).mul(deltaBlocks);

        return lastIndex.add(deltaIndex);
    }

    async _getAccruedSupplyReward(
        accountId: AccountId,
        underlyingCurrencyId: CurrencyId,
        lendTokenId: CurrencyId,
        rewardCurrency: CurrencyExt,
        currentBlock: number
    ): Promise<MonetaryAmount<CurrencyExt>> {
        const [latestSupplyIndex, rewardSupplierIndex, lendTokenRawBalance] = await Promise.all([
            this._getLatestSupplyIndex(underlyingCurrencyId, lendTokenId, currentBlock),
            this.api.query.loans.rewardSupplierIndex(underlyingCurrencyId, accountId),
            this.api.query.tokens.accounts(accountId, lendTokenId),
        ]);
        const supplierIndex = Big(rewardSupplierIndex.toString());
        const lendTokenBalance = Big(lendTokenRawBalance.free.toString()).add(lendTokenRawBalance.reserved.toString());
        const deltaIndex = latestSupplyIndex.sub(supplierIndex);

        const accruedRewardInPlanck = deltaIndex.mul(lendTokenBalance);
        const accruedSupplyReward = newMonetaryAmount(accruedRewardInPlanck, rewardCurrency);
        return accruedSupplyReward;
    }

    async _getLatestBorrowIndex(underlyingCurrencyId: CurrencyId, currentBlockNumber: number): Promise<Big> {
        const [marketBorrowState, marketBorrowSpeed, totalBorrowsRaw] = await Promise.all([
            this.api.query.loans.rewardBorrowState(underlyingCurrencyId),
            // Total KINT / INTR tokens awarded per block to suppliers of this market
            this.api.query.loans.rewardSpeed(underlyingCurrencyId),
            this.api.query.loans.totalBorrows(underlyingCurrencyId),
        ]);
        const lastBorrowIndex = Big(marketBorrowState.index.toString());
        const borrowRewardSpeed = Big(marketBorrowSpeed.toString());
        const totalBorrowed = Big(totalBorrowsRaw.toString());

        const deltaBlocks = currentBlockNumber - marketBorrowState.block.toNumber();
        const deltaIndex = borrowRewardSpeed.div(totalBorrowed).mul(deltaBlocks);

        return lastBorrowIndex.add(deltaIndex);
    }

    async _getAccruedBorrowReward(
        accountId: AccountId,
        underlyingCurrencyId: CurrencyId,
        rewardCurrency: CurrencyExt,
        currentBlock: number
    ): Promise<MonetaryAmount<CurrencyExt>> {
        const [latestBorrowIndex, rewardBorrowerIndex, accountBorrowSnapshot] = await Promise.all([
            this._getLatestBorrowIndex(underlyingCurrencyId, currentBlock),
            this.api.query.loans.rewardBorrowerIndex(underlyingCurrencyId, accountId),
            this.api.query.loans.accountBorrows(underlyingCurrencyId, accountId),
        ]);
        const borrowedAmount = Big(accountBorrowSnapshot.principal.toString());
        const borrowerIndex = Big(rewardBorrowerIndex.toString());
        const deltaIndex = latestBorrowIndex.sub(borrowerIndex);
        const accruedRewardInPlanck = deltaIndex.mul(borrowedAmount);
        const accruedBorrowReward = newMonetaryAmount(accruedRewardInPlanck, rewardCurrency);
        return accruedBorrowReward;
    }

    async getAccruedRewardsOfAccount(accountId: AccountId): Promise<AccruedRewards> {
        const [rewardAccrued, rewardCurrency, markets, blockNumber] = await Promise.all([
            this.api.query.loans.rewardAccrued(accountId),
            this._getRewardCurrency(),
            this.getLoansMarkets(),
            this.api.query.system.number(),
        ]);

        const totalAccrued = newMonetaryAmount(rewardAccrued.toString(), rewardCurrency);
        const currentBlock = blockNumber.toNumber();

        let totalRewards = totalAccrued;
        const rewardsPerMarket: TickerToData<{
            lend: MonetaryAmount<CurrencyExt> | null;
            borrow: MonetaryAmount<CurrencyExt> | null;
        }> = {};
        for (const [underlyingCurrency, market] of markets) {
            // the following computes the reward not claimed and not yet computed, for a single market
            const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);

            const [lendReward, borrowReward] = await Promise.all([
                this._getAccruedSupplyReward(
                    accountId,
                    underlyingCurrencyId,
                    market.lendTokenId,
                    rewardCurrency,
                    currentBlock
                ),
                this._getAccruedBorrowReward(accountId, underlyingCurrencyId, rewardCurrency, currentBlock),
            ]);
            rewardsPerMarket[underlyingCurrency.ticker].lend = lendReward;
            rewardsPerMarket[underlyingCurrency.ticker].borrow = borrowReward;

            totalRewards = totalRewards.add(lendReward).add(borrowReward);
        }
        return { total: totalRewards, perMarket: rewardsPerMarket };
    }

    // Check that market for given currency is added and in active state.
    async _checkMarketState(currency: CurrencyExt, action: string): Promise<void> {
        const underlyingCurrencyId = newCurrencyId(this.api, currency);
        const underlyingCurrencyMarket = await this.api.query.loans.markets(underlyingCurrencyId);

        if (underlyingCurrencyMarket.isNone) {
            throw new Error(`Cannot ${action} currency that does not have market created`);
        }
        if (underlyingCurrencyMarket.unwrap().state.isPending) {
            throw new Error(`Cannot ${action} currency that does not have active market.`);
        }
    }

    async lend(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "lend");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const lendExtrinsic = this.api.tx.loans.mint(underlyingCurrencyId, amount.toString(true));

        return { extrinsic: lendExtrinsic, event: this.api.events.loans.Deposited };
    }

    async withdraw(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "withdraw");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const withdrawExtrinsic = this.api.tx.loans.redeem(underlyingCurrencyId, amount.toString(true));

        return { extrinsic: withdrawExtrinsic, event: this.api.events.loans.Redeemed };
    }

    async withdrawAll(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "withdraw");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const withdrawExtrinsic = this.api.tx.loans.redeemAll(underlyingCurrencyId);

        return { extrinsic: withdrawExtrinsic, event: this.api.events.loans.Redeemed };
    }

    async enableAsCollateral(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "enable collateral");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const enableCollateralExtrinsic = this.api.tx.loans.depositAllCollateral(underlyingCurrencyId);

        return { extrinsic: enableCollateralExtrinsic, event: this.api.events.loans.DepositCollateral };
    }

    async disableAsCollateral(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "disable collateral");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const enableCollateralExtrinsic = this.api.tx.loans.withdrawAllCollateral(underlyingCurrencyId);

        return { extrinsic: enableCollateralExtrinsic, event: this.api.events.loans.WithdrawCollateral };
    }

    claimAllSubsidyRewards(): ExtrinsicData {
        const claimRewardsExtrinsic = this.api.tx.loans.claimReward();

        return { extrinsic: claimRewardsExtrinsic, event: this.api.events.loans.RewardPaid };
    }

    async borrow(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "borrow");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const borrowExtrinsic = this.api.tx.loans.borrow(underlyingCurrencyId, amount.toString(true));

        return { extrinsic: borrowExtrinsic, event: this.api.events.loans.Borrowed };
    }

    async repay(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "repay debt of");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const repayExtrinsic = this.api.tx.loans.repayBorrow(underlyingCurrencyId, amount.toString(true));

        return { extrinsic: repayExtrinsic, event: this.api.events.loans.RepaidBorrow };
    }

    async repayAll(underlyingCurrency: CurrencyExt): Promise<ExtrinsicData> {
        await this._checkMarketState(underlyingCurrency, "repay all debt of");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const repayAllExtrinsic = this.api.tx.loans.repayBorrowAll(underlyingCurrencyId);

        return { extrinsic: repayAllExtrinsic, event: this.api.events.loans.RepaidBorrow };
    }

    liquidateBorrowPosition(
        borrower: AccountId,
        liquidationCurrency: CurrencyExt,
        repayAmount: MonetaryAmount<CurrencyExt>,
        collateralCurrency: CurrencyExt
    ): ExtrinsicData {
        const liquidationCurrencyId = newCurrencyId(this.api, liquidationCurrency);
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrency);
        const rawAmount = repayAmount.toString(true);
        const liquidateBorrowExtrinsic = this.api.tx.loans.liquidateBorrow(
            borrower,
            liquidationCurrencyId,
            rawAmount,
            collateralCurrencyId
        );

        return { extrinsic: liquidateBorrowExtrinsic, event: this.api.events.loans.LiquidatedBorrow };
    }
}
