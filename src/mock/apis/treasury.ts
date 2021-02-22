import { AccountId, Balance } from "@polkadot/types/interfaces/runtime";
import { TreasuryAPI } from "../../parachain/treasury";
import { u128 } from "@polkadot/types/primitive";
import { TypeRegistry } from "@polkadot/types";
import { AddressOrPair } from "@polkadot/api/submittable/types";

export class MockTreasuryAPI implements TreasuryAPI {
    async totalPolkaBTC(): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 128);
    }

    async balancePolkaBTC(id: AccountId): Promise<Balance> {
        const registry = new TypeRegistry();
        return new u128(registry, 128);
    }

    async transfer(destination: string, amountSatoshi: string): Promise<void> {
        return;
    }

    setAccount(account: AddressOrPair): void {
        return;
    }
}
