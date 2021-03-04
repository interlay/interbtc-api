import { ApiPromise } from "@polkadot/api";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";

/**
 * @category PolkaBTC Bridge
 */
export interface SystemAPI {
    /**
     * @returns The current block number being processed.
     */
    getCurrentBlockNumber(): Promise<BlockNumber>;
}

export class DefaultSystemAPI implements SystemAPI {
    constructor(private api: ApiPromise) {}

    async getCurrentBlockNumber(): Promise<BlockNumber> {
        return await this.api.query.system.number();
    }
}
