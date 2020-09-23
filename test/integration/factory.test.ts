import { assert } from "chai";
import { createPolkadotAPI } from "../../src/factory";

const defaultEndpoint = "ws://localhost:9944";

describe("createAPI", () => {
    it("should connect to parachain", async () => {
        const api = await createPolkadotAPI(defaultEndpoint);
        assert.isTrue(api.isConnected);
        await api.disconnect();
    });
});
