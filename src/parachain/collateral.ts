import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { ACCOUNT_NOT_SET_ERROR_MESSAGE, dotToPlanck, planckToDOT, Transaction } from "../utils";
import { IKeyringPair } from "@polkadot/types/types";
import Big from "big.js";
/**
 * @category PolkaBTC Bridge
 */
export interface CollateralAPI {
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: IKeyringPair): void;
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
     * Subscribe to free balance updates
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

export class DefaultCollateralAPI implements CollateralAPI {
    transaction: Transaction;

    constructor(private api: ApiPromise, private account?: IKeyringPair) {
        this.transaction = new Transaction(api);
    }

    async totalLocked(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const totalLockedBN = await this.api.query.collateral.totalCollateral.at(head);
        return new Big(planckToDOT(totalLockedBN.toString()));
    }

    async balanceLocked(id: AccountId): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const account = await this.api.query.dot.account.at(head, id);
        return new Big(planckToDOT(account.reserved.toString()));
    }

    async balance(id: AccountId): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const account = await this.api.query.dot.account.at(head, id);
        return new Big(planckToDOT(account.free.toString()));
    }

    async subscribeToBalance(account: string, callback: (account: string, balance: Big) => void): Promise<() => void> {
        try {
            const accountId = this.api.createType("AccountId", account);
            const unsubscribe = await this.api.query.dot.account(accountId, (balance) => {
                callback(account, new Big(planckToDOT(balance.free.toString())));
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
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }
        const amountSmallDenomination = this.api.createType("Balance", dotToPlanck(amount.toString()));
        const transferTx = this.api.tx.dot.transfer(address, amountSmallDenomination);
        await this.transaction.sendLogged(transferTx, this.account, this.api.events.dot.Transfer);
    }

    setAccount(account: IKeyringPair): void {
        this.account = account;
    }
}
