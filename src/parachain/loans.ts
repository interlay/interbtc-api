import { AccountId } from "@polkadot/types/interfaces";
import { MonetaryAmount } from "@interlay/monetary-js";
import {
    BorrowPosition,
    CurrencyExt,
    LoanAsset,
    TickerToData,
    LendToken,
    LoanPosition,
    AccountLiquidity,
    WrappedCurrency,
    CollateralPosition,
    UndercollateralizedPosition,
} from "../types";
import { AssetRegistryAPI } from "./asset-registry";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";
import {
    currencyIdToMonetaryCurrency,
    decodeFixedPointType,
    MS_PER_YEAR,
    decodePermill,
    newCurrencyId,
    newMonetaryAmount,
    storageKeyToNthInner,
    newAccountId,
} from "../utils";
import { InterbtcPrimitivesCurrencyId, LoansMarket } from "@polkadot/types/lookup";
import { StorageKey, Option } from "@polkadot/types";
import { TransactionAPI } from "./transaction";

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
     * Get all loan assets.
     *
     * @returns Array of all assets that can be lent and borrowed.
     * @remarks Method could be refactored to compute APR in lib if we can get underlyingCurrency/rewardCurrency exchange rate,
     * but is it safe to assume that exchange rate for btc/underlyingCurrency will be
     * always fed to the oracle and available?
     */
    getLoanAssets(): Promise<TickerToData<LoanAsset>>;

    /**
     * Get underlying currency of lend token id,
     *
     * @param lendTokenId Currency id of the lend token to get currency from
     * @returns Underlying CurrencyExt for provided lend token
     */
    getUnderlyingCurrencyFromLendTokenId(lendTokenId: InterbtcPrimitivesCurrencyId): Promise<CurrencyExt>;

    /**
     * Get all lend token currencies.
     *
     * @returns Array of all LendToken currencies.
     */
    getLendTokens(): Promise<Array<LendToken>>;

    /**
     * Get accrued subsidy rewards amount for the account
     *
     * @param accountId Account to get rewards for
     * @returns {MonetaryAmount<CurrencyExt>} Amount how much rewards the account can claim.
     */
    getAccruedRewardsOfAccount(accountId: AccountId): Promise<MonetaryAmount<CurrencyExt>>;

    /**
     * Lend currency to protocol for borrowing.
     *
     * @param {CurrencyExt} underlyingCurrency  Currency to lend.
     * @param {MonetaryAmount<CurrencyExt>} amount Amount of currency to lend.
     * @throws If there is not active market for `underlyingCurrency`.
     * @throws If `amount` is exceeding available balance of account.
     */
    lend(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void>;

    /**
     * Withdraw previously lent currency from protocol.
     *
     * @param {CurrencyExt} underlyingCurrency Currency to witdhraw.
     * @param {MonetaryAmount<CurrencyExt>} amount Amount of currency to withdraw.
     * @throws If there is not active market for `underlyingCurrency`.
     * @throws If `amount` is exceeding lent amount of account.
     * @throws If `underlyingCurrency` is used as collateral and withdrawal of
     * `amount` would bring account under collateral threshold.
     * @throws If there is not enough of underlying currency currently
     * available in the protocol.
     */
    withdraw(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void>;

    /**
     * Same as `withdraw`, but exits full position.
     *
     * @param underlyingCurrency Currency to fully withdraw.
     */
    withdrawAll(underlyingCurrency: CurrencyExt): Promise<void>;

    /**
     * Enable lend position of account as collateral for borrowing.
     *
     * @param underlyingCurrency Currency to enable as collateral.
     * @throws If there is no existing lend position for `currency`.
     */
    enableAsCollateral(underlyingCurrency: CurrencyExt): Promise<void>;

    /**
     * Enable lend position of account as collateral for borrowing.
     *
     * @param underlyingCurrency Currency to enable as collateral.
     * @throws If there is no existing lend position for `currency`.
     * @throws If disabling lend position of `currency` would bring
     * account under collateral threshold.
     */
    disableAsCollateral(underlyingCurrency: CurrencyExt): Promise<void>;

    /**
     * Claim subsidy rewards for all markets available for account.
     */
    claimAllSubsidyRewards(): Promise<void>;

    /**
     * Borrow currency from the protocol.
     *
     * @param underlyingCurrency Currency to borrow.
     * @param amount Amount of currency to borrow.
     * @throws If there is no active market for `underlyingCurrency`.
     * @throws If there is not enough collateral provided by account for
     * `amount` of `underlyingCurrency`.
     * @throws If `amount` is higher than available amount of `underlyingCurrency`
     * in the protocol.
     */
    borrow(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void>;

    /**
     * Repay borrowed loan.
     *
     * @param underlyingCurrency Currency to repay.
     * @param amount Amount of currency to repay.
     * @throws If there is no active market for `underlyingCurrency`.
     * @throws If `amount` is higher than available balance of account.
     * @throws If `amount` is higher than outstanding loan.
     */
    repay(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void>;

    /**
     * Same as `repay`, but repays full loan.
     *
     * @param underlyingCurrency Currency to repay.
     */
    repayAll(underlyingCurrency: CurrencyExt): Promise<void>;

    /**
     * Liquidates borrow position for exchange of collateral.
     *
     * @param borrower AccountId of borrower whose position will be liquidated.
     * @param liquidationCurrency Currency of position that will be liquidated.
     * @param repayAmount Amount to be repaid.
     * @param collateralCurrency Collateral currency which will be claimed by liquidator.
     */
    liquidateBorrowPosition(
        borrower: AccountId,
        liquidationCurrency: CurrencyExt,
        repayAmount: MonetaryAmount<CurrencyExt>,
        collateralCurrency: CurrencyExt
    ): Promise<void>;
    /**
     * @returns An array of `[AccountId, Shortage]` tuples, where `Shortage` is expressed in the
     * wrapped currency
     */
    getUndercollateralizedBorrowers(): Promise<Array<UndercollateralizedPosition>>;
    /**
     * @return An array of `AccountId`s which historically borrowed from the lending protocol.
     * This includes accounts with zero outstanding debt.
     */
    getBorrowerAccountIds(): Promise<Array<AccountId>>;
}

export class DefaultLoansAPI implements LoansAPI {
    constructor(
        private api: ApiPromise,
        private wrappedCurrency: WrappedCurrency,
        private assetRegistryAPI: AssetRegistryAPI,
        private transactionAPI: TransactionAPI
    ) {}

    // Wrapped call to make mocks in tests simple.
    async getLoansMarketsEntries(): Promise<[StorageKey<[InterbtcPrimitivesCurrencyId]>, Option<LoansMarket>][]> {
        const entries = await this.api.query.loans.markets.entries();
        return entries.filter((entry) => entry[1].isSome);
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

    async getUnderlyingCurrencyFromLendTokenId(lendTokenId: InterbtcPrimitivesCurrencyId): Promise<CurrencyExt> {
        const underlyingCurrencyId = await this.api.query.loans.underlyingAssetId(lendTokenId);

        const underlyingCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistryAPI,
            this,
            underlyingCurrencyId.unwrap()
        );

        return underlyingCurrency;
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
        const marketEntries = await this.getLoansMarketsEntries();

        return Promise.all(
            marketEntries.map(async ([key, market]) => {
                const lendTokenId = market.unwrap().lendTokenId;
                const underlyingCurrencyId = storageKeyToNthInner(key);
                const underlyingCurrency = await currencyIdToMonetaryCurrency(
                    this.assetRegistryAPI,
                    this,
                    underlyingCurrencyId
                );
                return DefaultLoansAPI.getLendTokenFromUnderlyingCurrency(underlyingCurrency, lendTokenId);
            })
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
                collateralPositions: collateral[i],
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
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): Promise<CollateralPosition | null> {
        const [underlyingCurrencyAmount] = await this.getLendPositionAmounts(
            accountId,
            lendTokenId,
            underlyingCurrencyId
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
        return borrowedAmount.mul(factor);
    }

    async _getBorrowPosition(
        accountId: AccountId,
        underlyingCurrency: CurrencyExt,
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): Promise<BorrowPosition | null> {
        const [borrowSnapshot, marketStatus] = await Promise.all([
            this.api.query.loans.accountBorrows(lendTokenId, accountId),
            this.api.rpc.loans.getMarketStatus(lendTokenId),
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
            underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
            lendTokenId: InterbtcPrimitivesCurrencyId
        ) => Promise<Position | null>
    ): Promise<Array<Position>> {
        const marketsEntries = await this.getLoansMarketsEntries();
        const marketsCurrencies = marketsEntries.map(([key, value]) => [
            storageKeyToNthInner(key),
            value.unwrap().lendTokenId,
        ]);

        const allMarketsPositions = await Promise.all(
            marketsCurrencies.map(async ([underlyingCurrencyId, lendTokenId]) => {
                const underlyingCurrency = await currencyIdToMonetaryCurrency(
                    this.assetRegistryAPI,
                    this,
                    underlyingCurrencyId
                );
                return getSinglePosition(accountId, underlyingCurrency, underlyingCurrencyId, lendTokenId);
            })
        );

        return <Array<Position>>allMarketsPositions.filter((position) => position !== null);
    }

    async getLendPositionsOfAccount(accountId: AccountId): Promise<Array<CollateralPosition>> {
        return this._getPositionsOfAccount(accountId, this._getLendPosition.bind(this));
    }

    async getBorrowPositionsOfAccount(accountId: AccountId): Promise<Array<BorrowPosition>> {
        return this._getPositionsOfAccount(accountId, this._getBorrowPosition.bind(this));
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
            .map((rewardSpeed) => this._calculateAnnualizedRewardAmount(rewardSpeed, blockTimeMs));
        // @note could be refactored to compute APR in lib if we can get underlyingCurrency/rewardCurrency exchange rate,
        // but is it safe to assume that exchange rate for btc/underlyingCurrency will be
        // always fed to the oracle and available?

        // Return rate per 1 UNIT of underlying currency and compute APR
        // on UI where all exchange rates are available.
        const lendRewardPerUnit = totalLiquidity.eq(0) ? lendRewardPerPool : lendRewardPerPool.div(totalLiquidity);
        const borrowRewardPerUnit = totalBorrows.eq(0) ? borrowRewardPerPool : borrowRewardPerPool.div(totalBorrows);

        return [lendRewardPerUnit, borrowRewardPerUnit];
    }

    _calculateAnnualizedRewardAmount(amountPerBlock: Big, blockTimeMs: number): Big {
        const blocksPerYear = MS_PER_YEAR.div(blockTimeMs);
        return amountPerBlock.mul(blocksPerYear);
    }

    async _getRewardCurrency(): Promise<CurrencyExt> {
        const rewardCurrencyId = this.api.consts.loans.rewardAssetId;

        return currencyIdToMonetaryCurrency(this.assetRegistryAPI, this, rewardCurrencyId);
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
        const underlyingCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistryAPI,
            this,
            underlyingCurrencyId
        );

        const [lendApy, borrowApy, [totalLiquidity, availableCapacity, totalBorrows], rewardCurrency] =
            await Promise.all([
                this._getLendApy(underlyingCurrencyId),
                this._getBorrowApy(underlyingCurrencyId),
                this._getTotalLiquidityCapacityAndBorrows(underlyingCurrency, underlyingCurrencyId),
                this._getRewardCurrency(),
            ]);

        // Format data.
        const liquidationThreshold = decodePermill(marketData.liquidationThreshold);
        const collateralThreshold = decodePermill(marketData.collateralFactor);

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
            },
        ];
    }

    async getLoanAssets(): Promise<TickerToData<LoanAsset>> {
        const marketsEntries = await this.getLoansMarketsEntries();
        const loanAssetsArray = await Promise.all(
            marketsEntries.map(([key, marketData]) =>
                this._getLoanAsset(storageKeyToNthInner(key), marketData.unwrap())
            )
        );

        const loanAssets = loanAssetsArray.reduce(
            (result, [currency, loanAsset]) => ({ ...result, [currency.ticker]: loanAsset }),
            {}
        );

        return loanAssets;
    }

    async getAccruedRewardsOfAccount(accountId: AccountId): Promise<MonetaryAmount<CurrencyExt>> {
        const [rewardAccrued, rewardCurrency] = await Promise.all([
            this.api.query.loans.rewardAccrued(accountId),
            this._getRewardCurrency(),
        ]);

        return newMonetaryAmount(rewardAccrued.toString(), rewardCurrency);
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

    async lend(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "lend");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const lendExtrinsic = this.api.tx.loans.mint(underlyingCurrencyId, amount.toString(true));

        await this.transactionAPI.sendLogged(lendExtrinsic, this.api.events.loans.Deposited, true);
    }

    async withdraw(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "withdraw");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const withdrawExtrinsic = this.api.tx.loans.redeem(underlyingCurrencyId, amount.toString(true));

        await this.transactionAPI.sendLogged(withdrawExtrinsic, this.api.events.loans.Redeemed, true);
    }

    async withdrawAll(underlyingCurrency: CurrencyExt): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "withdraw");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const withdrawExtrinsic = this.api.tx.loans.redeemAll(underlyingCurrencyId);

        await this.transactionAPI.sendLogged(withdrawExtrinsic, this.api.events.loans.Redeemed, true);
    }

    async enableAsCollateral(underlyingCurrency: CurrencyExt): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "enable collateral");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const enableCollateralExtrinsic = this.api.tx.loans.depositAllCollateral(underlyingCurrencyId);

        await this.transactionAPI.sendLogged(enableCollateralExtrinsic, this.api.events.loans.DepositCollateral, true);
    }

    async disableAsCollateral(underlyingCurrency: CurrencyExt): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "disable collateral");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const enableCollateralExtrinsic = this.api.tx.loans.withdrawAllCollateral(underlyingCurrencyId);

        await this.transactionAPI.sendLogged(enableCollateralExtrinsic, this.api.events.loans.WithdrawCollateral, true);
    }

    async claimAllSubsidyRewards(): Promise<void> {
        const claimRewardsExtrinsic = this.api.tx.loans.claimReward();

        await this.transactionAPI.sendLogged(claimRewardsExtrinsic, this.api.events.loans.RewardPaid, true);
    }

    async borrow(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "borrow");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const borrowExtrinsic = this.api.tx.loans.borrow(underlyingCurrencyId, amount.toString(true));

        await this.transactionAPI.sendLogged(borrowExtrinsic, this.api.events.loans.Borrowed, true);
    }

    async repay(underlyingCurrency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "repay debt of");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const repay = this.api.tx.loans.repayBorrow(underlyingCurrencyId, amount.toString(true));

        await this.transactionAPI.sendLogged(repay, this.api.events.loans.RepaidBorrow, true);
    }

    async repayAll(underlyingCurrency: CurrencyExt): Promise<void> {
        await this._checkMarketState(underlyingCurrency, "repay all debt of");

        const underlyingCurrencyId = newCurrencyId(this.api, underlyingCurrency);
        const repayAllExtrinsic = this.api.tx.loans.repayBorrowAll(underlyingCurrencyId);

        await this.transactionAPI.sendLogged(repayAllExtrinsic, this.api.events.loans.RepaidBorrow, true);
    }

    async liquidateBorrowPosition(
        borrower: AccountId,
        liquidationCurrency: CurrencyExt,
        repayAmount: MonetaryAmount<CurrencyExt>,
        collateralCurrency: CurrencyExt
    ): Promise<void> {
        const liquidationCurrencyId = newCurrencyId(this.api, liquidationCurrency);
        const collateralCurrencyId = newCurrencyId(this.api, collateralCurrency);
        const rawAmount = repayAmount.toString(true);
        const liquidateBorrowExtrinsic = this.api.tx.loans.liquidateBorrow(
            borrower,
            liquidationCurrencyId,
            rawAmount,
            collateralCurrencyId
        );

        await this.transactionAPI.sendLogged(liquidateBorrowExtrinsic, this.api.events.loans.LiquidatedBorrow, true);
    }
}
