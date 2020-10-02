import { ApiPromise } from "@polkadot/api";
import { BTCCoreAPI } from "./btc-core";

export interface BTCRelayAPI {
    verifyTransactionInclusion(txid: string, confirmations?: number, insecure?: boolean): Promise<void>;
}

export class DefaultBTCRelayAPI implements BTCRelayAPI {
    constructor(private api: ApiPromise, private btcCore: BTCCoreAPI) {}

    async verifyTransactionInclusion(
        txid: string,
        confirmations: number = 6,
        insecure: boolean = false
    ): Promise<void> {
        const merkleProof = await this.btcCore.getMerkleProof(txid);
        // TODO: change this to RPC call
        this.api.tx.btcRelay.verifyTransactionInclusion(txid, merkleProof, confirmations, insecure);
    }
}
