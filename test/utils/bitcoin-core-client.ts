// disabling linting as `bitcoin-core` has no types, causing the import to fail
// eslint-disable-next-line
const Client = require("bitcoin-core");

export class BitcoinCoreClient {
    private client: typeof Client;

    /**
     * Initialize the Bitcoin-core client, which is a js equivalent to bitcoin-cli
     * @param network Bitcoin network (mainnet, testnet, regtest)
     * @param host URL of Bitcoin node (e.g. localhost)
     * @param username User for RPC authentication
     * @param password Password for RPC authentication
     * @param port Bitcoin node connection port (e.g. 18443)
     * @param wallet Name of wallet to use (e.g. Alice)
     */
    constructor(network: string, host: string, username: string, password: string, port: string, wallet: string) {
        this.client = new Client({
            network: network,
            host: host,
            username: username,
            password: password,
            port: port,
            wallet: wallet,
        });
    }

    async sendBtcTxAndMine(
        recipient: string,
        amount: string,
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

    formatRawTxInput(recipient: string, amount: string, data?: string) {
        const paidOutput = {} as any;
        paidOutput[recipient] = amount;
        if (data !== undefined) {
            return [{ data }, paidOutput];
        }
        return [paidOutput];
    }

    async broadcastTx(
        recipient: string,
        amount: string,
        data?: string
    ): Promise<{
        txid: string;
        rawTx: string;
    }> {
        if (!this.client) {
            throw new Error("Client needs to be initialized before usage");
        }
        const paidOutput = {} as any;
        paidOutput[recipient] = amount;
        const raw = await this.client.command("createrawtransaction", [], this.formatRawTxInput(recipient, amount, data));
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
