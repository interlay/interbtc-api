import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { CollateralAPI } from "../../apis/collateral";
import { u128 } from "@polkadot/types/primitive";
import { TypeRegistry } from "@polkadot/types";

export class MockCollateralAPI implements CollateralAPI {
    async totalLockedDOT(): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 128);
    }

    async balanceLockedDOT(_id: AccountId): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 64);
    }

    async balanceDOT(_id: AccountId): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 32);
    }
}
