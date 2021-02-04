import { ApiPromise } from "@polkadot/api";
import { BTCCoreAPI } from "./btc-core";
import { u32 } from "@polkadot/types/primitive";
import { H256Le } from "../interfaces/default";

export const DEFAULT_STABLE_CONFIRMATIONS = 6;

export interface BTCRelayAPI {
    getStableBitcoinConfirmations(): Promise<number>;
    getLatestBlock(): Promise<H256Le>;
    getLatestBlockHeight(): Promise<u32>;
    verifyTransactionInclusion(txid: string, confirmations?: number, insecure?: boolean): Promise<void>;
}

export class DefaultBTCRelayAPI implements BTCRelayAPI {
    constructor(private api: ApiPromise, private btcCore: BTCCoreAPI) {}

    /**
     * @returns A global security parameter: the required block confirmations
     * for a transaction to be considered stable
     */
    async getStableBitcoinConfirmations(): Promise<number> {
        return this.api.query.btcRelay.stableBitcoinConfirmations().then((param) => param.toNumber());
    }

    /**
     * @returns The raw transaction data, represented as a Buffer object
     */
    async getLatestBlock(): Promise<H256Le> {
        return await this.api.query.btcRelay.bestBlock();
    }

    /**
     * @returns The height of the latest Bitcoin block that was rekayed by the BTC-Relay
     */
    async getLatestBlockHeight(): Promise<u32> {
        return await this.api.query.btcRelay.bestBlockHeight();
    }

    /**
     * Verifies the inclusion of a transaction with `txid` in the Bitcoin blockchain
     *
     * @param txid The ID of a Bitcoin transaction
     * @param confirmations The number of block confirmations needed to accept the inclusion proof.
     * This parameter is only used if the `insecure` parameter is set to `true`.
     */
    async verifyTransactionInclusion(
        txid: string,
        confirmations: number = DEFAULT_STABLE_CONFIRMATIONS
    ): Promise<void> {
        const merkleProof = await this.btcCore.getMerkleProof(txid);
        const confirmationsU32 = this.api.createType("u32", confirmations);
        // TODO: change this to RPC call
        this.api.tx.btcRelay.verifyTransactionInclusion(txid, merkleProof, confirmationsU32);
    }
}
