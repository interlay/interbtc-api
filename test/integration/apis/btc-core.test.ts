import { assert } from "chai";
import { ApiPromise } from "@polkadot/api";
import { createPolkadotAPI } from "../../../src/factory";
import { BTCCoreAPI, DefaultBTCCoreAPI } from "../../../src/apis/btc-core";
import { defaultEndpoint } from "../../config";

describe("BTCCore", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let btcCore: BTCCoreAPI;

    beforeEach(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        btcCore = new DefaultBTCCoreAPI();
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
            const proof = await btcCore.getMerkleProof(
                "6c15cb7dca49afc5d7521d9c8fb39bad2227e499b54895ceef0bfb1937402689"
            );
            assert.isNotEmpty(proof);
        });
    });
});
