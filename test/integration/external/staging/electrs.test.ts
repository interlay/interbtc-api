import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { createSubstrateAPI } from "../../../../src/factory";
import {
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    ESPLORA_BASE_PATH,
    PARACHAIN_ENDPOINT,
} from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { BitcoinAmount } from "@interlay/monetary-js";
import { makeRandomBitcoinAddress, runWhileMiningBTCBlocks, wait_success as waitSuccess } from "../../../utils/helpers";

describe("ElectrsAPI regtest", function () {
    this.timeout(100000);

    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
    });

    after(async () => {
        await api.disconnect();
    });

    it("should getLargestPaymentToRecipientAddressTxId", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const recipientAddress = makeRandomBitcoinAddress();
            const amount = new BitcoinAmount(0.00022244);

            const txData = await bitcoinCoreClient.broadcastTx(recipientAddress, amount);
            const txid = await waitSuccess(() => electrsAPI.getLargestPaymentToRecipientAddressTxId(recipientAddress));
            assert.strictEqual(txid, txData.txid);
        });
    });

    it("should getTxByOpreturn", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const opReturnValue = "01234567891154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91";
            const recipientAddress = makeRandomBitcoinAddress();
            const amount = new BitcoinAmount(0.00029);

            const txData = await bitcoinCoreClient.broadcastTx(recipientAddress, amount, opReturnValue);
            const txid = await waitSuccess(() => electrsAPI.getTxIdByOpReturn(opReturnValue, recipientAddress, amount));
            assert.strictEqual(txid, txData.txid);
        });
    });

    it("should use getTxStatus to return correct confirmations", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const opReturnValue = "01234567891154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91";
            const recipientAddress = makeRandomBitcoinAddress();
            const amount = new BitcoinAmount(0.00029);

            const txData = await bitcoinCoreClient.broadcastTx(recipientAddress, amount, opReturnValue);
            // transaction in mempool
            let status = await electrsAPI.getTransactionStatus(txData.txid);
            assert.strictEqual(status.confirmations, 0);

            // transaction in the latest block
            await waitSuccess(async () => {
                status = await electrsAPI.getTransactionStatus(txData.txid);
                assert.strictEqual(status.confirmations, 1);
            });

            // transaction in the parent of the latest block
            await waitSuccess(async () => {
                status = await electrsAPI.getTransactionStatus(txData.txid);
                assert.strictEqual(status.confirmations, 2);
            });
        });
    });
});
