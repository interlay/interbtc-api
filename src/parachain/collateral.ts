import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { ACCOUNT_NOT_SET_ERROR_MESSAGE, planckToDOT, Transaction } from "../utils";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import Big from "big.js";
/**
 * @category PolkaBTC Bridge
 */
export interface CollateralAPI {
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
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
     * Send a transaction that transfers from the caller's address to another address
     * @param address The recipient of the transfer
     * @param amount The balance to transfer
     */
    transfer(address: string, amount: string | number): Promise<void>;
}

export class DefaultCollateralAPI implements CollateralAPI {
    transaction: Transaction;

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
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

    async transfer(address: string, amount: string | number): Promise<void> {
        if (!this.account) {
            return Promise.reject(ACCOUNT_NOT_SET_ERROR_MESSAGE);
        }
        const transferTx = this.api.tx.dot.transfer(address, amount);
        await this.transaction.sendLogged(transferTx, this.account, this.api.events.dot.Transfer);
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
