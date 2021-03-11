import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { sendLoggedTx } from "../utils";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { EventRecord } from "@polkadot/types/interfaces";

/**
 * @category PolkaBTC Bridge
 */
export interface TreasuryAPI {
    /**
     * @returns The total PolkaBTC issued in the system, denoted in Satoshi
     */
    totalPolkaBTC(): Promise<Balance>;
    /**
     * @param id The AccountId of a user
     * @returns The user's PolkaBTC balance, denoted in Satoshi
     */
    balancePolkaBTC(id: AccountId): Promise<Balance>;
    /**
     * @param destination The address of a user
     * @param amountSatoshi The amount in satoshi to transfer
     */
    transfer(destination: string, amountSatoshi: string): Promise<void>;
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
}

export class DefaultTreasuryAPI implements TreasuryAPI {
    constructor(private api: ApiPromise, private account?: AddressOrPair) {}

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }

    totalPolkaBTC(): Promise<Balance> {
        return this.api.query.polkaBtc.totalIssuance();
    }

    async balancePolkaBTC(id: AccountId): Promise<Balance> {
        const account = await this.api.query.polkaBtc.account(id);
        return account.free;
    }

    /**
     * @param events The EventRecord array returned after sending transfer transaction
     * @returns A boolean value
     */
    isTransferSuccessful(events: EventRecord[]): boolean {
        for (const { event } of events) {
            if (this.api.events.polkaBtc.Transfer.is(event)) {
                return true;
            }
        }
        return false;
    }

    async transfer(destination: string, amountSatoshi: string): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const transferTransaction = this.api.tx.polkaBtc.transfer(destination, amountSatoshi);
        const result = await sendLoggedTx(transferTransaction, this.account, this.api);

        if (!this.isTransferSuccessful(result.events)) {
            Promise.reject("Transfer failed");
        }
    }
}
