import { ApiPromise } from "@polkadot/api";

import { createPolkadotAPI } from "../../../../src/factory";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { DefaultFeeAPI, FeeAPI } from "../../../../src";
import { assert } from "chai";
import { interBTC } from "@interlay/monetary-js";

describe("fee", () => {
    let api: ApiPromise;
    let feeAPI: FeeAPI;

    before(async function () {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        feeAPI = new DefaultFeeAPI(api, interBTC);
    });

    after(async () => {
        api.disconnect();
    });

    it("should check getReplaceGriefingCollateralRate", async () => {
        const replaceGriefingCollateralRate = await feeAPI.getReplaceGriefingCollateralRate();
        assert.equal(replaceGriefingCollateralRate.toString(), "0.1");
    }).timeout(1000000);
});
