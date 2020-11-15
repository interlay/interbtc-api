import { ApiPromise } from "@polkadot/api";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";

export interface SystemAPI {
    getCurrentBlockNumber(): Promise<BlockNumber>;
}

export class DefaultSystemAPI implements SystemAPI {
    constructor(private api: ApiPromise) {}

    async getCurrentBlockNumber(): Promise<BlockNumber> {
        return await this.api.query.system.number();
    }
}
