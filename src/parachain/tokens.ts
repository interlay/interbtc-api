import { AccountId } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";

import { newAccountId, newCurrencyId, newMonetaryAmount } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CurrencyUnit, tickerToCurrencyIdLiteral } from "../types";

/**
 * @category InterBTC Bridge
 */
export interface TokensAPI extends TransactionAPI {
    /**
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The total amount in the system
     */
    total<U extends CurrencyUnit>(currency: Currency<U>): Promise<MonetaryAmount<Currency<U>, U>>;
    /**
     * @param currency The currency specification, a `Monetary.js` object
     * @param id The AccountId of a user
     * @returns The user's free balance
     */
    balance<U extends CurrencyUnit>(currency: Currency<U>, id: AccountId): Promise<MonetaryAmount<Currency<U>, U>>;
    /**
     * @param currency The currency specification, a `Monetary.js` object
     * @param id The AccountId of a user
     * @returns The user's locked balance
     */
    balanceLocked<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>>;
    /**
     * @param destination The address of a user
     * @param amount The amount to transfer, as a `Monetary.js` object
     */
    transfer<U extends CurrencyUnit>(destination: string, amount: MonetaryAmount<Currency<U>, U>): Promise<void>;
    /**
     * Subscribe to balance updates
     * @param currency The currency specification, a `Monetary.js` object
     * @param account AccountId string
     * @param callback Function to be called whenever the balance of an account is updated.
     * Its parameters are (accountIdString, freeBalance)
     */
    subscribeToBalance<U extends CurrencyUnit>(
        currency: Currency<U>,
        account: string,
        callback: (account: string, balance: MonetaryAmount<Currency<U>, U>) => void
    ): Promise<() => void>;
}

export class DefaultTokensAPI extends DefaultTransactionAPI implements TokensAPI {
    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async total<U extends CurrencyUnit>(currency: Currency<U>): Promise<MonetaryAmount<Currency<U>, U>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const currencyId = tickerToCurrencyIdLiteral(currency.ticker);
        const rawAmount = await this.api.query.tokens.totalIssuance.at(head, currencyId);
        return newMonetaryAmount(rawAmount.toString(), currency);
    }

    async balance<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>> {
        const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
        const account = await this.api.query.tokens.accounts(id, newCurrencyId(this.api, currencyIdLiteral));
        return newMonetaryAmount(account.free.toString(), currency);
    }

    async balanceLocked<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>> {
        const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
        const account = await this.api.query.tokens.accounts(id, newCurrencyId(this.api, currencyIdLiteral));
        return newMonetaryAmount(account.reserved.toString(), currency);
    }

    async subscribeToBalance<U extends CurrencyUnit>(
        currency: Currency<U>,
        account: string,
        callback: (account: string, balance: MonetaryAmount<Currency<U>, U>) => void
    ): Promise<() => void> {
        try {
            const accountId = newAccountId(this.api, account);
            const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
            const unsubscribe = await this.api.query.tokens.accounts(
                accountId,
                newCurrencyId(this.api, currencyIdLiteral),
                (balance) => {
                    callback(account, newMonetaryAmount(balance.free.toString(), currency));
                }
            );
            return unsubscribe;
        } catch (error) {
            Promise.reject(error);
        }
        // as a fallback, return an empty void function
        return () => {
            return;
        };
    }

    async transfer<U extends CurrencyUnit>(destination: string, amount: MonetaryAmount<Currency<U>, U>): Promise<void> {
        const amountSmallDenomination = this.api.createType("Balance", amount.toString());
        const currencyIdLiteral = tickerToCurrencyIdLiteral(amount.currency.ticker);
        const transferTransaction = this.api.tx.tokens.transfer(
            destination,
            newCurrencyId(this.api, currencyIdLiteral),
            amountSmallDenomination
        );
        await this.sendLogged(transferTransaction, this.api.events.tokens.Transfer);
    }
}
