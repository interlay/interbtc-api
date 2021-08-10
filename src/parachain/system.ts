import { ApiPromise } from "@polkadot/api";
import { Header } from "@polkadot/types/interfaces";
import { StatusCode } from "../interfaces/default";

/**
 * @category InterBTC Bridge
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

    /**
     * On every new parachain block, call the callback function with the new block header
     * @param callback Function to be called with every new block header
     */
    subscribeToNewBlockHeads(callback: (blockHeader: Header) => void): Promise<() => void>;

    /**
     * @returns The parachain status code object.
     */
    getStatusCode(): Promise<StatusCode>;
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

    async subscribeToNewBlockHeads(callback: (blockHeader: Header) => void): Promise<() => void> {
        const unsub = await this.api.rpc.chain.subscribeFinalizedHeads((head) => {
            callback(head);
        });
        return unsub;
    }

    async getStatusCode(): Promise<StatusCode> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.security.parachainStatus.at(head);
    }
}
