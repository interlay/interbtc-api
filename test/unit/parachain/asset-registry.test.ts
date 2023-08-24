import { StorageKey, u32, TypeRegistry } from "@polkadot/types";
import {
    InterbtcPrimitivesCurrencyId,
    InterbtcPrimitivesVaultCurrencyPair,
    OrmlTraitsAssetRegistryAssetMetadata,
} from "@polkadot/types/lookup";
import { DefaultAssetRegistryAPI, ForeignAsset } from "../../../src/";
import { AssetRegistryMetadataTuple } from "../../../src/parachain/asset-registry";
import * as allThingsEncoding from "../../../src/utils/encoding";

describe("DefaultAssetRegistryAPI", () => {
    // let api: ApiPromise;
    let registry: TypeRegistry;
    let assetRegistryApi: DefaultAssetRegistryAPI;
    let mockMetadata: OrmlTraitsAssetRegistryAssetMetadata;
    let mockStorageKey: StorageKey<[u32]>;

    const mockStorageKeyValue = 42;
    const mockMetadataValues = {
        name: "Mock Coin One",
        symbol: "MCO",
        decimals: 8,
        existentialDeposit: 42,
        feesPerMinute: 15,
        coingeckoId: "mock-coin-one",
    };

    beforeAll(() => {
        registry = new TypeRegistry(undefined);

        // register just enough from OrmlTraitsAssetRegistryAssetMetadata to construct
        // meaningful representations for our tests
        registry.register({
            OrmlTraitsAssetRegistryAssetMetadata: {
                name: "Bytes",
                symbol: "Bytes",
                decimals: "u32",
                existentialDeposit: "u128",
                additional: "InterbtcPrimitivesCustomMetadata",
            },
            InterbtcPrimitivesCustomMetadata: {
                feePerSecond: "u128",
                coingeckoId: "Bytes",
            },
        });
    });

    beforeEach(() => {
        // anything calling the api should have been mocked, so pass null
        assetRegistryApi = new DefaultAssetRegistryAPI(null as never);

        // reset to base values
        mockMetadata = {
            name: registry.createType("Bytes", mockMetadataValues.name),
            symbol: registry.createType("Bytes", mockMetadataValues.symbol),
            decimals: registry.createType("u32", mockMetadataValues.decimals),
            existentialDeposit: registry.createType("u128", mockMetadataValues.existentialDeposit),
            additional: registry.createType("InterbtcPrimitivesCustomMetadata", {
                feePerSecond: registry.createType("u128", mockMetadataValues.feesPerMinute),
                coingeckoId: registry.createType("Bytes", mockMetadataValues.coingeckoId),
            }),
        } as OrmlTraitsAssetRegistryAssetMetadata;

        // mock return type of storageKeyToNthInner method which only works correctly in integration tests
        const mockedReturn = registry.createType("AssetId", mockStorageKeyValue);
        jest.spyOn(allThingsEncoding, "storageKeyToNthInner").mockClear().mockReturnValue(mockedReturn);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getForeignAssets", () => {
        it(
            "should return empty list if chain returns no foreign assets",
            async () => {
                // mock empty list returned from chain
                jest.spyOn(assetRegistryApi, "getAssetRegistryEntries").mockClear().mockResolvedValue([]);

                const actual = await assetRegistryApi.getForeignAssets();
                expect(actual).toHaveLength(0);
            }
        );

        it(
            "should ignore empty optionals in foreign assets data from chain",
            async () => {
                const chainDataReturned: AssetRegistryMetadataTuple[] = [
                    // one "good" returned value
                    [mockStorageKey, registry.createType("Option<OrmlTraitsAssetRegistryAssetMetadata>", mockMetadata)],
                    // one empty option
                    [mockStorageKey, registry.createType("Option<OrmlTraitsAssetRegistryAssetMetadata>", undefined)],
                ];

                jest.spyOn(assetRegistryApi, "getAssetRegistryEntries").mockClear().mockResolvedValue(chainDataReturned);

                const actual = await assetRegistryApi.getForeignAssets();

                expect(actual).toHaveLength(1);

                const actualCurrency = actual[0];
                expect(actualCurrency.ticker).toBe(mockMetadataValues.symbol);
            }
        );
    });

    describe("unwrapMetadataFromEntries", () => {
        it("should convert foreign asset metadata to currency", async () => {
            const actual = DefaultAssetRegistryAPI.metadataTupleToForeignAsset([mockStorageKey, mockMetadata]);

            expect(actual.ticker).toBe(mockMetadataValues.symbol);

            expect(actual.name).toBe(mockMetadataValues.name);

            expect(actual.decimals).toBe(mockMetadataValues.decimals);

            expect(actual.foreignAsset.coingeckoId).toBe(mockMetadataValues.coingeckoId);
        });
    });

    describe("getCollateralForeignAssets", () => {
        // only id matters for these tests
        const mockForeignAssets = [
            <ForeignAsset>{ foreignAsset: { id: 1 } },
            <ForeignAsset>{ foreignAsset: { id: 2 } },
            <ForeignAsset>{ foreignAsset: { id: 3 } },
        ];

        const prepareMocks = (
            assetRegistryApi: DefaultAssetRegistryAPI,
            allForeignAssets: ForeignAsset[],
            collateralCeilingCurrencyPairs?: InterbtcPrimitivesVaultCurrencyPair[]
        ) => {
            jest.spyOn(assetRegistryApi, "getForeignAssets").mockClear().mockResolvedValue(allForeignAssets);

            // this return does not matter since individual tests mock extractCollateralCeilingEntryKeys
            // which returns the actual values of interest
            jest.spyOn(assetRegistryApi, "getSystemCollateralCeilingEntries").mockClear().mockResolvedValue([]);
            if (collateralCeilingCurrencyPairs !== undefined) {
                jest.spyOn(assetRegistryApi, "extractCollateralCeilingEntryKeys").mockClear()
                    .mockReturnValue(collateralCeilingCurrencyPairs);
            }
        };

        it("should return empty array if there are no foreign assets", async () => {
            prepareMocks(assetRegistryApi, []);

            const actual = await assetRegistryApi.getCollateralForeignAssets();

            expect(actual).toHaveLength(0);
        });

        it(
            "should return empty array if there are no foreign assets with a collateral ceiling set",
            async () => {
                prepareMocks(assetRegistryApi, mockForeignAssets, []);

                const actual = await assetRegistryApi.getCollateralForeignAssets();
                expect(actual).toHaveLength(0);
            }
        );

        it(
            "should return only foreign assets, not tokens with collateral ceilings set",
            async () => {
                // pick an asset id that we expect to get returned
                const expectedForeignAssetId = mockForeignAssets[0].foreignAsset.id;

                // only bother mocking collateral currencies, the wrapped side is ignored
                const mockCurrencyPairs = [
                    <InterbtcPrimitivesVaultCurrencyPair>{
                        // mocked foreign asset collateral
                        collateral: <InterbtcPrimitivesCurrencyId>{
                            isForeignAsset: true,
                            isToken: false,
                            asForeignAsset: registry.createType("u32", expectedForeignAssetId),
                            type: "ForeignAsset",
                        },
                    },
                    <InterbtcPrimitivesVaultCurrencyPair>{
                        // mocked token collateral (ie. not foreign asset)
                        collateral: <InterbtcPrimitivesCurrencyId>{
                            isForeignAsset: false,
                            isToken: true,
                            // logically inconsistent (but trying to trick into having a valid result if this is used when it shouldn't)
                            asForeignAsset: registry.createType(
                                "u32",
                                mockForeignAssets[mockForeignAssets.length - 1].foreignAsset.id
                            ),
                            type: "Token",
                        },
                    },
                ];

                prepareMocks(assetRegistryApi, mockForeignAssets, mockCurrencyPairs);

                const actual = await assetRegistryApi.getCollateralForeignAssets();

                // expect one returned value
                expect(actual).toHaveLength(1);

                const actualAssetId = actual[0].foreignAsset.id;
                expect(actualAssetId).toBe(expectedForeignAssetId);
            }
        );
    });
});
