import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { BTCCoreAPI, DefaultBTCCoreAPI } from "../../../src/apis/btc-core";
import { createPolkadotAPI } from "../../../src/factory";
import { defaultEndpoint } from "../../config";

describe("BTCCore", function () {
    this.timeout(10000); // API can be slightly slow

    const txid = "0af83672b9f80f2ad53218a8f67899ea07d7da4f07a16ba2c954030895a91d9a";

    let api: ApiPromise;
    let btcCore: BTCCoreAPI;

    beforeEach(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        btcCore = new DefaultBTCCoreAPI(false);
    });

    afterEach(async () => {
        await api.disconnect();
    });

    describe("getLatestBlockHeight", () => {
        it("should return positive height", async () => {
            const latestBlockHeight = await btcCore.getLatestBlockHeight();
            assert.isAbove(latestBlockHeight, 0);
        });
    });

    describe("getLatestBlock", () => {
        it("should return block hash", async () => {
            const latestBlock = await btcCore.getLatestBlock();
            assert.isNotEmpty(latestBlock);
        });
    });

    describe("getMerkleProof", () => {
        it("should return BTC merkle proof as string", async () => {
            const proof = await btcCore.getMerkleProof(txid);
            assert.isNotEmpty(proof);
        });
    });

    describe("getTransactionStatus", () => {
        it("should return confirmed and number of confirmations", async () => {
            const status = await btcCore.getTransactionStatus(txid);
            assert.isAbove(status.confirmations, 90015);
            assert.isTrue(status.confirmed);
        });
    });

    describe("getTransactionBlockHeight", () => {
        it("should return correct block number", async () => {
            const height = await btcCore.getTransactionBlockHeight(txid);
            assert.strictEqual(height, 1747019);
        });
    });

    describe("getRawTransaction", () => {
        it("should return correct raw tx", async () => {
            // eslint-disable-next-line max-len
            const raw = new Buffer(
                "020000000001012a489eaa754d9aaf5198627d79e9234dba945436503aa445c1b82d6bc194c3270100000000ffffffff0280380100000000001600145601eeffa54c8b7e306c0b3a50c48121c42d09be8d4e030000000000160014a528e6f91766262e3d1b22e52af342f55b2d551c0247304402206fdaa5186ff79740b0fc2848f3ee40b48aa0cbdf9000304fbe6d35d7b1ee0c3602202cf90c73b0b834c8cc78c0b9e988bc2c5781fa617551c8cb5aa7b555efe7ab0a012102170f80797baa55d091f85e38a7b463c56905c09ef6024e83039037be5cd7550900000000",
                "hex"
            );
            const raw_tx = await btcCore.getRawTransaction(txid);
            assert.deepEqual(raw_tx, raw);
        });
    });
});
