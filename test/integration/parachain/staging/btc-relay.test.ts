import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { BTCRelayAPI } from "../../../../src/parachain";
import { BTCCoreAPI, DefaultBTCCoreAPI } from "../../../../src/external/btc-core";
import { DefaultBTCRelayAPI } from "../../../../src/parachain/btc-relay";
import { createPolkadotAPI } from "../../../../src/factory";
import { defaultParachainEndpoint } from "../../../config";

describe("BTCCore", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let btcCore: BTCCoreAPI;
    let btcRelay: BTCRelayAPI;

    beforeEach(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        btcCore = new DefaultBTCCoreAPI("testnet");
        btcRelay = new DefaultBTCRelayAPI(api, btcCore);
    });

    afterEach(async () => {
        await api.disconnect();
    });

    it("should getLatestBTCBlockFromBTCRelay", async () => {
        this.timeout(500);
        const latestBTCBlockFromBTCRelay = await btcRelay.getLatestBlock();
        assert.isDefined(latestBTCBlockFromBTCRelay);
    });

    it("should getLatestBTCBlockHeightFromBTCRelay", async () => {
        this.timeout(500);
        const latestBTCBlockHeightFromBTCRelay = await btcRelay.getLatestBlockHeight();
        assert.isDefined(latestBTCBlockHeightFromBTCRelay);
    });
});
