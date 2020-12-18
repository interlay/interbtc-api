import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { sendLoggedTx } from "../utils";
import { AddressOrPair } from "@polkadot/api/submittable/types";

export interface CollateralAPI {
    setAccount(account: AddressOrPair): void;
    totalLockedDOT(): Promise<Balance>;
    balanceLockedDOT(id: AccountId): Promise<Balance>;
    balanceDOT(id: AccountId): Promise<Balance>;
    transferDOT(address: string, amount: string | number): Promise<void>;
}

export class DefaultCollateralAPI implements CollateralAPI {
    constructor(private api: ApiPromise, private account?: AddressOrPair) {}

    /**
     * @returns Total locked DOT collateral
     */
    totalLockedDOT(): Promise<Balance> {
        return this.api.query.collateral.totalCollateral();
    }

    /**
     * @param id The ID of an account
     * @returns The reserved DOT balance of the given account
     */
    async balanceLockedDOT(id: AccountId): Promise<Balance> {
        const account = await this.api.query.dot.account(id);
        return account.reserved;
    }

    /**
     * @param id The ID of an account
     * @returns The free DOT balance of the given account
     */
    async balanceDOT(id: AccountId): Promise<Balance> {
        const account = await this.api.query.dot.account(id);
        return account.free;
    }

    /**
     * Send a transaction that transfers DOT from the caller's address to another address
     * @param address The recipient of the DOT transfer
     * @param amount The DOT balance to transfer
     */
    async transferDOT(address: string, amount: string | number): Promise<void> {
        if (!this.account) {
            throw new Error("Cannot transfer without account");
        }

        const transferTx = this.api.tx.dot.transfer(address, amount);
        await sendLoggedTx(transferTx, this.account, this.api);
    }

    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
