import { BlockApi, Status, TxApi, AddressApi, UTXO } from "@interlay/esplora-btc-api";
import { AxiosResponse } from "axios";
import { btcToSat } from "../utils/currency";

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
    getTxIdByRecipientAddress(recipientAddress: string, amountAsBTC?: string): Promise<string>;
}

export class DefaultBTCCoreAPI implements BTCCoreAPI {
    private blockApi: BlockApi;
    private txApi: TxApi;
    private addressApi: AddressApi;

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
        this.addressApi = new AddressApi({ basePath });
    }

    /**
     * @returns The block hash of the latest Bitcoin block
     */
    getLatestBlock(): Promise<string> {
        return this.getData(this.blockApi.getLastBlockHash());
    }

    /**
     * @returns The height of the latest Bitcoin block
     */
    getLatestBlockHeight(): Promise<number> {
        return this.getData(this.blockApi.getLastBlockHeight());
    }

    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The merkle inclusion proof for the transaction using bitcoind's merkleblock format.
     */
    getMerkleProof(txid: string): Promise<string> {
        return this.getData(this.txApi.getTxMerkleBlockProof(txid));
    }

    /**
     * Fetch the last bitcoin transaction ID based on the recipient address and amount.
     * Throw an error if no such transaction is found.
     *
     * @remarks
     * Performs the lookup using an external service, Esplora
     *
     * @param recipientAddress Match the receiving address of a UTXO
     * @param amountAsBTC Match the amount (in BTC) of a UTXO that contains said recipientAddress.
     *
     * @returns A Bitcoin transaction ID
     */
    async getTxIdByRecipientAddress(recipientAddress: string, amountAsBTC?: string): Promise<string> {
        try {
            const utxos = await this.getData(this.addressApi.getAddressUtxo(recipientAddress));
            for (const utxo of utxos.reverse()) {
                if (this.utxoHasAmount(utxo, amountAsBTC)) {
                    return utxo.txid;
                }
            }
        } catch (e) {
            console.log(`Error during tx lookup by unique vault address: ${e}`);
        }
        return Promise.reject("No transaction found for recipient and amount");
    }

    /**
     * Check if a given UTXO has at least `amountAsBTC`
     *
     * @param vout UTXO object
     * @param amountAsBTC (Optional) Amount the recipient must receive
     * @returns Boolean value
     */
    private utxoHasAmount(utxo: UTXO, amountAsBTC?: string): boolean {
        if (amountAsBTC) {
            const expectedBtcAsSatoshi = Number(btcToSat(amountAsBTC));
            if (utxo.value === undefined || expectedBtcAsSatoshi > utxo.value) {
                return false;
            }
        }
        return true;
    }

    /**
     * Broadcasts a transaction to the Bitcoin network configured in the constructor
     * @param hex A hex-encoded raw transaction to be broadcast to the Bitcoin blockchain
     * @returns The txid of the transaction
     */
    async broadcastRawTransaction(hex: string): Promise<AxiosResponse<string>> {
        return await this.txApi.postTx(hex);
    }

    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns A TxStatus object, containing the confirmation status and number of confirmations
     */
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

    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The height of the block the transaction was included in. If the block has not been confirmed, returns undefined.
     */
    async getTransactionBlockHeight(txid: string): Promise<number | undefined> {
        return (await this.getTxStatus(txid)).block_height;
    }

    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The raw transaction data, represented as a Buffer object
     */
    getRawTransaction(txid: string): Promise<Buffer> {
        return this.getData(this.txApi.getTxRaw(txid, { responseType: "arraybuffer" }));
    }

    /**
     * Use the TxAPI to get the confirmationation
     * @param txid The ID of a Bitcoin transaction
     * @returns A Status object, containing transaction settlement information
     */
    private getTxStatus(txid: string): Promise<Status> {
        return this.getData(this.txApi.getTxStatus(txid));
    }

    /**
     * Parse an AxiosResponse Promise
     * @param response A generic AxiosResponse Promise
     * @returns The data in the response
     */
    getData<T>(response: Promise<AxiosResponse<T>>): Promise<T> {
        return response.then((v) => v.data);
    }
}
