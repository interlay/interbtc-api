import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { TreasuryAPI } from "../../../src/parachain/treasury";
import { u128 } from "@polkadot/types/primitive";
import { TypeRegistry } from "@polkadot/types";
import { AddressOrPair } from "@polkadot/api/submittable/types";

export class MockTreasuryAPI implements TreasuryAPI {
    async totalPolkaBTC(): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 128);
    }

    async balancePolkaBTC(_id: AccountId): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 128);
    }

    async transfer(_destination: string, _amountSatoshi: string): Promise<void> {
        return;
    }

    setAccount(_account: AddressOrPair): void {
        return;
    }
}
