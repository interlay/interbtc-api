import { ApiPromise } from "@polkadot/api";

import { ElectrsAPI } from "../external/electrs";
import { H256Le } from "../interfaces/default";

export const DEFAULT_STABLE_CONFIRMATIONS = 6;

/**
 * @category InterBTC Bridge
 */
export interface BTCRelayAPI {
    /**
     * @returns A global security parameter: the required block confirmations
     * for a transaction to be considered stable on Bitcoin
     */
    getStableBitcoinConfirmations(): Promise<number>;
    /**
     * @returns A global security parameter: the required block confirmations
     * for a transaction to be considered stable on the parachain
     */
    getStableParachainConfirmations(): Promise<number>;
    /**
     * @returns The raw transaction data, represented as a Buffer object
     */
    getLatestBlock(): Promise<H256Le>;
    /**
     * @returns The height of the latest Bitcoin block that was rekayed by the BTC-Relay
     */
    getLatestBlockHeight(): Promise<number>;
    /**
     * Verifies the inclusion of a transaction with `txid` in the Bitcoin blockchain
     *
     * @param txid The ID of a Bitcoin transaction
     * @param confirmations The number of block confirmations needed to accept the inclusion proof.
     */
    verifyTransactionInclusion(txid: string, confirmations?: number): Promise<void>;
}

export class DefaultBTCRelayAPI implements BTCRelayAPI {
    constructor(private api: ApiPromise, private electrsAPI: ElectrsAPI) {}

    async getStableBitcoinConfirmations(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return this.api.query.btcRelay.stableBitcoinConfirmations.at(head).then((param) => param.toNumber());
    }

    async getStableParachainConfirmations(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return this.api.query.btcRelay.stableParachainConfirmations.at(head).then((param) => param.toNumber());
    }

    async getLatestBlock(): Promise<H256Le> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.btcRelay.bestBlock.at(head);
    }

    async getLatestBlockHeight(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return (await this.api.query.btcRelay.bestBlockHeight.at(head)).toNumber();
    }

    async verifyTransactionInclusion(
        txid: string,
        confirmations: number = DEFAULT_STABLE_CONFIRMATIONS
    ): Promise<void> {
        const merkleProof = await this.electrsAPI.getMerkleProof(txid);
        const confirmationsU32 = this.api.createType("u32", confirmations);
        // TODO: change this to RPC call
        this.api.tx.btcRelay.verifyTransactionInclusion(txid, merkleProof, confirmationsU32);
    }
}
