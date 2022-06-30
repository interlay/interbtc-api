import { expect } from "../../chai";
import sinon from "sinon";
import { ApiPromise } from "@polkadot/api";
import { StorageKey, u32 } from "@polkadot/types";
import { OrmlAssetRegistryAssetMetadata } from "@polkadot/types/lookup";
import { DefaultAssetRegistryAPI } from "../../../src/";
import { AssetRegistryMetadataTuple } from "@interlay/interbtc/parachain/asset-registry";

describe("DefaultAssetRegistryAPI", () => {
    let api: ApiPromise;
    let assetRegistryApi: DefaultAssetRegistryAPI;
    let mockMetadata: OrmlAssetRegistryAssetMetadata;
    const mockMetadataValues =  {
        name: "Mock Coin One",
        symbol: "MCO",
        decimals: 8,
        existentialDeposit: 42,
        feesPerMinute: 15
    };

    before(() => {
        api = new ApiPromise();
        // disconnect immediately to avoid printing errors
        // we only need the instance to create variables
        api.disconnect();

        // register just enough from OrmlAssetRegistryAssetMetadata to construct 
        // meaningful representations for our tests
        api.registerTypes({
            OrmlAssetRegistryAssetMetadata: {
                name: "Bytes",
                symbol: "Bytes",
                decimals: "u32",
                existentialDeposit: "u128",
                additional: "InterbtcPrimitivesCustomMetadata"
            },
            InterbtcPrimitivesCustomMetadata: {
                feePerSecond: "u128"
            }
        });
    });

    beforeEach(() => {
        assetRegistryApi = new DefaultAssetRegistryAPI(api);

        // reset to base values
        mockMetadata = {
            name: api.createType("Bytes", mockMetadataValues.name),
            symbol: api.createType("Bytes", mockMetadataValues.symbol),
            decimals: api.createType("u32", mockMetadataValues.decimals),
            existentialDeposit: api.createType("u128", mockMetadataValues.existentialDeposit),
            additional: api.createType("InterbtcPrimitivesCustomMetadata", {
                feePerSecond: api.createType("u128", mockMetadataValues.feesPerMinute)
            })
        } as OrmlAssetRegistryAssetMetadata;
    });

    afterEach(() => {
        sinon.restore();
        sinon.reset();
    });

    describe("getForeignAssetsAsCurrencies", () => {
        it("should return empty list if chain returns no foreign assets", async () => {
            // mock empty list returned from chain
            sinon.stub(assetRegistryApi, "getAssetRegistryEntries").returns(Promise.resolve([]));

            const actual = await assetRegistryApi.getForeignAssetsAsCurrencies();
            expect(actual).to.be.empty;
        });

        it("should ignore empty optionals in foreign assets data from chain", async () => {
            const chainDataReturned: AssetRegistryMetadataTuple[] = [
                // one "good" returned value
                [
                    api.createType("StorageKey<[u32]>", "0x0000000000000001") as StorageKey<[u32]>,
                    api.createType("Option<OrmlAssetRegistryAssetMetadata>", mockMetadata)
                ],
                // one empty option
                [
                    api.createType("StorageKey<[u32]>", "0x0000000000000002") as StorageKey<[u32]>,
                    api.createType("Option<OrmlAssetRegistryAssetMetadata>", undefined)
                ]
            ];

            sinon.stub(assetRegistryApi, "getAssetRegistryEntries").returns(Promise.resolve(chainDataReturned));

            const actual = await assetRegistryApi.getForeignAssetsAsCurrencies();

            expect(actual).to.have.lengthOf(
                1,
                `Expected only one currency to be returned, but got ${actual.length}`
            );

            const actualCurrency = actual[0];
            expect(actualCurrency.ticker).to.equal(
                mockMetadataValues.symbol,
                `Expected the returned currency ticker to be ${mockMetadataValues.symbol}, but it was ${actualCurrency.ticker}`
            );
        });
    });

    describe("metadataToCurrency", () => {
        it("should convert foreign asset metadata to currency", async () => {
            const actual = DefaultAssetRegistryAPI.metadataToCurrency(mockMetadata);

            expect(actual.ticker).to.equal(
                mockMetadataValues.symbol,
                `Expected currency ticker to be ${mockMetadataValues.symbol}, but was ${actual.ticker}`
            );

            expect(actual.name).to.equal(
                mockMetadataValues.name,
                `Expected currency name to be ${mockMetadataValues.name}, but was ${actual.name}`
            );

            expect(actual.base).to.equal(
                mockMetadataValues.decimals,
                `Expected currency base to be ${mockMetadataValues.decimals}, but was ${actual.base}`
            );

            // rawBase should always be zero
            expect(actual.rawBase).to.equal(
                0,
                `Expected currency rawBase to be zero, but was ${actual.rawBase}`
            );
            
            // check atomic units are defined and zero
            expect(actual.units.atomic).to.exist;
            expect(actual.units.atomic).to.equal(
                0,
                `Expected currency atomic unit value to be zero, but was ${actual.units.atomic}`
            );
            // check "main" unit is defined and has expected decimals value
            expect(actual.units[actual.ticker]).to.equal(
                actual.base,
                `Expected currency unit value for ${actual.ticker} to be ${actual.base}, but was ${actual.units[actual.ticker]}`
            );
        });
    });
});