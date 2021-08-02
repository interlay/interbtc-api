import { ApiPromise, Keyring } from "@polkadot/api";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";

import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import { 
    DEFAULT_BITCOIN_CORE_HOST,
    DEFAULT_BITCOIN_CORE_NETWORK,
    DEFAULT_BITCOIN_CORE_PASSWORD,
    DEFAULT_BITCOIN_CORE_PORT,
    DEFAULT_BITCOIN_CORE_USERNAME,
    DEFAULT_BITCOIN_CORE_WALLET,
    DEFAULT_PARACHAIN_ENDPOINT
} from "../../../../src/utils/setup";
import { assert } from "../../../chai";
import { issueSingle, sleep } from "../../../../src/utils/issueRedeem";
import { DefaultReplaceAPI, REGTEST_ESPLORA_BASE_PATH, ReplaceAPI } from "../../../../src";
import { BTCAmount, Polkadot } from "@interlay/monetary-js";

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
        alice = keyring.addFromUri("//Alice");
        eve_stash = keyring.addFromUri("//Eve//stash");
    });

    after(async () => {
        api.disconnect();
    });

    it("should request vault replacement", async () => {
        const issueAmount = BTCAmount.from.BTC(0.001);
        const replaceAmount = BTCAmount.from.BTC(0.0005);
        await issueSingle(
            api,
            electrsAPI,
            bitcoinCoreClient,
            alice,
            issueAmount,
            eve_stash.address
        );
        // Eve//stash is the vault that requests replacement
        replaceAPI.setAccount(eve_stash);
        await replaceAPI.request(replaceAmount);
    }).timeout(100000);

    it("should getDustValue", async () => {
        const dustValue = await replaceAPI.getDustValue();
        assert.equal(dustValue.str.BTC(), "0.00001");
    }).timeout(500);

    it("should getGriefingCollateral", async () => {
        const amountToReplace = BTCAmount.from.BTC(0.728);
        const griefingCollateral = await replaceAPI.getGriefingCollateral(amountToReplace, Polkadot);
        assert.equal(griefingCollateral.str.DOT(), "280.660880136");
    }).timeout(500);

    it("should getReplacePeriod", async () => {
        const replacePeriod = await replaceAPI.getReplacePeriod();
        assert.equal(replacePeriod.toString(), "14400");
    }).timeout(500);

    it("should list/map a single replace request", async () => {
        // Sleep for 30s to allow for the list of replace requests to update.
        // Otherwise the test may fail.
        await sleep(30 * 1000);
        // This test assumes the request replace test was successful
        const requestsList = await replaceAPI.list();
        const requestsMap = await replaceAPI.map();
        assert.equal(requestsList.length, 1);
        assert.equal(requestsMap.size, 1);
        const firstMapEntry = requestsMap.values().next();
        // `deepEqual` fails with: Cannot convert 'Pending' via asCancelled
        // Need to manually compare some fields
        assert.equal(requestsList[0].btc_address, firstMapEntry.value.btc_address);
        assert.equal(requestsList[0].amount.toString(), firstMapEntry.value.amount.toString());
        assert.equal(requestsList[0].btc_height.toString(), firstMapEntry.value.btc_height.toString());
    }).timeout(50000);
});
