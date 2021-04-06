import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultIssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { btcToSat } from "../../../../src/utils";
import { assert } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoin from "bitcoinjs-lib";
import { BitcoinCoreClient } from "../../../utils/bitcoin-core-client";

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    // alice is the root account
    let alice: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");

        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");

        issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
    });

    after(async () => {
        api.disconnect();
    });

    it("should cancel a request issue", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");

        // request issue
        issueAPI.setAccount(alice);
        const amountAsBtcString = "0.0000121";
        const amountAsSatoshiString = btcToSat(amountAsBtcString);
        const amountAsSatoshi = api.createType("Balance", amountAsSatoshiString);
        const requestResult = await issueAPI.request(amountAsSatoshi);

        // The cancellation period set by docker-compose is 50 blocks, each being relayed every 6s
        await bitcoinCoreClient.mineBlocks(50);
        await issueAPI.cancel(requestResult.id);

        const issueRequest = await issueAPI.getRequestById(requestResult.id);

        assert.isTrue(issueRequest.status.isCancelled, "Failed to cancel issue request");
    }).timeout(700000);

});

