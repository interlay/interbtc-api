import { ApiPromise } from "@polkadot/api";
import sinon from "sinon";
import { createPolkadotAPI } from "../../../src/factory";
import { assert } from "../../chai";
import { BTCCoreAPI } from "../../../src/apis";
import { DefaultBTCCoreAPI } from "../../../src/apis/btc-core";
import { Transaction, VOut } from "@interlay/esplora-btc-api";

describe("btc-core", () => {
    let api: ApiPromise;
    let btcCore: BTCCoreAPI;
    let sandbox: sinon.SinonSandbox;

    before(async () => {
        api = await createPolkadotAPI("mock");
        sandbox = sinon.createSandbox();
    });

    beforeEach(async () => {
        btcCore = new DefaultBTCCoreAPI("testnet");
    });

    after(() => {
        return api.disconnect();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should reject getTxIdByOpReturn if query returns empty array", async () => {
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve([]));
        assert.isRejected(
            btcCore.getTxIdByOpReturn("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b")
        );
    });

    it("should reject getTxIdByOpReturn if no found tx has outputs", async () => {
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve([undefined, undefined]));
        assert.isRejected(
            btcCore.getTxIdByOpReturn("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b")
        );
    });

    it("should return the first tx when using getTxIdByOpReturn if esplora returns array longer than 1", async () => {
        const txs = [
            {
                txid: "tx1",
                version: 1,
                vout: [{} as VOut],
            } as Transaction,
            {
                txid: "tx2",
                version: 1,
                vout: [{} as VOut],
            } as Transaction,
        ];
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve(txs));
        const tx = await btcCore.getTxIdByOpReturn("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b");
        assert.strictEqual(tx, txs[0].txid);
    });
});
