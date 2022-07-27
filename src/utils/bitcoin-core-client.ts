// disabling linting as `bitcoin-core` has no types, causing the import to fail

import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { WrappedCurrency } from "../types";

// eslint-disable-next-line
const Client = require("bitcoin-core");
interface RecipientsToUTXOAmounts {
    [key: string]: string;
}
export class BitcoinCoreClient {
    client: typeof Client;

    /**
     * Initialize the Bitcoin-core client, which is a js equivalent to bitcoin-cli
     * @param network Bitcoin network (mainnet, testnet, regtest)
     * @param host URL of Bitcoin node (e.g. localhost)
     * @param username User for RPC authentication
     * @param password Password for RPC authentication
     * @param port Bitcoin node connection port (e.g. 18443)
     * @param wallet Wallet to use if several are available. See https://github.com/ruimarinho/bitcoin-core#multiwallet
     */
    constructor(network: string, host: string, username: string, password: string, port: string, wallet: string) {
        this.client = new Client({
            network,
            host,
            username,
            password,
            port,
            wallet,
        });
    }

    async sendBtcTxAndMine(
        recipient: string,
        amount: MonetaryAmount<WrappedCurrency>,
        blocksToMine: number,
        data?: string
    ): Promise<{
        // big endian
        txid: string;
        rawTx: string;
    }> {
        const tx = await this.broadcastTx(recipient, amount, data);
        await this.mineBlocks(blocksToMine);
        return tx;
    }

    formatRawTxInput(recipient: string, amount: Big, data?: string): RecipientsToUTXOAmounts[] {
        const paidOutput: RecipientsToUTXOAmounts = {};
        paidOutput[recipient] = amount.toString();
        if (data !== undefined) {
            return [{ data }, paidOutput];
        }
        return [paidOutput];
    }

    async broadcastTx(
        recipient: string,
        amount: MonetaryAmount<WrappedCurrency>,
        data?: string
    ): Promise<{
        txid: string;
        rawTx: string;
    }> {
        if (!this.client) {
            throw new Error("Client needs to be initialized before usage");
        }
        console.log(`Broadcasting tx: ${amount.toString()} BTC to ${recipient}`);
        const raw = await this.client.command(
            "createrawtransaction",
            [],
            this.formatRawTxInput(recipient, amount.toBig(), data)
        );
        const funded = await this.client.command("fundrawtransaction", raw);
        const signed = await this.client.command("signrawtransactionwithwallet", funded.hex);
        const response = await this.client.command("sendrawtransaction", signed.hex);
        const txid = response;
        return {
            txid: txid,
            rawTx: signed.hex,
        };
    }

    async mineBlocks(n: number): Promise<void> {
        console.log(`Mining ${n} Bitcoin block(s)`);
        const newWalletAddress = await this.client.command("getnewaddress");
        await this.client.command("generatetoaddress", n, newWalletAddress);
    }

    async getBalance(): Promise<string> {
        return await this.client.command("getbalance");
    }

    async sendToAddress(address: string, amount: MonetaryAmount<WrappedCurrency>): Promise<string> {
        return await this.client.command("sendtoaddress", address, amount.toString());
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getMempoolInfo(): Promise<any> {
        return this.client.command("getmempoolinfo");
    }

    getBestBlockHash(): Promise<string> {
        return this.client.command("getbestblockhash");
    }

    createWallet(name: string): Promise<void> {
        return this.client.command("createwallet", name);
    }

    loadWallet(name: string): Promise<void> {
        return this.client.command("loadwallet", name);
    }
}
