import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";

import { btcToSat, newAccountId, satToBTC } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";

/**
 * @category PolkaBTC Bridge
 * The type Big represents DOT or PolkaBTC denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface TreasuryAPI extends TransactionAPI {
    /**
     * @returns The total amount issued in the system
     */
    total(): Promise<Big>;
    /**
     * @param id The AccountId of a user
     * @returns The user's balance
     */
    balance(id: AccountId): Promise<Big>;
    /**
     * @param destination The address of a user
     * @param amount The amount to transfer
     */
    transfer(destination: string, amount: Big): Promise<void>;
    /**
     * Subscribe to balance updates, denominated in PolkaBTC
     * @param account AccountId string
     * @param callback Function to be called whenever the balance of an account is updated.
     * Its parameters are (accountIdString, freeBalance)
     */
    subscribeToBalance(account: string, callback: (account: string, balance: Big) => void): Promise<() => void>;
}

export class DefaultTreasuryAPI extends DefaultTransactionAPI implements TreasuryAPI {

    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async total(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const totalBN = await this.api.query.wrapped.totalIssuance.at(head);
        return satToBTC(totalBN);
    }

    async balance(id: AccountId): Promise<Big> {
        const account = await this.api.query.wrapped.account(id);
        return satToBTC(account.free);
    }

    async subscribeToBalance(account: string, callback: (account: string, balance: Big) => void): Promise<() => void> {
        try {
            const accountId = newAccountId(this.api, account);
            const unsubscribe = await this.api.query.wrapped.account(accountId, (balance) => {
                callback(account, satToBTC(balance.free));
            });
            return unsubscribe;
        } catch (error) {
            console.log(`Error during treasury balance subscription callback: ${error}`);
        }
        // as a fallback, return an empty void function
        return () => {
            return;
        };
    }

    async transfer(destination: string, amount: Big): Promise<void> {
        const amountSmallDenomination = this.api.createType("Balance", btcToSat(amount));
        const transferTransaction = this.api.tx.wrapped.transfer(destination, amountSmallDenomination);
        await this.sendLogged(transferTransaction, this.api.events.wrapped.Transfer);
    }
}
