import { assert } from "chai";
import { createPolkadotAPI } from "../../../../src/factory";
import { defaultParachainEndpoint } from "../../../config";


describe("createAPI", () => {
    it("should connect to parachain", async () => {
        const api = await createPolkadotAPI(defaultParachainEndpoint);
        assert.isTrue(api.isConnected);
        await api.disconnect();
    });
});
