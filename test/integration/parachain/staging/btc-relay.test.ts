import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { BTCRelayAPI } from "../../../../src/parachain";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultBTCRelayAPI } from "../../../../src/parachain/btc-relay";
import { createPolkadotAPI } from "../../../../src/factory";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../../src/utils/setup";

describe("BTCRelay", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let btcRelay: BTCRelayAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        electrsAPI = new DefaultElectrsAPI("testnet");
        btcRelay = new DefaultBTCRelayAPI(api, electrsAPI);
    });

    after(async () => {
        await api.disconnect();
    });

    it("should getLatestBTCBlockFromBTCRelay", async () => {
        const latestBTCBlockFromBTCRelay = await btcRelay.getLatestBlock();
        assert.isDefined(latestBTCBlockFromBTCRelay);
    }).timeout(500);

    it("should getLatestBTCBlockHeightFromBTCRelay", async () => {
        const latestBTCBlockHeightFromBTCRelay = await btcRelay.getLatestBlockHeight();
        assert.isDefined(latestBTCBlockHeightFromBTCRelay);
    }).timeout(500);
});
