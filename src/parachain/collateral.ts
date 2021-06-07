import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";

import { dotToPlanck, newAccountId, planckToDOT } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";

/**
 * @category PolkaBTC Bridge
 * The type Big represents DOT or PolkaBTC denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface CollateralAPI extends TransactionAPI {
    /**
     * @returns Total locked collateral
     */
    totalLocked(): Promise<Big>;
    /**
     * @param id The ID of an account
     * @returns The reserved balance of the given account
     */
    balanceLocked(id: AccountId): Promise<Big>;
    /**
     * @param id The ID of an account
     * @returns The free balance of the given account
     */
    balance(id: AccountId): Promise<Big>;
    /**
     * Subscribe to free balance updates, denominated in DOT
     * @param account AccountId string
     * @param callback Function to be called whenever the balance of an account is updated.
     * Its parameters are (accountIdString, freeBalance)
     */
     subscribeToBalance(account: string, callback: (account: string, balance: Big) => void): Promise<() => void>;
    /**
     * Send a transaction that transfers from the caller's address to another address
     * @param address The recipient of the transfer
     * @param amount The balance to transfer
     */
    transfer(address: string, amount: Big): Promise<void>;
}

export class DefaultCollateralAPI extends DefaultTransactionAPI implements CollateralAPI {

    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async totalLocked(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const totalLockedBN = await this.api.query.collateralCurrency.totalLocked.at(head);
        return new Big(planckToDOT(totalLockedBN));
    }

    async balanceLocked(id: AccountId): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const account = await this.api.query.collateral.account.at(head, id);
        return new Big(planckToDOT(account.reserved));
    }

    async balance(id: AccountId): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const account = await this.api.query.collateral.account.at(head, id);
        return new Big(planckToDOT(account.free));
    }

    async subscribeToBalance(account: string, callback: (account: string, balance: Big) => void): Promise<() => void> {
        try {
            const accountId = newAccountId(this.api, account);
            const unsubscribe = await this.api.query.collateral.account(accountId, (balance) => {
                callback(account, new Big(planckToDOT(balance.free)));
            });
            return unsubscribe;
        } catch (error) {
            console.log(`Error during collateral balance subscription callback: ${error}`);
        }
        // as a fallback, return an empty void function
        return () => {
            return;
        };
    }

    async transfer(address: string, amount: Big): Promise<void> {
        const amountSmallDenomination = this.api.createType("Balance", dotToPlanck(amount));
        const transferTx = this.api.tx.collateral.transfer(address, amountSmallDenomination);
        await this.sendLogged(transferTx, this.api.events.collateral.Transfer);
    }
}
