import { ApiPromise } from "@polkadot/api";
import { UTXO } from "@interlay/esplora-btc-api";
import sinon from "sinon";
import Big from "big.js";

import { createPolkadotAPI } from "../../mock/factory";
import { assert } from "../../chai";
import { ElectrsAPI } from "../../../src/external";
import { DefaultElectrsAPI } from "../../../src/external/electrs";

describe("btc-core", () => {
    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let sandbox: sinon.SinonSandbox;

    before(async () => {
        api = await createPolkadotAPI();
        sandbox = sinon.createSandbox();
    });

    beforeEach(async () => {
        electrsAPI = new DefaultElectrsAPI("testnet");
    });

    after(() => {
        return api.disconnect();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should reject getTxIdByRecipientAddress if query returns empty array", async () => {
        sandbox.stub(DefaultElectrsAPI.prototype, "getData").returns(Promise.resolve([]));
        assert.isRejected(
            electrsAPI.getTxIdByRecipientAddress("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b")
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
        const amountAsSat = new Big("0.0007811");
        sandbox.stub(DefaultElectrsAPI.prototype, "getData").returns(Promise.resolve(txs));
        assert.isRejected(
            electrsAPI.getTxIdByRecipientAddress("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b", amountAsSat)
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
        sandbox.stub(DefaultElectrsAPI.prototype, "getData").returns(Promise.resolve(txs));
        const tx = await electrsAPI.getTxIdByRecipientAddress("2e6b22b95a2befa403ad59d0b75d931fd0748cf538b57640826e4692cc4fa24b");
        assert.strictEqual(tx, txs[0].txid);
    });
});
