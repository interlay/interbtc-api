import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import Big from "big.js";

import { DefaultIssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { ElectrsAPI } from "../../../../src";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";

describe.skip("issue", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let electrsAPI: ElectrsAPI;

    // alice is the root account
    let alice: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");

        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
        electrsAPI = new DefaultElectrsAPI("http://0.0.0.0:3002");
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
    });

    after(async () => {
        api.disconnect();
    });

    it("should cancel a request issue", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");

        // request issue
        issueAPI.setAccount(alice);
        const amount = new Big("0.0000121");
        const requestResults = await issueAPI.request(amount);
        assert.equal(requestResults.length, 1, "Test broken: more than one issue request created"); // sanity check
        const requestResult = requestResults[0];

        // The cancellation period set by docker-compose is 50 blocks, each being relayed every 6s
        await bitcoinCoreClient.mineBlocks(50);
        await issueAPI.cancel(requestResult.id);

        const issueRequest = await issueAPI.getRequestById(requestResult.id);

        assert.isTrue(issueRequest.status.isCancelled, "Failed to cancel issue request");
    }).timeout(700000);

});

