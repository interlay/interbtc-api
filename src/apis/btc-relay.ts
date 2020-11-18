import { ApiPromise } from "@polkadot/api";
import { BTCCoreAPI } from "./btc-core";
import { u32 } from "@polkadot/types/primitive";
import { H256Le } from "../interfaces/default";
import { BlockNumber } from "@polkadot/types/interfaces";

export const DEFAULT_STABLE_CONFIRMATIONS = 6;

export interface BTCRelayAPI {
    getStableBitcoinConfirmations(): Promise<number>;
    getLatestBlock(): Promise<H256Le>;
    getLatestBlockHeight(): Promise<u32>;
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

    async getParachainBlockHeight(): Promise<BlockNumber> {
        return (await this.api.query.btcRelay.parachainHeight() as BlockNumber);
    }

    async verifyTransactionInclusion(
        txid: string,
        confirmations: number = DEFAULT_STABLE_CONFIRMATIONS,
        insecure: boolean = false
    ): Promise<void> {
        const merkleProof = await this.btcCore.getMerkleProof(txid);
        // TODO: change this to RPC call
        this.api.tx.btcRelay.verifyTransactionInclusion(txid, merkleProof, confirmations, insecure);
    }
}
