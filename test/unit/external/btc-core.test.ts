import { ApiPromise } from "@polkadot/api";
import sinon from "sinon";
import { createPolkadotAPI } from "../../mock/factory";
import { assert } from "../../chai";
import { BTCCoreAPI } from "../../../src/external";
import { DefaultBTCCoreAPI } from "../../../src/external/electrs";
import { UTXO } from "@interlay/esplora-btc-api";

describe("btc-core", () => {
    let api: ApiPromise;
    let btcCore: BTCCoreAPI;
    let sandbox: sinon.SinonSandbox;

    before(async () => {
        api = await createPolkadotAPI();
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

    it("should reject getTxIdByRecipientAddress if query returns empty array", async () => {
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve([]));
        assert.isRejected(
            btcCore.getTxIdByRecipientAddress("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b")
        );
    });

    it("should reject getTxIdByRecipientAddress transaction amount is smaller", async () => {
        const txs = [
            {
                txid: "tx1",
                vout: 0,
                value: 78100
            } as UTXO
        ];
        const amountAsSat = "0.0007811";
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve(txs));
        assert.isRejected(
            btcCore.getTxIdByRecipientAddress("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b", amountAsSat)
        );
    });

    it("should return the first tx when using getTxIdByRecipientAddress if esplora returns array longer than 1", async () => {
        const txs = [
            {
                txid: "tx1",
                vout: 0,
                value: 781
            } as UTXO,
            {
                txid: "tx2",
                vout: 1,
                value: 119000000
            } as UTXO,
        ];
        sandbox.stub(DefaultBTCCoreAPI.prototype, "getData").returns(Promise.resolve(txs));
        const tx = await btcCore.getTxIdByRecipientAddress("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b");
        assert.strictEqual(tx, txs[0].txid);
    });
});
