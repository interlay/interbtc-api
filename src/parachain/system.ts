import { ApiPromise } from "@polkadot/api";

/**
 * @category PolkaBTC Bridge
 */
export interface SystemAPI {
    /**
     * @returns The current block number being processed.
     */
    getCurrentBlockNumber(): Promise<number>;
    /**
     * @returns The current active block number being processed.
     */
    getCurrentActiveBlockNumber(): Promise<number>;
}

export class DefaultSystemAPI implements SystemAPI {
    constructor(private api: ApiPromise) { }

    async getCurrentBlockNumber(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return (await this.api.query.system.number.at(head)).toNumber();
    }

    async getCurrentActiveBlockNumber(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return (await this.api.query.security.activeBlockCount.at(head)).toNumber();
    }
}
