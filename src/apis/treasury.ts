import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { sendLoggedTx } from "../utils";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { EventRecord } from "@polkadot/types/interfaces";

export interface TreasuryAPI {
    totalPolkaBTC(): Promise<Balance>;
    balancePolkaBTC(id: AccountId): Promise<Balance>;
    transfer(destination: string, amountSatoshi: string): Promise<void>;
    setAccount(account: AddressOrPair): void;
}

export class DefaultTreasuryAPI implements TreasuryAPI {
    constructor(private api: ApiPromise, private account?: AddressOrPair) {}

    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void {
        this.account = account;
    }

    /**
     * @returns The total PolkaBTC issued in the system, denoted in Satoshi
     */
    totalPolkaBTC(): Promise<Balance> {
        return this.api.query.polkaBtc.totalIssuance();
    }

    /**
     * @param id The AccountId of a user
     * @returns The user's PolkaBTC balance, denoted in Satoshi
     */
    async balancePolkaBTC(id: AccountId): Promise<Balance> {
        const account = await this.api.query.polkaBtc.account(id);
        return account.free;
    }

    /**
     * @param events The EventRecord array returned after sending transfer transaction
     * @returns A boolean value
     */
    isTransferSuccessful(events: EventRecord[]): boolean {
        for (const {
            event: { method, section },
        } of events) {
            if (section == "polkaBtc" && method == "Transfer") {
                return true;
            }
        }

        return false;
    }

    /**
     * @param destination The address of a user
     * @param amountSatoshi The amount in satoshi to transfer
     */
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
