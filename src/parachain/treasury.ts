import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";

import { btcToSat, satToBTC } from "../utils";
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
        const totalBN =  this.api.query.polkaBtc.totalIssuance.at(head);
        return new Big(satToBTC(totalBN.toString()));
    }

    async balance(id: AccountId): Promise<Big> {
        const account = await this.api.query.polkaBtc.account(id);
        return new Big(satToBTC(account.free.toString()));
    }

    async subscribeToBalance(account: string, callback: (account: string, balance: Big) => void): Promise<() => void> {
        try {
            const accountId = this.api.createType("AccountId", account);
            const unsubscribe = await this.api.query.polkaBtc.account(accountId, (balance) => {
                callback(account, new Big(satToBTC(balance.free.toString())));
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
        const amountSmallDenomination = this.api.createType("Balance", btcToSat(amount.toString()));
        const transferTransaction = this.api.tx.polkaBtc.transfer(destination, amountSmallDenomination);
        await this.sendLogged(transferTransaction, this.api.events.polkaBtc.Transfer);
    }
}
