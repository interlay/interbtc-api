import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { 
    DefaultInterBtcApi, 
    getCorrespondingCollateralCurrency, 
    InterBtcApi, 
    InterbtcPrimitivesVaultId, 
    newMonetaryAmount
} from "../../../../../src/index";

import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { createSubstrateAPI } from "../../../../../src/factory";
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
} from "../../../../config";
import { assert } from "../../../../chai";
import { issueSingle } from "../../../../../src/utils/issueRedeem";
import { CollateralCurrency, currencyIdToMonetaryCurrency, newAccountId, newVaultId, WrappedCurrency } from "../../../../../src";

describe("replace", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_3: KeyringPair;
    let vault_3_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;
    let interBtcAPI: InterBtcApi;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrency: CollateralCurrency;

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );

        userAccount = keyring.addFromUri(USER_1_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        collateralCurrency = getCorrespondingCollateralCurrency(interBtcAPI.getGovernanceCurrency());
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_id = newVaultId(api, vault_3.address, collateralCurrency, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency);
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        it("should request vault replacement", async () => {
            const issueAmount = newMonetaryAmount(0.000012, wrappedCurrency, true);
            const replaceAmount = newMonetaryAmount(0.00001, wrappedCurrency, true);
            await issueSingle(
                interBtcAPI,
                bitcoinCoreClient,
                userAccount,
                issueAmount,
                vault_3_id
            );
            interBtcAPI.setAccount(vault_3);
            await interBtcAPI.replace.request(
                replaceAmount, 
                currencyIdToMonetaryCurrency(vault_3_id.currencies.collateral) as CollateralCurrency
            );

            interBtcAPI.setAccount(vault_2);
            await interBtcAPI.replace.request(
                replaceAmount, 
                currencyIdToMonetaryCurrency(vault_2_id.currencies.collateral) as CollateralCurrency
            );

            const requestsList = await interBtcAPI.replace.list();
            const requestsMap = await interBtcAPI.replace.map();
            assert.equal(requestsList.length, 1);
            assert.equal(requestsMap.size, 1);
            const firstMapEntry = requestsMap.values().next();
            // `deepEqual` fails with: Cannot convert 'Pending' via asCancelled
            // Need to manually compare some fields
            // Only check the first element to ensure parsing is correct
            assert.equal(requestsList[0].btcAddress, firstMapEntry.value.btcAddress);
            assert.equal(requestsList[0].amount.toString(), firstMapEntry.value.amount.toString());
            assert.equal(requestsList[0].btcHeight.toString(), firstMapEntry.value.btcHeight.toString());
        }).timeout(400000);
    });

    it("should getDustValue", async () => {
        const dustValue = await interBtcAPI.replace.getDustValue();
        assert.equal(dustValue.str.BTC(), "0.00001");
    }).timeout(500);

    it("should getReplacePeriod", async () => {
        const replacePeriod = await interBtcAPI.replace.getReplacePeriod();
        assert.equal(replacePeriod.toString(), "7200");
    }).timeout(500);

    it("should list replace request by a vault", async () => {
        const vault3Id = newAccountId(api, vault_3.address);
        const replaceRequests = await interBtcAPI.replace.mapReplaceRequests(vault3Id);
        replaceRequests.forEach((request) => {
            assert.deepEqual(request.oldVault.accountId, vault3Id);
        });
    });

});
