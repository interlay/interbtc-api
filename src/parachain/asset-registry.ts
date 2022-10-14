import { Currency } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { StorageKey, u32, u128 } from "@polkadot/types";
import { AssetId } from "@polkadot/types/interfaces/runtime";
import { InterbtcPrimitivesVaultCurrencyPair, OrmlTraitsAssetRegistryAssetMetadata } from "@polkadot/types/lookup";
import { decodeBytesAsString, newForeignAssetId, storageKeyToNthInner } from "../utils";
import { Option } from "@polkadot/types-codec";
import { ForeignAsset } from "../types";

/**
 * @category BTC Bridge
 */
export interface AssetRegistryAPI {
    /**
     * Get all currencies (foreign assets) in the asset registry.
     * @returns A list of currencies.
     */
    getForeignAssets(): Promise<Array<ForeignAsset>>;

    /**
     * Get foreign asset by its id.
     * @param id The id of the foreign asset.
     * @returns The foreign asset.
     */
    getForeignAsset(id: number | u32): Promise<ForeignAsset>;

    /**
     * Get all foreign assets which have a registered collateral ceiling, meaning they can be used as collateral currency.
     *
     * @returns All foreign assets that have been registered as collateral currency
     */
    getCollateralForeignAssets(): Promise<Array<ForeignAsset>>;
}

// shorthand type for asset key
export type AssetKey = StorageKey<[u32]>;
// shorthand types for the unwieldy tuples
export type AssetRegistryMetadataTuple = [StorageKey<[u32]>, Option<OrmlTraitsAssetRegistryAssetMetadata>];
export type UnwrappedAssetRegistryMetadataTuple = [StorageKey<[u32]>, OrmlTraitsAssetRegistryAssetMetadata];
export type SystemCollateralCeilingTuple = [StorageKey<[InterbtcPrimitivesVaultCurrencyPair]>, Option<u128>];

export class DefaultAssetRegistryAPI implements AssetRegistryAPI {
    constructor(private api: ApiPromise) {}

    static metadataToCurrency(metadata: OrmlTraitsAssetRegistryAssetMetadata): Currency {
        const symbol = decodeBytesAsString(metadata.symbol);
        const name = decodeBytesAsString(metadata.name);
        return {
            name: name,
            ticker: symbol,
            decimals: metadata.decimals.toNumber(),
        };
    }

    // not private for easier testing
    static metadataTupleToForeignAsset([key, metadata]: UnwrappedAssetRegistryMetadataTuple): ForeignAsset {
        const keyInner = storageKeyToNthInner<AssetId>(key);
        const currencyPart = DefaultAssetRegistryAPI.metadataToCurrency(metadata);
        const coingeckoId = decodeBytesAsString(metadata.additional.coingeckoId);

        return {
            id: keyInner.toNumber(),
            coingeckoId,
            ...currencyPart,
        };
    }

    // wrapped call for easier mocking in tests
    async getAssetRegistryEntries(): Promise<AssetRegistryMetadataTuple[]> {
        return await this.api.query.assetRegistry.metadata.entries();
    }

    /**
     * Static method to filter out metadata that can be unwrapped.ie. `Option.isSome !== true`.
     * @param entries The entries from the asset registry.
     * @returns A list of all entries containing metadata.
     */
    static unwrapMetadataFromEntries(entries: AssetRegistryMetadataTuple[]): UnwrappedAssetRegistryMetadataTuple[] {
        return entries
            .filter(([, metadata]) => metadata.isSome)
            .map(([storageKey, metadata]) => [storageKey, metadata.unwrap()]);
    }

    async getForeignAssets(): Promise<Array<ForeignAsset>> {
        const entries = await this.getAssetRegistryEntries();

        return DefaultAssetRegistryAPI.unwrapMetadataFromEntries(entries).map(
            DefaultAssetRegistryAPI.metadataTupleToForeignAsset
        );
    }

    async getForeignAsset(id: number | u32): Promise<ForeignAsset> {
        const u32Id = id instanceof u32 ? id : newForeignAssetId(this.api, id);
        const optionMetadata = await this.api.query.assetRegistry.metadata(u32Id);

        if (!optionMetadata.isSome) {
            return Promise.reject(new Error("Foreign asset not found"));
        }
        const currencyPart = DefaultAssetRegistryAPI.metadataToCurrency(optionMetadata.unwrap());
        const coingeckoId = decodeBytesAsString(optionMetadata.unwrap().additional.coingeckoId);

        const numberId = id instanceof u32 ? id.toNumber() : id;

        return {
            id: numberId,
            coingeckoId,
            ...currencyPart,
        };
    }

    // wrapped call for easier mocking in tests
    async getSystemCollateralCeilingEntries(): Promise<SystemCollateralCeilingTuple[]> {
        return this.api.query.vaultRegistry.systemCollateralCeiling.entries();
    }

    // wrapped call for easier mocking in tests
    extractCollateralCeilingEntryKeys(
        entries: Array<SystemCollateralCeilingTuple>
    ): Array<InterbtcPrimitivesVaultCurrencyPair> {
        return entries.map(([key, _]) => storageKeyToNthInner(key));
    }

    async getCollateralForeignAssets(): Promise<Array<ForeignAsset>> {
        const [collateralCeilingEntries, foreignAssets] = await Promise.all([
            this.getSystemCollateralCeilingEntries(),
            this.getForeignAssets(),
        ]);

        // get a set of all ids of foreign assets within the collateral ceiling entries
        const collateralForeignAssetIdSet = new Set(
            this.extractCollateralCeilingEntryKeys(collateralCeilingEntries)
                .map((currencyPair) => currencyPair.collateral)
                .filter((currencyId) => currencyId.isForeignAsset)
                .map((currencyId) => currencyId.asForeignAsset.toNumber())
        );

        // filter all foreign assets to include only those with a collateral ceiling
        return foreignAssets.filter((foreignAsset) => collateralForeignAssetIdSet.has(foreignAsset.id));
    }
}
