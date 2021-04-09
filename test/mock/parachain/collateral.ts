import { AccountId } from "@polkadot/types/interfaces/runtime";
import { CollateralAPI } from "../../../src/parachain/collateral";
import { IKeyringPair } from "@polkadot/types/types";
import Big from "big.js";

export class MockCollateralAPI implements CollateralAPI {
    subscribeToBalance(_account: string, _callback: (account: string, balance: Big) => void): Promise<() => void> {
        throw new Error("Method not implemented.");
    }

    async totalLocked(): Promise<Big> {
        return new Big("10");
    }

    async balanceLocked(_id: AccountId): Promise<Big> {
        return new Big("1");
    }

    async balance(_id: AccountId): Promise<Big> {
        return new Big("5");
    }

    async transfer(_address: string, _amount: Big): Promise<void> {
        return;
    }

    setAccount(_account?: IKeyringPair): void {
        return;
    }
}
