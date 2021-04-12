import { ApiPromise, Keyring } from "@polkadot/api";
import { BTCCoreAPI, DefaultBTCCoreAPI } from "../../../../src/external/btc-core";
import { BitcoinCoreClient } from "../../../utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoin from "bitcoinjs-lib";
import { DefaultRefundAPI, RefundAPI } from "../../../../src/parachain/refund";
import { assert } from "../../../chai";
import { issue } from "../../../utils/issue";

describe("refund", () => {
    let api: ApiPromise;
    let btcCoreAPI: BTCCoreAPI;
    let refundAPI: RefundAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        btcCoreAPI = new DefaultBTCCoreAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
        refundAPI = new DefaultRefundAPI(api, bitcoin.networks.regtest);
    });

    after(async () => {
        api.disconnect();
    });

    it("should not generate a refund request", async () => {
        const isueResult = await issue(
            api,
            btcCoreAPI,
            bitcoinCoreClient,
            keyring,
            "0.001",
            "Alice",
            "Eve",
            false,
            false
        );
        const refund = await refundAPI.getRequestByIssueId(isueResult.request.id);
        // The parachain returns an Option<> refund request if none was found,
        // which is deserialized as a refund request with blank/default fields
        assert.equal(refund.amount_btc.toString(), "0");
    }).timeout(1000000);

    it("should generate a refund request", async () => {
        const isueResult = await issue(
            api,
            btcCoreAPI,
            bitcoinCoreClient,
            keyring,
            "0.001",
            "Alice",
            "Eve",
            false,
            true
        );
        const refund = await refundAPI.getRequestByIssueId(isueResult.request.id);
        assert.notEqual(refund.amount_btc.toString(), "0");
    }).timeout(1000000);

    it("should list a single refund request", async () => {
        const refundRequests = await refundAPI.list();
        assert.equal(refundRequests.length, 1);
    }).timeout(100000);
});
