import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import Big from "big.js";

import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { createPolkadotAPI } from "../../../../src/factory";
import { DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../../src/utils/setup";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { REGTEST_ESPLORA_BASE_PATH } from "../../../../src";
import { BTCAmount } from "@interlay/monetary-js";

describe("ElectrsAPI testnet", function () {
    const txid = "0af83672b9f80f2ad53218a8f67899ea07d7da4f07a16ba2c954030895a91d9a";

    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        electrsAPI = new DefaultElectrsAPI("testnet");
    });

    after(async () => {
        await api.disconnect();
    });

    it("should return positive height in getLatestBlockHeight", async () => {
        const latestBlockHeight = await electrsAPI.getLatestBlockHeight();
        assert.isAbove(latestBlockHeight, 0);
    });

    it("should return block hash in getLatestBlock", async () => {
        const latestBlock = await electrsAPI.getLatestBlock();
        assert.isNotEmpty(latestBlock);
    });

    it("should return BTC merkle proof as string", async () => {
        const proof = await electrsAPI.getMerkleProof(txid);
        assert.isNotEmpty(proof);
    });

    it("should return confirmed and number of confirmations", async () => {
        const status = await electrsAPI.getTransactionStatus(txid);
        assert.isAbove(status.confirmations, 90015);
        assert.isTrue(status.confirmed);
    });

    it("should return correct block height", async () => {
        const height = await electrsAPI.getTransactionBlockHeight(txid);
        assert.strictEqual(height, 1747019);
    });

    it("should return correct raw tx", async () => {
        // eslint-disable-next-line max-len
        const raw =
            "020000000001012a489eaa754d9aaf5198627d79e9234dba945436" +
            "503aa445c1b82d6bc194c3270100000000ffffffff028038010000" +
            "0000001600145601eeffa54c8b7e306c0b3a50c48121c42d09be8d" +
            "4e030000000000160014a528e6f91766262e3d1b22e52af342f55b" +
            "2d551c0247304402206fdaa5186ff79740b0fc2848f3ee40b48aa0" +
            "cbdf9000304fbe6d35d7b1ee0c3602202cf90c73b0b834c8cc78c0" +
            "b9e988bc2c5781fa617551c8cb5aa7b555efe7ab0a012102170f80" +
            "797baa55d091f85e38a7b463c56905c09ef6024e83039037be5cd7" +
            "550900000000";
        const raw_tx = await electrsAPI.getRawTransaction(txid);
        assert.deepEqual(raw_tx, raw);
    });

    it("should return correct tx id when called with amount and receiver", async () => {
        const recipientAddress = "tb1q9dxnjz0qwh7yj6axl0q9r7lyc9n3gat8nlrvhf";
        const amount = BTCAmount.from.BTC(0.0001236);
        const txid = await electrsAPI.getTxIdByRecipientAddress(recipientAddress, amount);
        assert.strictEqual(txid, "41640c7703ebd972dd913f89c6d66941894d03ef3934edc59259342c7cc8126e");
    });

    describe("getTxByOpReturn", () => {
        it("should return correct tx id", async () => {
            // uses testnet tx: https://blockstream.info/testnet/tx/cac50845f700c97b0e9f0232d2e876e93d384cd93cfa9dc2bf7883ba202237d4?expand
            const opReturn = "8703723a787b0f989110b49fd5e1cf1c2571525d564bf384b5aa9e340c9ad8bd";
            const txid = await electrsAPI.getTxIdByOpReturn(opReturn);
            assert.strictEqual(txid, "cac50845f700c97b0e9f0232d2e876e93d384cd93cfa9dc2bf7883ba202237d4");
        });

        it("should return correct tx id when called with amount and receiver", async () => {
            // uses an op_return that is part of 2 testnet interBTC txs, but
            // only the first one has the queried `amount` parameter
            // https://blockstream.info/testnet/tx/f5bcaeb5181154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91?expand
            // https://blockstream.info/testnet/tx/4b1900dc48aaa9fa84a340e94aa21d20b54371d19ea6b8edd68a558cd36afdd0?expand
            const opReturn = "1165adb125d9703328a37f18b5f8c35732c97a3cd2aab2ead6f28054fd023105";
            const receiverAddress = "tb1qr959hr9t8zd96w3cqke40da4czqfgmwl0yn5mq";
            const amount = BTCAmount.from.BTC(0.00088);

            const txid = await electrsAPI.getTxIdByOpReturn(opReturn, receiverAddress, amount);
            assert.strictEqual(txid, "f5bcaeb5181154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91");
        });
    });
});

describe("ElectrsAPI regtest", function () {
    this.timeout(100000);

    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
    });

    after(async () => {
        await api.disconnect();
    });

    it("should getTxIdByRecipientAddress", async () => {
        const recipientAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
        const amount = BTCAmount.from.BTC(0.00022244);
        
        const txData = await bitcoinCoreClient.sendBtcTxAndMine(recipientAddress, amount, 6);
        const txid = await electrsAPI.getTxIdByRecipientAddress(recipientAddress, amount);
        assert.strictEqual(txid, txData.txid);
    });

    it("should getTxByOpreturn", async () => {
        const opReturnValue = "01234567891154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91";
        const recipientAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
        const amount = BTCAmount.from.BTC(0.00029);

        const txData = await bitcoinCoreClient.sendBtcTxAndMine(recipientAddress, amount, 6, opReturnValue);
        const txid = await electrsAPI.getTxIdByOpReturn(opReturnValue, recipientAddress, amount);
        assert.strictEqual(txid, txData.txid);
    });

    it("should use getTxStatus to return correct confirmations", async () => {
        const opReturnValue = "01234567891154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91";
        const recipientAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
        const amount = BTCAmount.from.BTC(0.00029);

        const txData = await bitcoinCoreClient.broadcastTx(recipientAddress, amount, opReturnValue);
        // transaction in mempool
        let status = await electrsAPI.getTransactionStatus(txData.txid);
        assert.strictEqual(status.confirmations, 0);

        // transaction in the latest block
        await bitcoinCoreClient.mineBlocks(1);
        status = await electrsAPI.getTransactionStatus(txData.txid);
        assert.strictEqual(status.confirmations, 1);

        // transaction in the parent of the latest block
        await bitcoinCoreClient.mineBlocks(1);
        status = await electrsAPI.getTransactionStatus(txData.txid);
        assert.strictEqual(status.confirmations, 2);
    });
});
