// disabling linting as `bitcoin-core` has no types, causing the import to fail

import Big from "big.js";

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
        amount: Big,
        blocksToMine: number,
        data?: string
    ): Promise<{
        // big endian
        txid: string;
        rawTx: string;
    }> {
        console.log(`Broadcasting tx: ${amount.toString()} BTC`);
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
        amount: Big,
        data?: string
    ): Promise<{
        txid: string;
        rawTx: string;
    }> {
        if (!this.client) {
            throw new Error("Client needs to be initialized before usage");
        }

        const raw = await this.client.command(
            "createrawtransaction",
            [],
            this.formatRawTxInput(recipient, amount, data)
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

    async mineBlocksWithoutDelay(n: number): Promise<void> {
        const newWalletAddress = await this.client.command("getnewaddress");
        await this.client.command("generatetoaddress", n, newWalletAddress);
    }

    async mineBlocks(n: number): Promise<void> {
        await this.mineBlocksWithoutDelay(n);
        // A block is relayed every 6000ms by the staked-relayer.
        // Wait an additional 100ms to be sure
        const relayPeriodWithBuffer = 6100;
        await delay(n * relayPeriodWithBuffer);
    }

    async getBalance(): Promise<string> {
        return await this.client.command("getbalance");
    }

    async sendToAddress(address: string, amount: Big): Promise<void> {
        return await this.client.command("sendtoaddress", address, amount.toString());
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getMempoolInfo(): Promise<any> {
        return await this.client.command("getmempoolinfo");
    }
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
