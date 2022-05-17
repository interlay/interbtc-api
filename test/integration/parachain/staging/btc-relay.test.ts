import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { createSubstrateAPI } from "../../../../src/factory";
import { PARACHAIN_ENDPOINT } from "../../../config";
import { DefaultInterBtcApi, InterBtcApi } from "../../../../src";

describe("BTCRelay", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let interBtcAPI: InterBtcApi;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, "testnet");
    });

    after(async () => {
        await api.disconnect();
    });

    it("should getLatestBTCBlockFromBTCRelay", async () => {
        const latestBTCBlockFromBTCRelay = await interBtcAPI.btcRelay.getLatestBlock();
        assert.isDefined(latestBTCBlockFromBTCRelay);
    }).timeout(1500);

    it("should getLatestBTCBlockHeightFromBTCRelay", async () => {
        const latestBTCBlockHeightFromBTCRelay = await interBtcAPI.btcRelay.getLatestBlockHeight();
        assert.isDefined(latestBTCBlockHeightFromBTCRelay);
    }).timeout(1500);
});
