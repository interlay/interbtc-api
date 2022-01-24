import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import { Header, BlockHash } from "@polkadot/types/interfaces";
import { SecurityStatusCode } from "@polkadot/types/lookup";

import { DefaultTransactionAPI, TransactionAPI } from "./transaction";

/**
 * @category InterBTC Bridge
 */
export interface SystemAPI extends TransactionAPI {
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
     * @returns The parachain status code object.
     */
    getStatusCode(): Promise<SecurityStatusCode>;
    /**
     * @remarks Upgrades runtime using `sudoUncheckedWeight`
     * @param code Hex-encoded wasm blob
     */
    setCode(code: string): Promise<void>;
}

export class DefaultSystemAPI extends DefaultTransactionAPI implements SystemAPI {
    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async getCurrentBlockNumber(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return (await this.api.query.system.number.at(head)).toNumber();
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

    async getStatusCode(): Promise<SecurityStatusCode> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.security.parachainStatus.at(head);
    }

    async setCode(code: string): Promise<void> {
        const tx = this.api.tx.sudo.sudoUncheckedWeight(this.api.tx.system.setCode(code), 0);
        await this.sendLogged(tx, this.api.events.system.CodeUpdated);
    }
}
