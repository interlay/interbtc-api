import { Currency, UnitList } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { OrmlAssetRegistryAssetMetadata } from "@polkadot/types/lookup";
import { stripHexPrefix } from "../utils";

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

export class DefaultAssetRegistryAPI {
    constructor(private api: ApiPromise) { }

    private metadataToCurrency(metadata: OrmlAssetRegistryAssetMetadata): Currency<UnitList> {
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

    async getForeignAssetsAsCurrencies(): Promise<Array<Currency<UnitList>>> {
        const assetsMetadata = await this.api.query.assetRegistry.metadata.entries();

        return assetsMetadata
            .map(([_, metadata]) => metadata)
            .filter(metadata => metadata.isSome)
            .map(metadata => metadata.unwrap())
            .map(metadata => this.metadataToCurrency(metadata));
    }
}