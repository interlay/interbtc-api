import { ApiPromise } from "@polkadot/api";
import sinon from "sinon";
import { createPolkadotAPI } from "../../../src/factory";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";
import { BTCCoreAPI } from "../../../src/apis";
import { DefaultBTCCoreAPI } from "../../../src/apis/btc-core";

// fails to disconnect from the api
describe.skip("btc-core", () => {
    let api: ApiPromise;
    let btcCore: BTCCoreAPI;
    let sandbox: sinon.SinonSandbox;

    before(async () => {
        api = await createPolkadotAPI("mock");
        sandbox = sinon.createSandbox();
    });

    beforeEach(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        btcCore = new DefaultBTCCoreAPI("testnet");
    });

    after(() => {
        return api.disconnect();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should reject getTxByOpcode if query returns empty array", async () => {
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve([]));
        assert.isRejected(btcCore.getTxIdByOpcode("random"));
    });

    it("should reject getTxByOpcode if query returns array longer than 1", async () => {
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve([undefined, undefined]));
        assert.isRejected(btcCore.getTxIdByOpcode("random"));
    });
});
