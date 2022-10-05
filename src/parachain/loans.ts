import { AccountId } from "@polkadot/types/interfaces";
import { InterBtc, Interlay, MonetaryAmount } from "@interlay/monetary-js";
import { BorrowPosition, CurrencyExt, LoanAsset, SupplyPosition, TickerToData } from "../types";
import { AssetRegistryAPI } from "./asset-registry";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";

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
     * Get the supply positions for given account.
     * 
     * @param accountId the account Id for which to get supply positions
     * @returns Asset ticker to SupplyPosition mapping of all supply positions of account.
     */
    getSupplyPositionsOfAccount(accountId: AccountId): Promise<TickerToData<SupplyPosition>>;

    /**
     * Get the borrow positions for given account.
     * 
     * @param accountId the account Id for which to get supply positions
     * @returns Asset ticker to SupplyPosition mapping of all supply positions of account.
     */
    getBorrowPositionsOfAccount(accountId: AccountId): Promise<TickerToData<BorrowPosition>>;

    /**
     * Get all loan assets.
     * 
     * @returns array of all 
     */
    getLoanAssets(): Promise<TickerToData<LoanAsset>>;
}

const MOCKDATA_LOAN_ASSET_IBTC: LoanAsset = {
    currency: InterBtc,
    supplyApy: Big(10.2),
    borrowApy: Big(13.223),
    totalLiquidity: new MonetaryAmount(InterBtc, Big(100000000000000)),
    reward: {
        currency: Interlay,
        apy: Big(23.21)
    },
    availableCapacity: new MonetaryAmount(InterBtc, Big(67935275343163)),
    liquidationThreshold: Big(80)
};

const MOCKDATA_LOAN_ASSET_INTR = {
    currency: Interlay,
    supplyApy: Big(40.13),
    borrowApy: Big(53.91),
    totalLiquidity: new MonetaryAmount(Interlay, Big(479746808557974)),
    reward: null,
    availableCapacity: new MonetaryAmount(Interlay, Big("652489679335275343163")),
    liquidationThreshold: Big(80)
};

const MOCKDATA_LOAN_ASSETS: TickerToData<LoanAsset> = {
    "IBTC": MOCKDATA_LOAN_ASSET_IBTC,
    "INTR": MOCKDATA_LOAN_ASSET_INTR
};

const MOCKDATA_SUPPLY_POSITION_IBTC: SupplyPosition = {
    currency: InterBtc,
    amount: new MonetaryAmount(InterBtc, Big(279764257)),
    isCollateral: true,
    earnedInterest: new MonetaryAmount(InterBtc, Big(764257)),
    earnedReward: new MonetaryAmount(Interlay, Big(593279764257))
};

const MOCKDATA_SUPPLY_POSITIONS = {
    "IBTC": MOCKDATA_SUPPLY_POSITION_IBTC
};

const MOCKDATA_BORROW_POSITION_INTR: BorrowPosition = {
    currency: Interlay,
    amount: new MonetaryAmount(Interlay, Big(130573946294014))
};

const MOCKDATA_BORROW_POSITIONS = {
    "INTR": MOCKDATA_BORROW_POSITION_INTR
};

export class DefaultLoansAPI implements LoansAPI {
    constructor(private api: ApiPromise, private assetRegistry: AssetRegistryAPI) { }

    getCurrentBorrowBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>> {
        // return some mocked amount for the given currency as promise
        return Promise.resolve(new MonetaryAmount(currency, 4.2));
    }

    getCurrentCollateralBalance(accountId: AccountId, currency: CurrencyExt): Promise<MonetaryAmount<CurrencyExt>> {
        // return some mocked amount for the given currency as promise
        return Promise.resolve(new MonetaryAmount(currency, 12.34567));
    }

    getSupplyPositionsOfAccount(accountId: AccountId): Promise<TickerToData<SupplyPosition>> {
        return Promise.resolve(MOCKDATA_SUPPLY_POSITIONS);
    }

    getBorrowPositionsOfAccount(accountId: AccountId): Promise<TickerToData<BorrowPosition>> {
        return Promise.resolve(MOCKDATA_BORROW_POSITIONS);
    }

    getLoanAssets(): Promise<TickerToData<LoanAsset>> {
        return Promise.resolve(MOCKDATA_LOAN_ASSETS);
    }
}
