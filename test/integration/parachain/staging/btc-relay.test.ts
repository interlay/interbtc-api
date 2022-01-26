import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { BTCRelayAPI } from "../../../../src/parachain";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultBTCRelayAPI } from "../../../../src/parachain/btc-relay";
import { createSubstrateAPI } from "../../../../src/factory";
import { COLLATERAL_CURRENCY_TICKER, ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, WRAPPED_CURRENCY_TICKER } from "../../../config";
import { CollateralCurrency, DefaultBridgeAPI, BridgeAPI, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";

describe("BTCRelay", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let interBtcAPI: BridgeAPI;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        let wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        interBtcAPI = new DefaultBridgeAPI(api, "regtest", wrappedCurrency, undefined, "testnet");
    });

    after(async () => {
        await api.disconnect();
    });

    it("should getLatestBTCBlockFromBTCRelay", async () => {
        const latestBTCBlockFromBTCRelay = await interBtcAPI.btcRelay.getLatestBlock();
        assert.isDefined(latestBTCBlockFromBTCRelay);
    }).timeout(500);

    it("should getLatestBTCBlockHeightFromBTCRelay", async () => {
        const latestBTCBlockHeightFromBTCRelay = await interBtcAPI.btcRelay.getLatestBlockHeight();
        assert.isDefined(latestBTCBlockHeightFromBTCRelay);
    }).timeout(500);
});
