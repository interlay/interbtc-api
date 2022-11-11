import { AccountId } from "@polkadot/types/interfaces";
import { KBtc, Kintsugi, MonetaryAmount } from "@interlay/monetary-js";
import { BorrowPosition, CurrencyExt, LoanAsset, LendPosition, TickerToData, LendToken, LoanMarket } from "../types";
import { AssetRegistryAPI } from "./asset-registry";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";
import {
    currencyIdToMonetaryCurrency,
    decodeFixedPointType,
    newAccountId,
    newCurrencyId,
    newMonetaryAmount,
} from "../utils";
import { InterbtcPrimitivesCurrencyId, PalletLoansMarket } from "@polkadot/types/lookup";
import { StorageKey, Option } from "@polkadot/types";
import { TransactionAPI } from "./transaction";

// TODO: remove mock data after real implementation is added
const MOCKDATA_LOAN_ASSET_KBTC: LoanAsset = {
    currency: KBtc,
    lendApy: Big(10.2),
    borrowApy: Big(13.223),
    totalLiquidity: new MonetaryAmount(KBtc, Big(165.231651)),
    lendReward: {
        currency: Kintsugi,
        apy: Big(23.21),
    },
    borrowReward: null,
    availableCapacity: new MonetaryAmount(KBtc, Big(6.7935275343163)),
    liquidationThreshold: Big(80),
    collateralThreshold: Big(70),
    isActive: true,
};

const MOCKDATA_LOAN_ASSET_KINT = {
    currency: Kintsugi,
    lendApy: Big(40.13),
    borrowApy: Big(53.91),
    totalLiquidity: new MonetaryAmount(Kintsugi, Big(479574.6808557974)),
    lendReward: null,
    borrowReward: null,
    availableCapacity: new MonetaryAmount(Kintsugi, Big(65593.3527534316)),
    liquidationThreshold: Big(80),
    collateralThreshold: Big(60),
    isActive: false,
};

const MOCKDATA_LOAN_ASSETS: TickerToData<LoanAsset> = {
    KBTC: MOCKDATA_LOAN_ASSET_KBTC,
    KINT: MOCKDATA_LOAN_ASSET_KINT,
};

const MOCKDATA_SUPPLY_POSITION_KBTC: LendPosition = {
    currency: KBtc,
    amount: new MonetaryAmount(KBtc, Big(2.79764257)),
    isCollateral: true,
    earnedInterest: new MonetaryAmount(KBtc, Big(0.0764257)),
    earnedReward: new MonetaryAmount(Kintsugi, Big(593.279764257)),
};

const MOCKDATA_SUPPLY_POSITIONS = [MOCKDATA_SUPPLY_POSITION_KBTC];

const MOCKDATA_BORROW_POSITION_INTR: BorrowPosition = {
    currency: Kintsugi,
    amount: new MonetaryAmount(Kintsugi, Big(1305.73946294014)),
    earnedReward: new MonetaryAmount(Kintsugi, Big(0)),
    earnedDebt: new MonetaryAmount(Kintsugi, Big(35.231)),
};

const MOCKDATA_BORROW_POSITIONS = [MOCKDATA_BORROW_POSITION_INTR];

/**
 * @category Lending protocol
 */

export interface LoansAPI {
    // TODO: is this needed if we use getLoanAssets??
    /**
     * Get all markets.
     *
     * @returns Map of underlying currency CurrencyId to LoanMarket for all markets.
     */
    getMarkets(): Promise<Map<InterbtcPrimitivesCurrencyId, LoanMarket>>;

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
     * Claim subsidy reward for specified currency.
     *
     * @param currency Currency for which to claim reward.
     * @throws If no position exists for `currency` and account.
     */
    claimSubsidyReward(currency: CurrencyExt): Promise<void>;

    /**
     * Claim subsidy rewards for all currencies available for account.
     */
    claimAllSubsidyRewards(): Promise<void>;

    /**
     * Borrow currency from the protocol.
     *
     * @param currency Currency to borrow.
     * @param amount Amount of currency to borrow.
     * @throws If there is no active market for `currency`.
     * @throws If there is not enough collateral provided by account for
     * `amount` of `currency`.
     * @throws If `amount` is higher than available amount of `currency`
     * in the protocol.
     */
    borrow(currency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void>;

    /**
     * Repay borrowed loan.
     *
     * @param currency Currency to repay.
     * @param amount Amount of currency to repay.
     * @throws If there is no active market for `currency`.
     * @throws If `amount` is higher than available balance of account.
     * @throws If `amount` is higher than outstanding loan.
     */
    repay(currency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void>;

    /**
     * Same as `repay`, but repays full loan.
     *
     * @param currency Currency to repay.
     */
    repayAll(currency: CurrencyExt): Promise<void>;
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
    getLoansMarketsEntries(): Promise<[StorageKey<[InterbtcPrimitivesCurrencyId]>, Option<PalletLoansMarket>][]> {
        return this.api.query.loans.markets.entries();
    }

    async getMarkets(): Promise<Map<InterbtcPrimitivesCurrencyId, LoanMarket>> {
        const markets = await this.getLoansMarketsEntries();

        const result = new Map<InterbtcPrimitivesCurrencyId, LoanMarket>();
        for (const [key, market] of markets) {
            const marketData = DefaultLoansAPI.parseMarket(market.unwrap());
            result.set(key.args[0], marketData);
        }
        return result;
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

    async getLendAmountInUnderlyingCurrency(
        accountId: AccountId,
        lendTokenId: InterbtcPrimitivesCurrencyId,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId
    ): Promise<Big> {
        const [lendTokenBalance, exchangeRate] = await Promise.all([
            this.api.query.tokens.accounts(accountId, lendTokenId),
            this.api.query.loans.exchangeRate(underlyingCurrencyId),
        ]);
        const decodedExchangeRate = decodeFixedPointType(exchangeRate);
        const lendTokenBalanceTotal = lendTokenBalance.free.add(lendTokenBalance.reserved);

        return Big(lendTokenBalanceTotal.toString()).mul(decodedExchangeRate);
    }

    async getLendTokens(): Promise<LendToken[]> {
        const marketEntries = await this.getLoansMarketsEntries();

        return Promise.all(
            marketEntries.map(async ([key, market]) => {
                const lendTokenId = market.unwrap().lendTokenId;
                const underlyingCurrencyId = key.args[0];
                const underlyingCurrency = await currencyIdToMonetaryCurrency(
                    this.assetRegistryAPI,
                    this,
                    underlyingCurrencyId
                );
                return DefaultLoansAPI.getLendTokenFromUnderlyingCurrency(underlyingCurrency, lendTokenId);
            })
        );
    }

    async getLendPosition(
        accountId: AccountId,
        underlyingCurrency: CurrencyExt,
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): Promise<LendPosition> {
        const rewardCurrencyId = this.api.consts.loans.rewardAssetId;

        const [
            underlyingCurrencyAmount,
            accountEarned,
            accountDeposits,
            rewardAccrued,
            rewardCurrency,
            currentMarketStatus,
        ] = await Promise.all([
            this.getLendAmountInUnderlyingCurrency(accountId, lendTokenId, underlyingCurrencyId),
            this.api.query.loans.accountEarned(underlyingCurrencyId, accountId),
            this.api.query.loans.accountDeposits(lendTokenId, accountId),
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

    async getLendPositionsOfAccount(accountId: AccountId): Promise<Array<LendPosition>> {
        const marketsEntries = await this.getLoansMarketsEntries();
        const marketsCurrencies = marketsEntries.map(([key, value]) => [key.args[0], value.unwrap().lendTokenId]);

        return Promise.all(
            marketsCurrencies.map(async ([underlyingCurrencyId, lendTokenId]) => {
                const underlyingCurrency = await currencyIdToMonetaryCurrency(
                    this.assetRegistryAPI,
                    this,
                    underlyingCurrencyId
                );
                return this.getLendPosition(accountId, underlyingCurrency, underlyingCurrencyId, lendTokenId);
            })
        );
    }

    getBorrowPositionsOfAccount(accountId: AccountId): Promise<Array<BorrowPosition>> {
        return Promise.resolve(MOCKDATA_BORROW_POSITIONS);
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

    async _getLoanAssetFromMarket(
        underlyingCurrencyId: InterbtcPrimitivesCurrencyId,
        marketData: PalletLoansMarket
    ): Promise<[CurrencyExt, LoanAsset]> {
        //TODO

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

        const liquidationThreshold = decodeFixedPointType(marketData.liquidationThreshold);
        const collateralThreshold = decodeFixedPointType(marketData.collateralFactor);
        

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
            },
        ];
    }

    async getLoanAssets(): Promise<TickerToData<LoanAsset>> {
        // TODO: handle active/inactive markets
        const marketsEntries = await this.getLoansMarketsEntries();
        const loanAssets = await Promise.all(
            marketsEntries.map(([underlyingCurrency, marketData]) =>
                this._getLoanAssetFromMarket(underlyingCurrency.args[0], marketData.unwrap())
            )
        );

        return Promise.resolve(MOCKDATA_LOAN_ASSETS);
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

    async claimSubsidyReward(currency: CurrencyExt): Promise<void> {
        //TODO
    }

    async claimAllSubsidyRewards(): Promise<void> {
        //TODO
    }

    async borrow(currency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void> {
        //TODO
    }

    async repay(currency: CurrencyExt, amount: MonetaryAmount<CurrencyExt>): Promise<void> {
        //TODO
    }

    async repayAll(currency: CurrencyExt): Promise<void> {
        //TODO
    }
}
