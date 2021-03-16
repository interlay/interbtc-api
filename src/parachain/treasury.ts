import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { Transaction } from "../utils";
import { AddressOrPair } from "@polkadot/api/submittable/types";

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
    transaction: Transaction;

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.transaction = new Transaction(api);
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }

    async totalPolkaBTC(): Promise<Balance> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return this.api.query.polkaBtc.totalIssuance.at(head);
    }

    async balancePolkaBTC(id: AccountId): Promise<Balance> {
        const account = await this.api.query.polkaBtc.account(id);
        return account.free;
    }

    async transfer(destination: string, amountSatoshi: string): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const transferTransaction = this.api.tx.polkaBtc.transfer(destination, amountSatoshi);
        await this.transaction.sendLogged(transferTransaction, this.account, this.api.events.polkaBtc.Transfer);
    }
}
