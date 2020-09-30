import { BlockApi, TxApi } from "@interlay/esplora-btc-api";
import { AxiosResponse } from "axios";

const mainnetApiBasePath = "https://blockstream.info/api";
const testnetApiBasePath = "https://blockstream.info/testnet/api";

export interface BTCCoreAPI {
    getLatestBlock(): Promise<string>;
    getLatestBlockHeight(): Promise<number>;
    getMerkleProof(txid: string): Promise<string>;
}

export class DefaultBTCCoreAPI implements BTCCoreAPI {
    private blockApi: BlockApi;
    private txApi: TxApi;

    constructor(mainnet: boolean = true) {
        const basePath = mainnet ? mainnetApiBasePath : testnetApiBasePath;
        this.blockApi = new BlockApi({ basePath });
        this.txApi = new TxApi({ basePath });
    }

    getLatestBlock(): Promise<string> {
        return this.getData(this.blockApi.getLastBlockHash());
    }

    getLatestBlockHeight(): Promise<number> {
        return this.getData(this.blockApi.getLastBlockHeight());
    }

    getMerkleProof(txid: string): Promise<string> {
        return this.getData(this.txApi.getTxMerkleBlockProof(txid));
    }

    private getData<T>(response: Promise<AxiosResponse<T>>): Promise<T> {
        return response.then((v) => v.data);
    }
}
