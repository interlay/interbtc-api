import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultIssueAPI } from "../../../src/parachain/issue";
import { DefaultBTCCoreAPI } from "../../../src/external/btc-core";
import { issue } from "./issue.test";
import { BitcoinCoreClient } from "../../utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../src/factory";
import { defaultParachainEndpoint } from "../../config";
import * as bitcoin from "bitcoinjs-lib";
import { DefaultRefundAPI } from "../../../src/parachain/refund";
import { KeyringPair } from "@polkadot/keyring/types";
import { assert } from "../../chai";

describe("refund", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let btcCoreAPI: DefaultBTCCoreAPI;
    let refundAPI: DefaultRefundAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let alice: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");
        btcCoreAPI = new DefaultBTCCoreAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
        issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
        refundAPI = new DefaultRefundAPI(api, bitcoin.networks.regtest);
        refundAPI.setAccount(alice);
    });

    after(async () => {
        api.disconnect();
    });

    it.skip("should not generate a refund request", async () => {
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
        const refund = await refundAPI.getRequestByIssueId(isueResult.request.id.toString());
        // The parachain returns an Option<> refund request if none was found,
        // which is deserialized as a refund request with blank/default fields
        assert.equal(refund.amount_btc.toString(), "0");
    });

    it.skip("should generate a refund request", async () => {
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
        const refund = await refundAPI.getRequestByIssueId(isueResult.request.id.toString());
        assert.notEqual(refund.amount_btc.toString(), "0");
    });

    it.skip("should list a single refund request", async () => {
        const refundRequests = await refundAPI.list();
        assert.equal(refundRequests.length, 1);
    });
});
