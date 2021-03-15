import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { Transaction } from "../utils";
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
     * @returns Total locked DOT collateral
     */
    totalLockedDOT(): Promise<Balance>;
    /**
     * @param id The ID of an account
     * @returns The reserved DOT balance of the given account
     */
    balanceLockedDOT(id: AccountId): Promise<Balance>;
    /**
     * @param id The ID of an account
     * @returns The free DOT balance of the given account
     */
    balanceDOT(id: AccountId): Promise<Balance>;
    /**
     * Send a transaction that transfers DOT from the caller's address to another address
     * @param address The recipient of the DOT transfer
     * @param amount The DOT balance to transfer
     */
    transferDOT(address: string, amount: string | number): Promise<void>;
}

export class DefaultCollateralAPI implements CollateralAPI {
    transaction: Transaction;

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.transaction = new Transaction(api);
    }

    totalLockedDOT(): Promise<Balance> {
        return this.api.query.collateral.totalCollateral();
    }

    async balanceLockedDOT(id: AccountId): Promise<Balance> {
        const account = await this.api.query.dot.account(id);
        return account.reserved;
    }

    async balanceDOT(id: AccountId): Promise<Balance> {
        const account = await this.api.query.dot.account(id);
        return account.free;
    }

    async transferDOT(address: string, amount: string | number): Promise<void> {
        if (!this.account) {
            throw new Error("Cannot transfer without account");
        }

        const transferTx = this.api.tx.dot.transfer(address, amount);
        await this.transaction.sendLogged(transferTx, this.account, this.api.events.dot.Transfer);
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
