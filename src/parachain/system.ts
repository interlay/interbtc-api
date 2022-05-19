import { ApiPromise } from "@polkadot/api";
import { Header, BlockHash } from "@polkadot/types/interfaces";
import { SecurityStatusCode } from "@polkadot/types/lookup";

import { TransactionAPI } from "./transaction";

/**
 * @category BTC Bridge
 */
export interface SystemAPI {
    /**
     * @returns The current block number being processed.
     */
    getCurrentBlockNumber(): Promise<number>;

    /**
     * @returns The current active block number being processed.
     */
    getCurrentActiveBlockNumber(atBlock?: BlockHash): Promise<number>;

    /**
     * On every new parachain block, call the callback function with the new block header
     * @param callback Function to be called with every new block header
     */
    subscribeToFinalizedBlockHeads(callback: (blockHeader: Header) => void): Promise<() => void>;

    /**
     * On every new parachain block, call the callback function with the new block header
     * @param callback Function to be called with every new unfinalized block header
     */
     subscribeToCurrentBlockHeads(callback: (blockHeader: Header) => void): Promise<() => void>;

     /**
     * @returns The parachain status code object.
     */
    getStatusCode(): Promise<SecurityStatusCode>;
    /**
     * @remarks Upgrades runtime using `sudoUncheckedWeight`
     * @param code Hex-encoded wasm blob
     */
    setCode(code: string): Promise<void>;

    /**
     * @param blockNumber The block number to get the hash for
     * @returns The block hash for the given block number
     */
    getBlockHash(blockNumber: number): Promise<BlockHash>;
}

export class DefaultSystemAPI {
    constructor(private api: ApiPromise, private transactionAPI: TransactionAPI) {}

    async getCurrentBlockNumber(): Promise<number> {
        return (await this.api.query.system.number()).toNumber();
    }

    async getCurrentActiveBlockNumber(atBlock?: BlockHash): Promise<number> {
        const block = atBlock || (await this.api.rpc.chain.getFinalizedHead());
        return (await this.api.query.security.activeBlockCount.at(block)).toNumber();
    }

    async subscribeToFinalizedBlockHeads(callback: (blockHeader: Header) => void): Promise<() => void> {
        const unsub = await this.api.rpc.chain.subscribeFinalizedHeads((head) => {
            callback(head);
        });
        return unsub;
    }

    async subscribeToCurrentBlockHeads(callback: (blockHeader: Header) => void): Promise<() => void> {
        const unsub = await this.api.rpc.chain.subscribeAllHeads((head) => {
            callback(head);
        });
        return unsub;
    }

    async getStatusCode(): Promise<SecurityStatusCode> {
        return await this.api.query.security.parachainStatus();
    }

    async setCode(code: string): Promise<void> {
        const tx = this.api.tx.sudo.sudoUncheckedWeight(this.api.tx.system.setCode(code), 0);
        await this.transactionAPI.sendLogged(tx, this.api.events.system.CodeUpdated, true);
    }

    async getBlockHash(blockNumber: number): Promise<BlockHash> {
        return await this.api.query.system.blockHash(blockNumber);
    }
}
