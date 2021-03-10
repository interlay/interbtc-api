import {
    BlockApi,
    Status,
    TxApi,
    AddressApi,
    UTXO,
    VOut,
    Transaction,
    ScripthashApi,
    Configuration,
} from "@interlay/esplora-btc-api";
import { AxiosResponse } from "axios";
import * as bitcoinjs from "bitcoinjs-lib";
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

/**
 * Bitcoin Core API
 * @category Bitcoin Core
 */
export interface BTCCoreAPI {
    /**
     * @returns The block hash of the latest Bitcoin block
     */
    getLatestBlock(): Promise<string>;
    /**
     * @returns The height of the latest Bitcoin block
     */
    getLatestBlockHeight(): Promise<number>;
    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The merkle inclusion proof for the transaction using bitcoind's merkleblock format.
     */
    getMerkleProof(txid: string): Promise<string>;
    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns A TxStatus object, containing the confirmation status and number of confirmations
     */
    getTransactionStatus(txid: string): Promise<TxStatus>;
    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The height of the block the transaction was included in. If the block has not been confirmed, returns undefined.
     */
    getTransactionBlockHeight(txid: string): Promise<number | undefined>;
    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The raw transaction data, represented as a Buffer object
     */
    getRawTransaction(txid: string): Promise<Buffer>;
    /**
     * Fetch the first bitcoin transaction ID based on the OP_RETURN field, recipient and amount.
     * Throw an error unless there is exactly one transaction with the given opcode.
     *
     * @remarks
     * Performs the lookup using an external service, Esplora. Requires the input string to be a hex
     *
     * @param opReturn Data string used for matching the OP_CODE of Bitcoin transactions
     * @param recipientAddress Match the receiving address of a transaction that contains said op_return
     * @param amountAsBTC Match the amount (in BTC) of a transaction that contains said op_return and recipientAddress.
     * This parameter is only considered if `recipientAddress` is defined.
     *
     * @returns A Bitcoin transaction ID
     */
    getTxIdByOpReturn(opReturn: string, recipientAddress?: string, amountAsBTC?: string): Promise<string>;
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
    getTxIdByRecipientAddress(recipientAddress: string, amountAsBTC?: string): Promise<string>;
    /**
     * Fetch the Bitcoin transaction that matches the given TxId
     *
     * @remarks
     * Performs the lookup using an external service, Esplora
     *
     * @param txid A Bitcoin transaction ID
     *
     * @returns A Bitcoin Transaction object
     */
    getTx(txid: string): Promise<Transaction>;
    /**
     * Fetch the Bitcoin UTXO amount that matches the given TxId and recipient
     *
     * @remarks
     * Performs the lookup using an external service, Esplora
     *
     * @param txid A Bitcoin transaction ID
     * @param recipient A Bitcoin scriptpubkey address
     *
     * @returns A UTXO amount if found, 0 otherwise
     */
    getUtxoAmount(txid: string, recipient: string): Promise<number>;
}

export class DefaultBTCCoreAPI implements BTCCoreAPI {
    private blockApi: BlockApi;
    private txApi: TxApi;
    private scripthashApi: ScripthashApi;
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
        const conf = new Configuration({ basePath });
        this.blockApi = new BlockApi(conf);
        this.txApi = new TxApi(conf);
        this.scripthashApi = new ScripthashApi(conf);
        this.addressApi = new AddressApi(conf);
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

    getTx(txid: string): Promise<Transaction> {
        return this.getData(this.txApi.getTx(txid));
    }

    async getUtxoAmount(txid: string, recipient: string): Promise<number> {
        let amount = 0;
        if(!txid) {
            return amount;
        }
        const tx = await this.getTx(txid);
        if(!tx.vout) {
            return amount;
        }
        tx.vout.forEach(vout=> {
            if (vout.scriptpubkey_address === recipient && vout.value) {
                amount = vout.value;
            }
        });
        return amount;
    }

    async getTxIdByRecipientAddress(recipientAddress: string, amountAsBTC?: string): Promise<string> {
        try {
            const utxos = await this.getData(this.addressApi.getAddressUtxo(recipientAddress));
            for (const utxo of utxos.reverse()) {
                if (this.utxoHasAmount(utxo, amountAsBTC)) {
                    return utxo.txid;
                }
            }
        } catch (e) {
            console.log(`Error during tx lookup by address: ${e}`);
        }
        return Promise.reject(new Error("No transaction found for recipient and amount"));
    }

    /**
     * Check if a given UTXO has at least `amountAsBTC`
     *
     * @param vout UTXO object
     * @param amountAsBTC (Optional) Amount the recipient must receive
     * @returns Boolean value
     */
    private utxoHasAmount(utxo: UTXO | VOut, amountAsBTC?: string): boolean {
        if (amountAsBTC) {
            const expectedBtcAsSatoshi = Number(btcToSat(amountAsBTC));
            if (utxo.value === undefined || expectedBtcAsSatoshi > utxo.value) {
                return false;
            }
        }
        return true;
    }

    async getTxIdByOpReturn(opReturn: string, recipientAddress?: string, amountAsBTC?: string): Promise<string> {
        const data = Buffer.from(opReturn, "hex");
        if (data.length !== 32) {
            return Promise.reject("Requires a 32 byte hash as OP_RETURN");
        }
        const opReturnBuffer = bitcoinjs.script.compile([bitcoinjs.opcodes.OP_RETURN, data]);
        const hash = bitcoinjs.crypto.sha256(opReturnBuffer).toString("hex");

        let txs: Transaction[] = [];
        try {
            txs = await this.getData(this.scripthashApi.getRecentTxsByScripthash(hash));
        } catch (e) {
            console.log(`Error during tx lookup by OP_RETURN: ${e}`);
        }

        for (const tx of txs) {
            if (tx.vout === undefined) {
                continue;
            }
            for (const vout of tx.vout) {
                if (this.txOutputHasRecipientAndAmount(vout, recipientAddress, amountAsBTC)) {
                    return tx.txid;
                }
            }
        }
        return Promise.reject("No transaction id found");
    }

    /**
     * Check if a given UTXO sends at least `amountAsBTC` to a certain `recipientAddress`
     *
     * @param vout UTXO object
     * @param recipientAddress (Optional) Address of recipient
     * @param amountAsBTC (Optional) Amount the recipient must receive. This parameter is only considered if the
     * `recipientAddress` is defined too
     * @returns Boolean value
     */
    private txOutputHasRecipientAndAmount(vout: VOut, recipientAddress?: string, amountAsBTC?: string): boolean {
        if (recipientAddress) {
            if (recipientAddress !== vout.scriptpubkey_address) {
                return false;
            }
            return this.utxoHasAmount(vout, amountAsBTC);
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

    async getTransactionStatus(txid: string): Promise<TxStatus> {
        const status = {
            confirmed: false,
            confirmations: 0,
        };
        const txStatus = await this.getTxStatus(txid);
        const latest_block_height = await this.getLatestBlockHeight();

        status.confirmed = txStatus.confirmed;
        // NOTE: the second part of the check is only to ensure that the -1 we sometimes see
        // in the UI is not caused by the lib
        if (txStatus.block_height && latest_block_height - txStatus.block_height >= 0) {
            // use Bitoin Core definition of confirmations (= block depth)
            status.confirmations = latest_block_height - txStatus.block_height + 1;
            // note that block_height will only be set if confirmed == true, i.e. block
            // depth is at least 1. So confirmations 0 will only be returned while unconfirmed.
            // This is correct.
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
