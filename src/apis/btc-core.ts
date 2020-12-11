import { BlockApi, Status, TxApi, ScripthashApi, Transaction, VOut } from "@interlay/esplora-btc-api";
import { AxiosResponse } from "axios";
import * as bitcoinjs from "bitcoinjs-lib";
import { btcToSat } from "../utils/currency";

// disabling linting as `bitcoin-core` has no types, causing the import to fail
// eslint-disable-next-line
const Client = require("bitcoin-core");

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
    getTxIdByOpReturn(opReturn: string, recipientAddress?: string, amountAsBTC?: string): Promise<string>;
    broadcastOpReturnTx(
        receiver: string,
        amount: string,
        data: string
    ): Promise<{
        txid: string;
        rawTx: string;
    }>;
    initializeClientConnection(
        network: string,
        host: string,
        username: string,
        password: string,
        port: string,
        wallet: string
    ): void;
    mineBlocks(n: number): Promise<void>;
    sendBtcTxAndMine(
        recipient: string,
        amount: string,
        data: string,
        blocksToMine: number
    ): Promise<{
        txid: string;
        rawTx: string;
    }>;
}

export class DefaultBTCCoreAPI implements BTCCoreAPI {
    private blockApi: BlockApi;
    private txApi: TxApi;
    private scripthashApi: ScripthashApi;
    private client: typeof Client;

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

    initializeClientConnection(
        network: string,
        host: string,
        username: string,
        password: string,
        port: string,
        wallet: string
    ): void {
        this.client = new Client({
            network: network,
            host: host,
            username: username,
            password: password,
            port: port,
            wallet: wallet,
        });
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

    async broadcastRawTransaction(hex: string): Promise<AxiosResponse<string>> {
        return await this.txApi.postTx(hex);
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
     * Fetch the first bitcoin transaction ID based on the OP_RETURN field, recipient and amount.
     * Throw an error unless there is exactly one transaction with the given opcode.
     *
     * @remarks
     * Performs the lookup using an external service, Esplora. Requires the input string to be a hex
     *
     * @param opReturn - Data string used for matching the OP_CODE of Bitcoin transactions
     * @param recipientAddress - Match the receiving address of a transaction that contains said op_return
     * @param amountAsBTC - Match the amount (in BTC) of a transaction that contains said op_return and recipientAddress.
     * This parameter is only considered if `recipientAddress` is defined.
     *
     * @returns A Bitcoin transaction ID
     */
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

    private txOutputHasRecipientAndAmount(vout: VOut, recipientAddress?: string, amountAsBTC?: string): boolean {
        if (recipientAddress) {
            if (recipientAddress !== vout.scriptpubkey_address) {
                return false;
            }
            if (amountAsBTC) {
                const expectedBtcAsSatoshi = Number(btcToSat(amountAsBTC));
                if (vout.value === undefined || expectedBtcAsSatoshi > vout.value) {
                    return false;
                }
            }
        }
        return true;
    }

    private getTxStatus(txid: string): Promise<Status> {
        return this.getData(this.txApi.getTxStatus(txid));
    }

    getData<T>(response: Promise<AxiosResponse<T>>): Promise<T> {
        return response.then((v) => v.data);
    }

    async sendBtcTxAndMine(
        recipient: string,
        amount: string,
        data: string,
        blocksToMine: number
    ): Promise<{
        txid: string;
        rawTx: string;
    }> {
        const tx = await this.broadcastOpReturnTx(recipient, amount, data);
        await this.mineBlocks(blocksToMine);
        return tx;
    }

    async broadcastOpReturnTx(
        recipient: string,
        amount: string,
        data: string
    ): Promise<{
        txid: string;
        rawTx: string;
    }> {
        if (!this.client) {
            throw new Error("Client needs to be initialized before usage");
        }
        const paidOutput = {} as any;
        paidOutput[recipient] = amount;
        const raw = await this.client.command("createrawtransaction", [], [{ data: data }, paidOutput]);
        const funded = await this.client.command("fundrawtransaction", raw);
        const signed = await this.client.command("signrawtransactionwithwallet", funded.hex);
        const response = await this.broadcastRawTransaction(signed.hex);
        const txid = response.data;
        return {
            txid: txid,
            rawTx: signed.hex,
        };
    }

    async mineBlocks(n: number): Promise<void> {
        const newWalletAddress = await this.client.command("getnewaddress");
        const minedTxs = await this.client.command("generatetoaddress", n, newWalletAddress);
        // A block is relayed every 6000ms by the staked-relayer.
        // Wait an additional 100ms to be sure
        const relayPeriodWithBuffer = 6100;
        await delay(n * relayPeriodWithBuffer);
    }

    async getBalance() {
        return await this.client.command("getbalance");
    }
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
