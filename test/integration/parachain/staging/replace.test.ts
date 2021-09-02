import { ApiPromise, Keyring } from "@polkadot/api";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import { BTCAmount, Polkadot } from "@interlay/monetary-js";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import {
    ALICE_URI,
    DEFAULT_BITCOIN_CORE_HOST,
    DEFAULT_BITCOIN_CORE_NETWORK,
    DEFAULT_BITCOIN_CORE_PASSWORD,
    DEFAULT_BITCOIN_CORE_PORT,
    DEFAULT_BITCOIN_CORE_USERNAME,
    DEFAULT_BITCOIN_CORE_WALLET,
    DEFAULT_PARACHAIN_ENDPOINT,
    EVE_STASH_URI
} from "../../../config";
import { assert } from "../../../chai";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { DefaultReplaceAPI, REGTEST_ESPLORA_BASE_PATH, ReplaceAPI } from "../../../../src";
import { SLEEP_TIME_MS, sleep } from "../../../utils/helpers";

describe("replace", () => {
    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let replaceAPI: ReplaceAPI;
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
        replaceAPI = new DefaultReplaceAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        alice = keyring.addFromUri(ALICE_URI);
        eve_stash = keyring.addFromUri(EVE_STASH_URI);
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        let replaceId: string;

        it("should request vault replacement", async () => {
            const issueAmount = BTCAmount.from.BTC(0.001);
            const replaceAmount = BTCAmount.from.BTC(0.0005);
            await issueSingle(
                api,
                electrsAPI,
                bitcoinCoreClient,
                alice,
                issueAmount,
                Polkadot,
                eve_stash.address
            );
            // Eve//stash is the vault that requests replacement
            replaceAPI.setAccount(eve_stash);
            replaceId = await replaceAPI.request(replaceAmount);
        }).timeout(200000);

        // This test assumes the request replace test was successful
        it("should list/map a single replace request", async () => {
            // wait for request to be finalized so list/map below works
            while ((await replaceAPI.list()).length == 0) {
                await sleep(SLEEP_TIME_MS);
            }

            const requestsList = await replaceAPI.list();
            const requestsMap = await replaceAPI.map();
            assert.equal(requestsList.length, 1);
            assert.equal(requestsMap.size, 1);
            const firstMapEntry = requestsMap.values().next();
            // `deepEqual` fails with: Cannot convert 'Pending' via asCancelled
            // Need to manually compare some fields
            assert.equal(requestsList[0].btcAddress, firstMapEntry.value.btcAddress);
            assert.equal(requestsList[0].amount.toString(), firstMapEntry.value.amount.toString());
            assert.equal(requestsList[0].btcHeight.toString(), firstMapEntry.value.btcHeight.toString());
        }).timeout(50000);

    });


    it("should getDustValue", async () => {
        const dustValue = await replaceAPI.getDustValue();
        assert.equal(dustValue.str.BTC(), "0.00001");
    }).timeout(500);

    it("should getGriefingCollateral", async () => {
        const amountToReplace = BTCAmount.from.BTC(0.728);
        const griefingCollateral = await replaceAPI.getGriefingCollateral(amountToReplace, Polkadot);
        assert.equal(griefingCollateral.str.DOT(), "284.9204534203");
    }).timeout(500);

    it("should getReplacePeriod", async () => {
        const replacePeriod = await replaceAPI.getReplacePeriod();
        assert.equal(replacePeriod.toString(), "14400");
    }).timeout(500);

});
