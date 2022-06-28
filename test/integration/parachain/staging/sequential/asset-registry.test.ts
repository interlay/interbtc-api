import { assert } from "../../../../chai";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { createSubstrateAPI } from "../../../../../src/factory";
import { ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, SUDO_URI } from "../../../../config";
import { DefaultInterBtcApi, getStorageKey, stripHexPrefix } from "../../../../../src";

import { StorageKey } from "@polkadot/types";
import { AnyTuple } from "@polkadot/types/types";
import { waitForFinalizedEvent } from "../../../../utils/helpers";

describe("AssetRegistry", () => {
    let api: ApiPromise;
    let interBtcAPI: DefaultInterBtcApi;

    let sudoAccount: KeyringPair;

    let assetRegistryMetadataHash: string;
    let registeredKeysBefore: StorageKey<AnyTuple>[] = [];

    before(async () => {
        const keyring = new Keyring({ type: "sr25519" });
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

        sudoAccount = keyring.addFromUri(SUDO_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

        assetRegistryMetadataHash = getStorageKey("AssetRegistry", "Metadata");
        // check which keys exist before the tests
        registeredKeysBefore = (await interBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataHash)).toArray();
    });
    
    after(async () => {
        // clean up keys created in tests if necessary
        const registeredKeysAfter = (await interBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataHash)).toArray();

        const previousKeyHashes = registeredKeysBefore.map(key => stripHexPrefix(key.toHex()));
        // need to use string comparison since the raw StorageKeys don't play nicely with .filter()
        const newKeys = registeredKeysAfter.filter(key => {
            const newKeyHash = stripHexPrefix(key.toHex());
            return !previousKeyHashes.includes(newKeyHash);
        });

        if (newKeys.length > 0) {
            // clean up assets registered in test(s)
            const deleteKeysInstruction = interBtcAPI.api.tx.system.killStorage(newKeys);
            await interBtcAPI.api.tx.sudo.sudo(deleteKeysInstruction).signAndSend(sudoAccount);

            // wait for finalized event
            await waitForFinalizedEvent(interBtcAPI, api.events.sudo.Sudid);

        }
        
        return api.disconnect();
    });

    it("should get registered foreign assets as currencies", async () => {
        // check if any assets have been registered
        const existingKeys = (await interBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataHash)).toArray();

        if (existingKeys.length === 0) {
            // register a new foreign asset for the test
            const nextAssetId = (await interBtcAPI.api.query.assetRegistry.lastAssetId()).toNumber() + 1;

            const callToRegister = interBtcAPI.api.tx.assetRegistry.registerAsset({ 
                decimals: 6,
                name: "Test coin",
                symbol: "TSC",
            },
            api.createType("u32", nextAssetId)
            );

            // need sudo to add new foreign asset
            await interBtcAPI.api.tx.sudo.sudo(callToRegister).signAndSend(sudoAccount);
    
            // wait for finalized event
            await waitForFinalizedEvent(interBtcAPI, api.events.assetRegistry.RegisteredAsset);
        }

        // if this doesn't throw here we're in a good spot, but we can check a few more fields
        const currencies = await interBtcAPI.assetRegistry.getForeignAssetsAsCurrencies();
        assert.isNotEmpty(
            currencies,
            "Expected at least one currency, but got none"
        );

        for (const currency of currencies) {
            const currencyName = currency.name;
            assert.isDefined(
                currencyName,
                "Expected currency name to be defined"
            );

            const currencyTicker = currency.ticker;
            assert.isDefined(
                currencyTicker,
                `currency '${currencyName}' has no ticker`
            );

            assert.isDefined(
                currency.base,
                `currency '${currencyName}' has no base`
            );

            assert.isDefined(
                currency.rawBase,
                `currency '${currencyName}' has no raw base`
            );
        }
    }).timeout(5 * 60000);
});