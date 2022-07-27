import { expect } from "../../chai";
import sinon from "sinon";
import { ApiPromise } from "@polkadot/api";
import { StorageKey, u32 } from "@polkadot/types";
import { OrmlTraitsAssetRegistryAssetMetadata } from "@polkadot/types/lookup";
import { DefaultAssetRegistryAPI } from "../../../src/";
import { AssetRegistryMetadataTuple } from "@interlay/interbtc/parachain/asset-registry";
import * as allThingsEncoding from "../../../src/utils/encoding";

describe("DefaultAssetRegistryAPI", () => {
    let api: ApiPromise;
    let assetRegistryApi: DefaultAssetRegistryAPI;
    let mockMetadata: OrmlTraitsAssetRegistryAssetMetadata;
    let mockStorageKey: StorageKey<[u32]>;
    // scraped from integration tests
    const scrapedStorageKey =
        "0x6e9a9b71050cd23f2d7d1b72e8c1a625b5f3822e35ca2f31ce3526eab1363fd25153cb1f00942ff401000000";
    const mockStorageKeyValue = 42;
    const mockMetadataValues = {
        name: "Mock Coin One",
        symbol: "MCO",
        decimals: 8,
        existentialDeposit: 42,
        feesPerMinute: 15,
    };

    before(() => {
        api = new ApiPromise();
        // disconnect immediately to avoid printing errors
        // we only need the instance to create variables
        api.disconnect();

        // register just enough from OrmlTraitsAssetRegistryAssetMetadata to construct
        // meaningful representations for our tests
        api.registerTypes({
            OrmlTraitsAssetRegistryAssetMetadata: {
                name: "Bytes",
                symbol: "Bytes",
                decimals: "u32",
                existentialDeposit: "u128",
                additional: "InterbtcPrimitivesCustomMetadata",
            },
            InterbtcPrimitivesCustomMetadata: {
                feePerSecond: "u128",
            },
        });
    });

    beforeEach(() => {
        assetRegistryApi = new DefaultAssetRegistryAPI(api);

        mockStorageKey = api.createType("StorageKey<[u32]>", scrapedStorageKey);

        // reset to base values
        mockMetadata = {
            name: api.createType("Bytes", mockMetadataValues.name),
            symbol: api.createType("Bytes", mockMetadataValues.symbol),
            decimals: api.createType("u32", mockMetadataValues.decimals),
            existentialDeposit: api.createType("u128", mockMetadataValues.existentialDeposit),
            additional: api.createType("InterbtcPrimitivesCustomMetadata", {
                feePerSecond: api.createType("u128", mockMetadataValues.feesPerMinute),
            }),
        } as OrmlTraitsAssetRegistryAssetMetadata;

        // mock return type of storageKeyToNthInner method which only works correctly in integration tests
        const mockedReturn = api.createType("AssetId", mockStorageKeyValue);
        sinon.stub(allThingsEncoding, "storageKeyToNthInner").returns(mockedReturn);
    });

    afterEach(() => {
        sinon.restore();
        sinon.reset();
    });

    describe("getForeignAssets", () => {
        it("should return empty list if chain returns no foreign assets", async () => {
            // mock empty list returned from chain
            sinon.stub(assetRegistryApi, "getAssetRegistryEntries").returns(Promise.resolve([]));

            const actual = await assetRegistryApi.getForeignAssets();
            expect(actual).to.be.empty;
        });

        it("should ignore empty optionals in foreign assets data from chain", async () => {
            const chainDataReturned: AssetRegistryMetadataTuple[] = [
                // one "good" returned value
                [mockStorageKey, api.createType("Option<OrmlTraitsAssetRegistryAssetMetadata>", mockMetadata)],
                // one empty option
                [mockStorageKey, api.createType("Option<OrmlTraitsAssetRegistryAssetMetadata>", undefined)],
            ];

            sinon.stub(assetRegistryApi, "getAssetRegistryEntries").returns(Promise.resolve(chainDataReturned));

            const actual = await assetRegistryApi.getForeignAssets();

            expect(actual).to.have.lengthOf(1, `Expected only one currency to be returned, but got ${actual.length}`);

            const actualCurrency = actual[0];
            expect(actualCurrency.ticker).to.equal(
                mockMetadataValues.symbol,
                `Expected the returned currency ticker to be ${mockMetadataValues.symbol}, but it was ${actualCurrency.ticker}`
            );
        });
    });

    describe("unwrapMetadataFromEntries", () => {
        it("should convert foreign asset metadata to currency", async () => {
            const actual = DefaultAssetRegistryAPI.metadataTupleToForeignAsset([mockStorageKey, mockMetadata]);

            expect(actual.ticker).to.equal(
                mockMetadataValues.symbol,
                `Expected currency ticker to be ${mockMetadataValues.symbol}, but was ${actual.ticker}`
            );

            expect(actual.name).to.equal(
                mockMetadataValues.name,
                `Expected currency name to be ${mockMetadataValues.name}, but was ${actual.name}`
            );

            expect(actual.decimals).to.equal(
                mockMetadataValues.decimals,
                `Expected currency base to be ${mockMetadataValues.decimals}, but was ${actual.decimals}`
            );
        });
    });
});
