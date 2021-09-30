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
import { TypeRegistry } from "@polkadot/types";
import { Bytes } from "@polkadot/types";
import { BitcoinAmount } from "@interlay/monetary-js";

import { MAINNET_ESPLORA_BASE_PATH, REGTEST_ESPLORA_BASE_PATH, TESTNET_ESPLORA_BASE_PATH } from "../utils/constants";

export type TxStatus = {
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
    blockHash?: string;
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
export interface ElectrsAPI {
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
     * @returns A TxStatus object, containing the confirmation status and number of confirmations, plus block height if
     * the tx is included in the blockchain
     */
    getTransactionStatus(txid: string): Promise<TxStatus>;
    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The height of the block the transaction was included in. If the block has not been confirmed, returns undefined.
     */
    getTransactionBlockHeight(txid: string): Promise<number | undefined>;
    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns The raw transaction data, represented as a hex string
     */
    getRawTransaction(txid: string): Promise<string>;
    /**
     * Fetch the first bitcoin transaction ID based on the OP_RETURN field, recipient and amount.
     * Throw an error unless there is exactly one transaction with the given opcode.
     *
     * @remarks
     * Performs the lookup using an external service, Esplora. Requires the input string to be a hex
     *
     * @param opReturn Data string used for matching the OP_CODE of Bitcoin transactions
     * @param recipientAddress Match the receiving address of a transaction that contains said op_return
     * @param amount Match the amount (in BTC) of a transaction that contains said op_return and recipientAddress.
     * This parameter is only considered if `recipientAddress` is defined.
     *
     * @returns A Bitcoin transaction ID
     */
    getTxIdByOpReturn(opReturn: string, recipientAddress?: string, amount?: BitcoinAmount): Promise<string>;
    /**
     * Fetch the earliest bitcoin transaction ID based on the recipient address and amount.
     * Throw an error if no such transaction is found.
     *
     * @remarks
     * Performs the lookup using an external service, Esplora
     *
     * @param recipientAddress Match the receiving address of a transaction output
     * @param amount Match the amount (in BTC) of a transaction output that contains said recipientAddress.
     *
     * @returns A Bitcoin transaction ID
     */
    getEarliestPaymentToRecipientAddressTxId(recipientAddress: string, amount?: BitcoinAmount): Promise<string>;
    /**
     * Fetch the last bitcoin transaction ID based on the recipient address and amount.
     * Throw an error if no such transaction is found.
     *
     * @remarks
     * Performs the lookup using an external service, Esplora
     *
     * @param recipientAddress Match the receiving address of a UTXO
     * @param amount Match the amount (in BTC) of a UTXO that contains said recipientAddress.
     *
     * @returns A Bitcoin transaction ID
     */
    getUtxoTxIdByRecipientAddress(recipientAddress: string, amount?: BitcoinAmount): Promise<string>;
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
    /**
     * Get the parsed (as Bytes) merkle proof and raw transaction
     *
     * @remarks
     * Performs the lookup using an external service, Esplora
     *
     * @param txid A Bitcoin transaction ID
     *
     * @returns A tuple of Bytes object, representing [merkleProof, rawTx]
     */
    getParsedExecutionParameters(txid: string): Promise<[Bytes, Bytes]>;
    /**
     * Return a promise that either resolves to the first txid with the given opreturn `data`,
     * or rejects if the `timeout` has elapsed.
     *
     * @remarks
     * Every 5 seconds, performs the lookup using an external service, Esplora
     *
     * @param data The opReturn of the bitcoin transaction
     * @param timeoutMs The duration until the Promise times out (in milliseconds)
     * @param retryIntervalMs The time to wait (in milliseconds) between retries
     *
     * @returns The Bitcoin txid
     */
    waitForOpreturn(data: string, timeoutMs: number, retryIntervalMs: number): Promise<string>;
    /**
     * @param txid The ID of a Bitcoin transaction
     * @returns A TxStatus object, containing the confirmation status and number of confirmations, plus block height if
     * the tx is included in the blockchain
     */
    waitForTxInclusion(txid: string, timeoutMs: number, retryIntervalMs: number): Promise<TxStatus>;
}

export class DefaultElectrsAPI implements ElectrsAPI {
    private blockApi: BlockApi;
    private txApi: TxApi;
    private scripthashApi: ScripthashApi;
    private addressApi: AddressApi;

    constructor(network: string = "mainnet") {
        let basePath = "";
        switch (network) {
            case "mainnet":
                basePath = MAINNET_ESPLORA_BASE_PATH;
                break;
            case "testnet":
                basePath = TESTNET_ESPLORA_BASE_PATH;
                break;
            case "regtest":
                basePath = REGTEST_ESPLORA_BASE_PATH;
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
        if (!txid) {
            return amount;
        }
        const tx = await this.getTx(txid);
        if (!tx.vout) {
            return amount;
        }
        tx.vout.forEach((vout) => {
            if (vout.scriptpubkey_address === recipient && vout.value) {
                amount = vout.value;
            }
        });
        return amount;
    }

    async getEarliestPaymentToRecipientAddressTxId(recipientAddress: string, amount?: BitcoinAmount): Promise<string> {
        try {
            const txes = await this.getData(this.addressApi.getAddressTxHistory(recipientAddress));
            if (txes.length >= 25) {
                throw new Error("Over 25 transactions returned; this is either a highly non-standard vault, or not a vault address");
            }

            const oldestTx = txes.pop();
            if (!oldestTx || !(oldestTx.vout)) {
                throw new Error("No transaction found for recipient and amount");
            }
            for (const txo of oldestTx.vout) {
                if (txo.scriptpubkey_address === recipientAddress && this.txoHasAtLeastAmount(txo, amount)) {
                    return oldestTx.txid;
                }
            }
        } catch (e) {
            return Promise.reject(new Error(`Error during tx lookup by address: ${e}`));
        }
        return Promise.reject(new Error("No transaction found for recipient and amount"));
    }

    async getUtxoTxIdByRecipientAddress(recipientAddress: string, amount?: BitcoinAmount): Promise<string> {
        try {
            const utxos = await this.getData(this.addressApi.getAddressUtxo(recipientAddress));
            for (const utxo of utxos.reverse()) {
                if (this.txoHasAtLeastAmount(utxo, amount)) {
                    return utxo.txid;
                }
            }
        } catch (e) {
            return Promise.reject(new Error(`Error during tx lookup by address: ${e}`));
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
    private txoHasAtLeastAmount(txo: UTXO | VOut, amount?: BitcoinAmount): boolean {
        if (amount) {
            if (txo.value === undefined) {
                return false;
            } else {
                const utxoValue = BitcoinAmount.from.Satoshi(txo.value);
                return utxoValue.gte(amount);
            }
        }
        return true;
    }

    async getTxIdByOpReturn(opReturn: string, recipientAddress?: string, amount?: BitcoinAmount): Promise<string> {
        const data = Buffer.from(opReturn, "hex");
        if (data.length !== 32) {
            return Promise.reject(new Error("Requires a 32 byte hash as OP_RETURN"));
        }
        const opReturnBuffer = bitcoinjs.script.compile([bitcoinjs.opcodes.OP_RETURN, data]);
        const hash = bitcoinjs.crypto.sha256(opReturnBuffer).toString("hex");

        let txs: Transaction[] = [];
        try {
            txs = await this.getData(this.scripthashApi.getRecentTxsByScripthash(hash));
        } catch (e) {
            return Promise.reject(new Error(`Error during tx lookup by OP_RETURN: ${e}`));
        }

        for (const tx of txs) {
            if (tx.vout === undefined) {
                continue;
            }
            for (const vout of tx.vout) {
                if (this.txOutputHasRecipientAndAmount(vout, recipientAddress, amount)) {
                    return tx.txid;
                }
            }
        }
        return Promise.reject(new Error("No transaction id found"));
    }

    async waitForOpreturn(data: string, timeoutMs: number, retryIntervalMs: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.getTxIdByOpReturn(data)
                .then(resolve)
                .catch((_error) => {
                    setTimeout(() => {
                        console.log("Did not find opreturn, retrying...");
                        if (timeoutMs < retryIntervalMs) {
                            reject(new Error("Timeout elapsed"));
                        } else {
                            this.waitForOpreturn(data, timeoutMs - retryIntervalMs, retryIntervalMs)
                                .then(resolve)
                                .catch(reject);
                        }
                    }, retryIntervalMs);
                });
        });
    }

    async waitForTxInclusion(txid: string, timeoutMs: number, retryIntervalMs: number): Promise<TxStatus> {
        return new Promise<TxStatus>((resolve, reject) => {
            this.getTransactionStatus(txid).then((txStatus) => {
                if (txStatus.blockHeight !== undefined) {
                    resolve(txStatus);
                } else {
                    setTimeout(() => {
                        console.log(`Tx ${txid} not yet included in a block...`);
                        if (timeoutMs < retryIntervalMs) {
                            reject(new Error("Timeout elapsed"));
                        } else {
                            this.waitForTxInclusion(txid, timeoutMs - retryIntervalMs, retryIntervalMs)
                                .then(resolve)
                                .catch(reject);
                        }
                    }, retryIntervalMs);
                }
            });
        });
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
    private txOutputHasRecipientAndAmount(vout: VOut, recipientAddress?: string, amount?: BitcoinAmount): boolean {
        if (recipientAddress) {
            if (recipientAddress !== vout.scriptpubkey_address) {
                return false;
            }
            return this.txoHasAtLeastAmount(vout, amount);
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
        const status: TxStatus = {
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
            status.blockHeight = txStatus.block_height;
            status.blockHash = txStatus.block_hash;
            // note that block_height will only be set if confirmed == true, i.e. block
            // depth is at least 1. So confirmations 0 will only be returned while unconfirmed.
            // This is correct.
        }

        return status;
    }

    async getTransactionBlockHeight(txid: string): Promise<number | undefined> {
        return (await this.getTxStatus(txid)).block_height;
    }

    async getParsedExecutionParameters(txid: string): Promise<[Bytes, Bytes]> {
        const [unparsedMerkleProof, unparsedRawTx] = await Promise.all([
            this.getMerkleProof(txid),
            this.getRawTransaction(txid),
        ]);
        // To avoid taking an ApiPromise object as a constructor parameter,
        // use the default TypeRegistry (without custom type metadata),
        // because the Bytes type instantiated is provided by default.
        const registry = new TypeRegistry();

        const merkleProof = registry.createType("Bytes", "0x" + unparsedMerkleProof);
        const rawTx = registry.createType("Bytes", "0x" + unparsedRawTx);
        return [merkleProof, rawTx];
    }

    getRawTransaction(txid: string): Promise<string> {
        return this.getData(this.txApi.getTxHex(txid));
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
