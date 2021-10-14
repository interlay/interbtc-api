import { ApiPromise, Keyring } from "@polkadot/api";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import { InterBtc, InterBtcAmount, Polkadot } from "@interlay/monetary-js";

import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import {
    USER_1_URI,
    VAULT_2,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    VAULT_3,
    ESPLORA_BASE_PATH
} from "../../../config";
import { assert } from "../../../chai";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { DefaultReplaceAPI, ReplaceAPI } from "../../../../src";
import { SLEEP_TIME_MS, sleep } from "../../../utils/helpers";

describe("replace", () => {
    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let replaceAPI: ReplaceAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_3: KeyringPair;
    let vault_2: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
        replaceAPI = new DefaultReplaceAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc);
        userAccount = keyring.addFromUri(USER_1_URI);
        vault_3 = keyring.addFromUri(VAULT_3);
        vault_2 = keyring.addFromUri(VAULT_2);
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        let replaceId: string;

        it("should request vault replacement", async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.001);
            const replaceAmount = InterBtcAmount.from.BTC(0.0005);
            await issueSingle(
                api,
                electrsAPI,
                bitcoinCoreClient,
                userAccount,
                issueAmount,
                vault_3.address
            );
            replaceAPI.setAccount(vault_3);
            replaceId = await replaceAPI.request(replaceAmount);

            replaceAPI.setAccount(vault_2);
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
        const amountToReplace = InterBtcAmount.from.BTC(0.728);
        const griefingCollateral = await replaceAPI.getGriefingCollateral(amountToReplace, Polkadot);
        assert.equal(griefingCollateral.str.DOT(), "284.9204534203");
    }).timeout(500);

    it("should getReplacePeriod", async () => {
        const replacePeriod = await replaceAPI.getReplacePeriod();
        assert.equal(replacePeriod.toString(), "14400");
    }).timeout(500);

    it("should list replace request by a vault", async () => {
        const eveStashId = api.createType("AccountId", vault_3.address);
        const replaceRequests = await replaceAPI.mapReplaceRequests(eveStashId);
        replaceRequests.forEach((request) => {
            assert.deepEqual(request.oldVault, eveStashId);
        });
    });

});
