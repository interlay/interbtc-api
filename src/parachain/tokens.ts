import { AccountId } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { MonetaryAmount } from "@interlay/monetary-js";

import { newAccountId, newCurrencyId, newMonetaryAmount } from "../utils";
import { TransactionAPI } from "./transaction";
import { ChainBalance, CurrencyExt, parseOrmlTokensAccountData } from "../types";
import { OrmlTokensAccountData } from "@polkadot/types/lookup";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

/**
 * @category BTC Bridge
 */
export interface TokensAPI {
    /**
     * @param currency The currency specification, a `Monetary.js` object or `ForeignAsset`
     * @returns The total amount in the system
     */
    total<CurrencyT extends CurrencyExt>(currency: CurrencyT): Promise<MonetaryAmount<CurrencyT>>;
    /**
     * @param currency The currency specification, `Monetary.js` object or `ForeignAsset`
     * @param id The AccountId of a user
     * @returns The user's balance
     */
    balance(currency: CurrencyExt, id: AccountId): Promise<ChainBalance>;
    /**
     * Build a transfer extrinsic without sending it.
     *
     * @param destination The address of a user
     * @param amount The amount to transfer, as `Monetary.js` object or `ForeignAsset`
     * @returns A transfer submittable extrinsic.
     */
    buildTransferExtrinsic(
        destination: string,
        amount: MonetaryAmount<CurrencyExt>
    ): SubmittableExtrinsic<"promise", ISubmittableResult>;
    /**
     * @param destination The address of a user
     * @param amount The amount to transfer, as `Monetary.js` object or `ForeignAsset`
     */
    transfer(destination: string, amount: MonetaryAmount<CurrencyExt>): Promise<void>;
    /**
     * Subscribe to balance updates
     * @param currency The currency specification, `Monetary.js` object or `ForeignAsset`
     * @param account AccountId string
     * @param callback Function to be called whenever the balance of an account is updated.
     * Its parameters are (accountIdString, freeBalance)
     */
    subscribeToBalance(
        currency: CurrencyExt,
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
        freeBalance: MonetaryAmount<CurrencyExt>,
        lockedBalance?: MonetaryAmount<CurrencyExt>
    ): Promise<void>;
}

export class DefaultTokensAPI implements TokensAPI {
    constructor(private api: ApiPromise, private transactionAPI: TransactionAPI) {}

    async total<CurrencyT extends CurrencyExt>(currency: CurrencyT): Promise<MonetaryAmount<CurrencyT>> {
        const currencyId = newCurrencyId(this.api, currency);
        const rawAmount = await this.api.query.tokens.totalIssuance(currencyId);
        return newMonetaryAmount(rawAmount.toString(), currency);
    }

    async getAccountData(currency: CurrencyExt, id: AccountId): Promise<OrmlTokensAccountData> {
        return await this.api.query.tokens.accounts(id, newCurrencyId(this.api, currency));
    }

    async balance(currency: CurrencyExt, id: AccountId): Promise<ChainBalance> {
        const accountData = await this.getAccountData(currency, id);
        return parseOrmlTokensAccountData(accountData, currency);
    }

    async subscribeToBalance(
        currency: CurrencyExt,
        account: string,
        callback: (account: string, accountData: ChainBalance) => void
    ): Promise<() => void> {
        try {
            const accountId = newAccountId(this.api, account);
            const unsubscribe = await this.api.query.tokens.accounts(
                accountId,
                newCurrencyId(this.api, currency),
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

    buildTransferExtrinsic(
        destination: string,
        amount: MonetaryAmount<CurrencyExt>
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString(true));
        return this.api.tx.tokens.transfer(destination, newCurrencyId(this.api, amount.currency), amountAtomicUnit);
    }

    async transfer(destination: string, amount: MonetaryAmount<CurrencyExt>): Promise<void> {
        const amountAtomicUnit = this.api.createType("Balance", amount.toString(true));
        const transferTransaction = this.api.tx.tokens.transfer(
            destination,
            newCurrencyId(this.api, amount.currency),
            amountAtomicUnit
        );
        await this.transactionAPI.sendLogged(transferTransaction, this.api.events.tokens.Transfer, true);
    }

    async setBalance(
        accountId: AccountId,
        freeBalance: MonetaryAmount<CurrencyExt>,
        lockedBalance?: MonetaryAmount<CurrencyExt>
    ): Promise<void> {
        lockedBalance = lockedBalance ? lockedBalance : newMonetaryAmount(0, freeBalance.currency);
        const tx = this.api.tx.sudo.sudo(
            this.api.tx.tokens.setBalance(
                accountId,
                newCurrencyId(this.api, freeBalance.currency),
                freeBalance.toString(true),
                lockedBalance.toString(true)
            )
        );
        await this.transactionAPI.sendLogged(tx, this.api.events.tokens.BalanceSet, true);
    }
}
