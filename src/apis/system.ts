import { ApiPromise } from "@polkadot/api";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";

export interface SystemAPI {
    getCurrentBlockNumber(): Promise<BlockNumber>;
}

export class DefaultSystemAPI implements SystemAPI {
    constructor(private api: ApiPromise) {}

    /**
     * @returns The current block number being processed.
     */
    async getCurrentBlockNumber(): Promise<BlockNumber> {
        return await this.api.query.system.number();
    }
}
