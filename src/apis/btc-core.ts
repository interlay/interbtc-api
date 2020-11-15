import { BlockApi, Status, TxApi, ScripthashApi, Transaction } from "@interlay/esplora-btc-api";
import { AxiosResponse } from "axios";
import * as bitcoinjs from "bitcoinjs-lib";

const mainnetApiBasePath = "https://blockstream.info/api";
const testnetApiBasePath = "https://electr-testnet.do.polkabtc.io";

export type TxStatus = {
    confirmed: boolean;
    confirmations: number;
};

export type TxOutput = {
    scriptpubkey: string;
    scriptpubkeyAsm: string;
    scriptpubkeyType: string;
    scriptpubkeyAddress: string;
    value: number;
};

export type TxInput = {
    txId: string;
    vout: number;
    isCoinbase: boolean;
    scriptsig: string;
    scriptsigAsm: string;
    innerRedeemscriptAsm: string;
    innerWitnessscriptAsm: string;
    sequence: number;
    witness: string[];
    prevout: TxOutput;
};

export interface BTCCoreAPI {
    getLatestBlock(): Promise<string>;
    getLatestBlockHeight(): Promise<number>;
    getMerkleProof(txid: string): Promise<string>;
    getTransactionStatus(txid: string): Promise<TxStatus>;
    getTransactionBlockHeight(txid: string): Promise<number | undefined>;
    getRawTransaction(txid: string): Promise<Buffer>;
    getTxIdByOpcode(opcode: string): Promise<string>;
}

export class DefaultBTCCoreAPI implements BTCCoreAPI {
    private blockApi: BlockApi;
    private txApi: TxApi;
    private scripthashApi: ScripthashApi;

    constructor(network: string = "mainnet") {
        let basePath = "";
        switch (network) {
        case "mainnet":
            basePath = mainnetApiBasePath;
            break;
        case "testnet":
            basePath = testnetApiBasePath;
            break;
        default:
            basePath = network;
        }
        this.blockApi = new BlockApi({ basePath });
        this.txApi = new TxApi({ basePath });
        this.scripthashApi = new ScripthashApi({ basePath });
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

    // returns the confirmation status and number of confirmations of a tx
    async getTransactionStatus(txid: string): Promise<TxStatus> {
        const status = {
            confirmed: false,
            confirmations: 0,
        };
        const txStatus = await this.getTxStatus(txid);
        const latest_block_height = await this.getLatestBlockHeight();

        status.confirmed = txStatus.confirmed;
        if (txStatus.block_height) {
            status.confirmations = latest_block_height - txStatus.block_height;
        }

        return status;
    }

    async getTransactionBlockHeight(txid: string): Promise<number | undefined> {
        return (await this.getTxStatus(txid)).block_height;
    }

    getRawTransaction(txid: string): Promise<Buffer> {
        return this.getData(this.txApi.getTxRaw(txid, { responseType: "arraybuffer" }));
    }

    /**
     * Fetch Bitcoin transaction ID based on OP_RETURN field.
     * Throw an error unless there is exactly one transaction with the given opcode.
     *
     * @remarks
     * Performs the lookup using an external service, Esplora. Requires the input string to be a hex
     *
     * @param opreturn - data string used for matching the OP_CODE of Bitcoin transactions
     * @returns A Bitcoin transaction ID
     */
    async getTxIdByOpcode(opreturn: string): Promise<string> {
        const data = Buffer.from(opreturn, "hex");
        if (data.length !== 32) {
            return Promise.reject("Requires a 32 byte hash as OP_RETURN");
        }
        const opreturnBuffer = bitcoinjs.script.compile([bitcoinjs.opcodes.OP_RETURN, data]);
        const hash = bitcoinjs.crypto.sha256(opreturnBuffer).toString("hex");

        let txs: Transaction[] = [];
        try {
            txs = await this.getData(this.scripthashApi.getRecentTxsByScripthash(hash));
        } catch (e) {
            console.log(`Error during tx lookup by OP_RETURN: ${e}`);
        }

        if (!txs.length) {
            return Promise.reject("No transaction id found");
        }
        if (txs.length > 1) {
            return Promise.reject("OP_RETURN collision detected");
        }

        return txs[0].txid;
    }

    private getTxStatus(txid: string): Promise<Status> {
        return this.getData(this.txApi.getTxStatus(txid));
    }

    getData<T>(response: Promise<AxiosResponse<T>>): Promise<T> {
        return response.then((v) => v.data);
    }
}
