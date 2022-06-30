import { Currency, UnitList } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { StorageKey, u32 } from "@polkadot/types";
import { OrmlAssetRegistryAssetMetadata } from "@polkadot/types/lookup";
import { stripHexPrefix } from "../utils";
import { Option } from "@polkadot/types-codec";

/**
 * @category BTC Bridge
 */
export interface AssetRegistryAPI {
    /**
     * Get all currencies (foreign assets) in the asset registry.
     * @returns A list of currencies.
     */
    getForeignAssetsAsCurrencies(): Promise<Array<Currency<UnitList>>>;
}

// shorthand type for the unwieldy tuple
export type AssetRegistryMetadataTuple = [StorageKey<[u32]>, Option<OrmlAssetRegistryAssetMetadata>];
 
export class DefaultAssetRegistryAPI {

    constructor(private api: ApiPromise) { }

    // not private for easier testing
    metadataToCurrency(metadata: OrmlAssetRegistryAssetMetadata): Currency<UnitList> {
        const symbol = Buffer.from(stripHexPrefix(metadata.symbol.toString()), "hex").toString();
        const name = Buffer.from(stripHexPrefix(metadata.name.toString()), "hex").toString();

        const DynamicUnit: UnitList = {
            atomic: 0
        };
        DynamicUnit[symbol] = metadata.decimals.toNumber();

        return {
            name: name,
            base: DynamicUnit[symbol],
            rawBase: DynamicUnit.atomic,
            units: DynamicUnit,
            ticker: symbol
        };
    }

    // wrapped call for easier mocking in tests
    async getAssetRegistryEntries(): Promise<AssetRegistryMetadataTuple[]> {
        return await this.api.query.assetRegistry.metadata.entries();
    }

    /**
     * Static method to grab onle metadata from entries provided by the asset registry.
     * Ignores entries with no metadata (ie. `Option.isSome !== true`).
     * @param entries The entries from the asset registry.
     * @returns A list of metadata.
     */
    static extractMetadataFromEntries(entries: AssetRegistryMetadataTuple[]): OrmlAssetRegistryAssetMetadata[] {
        return entries
            .filter(([,metadata]) => metadata.isSome)
            .map(([, metadata]) => metadata.unwrap());
    }

    async getForeignAssetsAsCurrencies(): Promise<Array<Currency<UnitList>>> {
        const entries = await this.getAssetRegistryEntries();

        return DefaultAssetRegistryAPI.extractMetadataFromEntries(entries)
            .map(metadata => this.metadataToCurrency(metadata));
    }
}