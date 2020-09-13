import { assert } from "chai";
import { createAPI } from "../../src/factory";

const defaultEndpoint = "ws://localhost:9944";

describe("createAPI", () => {
    it("should connect to parachain", async () => {
        const api = await createAPI(defaultEndpoint);
        assert.isTrue(api.isConnected);
        await api.disconnect();
    });
});
