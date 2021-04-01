import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { CollateralAPI } from "../../../src/parachain/collateral";
import { u128 } from "@polkadot/types/primitive";
import { TypeRegistry } from "@polkadot/types";
import { AddressOrPair } from "@polkadot/api/submittable/types";

export class MockCollateralAPI implements CollateralAPI {
    async totalLocked(): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 128);
    }

    async balanceLocked(_id: AccountId): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 64);
    }

    async balance(_id: AccountId): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 32);
    }

    async transfer(_address: string, _amount: string | number): Promise<void> {
        return;
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }
}
