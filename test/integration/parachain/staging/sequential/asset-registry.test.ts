import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { StorageKey } from "@polkadot/types";
import { AnyTuple } from "@polkadot/types/types";
import { AssetId } from "@polkadot/types/interfaces/runtime";
import { OrmlTraitsAssetRegistryAssetMetadata } from "@polkadot/types/lookup";

import { createSubstrateAPI } from "../../../../../src/factory";
import { ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, SUDO_URI } from "../../../../config";
import { DefaultAssetRegistryAPI, DefaultInterBtcApi, DefaultTransactionAPI } from "../../../../../src";
import { storageKeyToNthInner, stripHexPrefix } from "../../../../../src/utils";

describe("AssetRegistry", () => {
    let api: ApiPromise;
    let interBtcAPI: DefaultInterBtcApi;

    let sudoAccount: KeyringPair;

    let assetRegistryMetadataPrefix: string;
    let registeredKeysBefore: StorageKey<AnyTuple>[] = [];

    beforeAll(async () => {
        const keyring = new Keyring({ type: "sr25519" });
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

        sudoAccount = keyring.addFromUri(SUDO_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

        assetRegistryMetadataPrefix = api.query.assetRegistry.metadata.keyPrefix();
        // check which keys exist before the tests
        const keys = await interBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataPrefix);
        registeredKeysBefore = keys.toArray();
    });

    afterAll(async () => {
        // clean up keys created in tests if necessary
        const registeredKeysAfter = (await interBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataPrefix)).toArray();

        const previousKeyHashes = registeredKeysBefore.map((key) => stripHexPrefix(key.toHex()));
        // need to use string comparison since the raw StorageKeys don't play nicely with .filter()
        const newKeys = registeredKeysAfter.filter((key) => {
            const newKeyHash = stripHexPrefix(key.toHex());
            return !previousKeyHashes.includes(newKeyHash);
        });

        if (newKeys.length > 0) {
            // clean up assets registered in test(s)
            const deleteKeysCall = api.tx.system.killStorage(newKeys);
            await DefaultTransactionAPI.sendLogged(
                api,
                sudoAccount,
                api.tx.sudo.sudo(deleteKeysCall),
                api.events.sudo.Sudid
            );
        }

        await api.disconnect();
    });

    /**
     * This test checks that the returned metadata from the chain has all the fields we need to construct
     * a `Currency` object.
     * To see the fields required, take a look at {@link DefaultAssetRegistryAPI.metadataToCurrency}.
     *
     * Note: More detailed tests around the internal logic are in the unit tests.
     */
    it("should get expected shape of AssetRegistry metadata", async () => {
        // check if any assets have been registered
        const existingKeys = (await interBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataPrefix)).toArray();

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
            const result = await DefaultTransactionAPI.sendLogged(
                api,
                sudoAccount,
                api.tx.sudo.sudo(callToRegister),
                api.events.sudo.RegisteredAsset
            );

            expect(result.isCompleted).toBe(true);
        }

        // get the metadata for the asset we just registered
        const assetRegistryAPI = new DefaultAssetRegistryAPI(api);
        const foreignAssetEntries = await assetRegistryAPI.getAssetRegistryEntries();
        const unwrappedMetadataTupleArray = DefaultAssetRegistryAPI.unwrapMetadataFromEntries(foreignAssetEntries);

        type OrmlARAMetadataKey = keyof OrmlTraitsAssetRegistryAssetMetadata;

        // now check that we have the fields we absolutely need on the returned metadata
        // check {@link DefaultAssetRegistryAPI.metadataToCurrency} to see which fields are needed.
        const requiredFieldClassnames = new Map<OrmlARAMetadataKey, string>([
            ["name" as OrmlARAMetadataKey, "Bytes"],
            ["symbol" as OrmlARAMetadataKey, "Bytes"],
            ["decimals" as OrmlARAMetadataKey, "u32"],
        ]);

        for (const [storageKey, metadata] of unwrappedMetadataTupleArray) {
            expect(metadata).toBeDefined();
            expect(storageKey).toBeDefined();

            const storageKeyValue = storageKeyToNthInner<AssetId>(storageKey);
            expect(storageKeyValue).toBeDefined();

            for (const [key, className] of requiredFieldClassnames) {
                try {
                    expect(metadata[key]).toBeDefined();
                } catch(_) {
                    throw Error(`Expected metadata to have field ${key.toString()}, but it does not.`);
                }

                // check type
                try {
                    expect(metadata[key]?.constructor.name).toBe(className);
                } catch(_) {
                    throw Error(
                        `Expected metadata to have field ${key.toString()} of type ${className}, 
                        but its type is ${metadata[key]?.constructor.name}.`
                    );
                }
            }
        }
    });

    // PRECONDITION: This test requires at least one foreign asset set up as collateral currency.
    //   This should have happened as part of preparations in initialize.test.ts
    it("should get at least one collateral foreign asset", async () => {
        const collateralForeignAssets = await interBtcAPI.assetRegistry.getCollateralForeignAssets();

        expect(collateralForeignAssets.length).toBeGreaterThanOrEqual(1);
    });
});
