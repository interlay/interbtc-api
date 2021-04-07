import { AccountId } from "@polkadot/types/interfaces/runtime";
import { CollateralAPI } from "../../../src/parachain/collateral";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import Big from "big.js";

export class MockCollateralAPI implements CollateralAPI {
    async totalLocked(): Promise<Big> {
        return new Big("10");
    }

    async balanceLocked(_id: AccountId): Promise<Big> {
        return new Big("1");
    }

    async balance(_id: AccountId): Promise<Big> {
        return new Big("5");
    }

    async transfer(_address: string, _amount: string | number): Promise<void> {
        return;
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }
}
