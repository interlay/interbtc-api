import { SystemAPI } from "../../../src/parachain/system";

export class MockSystemAPI implements SystemAPI {
    async getCurrentBlockNumber(): Promise<number> {
        return 44;
    }
    async getCurrentActiveBlockNumber(): Promise<number> {
        return 42;
    }
}
