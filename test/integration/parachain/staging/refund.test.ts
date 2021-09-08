import { ApiPromise, Keyring } from "@polkadot/api";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";

import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import { ALICE_URI, EVE_STASH_URI, DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { DefaultRefundAPI, RefundAPI } from "../../../../src/parachain/refund";
import { assert } from "../../../chai";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { REGTEST_ESPLORA_BASE_PATH } from "../../../../src";
import { interBTC, interBTCAmount } from "@interlay/monetary-js";

describe("refund", () => {
    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let refundAPI: RefundAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let alice: KeyringPair;
    let eve_stash: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
        refundAPI = new DefaultRefundAPI(api, bitcoinjs.networks.regtest, electrsAPI, interBTC);
        alice = keyring.addFromUri(ALICE_URI);
        eve_stash = keyring.addFromUri(EVE_STASH_URI);
    });

    after(async () => {
        api.disconnect();
    });

    it("should not generate a refund request", async () => {
        const issueResult = await issueSingle(
            api,
            electrsAPI,
            bitcoinCoreClient,
            alice,
            interBTCAmount.from.BTC(0.001),
            eve_stash.address,
            false,
            false
        );
        const refund = await refundAPI.getRequestByIssueId(issueResult.request.id);
        // The parachain returns an Option<> refund request if none was found,
        // which is deserialized as a refund request with blank/default fields
        assert.equal(refund.amountBtc.toString(), "0");
    }).timeout(1000000);

    it("should generate a refund request", async () => {
        const issueResult = await issueSingle(
            api,
            electrsAPI,
            bitcoinCoreClient,
            alice,
            interBTCAmount.from.BTC(0.001),
            eve_stash.address,
            true,
            true
        );
        const refund = await refundAPI.getRequestByIssueId(issueResult.request.id);
        const refundId = await refundAPI.getRequestIdByIssueId(issueResult.request.id);
        const refundClone = await refundAPI.getRequestById(refundId);
        assert.notEqual(refund.amountBtc.toString(), "0");
        assert.equal(refund.amountBtc.toString(), refundClone.amountBtc.toString());
    }).timeout(1000000);

    it("should list a single refund request", async () => {
        const refundRequests = await refundAPI.list();
        assert.equal(refundRequests.length, 1);
    }).timeout(100000);
});
