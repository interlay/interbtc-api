import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { BTCRelayAPI } from "../../../../src/parachain";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultBTCRelayAPI } from "../../../../src/parachain/btc-relay";
import { createPolkadotAPI } from "../../../../src/factory";
import { defaultParachainEndpoint } from "../../../config";

describe("BTCRelay", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let btcRelay: BTCRelayAPI;

    beforeEach(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        electrsAPI = new DefaultElectrsAPI("testnet");
        btcRelay = new DefaultBTCRelayAPI(api, electrsAPI);
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
