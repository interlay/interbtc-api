import { AccountId } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";

import { newAccountId, newCurrencyId, newMonetaryAmount } from "../utils";
import { TransactionAPI } from "./transaction";
import { ChainBalance, parseOrmlTokensAccountData, tickerToCurrencyIdLiteral } from "../types";
import { OrmlTokensAccountData } from "@polkadot/types/lookup";

/**
 * @category BTC Bridge
 */
export interface TokensAPI {
    /**
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The total amount in the system
     */
    total(currency: Currency): Promise<MonetaryAmount<Currency>>;
    /**
     * @param currency The currency specification, a `Monetary.js` object
     * @param id The AccountId of a user
     * @returns The user's balance
     */
    balance(currency: Currency, id: AccountId): Promise<ChainBalance>;
    /**
     * @param destination The address of a user
     * @param amount The amount to transfer, as a `Monetary.js` object
     */
    transfer(destination: string, amount: MonetaryAmount<Currency>): Promise<void>;
    /**
     * Subscribe to balance updates
     * @param currency The currency specification, a `Monetary.js` object
     * @param account AccountId string
     * @param callback Function to be called whenever the balance of an account is updated.
     * Its parameters are (accountIdString, freeBalance)
     */
    subscribeToBalance(
        currency: Currency,
        account: string,
        callback: (account: string, balance: ChainBalance) => void
    ): Promise<() => void>;
    /**
     * @param accountId Account whose balance to set
     * @param freeBalance Free balance to set, as a Monetary.js object
     * @param lockedBalance Locked balance to set, as a Monetary.js object
     * @remarks This extrinsic is only valid if submitted by a sudo account
     */
    setBalance(
        accountId: AccountId,
        freeBalance: MonetaryAmount<Currency>,
        lockedBalance?: MonetaryAmount<Currency>
    ): Promise<void>;
}

export class DefaultTokensAPI implements TokensAPI {
    constructor(private api: ApiPromise, private transactionAPI: TransactionAPI) {}

    async total(currency: Currency): Promise<MonetaryAmount<Currency>> {
        const currencyId = newCurrencyId(this.api, tickerToCurrencyIdLiteral(currency.ticker));
        const rawAmount = await this.api.query.tokens.totalIssuance(currencyId);
        return newMonetaryAmount(rawAmount.toString(), currency);
    }

    async getAccountData(currency: Currency, id: AccountId): Promise<OrmlTokensAccountData> {
        const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
        return await this.api.query.tokens.accounts(id, newCurrencyId(this.api, currencyIdLiteral));
    }

    async balance(currency: Currency, id: AccountId): Promise<ChainBalance> {
        const accountData = await this.getAccountData(currency, id);
        return parseOrmlTokensAccountData(accountData, currency);
    }

    async subscribeToBalance(
        currency: Currency,
        account: string,
        callback: (account: string, accountData: ChainBalance) => void
    ): Promise<() => void> {
        try {
            const accountId = newAccountId(this.api, account);
            const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
            const unsubscribe = await this.api.query.tokens.accounts(
                accountId,
                newCurrencyId(this.api, currencyIdLiteral),
                (accountData) => {
                    callback(account, parseOrmlTokensAccountData(accountData, currency));
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

    async transfer(destination: string, amount: MonetaryAmount<Currency>): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString());
        const currencyIdLiteral = tickerToCurrencyIdLiteral(amount.currency.ticker);
        const transferTransaction = this.api.tx.tokens.transfer(
            destination,
            newCurrencyId(this.api, currencyIdLiteral),
            amountAtomicUnit
        );
        await this.transactionAPI.sendLogged(transferTransaction, this.api.events.tokens.Transfer, true);
    }

    async setBalance(
        accountId: AccountId,
        freeBalance: MonetaryAmount<Currency>,
        lockedBalance?: MonetaryAmount<Currency>
    ): Promise<void> {
        lockedBalance = lockedBalance ? lockedBalance : newMonetaryAmount(0, freeBalance.currency);
        const tx = this.api.tx.sudo.sudo(
            this.api.tx.tokens.setBalance(
                accountId,
                newCurrencyId(this.api, tickerToCurrencyIdLiteral(freeBalance.currency.ticker)),
                freeBalance.toString(true),
                lockedBalance.toString(true)
            )
        );
        await this.transactionAPI.sendLogged(tx, this.api.events.tokens.BalanceSet, true);
    }
}
