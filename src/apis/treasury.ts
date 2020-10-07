import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";

export interface TreasuryAPI {
    totalPolkaBTC(): Promise<Balance>;
    balancePolkaBTC(id: AccountId): Promise<Balance>;
}

export class DefaultTreasuryAPI implements TreasuryAPI {
    constructor(private api: ApiPromise) {}

    totalPolkaBTC(): Promise<Balance> {
        return this.api.query.polkaBtc.totalIssuance();
    }

    async balancePolkaBTC(id: AccountId): Promise<Balance> {
        const account = await this.api.query.polkaBtc.account(id);
        return account.free;
    }
}
