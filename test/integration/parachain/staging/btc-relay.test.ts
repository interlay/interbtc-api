import { ApiPromise } from "@polkadot/api";
import { createSubstrateAPI } from "../../../../src/factory";
import { PARACHAIN_ENDPOINT } from "../../../config";
import { DefaultInterBtcApi, InterBtcApi } from "../../../../src";

describe("BTCRelay", () => {
    let api: ApiPromise;
    let interBtcAPI: InterBtcApi;

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", undefined, "testnet");
    });

    afterAll(async () => {
        await api.disconnect();
    });

    it("should getLatestBTCBlockFromBTCRelay", async () => {
        const latestBTCBlockFromBTCRelay = await interBtcAPI.btcRelay.getLatestBlock();
        expect(latestBTCBlockFromBTCRelay).toBeDefined();
    }, 1500);

    it("should getLatestBTCBlockHeightFromBTCRelay", async () => {
        const latestBTCBlockHeightFromBTCRelay = await interBtcAPI.btcRelay.getLatestBlockHeight();
        expect(latestBTCBlockHeightFromBTCRelay).toBeDefined();
    }, 1500);
});
