import { assert } from "chai";
import { createPolkadotAPI } from "../../src/factory";
import { defaultEndpoint } from "../config";


describe("createAPI", () => {
    it("should connect to parachain", async () => {
        const api = await createPolkadotAPI(defaultEndpoint);
        assert.isTrue(api.isConnected);
        await api.disconnect();
    });
});
