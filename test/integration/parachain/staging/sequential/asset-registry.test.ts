import { assert } from "../../../../chai";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { createSubstrateAPI } from "../../../../../src/factory";
import { ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, SUDO_URI } from "../../../../config";
import { DefaultAssetRegistryAPI, DefaultInterBtcApi, getStorageKey, stripHexPrefix } from "../../../../../src";

import { StorageKey } from "@polkadot/types";
import { AnyTuple } from "@polkadot/types/types";

import { OrmlTraitsAssetRegistryAssetMetadata } from "@polkadot/types/lookup";
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

        const previousKeyHashes = registeredKeysBefore.map((key) => stripHexPrefix(key.toHex()));
        // need to use string comparison since the raw StorageKeys don't play nicely with .filter()
        const newKeys = registeredKeysAfter.filter((key) => {
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

    /**
     * This test checks that the returned metadata from the chain has all the fields we need to construct
     * a `Currency<UnitList>` object.
     * To see the fields required, take a look at {@link DefaultAssetRegistryAPI.metadataToCurrency}.
     *
     * Note: More detailed tests around the internal logic are in the unit tests.
     */
    it("should get expected shape of AssetRegistry metadata", async () => {
        // check if any assets have been registered
        const existingKeys = (await interBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataHash)).toArray();

        if (existingKeys.length === 0) {
            // no existing foreign assets; register a new foreign asset for the test
            const nextAssetId = (await interBtcAPI.api.query.assetRegistry.lastAssetId()).toNumber() + 1;

            const callToRegister = interBtcAPI.api.tx.assetRegistry.registerAsset(
                {
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

        // get the metadata for the asset we just registered
        const assetRegistryAPI = new DefaultAssetRegistryAPI(api);
        const foreignAssetEntries = await assetRegistryAPI.getAssetRegistryEntries();
        const metadataArray = DefaultAssetRegistryAPI.extractMetadataFromEntries(foreignAssetEntries);

        type OrmlARAMetadataKey = keyof OrmlTraitsAssetRegistryAssetMetadata;

        // now check that we have the fields we absolutely need on the returned metadata
        // check {@link DefaultAssetRegistryAPI.metadataToCurrency} to see which fields are needed.
        const requiredFieldClassnames = new Map<OrmlARAMetadataKey, string>([
            ["name" as OrmlARAMetadataKey, "Bytes"],
            ["symbol" as OrmlARAMetadataKey, "Bytes"],
            ["decimals" as OrmlARAMetadataKey, "u32"],
        ]);

        for (const metadata of metadataArray) {
            assert.isDefined(metadata, "Expected metadata to be defined, but it is not.");

            for (const [key, className] of requiredFieldClassnames) {
                assert.isDefined(metadata[key], `Expected metadata to have field ${key.toString()}, but it does not.`);

                // check type
                assert.equal(
                    metadata[key]?.constructor.name,
                    className,
                    `Expected metadata to have field ${key.toString()} of type ${className}, 
                    but its type is ${metadata[key]?.constructor.name}.`
                );
            }
        }
    }).timeout(5 * 60000);
});
