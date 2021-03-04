import { ApiPromise } from "@polkadot/api";
import { BTCCoreAPI } from "../external/btc-core";
import { u32 } from "@polkadot/types/primitive";
import { H256Le } from "../interfaces/default";

export const DEFAULT_STABLE_CONFIRMATIONS = 6;

/**
 * @category PolkaBTC Bridge
 */
export interface BTCRelayAPI {
    /**
     * @returns A global security parameter: the required block confirmations
     * for a transaction to be considered stable
     */
    getStableBitcoinConfirmations(): Promise<number>;
    /**
     * @returns The raw transaction data, represented as a Buffer object
     */
    getLatestBlock(): Promise<H256Le>;
    /**
     * @returns The height of the latest Bitcoin block that was rekayed by the BTC-Relay
     */
    getLatestBlockHeight(): Promise<u32>;
    /**
     * Verifies the inclusion of a transaction with `txid` in the Bitcoin blockchain
     *
     * @param txid The ID of a Bitcoin transaction
     * @param confirmations The number of block confirmations needed to accept the inclusion proof.
     * This parameter is only used if the `insecure` parameter is set to `true`.
     */
    verifyTransactionInclusion(txid: string, confirmations?: number, insecure?: boolean): Promise<void>;
}

export class DefaultBTCRelayAPI implements BTCRelayAPI {
    constructor(private api: ApiPromise, private btcCore: BTCCoreAPI) {}

    async getStableBitcoinConfirmations(): Promise<number> {
        return this.api.query.btcRelay.stableBitcoinConfirmations().then((param) => param.toNumber());
    }

    async getLatestBlock(): Promise<H256Le> {
        return await this.api.query.btcRelay.bestBlock();
    }

    async getLatestBlockHeight(): Promise<u32> {
        return await this.api.query.btcRelay.bestBlockHeight();
    }

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
