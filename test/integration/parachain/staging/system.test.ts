import { ApiPromise } from "@polkadot/api";
import { DefaultSystemAPI, SystemAPI } from "../../../../src/parachain/system";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";

describe("systemAPI", () => {
    let api: ApiPromise;
    let systemAPI: SystemAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        systemAPI = new DefaultSystemAPI(api);
    });

    after(async () => {
        api.disconnect();
    });

    it("should getCurrentBlockNumber", async () => {
        const currentBlockNumber = await systemAPI.getCurrentBlockNumber();
        assert.isDefined(currentBlockNumber);
    });

    it("should getStatusCode", async () => {
        const statusCode = await systemAPI.getStatusCode();
        assert.isDefined(statusCode);
    });
});
