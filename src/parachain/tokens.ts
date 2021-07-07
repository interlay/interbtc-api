import { AccountId } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";

import { btcToSat, newAccountId, satToBTC } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CurrencyIdLiteral, encodeCurrencyIdLiteral } from "../types";

/**
 * @category InterBTC Bridge
 * The type Big represents DOT or InterBTC denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface TokensAPI extends TransactionAPI {
    /**
     * @returns The total amount in the system
     */
    total(currency: CurrencyIdLiteral): Promise<Big>;
    /**
     * @param id The AccountId of a user
     * @returns The user's free balance
     */
    balance(currency: CurrencyIdLiteral, id: AccountId): Promise<Big>;
    /**
     * @param id The AccountId of a user
     * @returns The user's locked balance
     */
    balanceLocked(currency: CurrencyIdLiteral, id: AccountId): Promise<Big>;
    /**
     * @param destination The address of a user
     * @param amount The amount to transfer
     */
    transfer(currency: CurrencyIdLiteral, destination: string, amount: Big): Promise<void>;
    /**
     * Subscribe to balance updates, denominated in InterBTC
     * @param account AccountId string
     * @param callback Function to be called whenever the balance of an account is updated.
     * Its parameters are (accountIdString, freeBalance)
     */
    subscribeToBalance(
        currency: CurrencyIdLiteral,
        account: string,
        callback: (account: string, balance: Big) => void
    ): Promise<() => void>;
}

export class DefaultTokensAPI extends DefaultTransactionAPI implements TokensAPI {
    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async total(currency: CurrencyIdLiteral): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const encodedCurrency = encodeCurrencyIdLiteral(this.api, currency);
        const totalBN = await this.api.query.tokens.totalIssuance.at(head, encodedCurrency);
        // FIXME: should convert based on currency Id
        return satToBTC(totalBN);
    }

    async balance(currency: CurrencyIdLiteral, id: AccountId): Promise<Big> {
        const encodedCurrency = encodeCurrencyIdLiteral(this.api, currency);
        const account = await this.api.query.tokens.accounts(id, encodedCurrency);
        // FIXME: should convert based on currency Id
        return satToBTC(account.free);
    }

    async balanceLocked(currency: CurrencyIdLiteral, id: AccountId): Promise<Big> {
        const encodedCurrency = encodeCurrencyIdLiteral(this.api, currency);
        const account = await this.api.query.tokens.accounts(id, encodedCurrency);
        // FIXME: should convert based on currency Id
        return satToBTC(account.reserved);
    }

    async subscribeToBalance(
        currency: CurrencyIdLiteral,
        account: string,
        callback: (account: string, balance: Big) => void
    ): Promise<() => void> {
        try {
            const accountId = newAccountId(this.api, account);
            const encodedCurrency = encodeCurrencyIdLiteral(this.api, currency);
            const unsubscribe = await this.api.query.tokens.accounts(accountId, encodedCurrency, (balance) => {
                callback(account, satToBTC(balance.free));
            });
            return unsubscribe;
        } catch (error) {
            Promise.reject(error);
        }
        // as a fallback, return an empty void function
        return () => {
            return;
        };
    }

    async transfer(currency: CurrencyIdLiteral, destination: string, amount: Big): Promise<void> {
        // FIXME: should convert based on currency Id
        const amountSmallDenomination = this.api.createType("Balance", btcToSat(amount));
        const encodedCurrency = encodeCurrencyIdLiteral(this.api, currency);
        const transferTransaction = this.api.tx.tokens.transfer(destination, encodedCurrency, amountSmallDenomination);
        await this.sendLogged(transferTransaction, this.api.events.tokens.Transfer);
    }
}
