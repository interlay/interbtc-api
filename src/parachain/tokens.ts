import { AccountId } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";

import { newAccountId, newCurrencyId, newMonetaryAmount } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CurrencyUnit, tickerToCurrencyIdLiteral } from "../types";
import { OrmlTokensAccountData } from "@polkadot/types/lookup";

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
     * @param currency The currency specification, a `Monetary.js` object
     * @param id The AccountId of a user
     * @returns The user's frozen balance
     */
    balanceFrozen<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>>;
    /**
     * @param currency The currency specification, a `Monetary.js` object
     * @param id The AccountId of a user
     * @returns The user's transferable balance (free - frozen)
     */
    balanceTransferable<U extends CurrencyUnit>(
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
    /**
     * @param accountId Account whose balance to set
     * @param freeBalance Free balance to set, as a Monetary.js object
     * @param lockedBalance Locked balance to set, as a Monetary.js object
     * @remarks This extrinsic is only valid if submitted by a sudo account
     */
    setBalance<U extends CurrencyUnit>(
        accountId: AccountId,
        freeBalance: MonetaryAmount<Currency<U>, U>,
        lockedBalance?: MonetaryAmount<Currency<U>, U>,
    ): Promise<void>
}

export class DefaultTokensAPI extends DefaultTransactionAPI implements TokensAPI {
    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async total<U extends CurrencyUnit>(currency: Currency<U>): Promise<MonetaryAmount<Currency<U>, U>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const currencyId = newCurrencyId(this.api, tickerToCurrencyIdLiteral(currency.ticker));
        const rawAmount = await this.api.query.tokens.totalIssuance.at(head, currencyId);
        return newMonetaryAmount(rawAmount.toString(), currency);
    }

    async getAccountData<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<OrmlTokensAccountData> {
        const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
        return await this.api.query.tokens.accounts(id, newCurrencyId(this.api, currencyIdLiteral));
    }

    async balance<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>> {
        const accountData = await this.getAccountData(currency, id);
        return newMonetaryAmount(accountData.free.toString(), currency);
    }

    async balanceLocked<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>> {
        const accountData = await this.getAccountData(currency, id);
        return newMonetaryAmount(accountData.reserved.toString(), currency);
    }

    async balanceFrozen<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>> {
        const accountData = await this.getAccountData(currency, id);
        return newMonetaryAmount(accountData.frozen.toString(), currency);
    }

    async balanceTransferable<U extends CurrencyUnit>(
        currency: Currency<U>,
        id: AccountId
    ): Promise<MonetaryAmount<Currency<U>, U>> {
        const [free, frozen] = await Promise.all([
            this.balance(currency, id),
            this.balanceLocked(currency, id)
        ]);
        return free.sub(frozen);
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
        const amountAtomicUnit = this.api.createType("Balance", amount.toString());
        const currencyIdLiteral = tickerToCurrencyIdLiteral(amount.currency.ticker);
        const transferTransaction = this.api.tx.tokens.transfer(
            destination,
            newCurrencyId(this.api, currencyIdLiteral),
            amountAtomicUnit
        );
        await this.sendLogged(transferTransaction, this.api.events.tokens.Transfer);
    }

    async setBalance<U extends CurrencyUnit>(
        accountId: AccountId,
        freeBalance: MonetaryAmount<Currency<U>, U>,
        lockedBalance?: MonetaryAmount<Currency<U>, U>,
    ): Promise<void> {
        lockedBalance = (lockedBalance ? lockedBalance : newMonetaryAmount(0, freeBalance.currency)) as MonetaryAmount<Currency<U>, U>;
        const tx = this.api.tx.sudo.sudo(
            this.api.tx.tokens.setBalance(
                accountId,
                newCurrencyId(this.api, tickerToCurrencyIdLiteral(freeBalance.currency.ticker)),
                freeBalance.toString(freeBalance.currency.rawBase),
                lockedBalance.toString(lockedBalance.currency.rawBase),
            )
        );
        await this.sendLogged(tx, this.api.events.tokens.BalanceSet);
    }
}
