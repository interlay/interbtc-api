import { AccountId } from "@polkadot/types/interfaces";
import { InterBtc, Interlay, KBtc, Kintsugi, Kusama, MonetaryAmount, Polkadot } from "@interlay/monetary-js";
import { BorrowPosition, CurrencyExt, LoanAsset, LendPosition, TickerToData, parseOrmlTokensAccountData, LendToken, LoanMarket } from "../types";
import { AssetRegistryAPI, DefaultAssetRegistryAPI } from "./asset-registry";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";
import { currencyIdToMonetaryCurrency, newCurrencyId, newMonetaryAmount } from "../utils";
import { InterbtcPrimitivesCurrencyId, PalletLoansMarket } from "@polkadot/types/lookup";
import { reduceArraysToObject } from "../utils/parse";
import { InterbtcPTokenId } from "../interfaces";

// TODO: remove mock data after real implementation is added 
const MOCKDATA_LOAN_ASSET_KBTC: LoanAsset = {
    currency: KBtc,
    lendApy: Big(10.2),
    borrowApy: Big(13.223),
    totalLiquidity: new MonetaryAmount(KBtc, Big(165.231651)),
    lendReward: {
        currency: Kintsugi,
        apy: Big(23.21)
    },
    borrowReward: null,
    availableCapacity: new MonetaryAmount(KBtc, Big(6.7935275343163)),
    liquidationThreshold: Big(80)
};

const MOCKDATA_LOAN_ASSET_KINT = {
    currency: Kintsugi,
    lendApy: Big(40.13),
    borrowApy: Big(53.91),
    totalLiquidity: new MonetaryAmount(Kintsugi, Big(479574.6808557974)),
    lendReward: null,
    borrowReward: null,
    availableCapacity: new MonetaryAmount(Kintsugi, Big(65593.3527534316)),
    liquidationThreshold: Big(80)
};

const MOCKDATA_LOAN_ASSETS: TickerToData<LoanAsset> = {
    "KBTC": MOCKDATA_LOAN_ASSET_KBTC,
    "KINT": MOCKDATA_LOAN_ASSET_KINT
};

const MOCKDATA_SUPPLY_POSITION_KBTC: LendPosition = {
    currency: KBtc,
    amount: new MonetaryAmount(KBtc, Big(2.79764257)),
    isCollateral: true,
    earnedInterest: new MonetaryAmount(KBtc, Big(0.0764257)),
    earnedReward: new MonetaryAmount(Kintsugi, Big(593.279764257))
};

const MOCKDATA_SUPPLY_POSITIONS = [
    MOCKDATA_SUPPLY_POSITION_KBTC
];

const MOCKDATA_BORROW_POSITION_INTR: BorrowPosition = {
    currency: Kintsugi,
    amount: new MonetaryAmount(Kintsugi, Big(1305.73946294014)),
    earnedReward: new MonetaryAmount(Kintsugi, Big(0))
};

const MOCKDATA_BORROW_POSITIONS = [
    MOCKDATA_BORROW_POSITION_INTR
];

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
    getMarkets(): Promise<Map<InterbtcPrimitivesCurrencyId, LoanMarket>>

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
    async getUnderlyingCurrencyFromLendCurrencyId(lendTokenId: InterbtcPTokenId): Promise<CurrencyExt>
}

export class DefaultLoansAPI implements LoansAPI {
    constructor(private api: ApiPromise, private assetRegistryAPI: AssetRegistryAPI) { }

    getCurrentBorrowBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>> {
        // return some mocked amount for the given currency as promise
        return Promise.resolve(new MonetaryAmount(currency, 4.2));
    }

    getCurrentCollateralBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>> {
        // return some mocked amount for the given currency as promise
        return Promise.resolve(new MonetaryAmount(currency, 12.34567));
    }

    static parseMarket(market: PalletLoansMarket): LoanMarket {
        return {
            ...market,
            lendTokenId: market.ptokenId.asPToken.toNumber()
        }
    }

    async getMarkets(): Promise<Map<InterbtcPrimitivesCurrencyId, LoanMarket>> {
        const markets = await this.api.query.loans.markets.entries();

        const result = new Map<InterbtcPrimitivesCurrencyId, LoanMarket>();
        for (let [key, market] of markets) {
            const marketData = DefaultLoansAPI.parseMarket(market.unwrap());
            result.set(key.args[0], marketData);
        }
        return result;
    }

    static getLendCurrencyFromUnderlyingCurrency(currency: CurrencyExt, lendTokenId: InterbtcPTokenId): LendToken {
        return {
            name: `q${currency.name}`,
            ticker: `q${currency.ticker}`,
            decimals: currency.decimals,
            lendToken: {
                id: lendTokenId.toNumber()
            }
        };
    }

    async getUnderlyingCurrencyFromLendCurrencyId(lendTokenId: InterbtcPTokenId): Promise<CurrencyExt> {
        const underlyingCurrencyId = await this.api.query.loans.underlyingAssetId(lendTokenId);

        // TODO: check type casting
        const underlyingCurrency = await currencyIdToMonetaryCurrency(this.assetRegistryAPI, this, underlyingCurrencyId as InterbtcPrimitivesCurrencyId);
        return DefaultLoansAPI.getLendCurrencyFromUnderlyingCurrency(underlyingCurrency, lendTokenId);

    }

    async getLendCurrencyIdFromUnderlyingCurrency(currency: CurrencyExt): Promise<InterbtcPrimitivesCurrencyId> {
        const currencyId = newCurrencyId(this.api, currency)
        const { value } = await this.api.query.loans.markets(currencyId);
        return value.ptokenId;
    }

    async getLendUnderlyingAmount(accountId: AccountId, lendTokenId: InterbtcPrimitivesCurrencyId): Promise<Big> {
        const lendTokenBalance = await this.api.query.tokens.accounts(accountId, lendTokenId);
        const lendTokenExchangeRate = await this.api.query.loans.exchangeRate(lendTokenId);
        const lendTokenBalanceInUnderlying = lendTokenBalance.free.mul(lendTokenExchangeRate)

        // TODO: Consider returning monetary amount here.
        return Big(lendTokenBalanceInUnderlying.toString());
    }

    async getLendPosition(accountId: AccountId, underlyingCurrency: CurrencyExt): Promise<LendPosition> {
        const lendTokenId = await this.getLendCurrencyIdFromUnderlyingCurrency(underlyingCurrency);

        const totalUnderlyingCurrencyAmount = await this.getLendUnderlyingAmount(accountId, lendTokenId);
        const accountEarned = await this.api.query.loans.accountEarned();

        const parsedAccountEarned = accountEarned as unknown as Big; //!! TODO: Parse 
        const depositedUnderlyingCurrencyAmount = totalUnderlyingCurrencyAmount.sub(parsedAccountEarned);

        const earnedReward = await this.api.query.loans.rewardAccrued();

        return {
            earnedInterest: newMonetaryAmount(parsedAccountEarned, underlyingCurrency),
                currency: underlyingCurrency,
                    amount: newMonetaryAmount(totalUnderlyingCurrencyAmount, underlyingCurrency),
                        earnedReward:


        }
    }

    getLendPositionsOfAccount(accountId: AccountId): Promise<Array<LendPosition>> {
        return Promise.resolve(MOCKDATA_SUPPLY_POSITIONS);
    }

    getBorrowPositionsOfAccount(accountId: AccountId): Promise<Array<BorrowPosition>> {
        return Promise.resolve(MOCKDATA_BORROW_POSITIONS);
    }

    getLoanAssets(): Promise<TickerToData<LoanAsset>> {
        return Promise.resolve(MOCKDATA_LOAN_ASSETS);
    }
}
