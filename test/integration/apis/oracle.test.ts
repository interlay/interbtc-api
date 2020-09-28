import { assert } from "chai";
import { ApiPromise } from "@polkadot/api";
import { createPolkadotAPI } from "../../../src/factory";
import { OracleAPI, DefaultOracleAPI } from "../../../src/apis/oracle";

const defaultEndpoint = "ws://localhost:9944";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;

    beforeEach(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        oracle = new DefaultOracleAPI(api);
    });

    afterEach(async () => {
        await api.disconnect();
    });

    describe("info", () => {
        it("should return oracle info", async () => {
            const info = await oracle.getInfo();
            assert.equal(info.name, "Bob");
            assert.isTrue(info.online);
            assert.equal(info.feed, "BTC/DOT");
        });
    });
});
