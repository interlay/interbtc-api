import { AccountId, Balance as BN } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { ACCOUNT_NOT_SET_ERROR_MESSAGE, Transaction } from "../utils";
import { AddressOrPair } from "@polkadot/api/submittable/types";

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
    totalLocked(): Promise<BN>;
    /**
     * @param id The ID of an account
     * @returns The reserved balance of the given account
     */
    balanceLocked(id: AccountId): Promise<BN>;
    /**
     * @param id The ID of an account
     * @returns The free balance of the given account
     */
    balance(id: AccountId): Promise<BN>;
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

    async totalLocked(): Promise<BN> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return this.api.query.collateral.totalCollateral.at(head);
    }

    async balanceLocked(id: AccountId): Promise<BN> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const account = await this.api.query.dot.account.at(head, id);
        return account.reserved;
    }

    async balance(id: AccountId): Promise<BN> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const account = await this.api.query.dot.account.at(head, id);
        return account.free;
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
