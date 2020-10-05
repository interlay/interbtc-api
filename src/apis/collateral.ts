import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";

export interface CollateralAPI {
    totalLockedDOT(): Promise<Balance>;
    balanceLockedDOT(id: AccountId): Promise<Balance>;
    balanceDOT(id: AccountId): Promise<Balance>;
}

export class DefaultCollateralAPI implements CollateralAPI {
    constructor(private api: ApiPromise) {}

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
}
