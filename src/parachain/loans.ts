import { AccountId } from "@polkadot/types/interfaces";
import { KBtc, Kintsugi, MonetaryAmount } from "@interlay/monetary-js";
import { BorrowPosition, CurrencyExt, LoanAsset, LendPosition, TickerToData } from "../types";
import { AssetRegistryAPI } from "./asset-registry";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";

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
}

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
