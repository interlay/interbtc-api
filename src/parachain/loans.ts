import { AccountId } from "@polkadot/types/interfaces";
import { MonetaryAmount } from "@interlay/monetary-js";
import {
    BorrowPosition,
    CurrencyExt,
    LoanAsset,
    LendPosition,
    TickerToData,
    LendToken,
    LoanMarket,
    SubsidyReward,
    LoanPosition,
} from "../types";
import { AssetRegistryAPI } from "./asset-registry";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";
import {
    currencyIdToMonetaryCurrency,
    decodeFixedPointType,
    newCurrencyId,
    newMonetaryAmount,
    storageKeyToNthInner,
} from "../utils";
import { InterbtcPrimitivesCurrencyId, PalletLoansMarket } from "@polkadot/types/lookup";
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
    getLendPositionsOfAccount(accountId: AccountId): Promise<Array<LendPosition>>;

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
     *        await this._checkMarketState(underlyingCurrency, "withdraw");
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
}

export class DefaultLoansAPI implements LoansAPI {
    constructor(
        private api: ApiPromise,
        private assetRegistryAPI: AssetRegistryAPI,
        private transactionAPI: TransactionAPI
    ) {}

    static parseMarket(market: PalletLoansMarket): LoanMarket {
        // TODO
        return {
            ...market,
            lendTokenId: market.lendTokenId.asLendToken.toNumber(),
        };
    }

    // Wrapped call to make mocks in tests simple.
    async getLoansMarketsEntries(): Promise<[StorageKey<[InterbtcPrimitivesCurrencyId]>, Option<PalletLoansMarket>][]> {
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

    async getLendAmountInUnderlyingCurrency(
        accountId: AccountId,
        lendTokenId: InterbtcPrimitivesCurrencyId,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<Big> {
        const lendTokenBalance = await this.api.query.tokens.accounts(accountId, lendTokenId);
        const lendTokenBalanceTotal = lendTokenBalance.free.add(lendTokenBalance.reserved);
        const lendTokenBalanceInBig = Big(lendTokenBalanceTotal.toString());

        return this.convertLendTokenToUnderlyingCurrency(lendTokenBalanceInBig, underlyingCurrencyId);
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

    async _getLendPosition(
        accountId: AccountId,
        underlyingCurrency: CurrencyExt,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): Promise<LendPosition | null> {
        const rewardCurrencyId = this.api.consts.loans.rewardAssetId;

        const underlyingCurrencyAmount = await this.getLendAmountInUnderlyingCurrency(
            accountId,
            lendTokenId,
            underlyingCurrencyId
        );
        // Returns null if position does not exist
        if (underlyingCurrencyAmount.eq(0)) {
            return null;
        }

        const [accountEarned, accountDeposits, rewardAccrued, rewardCurrency, currentMarketStatus] = await Promise.all([
            this.api.query.loans.accountEarned(underlyingCurrencyId, accountId),
            this.api.query.loans.accountDeposits(lendTokenId, accountId),
            // TODO: fix - This is returning reward per account basis, not per lend position
            this.api.query.loans.rewardAccrued(accountId),
            currencyIdToMonetaryCurrency(this.assetRegistryAPI, this, rewardCurrencyId),
            this.api.rpc.loans.getMarketStatus(underlyingCurrencyId),
        ]);

        const startingExchangeRate = decodeFixedPointType(accountEarned.exchangeRatePrior);
        const currentExchangeRate = decodeFixedPointType(currentMarketStatus[2]);
        const earnedPrior = decodeFixedPointType(accountEarned.totalEarnedPrior);
        const earnedInterest = currentExchangeRate
            .sub(startingExchangeRate)
            .mul(underlyingCurrencyAmount) // TODO: check whether to use underlying or lendtoken balance here
            .add(earnedPrior);

        const isCollateral = !accountDeposits.isZero();
        const earnedReward = decodeFixedPointType(rewardAccrued);

        return {
            earnedInterest: newMonetaryAmount(earnedInterest, underlyingCurrency),
            currency: underlyingCurrency,
            amount: newMonetaryAmount(underlyingCurrencyAmount, underlyingCurrency),
            earnedReward: newMonetaryAmount(earnedReward, rewardCurrency),
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
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<BorrowPosition | null> {
        const [borrowSnapshot, marketStatus] = await Promise.all([
            this.api.query.loans.accountBorrows(underlyingCurrencyId, accountId),
            this.api.rpc.loans.getMarketStatus(underlyingCurrencyId),
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
            currency: underlyingCurrency,
            earnedReward: null, // TODO: add computation for earned subsidy reward
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

    async getLendPositionsOfAccount(accountId: AccountId): Promise<Array<LendPosition>> {
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

    async _getTotalLiquidityAndCapacity(
        underlyingCurrency: CurrencyExt,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<[MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>]> {
        const lendTokenId = await this.getLendTokenIdFromUnderlyingCurrency(underlyingCurrency);
        const [lendTokenTotalIssuance, totalBorrows, exchangeRate] = await Promise.all([
            this.api.query.tokens.totalIssuance(lendTokenId),
            await this.api.query.loans.totalBorrows(underlyingCurrencyId),
            this.api.query.loans.exchangeRate(underlyingCurrencyId),
        ]);

        const totalLiquidity = lendTokenTotalIssuance.mul(exchangeRate);
        // @note Available capacity to borrow is being computed in a different way
        // than in the runtime: https://docs.parallel.fi/parallel-finance/#2.1-internal-exchange-rate
        const availableCapacity = totalLiquidity.sub(totalBorrows);

        const totalLiquidityMonetary = newMonetaryAmount(totalLiquidity.toString(), underlyingCurrency);
        const availableCapacityMonetary = newMonetaryAmount(availableCapacity.toString(), underlyingCurrency);
        return [totalLiquidityMonetary, availableCapacityMonetary];
    }

    async _getLendAndBorrowYearlyRewardAmount(underlyingCurrencyId: InterbtcPrimitivesCurrencyId): Promise<[Big, Big]> {
        const [lendRewardSpeed, borrowRewardSpeed] = (
            await Promise.all([
                this.api.query.loans.rewardSupplySpeed(underlyingCurrencyId),
                this.api.query.loans.rewardBorrowSpeed(underlyingCurrencyId),
            ])
        ).map((rewardSpeed) => decodeFixedPointType(rewardSpeed));

        const blockTime = this.api.consts.timestamp.minimumPeriod.toNumber() * 2;
        const blocksPerYear = (86400 * 365 * 1000) / blockTime;
        // @note could be refactored to compute APR in lib if we can get underlyingCurrency/rewardCurrency exchange rate,
        // but is it safe to assume that exchange rate for btc/underlyingCurrency will be
        // always fed to the oracle and available?

        // Return rate per 1 UNIT of underlying currency and compute APR
        // on UI where all exchange rates are available.

        const lendRewardAmount = lendRewardSpeed.mul(blocksPerYear);
        const borrowRewardAmount = borrowRewardSpeed.mul(blocksPerYear);

        return [lendRewardAmount, borrowRewardAmount];
    }

    _constructSubsidyReward(amount: Big, currency: CurrencyExt): SubsidyReward | null {
        if (amount.eq(0)) {
            return null;
        }

        return {
            currency,
            amountPerUnitYearly: newMonetaryAmount(amount, currency),
        };
    }

    async _getLoanAsset(
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
        marketData: PalletLoansMarket
    ): Promise<[CurrencyExt, LoanAsset]> {
        const underlyingCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistryAPI,
            this,
            underlyingCurrencyId
        );

        const [
            lendApy,
            borrowApy,
            [totalLiquidity, availableCapacity],
            [lendRewardAmountYearly, borrowRewardAmountYearly],
        ] = await Promise.all([
            this._getLendApy(underlyingCurrencyId),
            this._getBorrowApy(underlyingCurrencyId),
            this._getTotalLiquidityAndCapacity(underlyingCurrency, underlyingCurrencyId),
            this._getLendAndBorrowYearlyRewardAmount(underlyingCurrencyId),
        ]);

        // Format data.
        const liquidationThreshold = decodeFixedPointType(marketData.liquidationThreshold);
        const collateralThreshold = decodeFixedPointType(marketData.collateralFactor);
        const lendReward = this._constructSubsidyReward(lendRewardAmountYearly, underlyingCurrency);
        const borrowReward = this._constructSubsidyReward(borrowRewardAmountYearly, underlyingCurrency);

        return [
            underlyingCurrency,
            {
                isActive: marketData.state.isActive,
                lendApy,
                borrowApy,
                currency: underlyingCurrency,
                totalLiquidity,
                availableCapacity,
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
}
