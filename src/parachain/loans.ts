import { AccountId } from "@polkadot/types/interfaces";
import { KBtc, Kintsugi, MonetaryAmount } from "@interlay/monetary-js";
import { BorrowPosition, CurrencyExt, LoanAsset, LendPosition, TickerToData, LendToken, LoanMarket } from "../types";
import { AssetRegistryAPI } from "./asset-registry";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";
import { currencyIdToMonetaryCurrency, decodeFixedPointType, newCurrencyId, newMonetaryAmount } from "../utils";
import { InterbtcPrimitivesCurrencyId, PalletLoansMarket } from "@polkadot/types/lookup";

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
};

const MOCKDATA_BORROW_POSITIONS = [MOCKDATA_BORROW_POSITION_INTR];

/**
 * @category BTC Bridge
 */

export interface LoansAPI {
    /**
     * Get the current borrowed amount for a given account and currency
     *
     * @param accountId the account Id for which to get the borrowed amount
     * @param currency The currency to retrieve the borrowed amount for
     * @returns The amount borrowed
     */
    getCurrentBorrowBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>>;

    /**
     * Get the current borrowed amount for a given account and currency
     *
     * @param accountId the account Id for which to get the collateral balance
     * @param currency The currency to retrieve the collateral balance for
     * @returns The current collateral amount
     */
    getCurrentCollateralBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>>;

    /**
     * Get all markets.
     *
     * @returns Map of underlying currency CurrencyId to LoanMarket for all markets.
     */
    getMarkets(): Promise<Map<InterbtcPrimitivesCurrencyId, LoanMarket>>;

    /**
     * Get the supply positions for given account.
     *
     * @param accountId the account Id for which to get supply positions
     * @returns Array of supply positions of account.
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
}

export class DefaultLoansAPI implements LoansAPI {
    constructor(private api: ApiPromise, private assetRegistryAPI: AssetRegistryAPI) {}

    getCurrentBorrowBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>> {
        // return some mocked amount for the given currency as promise
        return Promise.resolve(new MonetaryAmount(currency, 4.2));
    }

    getCurrentCollateralBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>> {
        // return some mocked amount for the given currency as promise
        return Promise.resolve(new MonetaryAmount(currency, 12.34567));
    }

    static parseMarket(market: PalletLoansMarket): LoanMarket {
        // TODO
        return {
            ...market,
            lendTokenId: market.ptokenId.asPToken.toNumber(),
        };
    }

    async getMarkets(): Promise<Map<InterbtcPrimitivesCurrencyId, LoanMarket>> {
        const markets = await this.api.query.loans.markets.entries();

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
                id: lendTokenId.toNumber(),
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
        return DefaultLoansAPI.getLendTokenFromUnderlyingCurrency(underlyingCurrency, lendTokenId);
    }

    async getLendTokenIdFromUnderlyingCurrency(currency: CurrencyExt): Promise<InterbtcPrimitivesCurrencyId> {
        const currencyId = newCurrencyId(this.api, currency);
        const { value } = await this.api.query.loans.markets(currencyId);
        return value.ptokenId;
    }

    async getLendAmountInUnderlyingCurrency(
        accountId: AccountId,
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): Promise<Big> {
        const [lendTokenBalance, lendTokenExchangeRate] = await Promise.all([
            this.api.query.tokens.accounts(accountId, lendTokenId),
            this.api.query.loans.exchangeRate(lendTokenId),
        ]);
        const lendTokenBalanceInUnderlying = lendTokenBalance.free.mul(lendTokenExchangeRate);

        return Big(lendTokenBalanceInUnderlying.toString());
    }

    async getLendTokens(): Promise<LendToken[]> {
        const marketEntries = await this.api.query.loans.markets.entries();

        return Promise.all(
            marketEntries.map(async ([key, market]) => {
                const lendTokenId = market.unwrap().ptokenId;
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
        lendTokenId: InterbtcPrimitivesCurrencyId
    ): Promise<LendPosition> {
        const rewardCurrencyId = this.api.consts.loans.rewardAssetId;

        const [totalUnderlyingCurrencyAmount, accountEarned, accountDeposits, rewardAccrued, rewardCurrency] =
            await Promise.all([
                this.getLendAmountInUnderlyingCurrency(accountId, lendTokenId),
                this.api.query.loans.accountEarned(lendTokenId, accountId),
                this.api.query.loans.accountDeposits(lendTokenId, accountId),
                this.api.query.loans.rewardAccrued(accountId),
                currencyIdToMonetaryCurrency(this.assetRegistryAPI, this, rewardCurrencyId),
            ]);

        const isCollateral = !accountDeposits.isZero();
        const earnedInterest = decodeFixedPointType(accountEarned.totalEarnedPrior);
        const earnedReward = decodeFixedPointType(rewardAccrued);

        return {
            earnedInterest: newMonetaryAmount(earnedInterest, underlyingCurrency),
            currency: underlyingCurrency,
            amount: newMonetaryAmount(totalUnderlyingCurrencyAmount, underlyingCurrency),
            earnedReward: newMonetaryAmount(earnedReward, rewardCurrency),
            isCollateral,
        };
    }

    async getLendPositionsOfAccount(accountId: AccountId): Promise<Array<LendPosition>> {
        const marketsEntries = await this.api.query.loans.markets.entries();
        const marketsCurrencies = marketsEntries.map(([key, value]) => [key.args[0], value.unwrap().ptokenId]);

        return Promise.all(
            marketsCurrencies.map(async ([underlyingCurrencyId, lendTokenId]) => {
                const underlyingCurrency = await currencyIdToMonetaryCurrency(
                    this.assetRegistryAPI,
                    this,
                    underlyingCurrencyId
                );
                return this.getLendPosition(accountId, underlyingCurrency, lendTokenId);
            })
        );
    }

    getBorrowPositionsOfAccount(accountId: AccountId): Promise<Array<BorrowPosition>> {
        return Promise.resolve(MOCKDATA_BORROW_POSITIONS);
    }

    getLoanAssets(): Promise<TickerToData<LoanAsset>> {
        return Promise.resolve(MOCKDATA_LOAN_ASSETS);
    }
}
