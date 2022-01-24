import { ApiPromise, Keyring } from "@polkadot/api";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import { InterBtcAmount, Kusama, Polkadot } from "@interlay/monetary-js";
import { InterbtcPrimitivesVaultId } from "../../../../src/index";

import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import {
    USER_1_URI,
    VAULT_2_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    VAULT_3_URI,
    ESPLORA_BASE_PATH,
    NATIVE_CURRENCY_TICKER,
    WRAPPED_CURRENCY_TICKER
} from "../../../config";
import { assert } from "../../../chai";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { CollateralCurrency, currencyIdToMonetaryCurrency, DefaultReplaceAPI, newAccountId, newVaultId, ReplaceAPI, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";
import { SLEEP_TIME_MS, sleep } from "../../../utils/helpers";

describe("replace", () => {
    let api: ApiPromise;
    let electrsAPI: ElectrsAPI;
    let replaceAPI: ReplaceAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_3: KeyringPair;
    let vault_3_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;

    let collateralCurrency: CollateralCurrency;
    let wrappedCurrency: WrappedCurrency;

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
        collateralCurrency = tickerToMonetaryCurrency(api, NATIVE_CURRENCY_TICKER) as CollateralCurrency;
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        replaceAPI = new DefaultReplaceAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency);
        userAccount = keyring.addFromUri(USER_1_URI);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_id = newVaultId(api, vault_3.address, Polkadot, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, Kusama, wrappedCurrency);
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        it("should request vault replacement", async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.00005);
            const replaceAmount = InterBtcAmount.from.BTC(0.00004);
            await issueSingle(
                api,
                electrsAPI,
                bitcoinCoreClient,
                userAccount,
                issueAmount,
                collateralCurrency,
                vault_3_id
            );
            replaceAPI.setAccount(vault_3);
            await replaceAPI.request(replaceAmount, currencyIdToMonetaryCurrency(vault_3_id.currencies.collateral) as CollateralCurrency);

            replaceAPI.setAccount(vault_2);
            await replaceAPI.request(replaceAmount, currencyIdToMonetaryCurrency(vault_2_id.currencies.collateral) as CollateralCurrency);
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
            // Only check the first element to ensure parsing is correct
            assert.equal(requestsList[0].btcAddress, firstMapEntry.value.btcAddress);
            assert.equal(requestsList[0].amount.toString(), firstMapEntry.value.amount.toString());
            assert.equal(requestsList[0].btcHeight.toString(), firstMapEntry.value.btcHeight.toString());
        }).timeout(50000);

    });

    it("should getDustValue", async () => {
        const dustValue = await replaceAPI.getDustValue();
        assert.equal(dustValue.str.BTC(), "0.00001");
    }).timeout(500);

    it("should getReplacePeriod", async () => {
        const replacePeriod = await replaceAPI.getReplacePeriod();
        assert.equal(replacePeriod.toString(), "14400");
    }).timeout(500);

    it("should list replace request by a vault", async () => {
        const vault3Id = newAccountId(api, vault_3.address);
        const replaceRequests = await replaceAPI.mapReplaceRequests(vault3Id);
        replaceRequests.forEach((request) => {
            assert.deepEqual(request.oldVault.accountId, vault3Id);
        });
    });

});
