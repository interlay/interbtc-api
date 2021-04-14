import { ApiPromise, Keyring } from "@polkadot/api";
import * as bitcoin from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import Big from "big.js";

import { BTCCoreAPI, DefaultBTCCoreAPI } from "../../../../src/external/electrs";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import { defaultParachainEndpoint } from "../../../config";
import { DefaultRefundAPI, RefundAPI } from "../../../../src/parachain/refund";
import { assert } from "../../../chai";
import { issue } from "../../../../src/utils/issue";

describe("refund", () => {
    let api: ApiPromise;
    let btcCoreAPI: BTCCoreAPI;
    let refundAPI: RefundAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let alice: KeyringPair;
    let eve: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        btcCoreAPI = new DefaultBTCCoreAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
        refundAPI = new DefaultRefundAPI(api, bitcoin.networks.regtest);
        alice = keyring.addFromUri("//Alice");
        eve = keyring.addFromUri("//Eve");
    });

    after(async () => {
        api.disconnect();
    });

    it("should not generate a refund request", async () => {
        const isueResult = await issue(
            api,
            btcCoreAPI,
            bitcoinCoreClient,
            alice,
            new Big("0.001"),
            eve.address,
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
            alice,
            new Big("0.001"),
            eve.address,
            true,
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
