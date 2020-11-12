import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { sendLoggedTx } from "../utils";
import { AddressOrPair } from "@polkadot/api/submittable/types";

export interface CollateralAPI {
    setAccount(account?: AddressOrPair): void;
    totalLockedDOT(): Promise<Balance>;
    balanceLockedDOT(id: AccountId): Promise<Balance>;
    balanceDOT(id: AccountId): Promise<Balance>;
    transferDOT(address: string, amount: string | number): Promise<void>;
}

export class DefaultCollateralAPI implements CollateralAPI {
    constructor(private api: ApiPromise, private account?: AddressOrPair) {}

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
        await sendLoggedTx(transferTx, this.account, this.api);
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
