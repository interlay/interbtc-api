import { SystemAPI } from "../../parachain/system";
import { ApiPromise } from "@polkadot/api";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { TypeRegistry, u32 } from "@polkadot/types";

export class MockSystemAPI implements SystemAPI {
    async getCurrentBlockNumber(): Promise<BlockNumber> {
        const registry = new TypeRegistry();
        return new u32(registry, 44) as BlockNumber;
    }
}
