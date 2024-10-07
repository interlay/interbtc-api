[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultAssetRegistryAPI

# Class: DefaultAssetRegistryAPI

## Implements

- [`AssetRegistryAPI`](../interfaces/AssetRegistryAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultAssetRegistryAPI.md#constructor)

### Properties

- [api](DefaultAssetRegistryAPI.md#api)

### Methods

- [extractCollateralCeilingEntryKeys](DefaultAssetRegistryAPI.md#extractcollateralceilingentrykeys)
- [getAssetRegistryEntries](DefaultAssetRegistryAPI.md#getassetregistryentries)
- [getCollateralForeignAssets](DefaultAssetRegistryAPI.md#getcollateralforeignassets)
- [getForeignAsset](DefaultAssetRegistryAPI.md#getforeignasset)
- [getForeignAssets](DefaultAssetRegistryAPI.md#getforeignassets)
- [getSystemCollateralCeilingEntries](DefaultAssetRegistryAPI.md#getsystemcollateralceilingentries)
- [metadataToCurrency](DefaultAssetRegistryAPI.md#metadatatocurrency)
- [metadataTupleToForeignAsset](DefaultAssetRegistryAPI.md#metadatatupletoforeignasset)
- [unwrapMetadataFromEntries](DefaultAssetRegistryAPI.md#unwrapmetadatafromentries)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultAssetRegistryAPI**(`api`): [`DefaultAssetRegistryAPI`](DefaultAssetRegistryAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |

#### Returns

[`DefaultAssetRegistryAPI`](DefaultAssetRegistryAPI.md)

#### Defined in

[src/parachain/asset-registry.ts:43](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L43)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/asset-registry.ts:43](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L43)

## Methods

### <a id="extractcollateralceilingentrykeys" name="extractcollateralceilingentrykeys"></a> extractCollateralCeilingEntryKeys

▸ **extractCollateralCeilingEntryKeys**(`entries`): `InterbtcPrimitivesVaultCurrencyPair`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `entries` | [`SystemCollateralCeilingTuple`](../modules.md#systemcollateralceilingtuple)[] |

#### Returns

`InterbtcPrimitivesVaultCurrencyPair`[]

#### Defined in

[src/parachain/asset-registry.ts:104](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L104)

___

### <a id="getassetregistryentries" name="getassetregistryentries"></a> getAssetRegistryEntries

▸ **getAssetRegistryEntries**(): `Promise`\<[`AssetRegistryMetadataTuple`](../modules.md#assetregistrymetadatatuple)[]\>

#### Returns

`Promise`\<[`AssetRegistryMetadataTuple`](../modules.md#assetregistrymetadatatuple)[]\>

#### Defined in

[src/parachain/asset-registry.ts:71](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L71)

___

### <a id="getcollateralforeignassets" name="getcollateralforeignassets"></a> getCollateralForeignAssets

▸ **getCollateralForeignAssets**(): `Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

Get all foreign assets which have a registered collateral ceiling, meaning they can be used as collateral currency.

#### Returns

`Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

All foreign assets that have been registered as collateral currency

#### Implementation of

[AssetRegistryAPI](../interfaces/AssetRegistryAPI.md).[getCollateralForeignAssets](../interfaces/AssetRegistryAPI.md#getcollateralforeignassets)

#### Defined in

[src/parachain/asset-registry.ts:110](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L110)

___

### <a id="getforeignasset" name="getforeignasset"></a> getForeignAsset

▸ **getForeignAsset**(`id`): `Promise`\<[`ForeignAsset`](../modules.md#foreignasset)\>

Get foreign asset by its id.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `number` \| `u32` | The id of the foreign asset. |

#### Returns

`Promise`\<[`ForeignAsset`](../modules.md#foreignasset)\>

The foreign asset.

#### Implementation of

[AssetRegistryAPI](../interfaces/AssetRegistryAPI.md).[getForeignAsset](../interfaces/AssetRegistryAPI.md#getforeignasset)

#### Defined in

[src/parachain/asset-registry.ts:94](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L94)

___

### <a id="getforeignassets" name="getforeignassets"></a> getForeignAssets

▸ **getForeignAssets**(): `Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

Get all currencies (foreign assets) in the asset registry.

#### Returns

`Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

A list of currencies.

#### Implementation of

[AssetRegistryAPI](../interfaces/AssetRegistryAPI.md).[getForeignAssets](../interfaces/AssetRegistryAPI.md#getforeignassets)

#### Defined in

[src/parachain/asset-registry.ts:86](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L86)

___

### <a id="getsystemcollateralceilingentries" name="getsystemcollateralceilingentries"></a> getSystemCollateralCeilingEntries

▸ **getSystemCollateralCeilingEntries**(): `Promise`\<[`SystemCollateralCeilingTuple`](../modules.md#systemcollateralceilingtuple)[]\>

#### Returns

`Promise`\<[`SystemCollateralCeilingTuple`](../modules.md#systemcollateralceilingtuple)[]\>

#### Defined in

[src/parachain/asset-registry.ts:99](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L99)

___

### <a id="metadatatocurrency" name="metadatatocurrency"></a> metadataToCurrency

▸ **metadataToCurrency**(`metadata`): `Currency`

#### Parameters

| Name | Type |
| :------ | :------ |
| `metadata` | `OrmlTraitsAssetRegistryAssetMetadata` |

#### Returns

`Currency`

#### Defined in

[src/parachain/asset-registry.ts:45](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L45)

___

### <a id="metadatatupletoforeignasset" name="metadatatupletoforeignasset"></a> metadataTupleToForeignAsset

▸ **metadataTupleToForeignAsset**(`«destructured»`): [`ForeignAsset`](../modules.md#foreignasset)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`UnwrappedAssetRegistryMetadataTuple`](../modules.md#unwrappedassetregistrymetadatatuple) |

#### Returns

[`ForeignAsset`](../modules.md#foreignasset)

#### Defined in

[src/parachain/asset-registry.ts:56](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L56)

___

### <a id="unwrapmetadatafromentries" name="unwrapmetadatafromentries"></a> unwrapMetadataFromEntries

▸ **unwrapMetadataFromEntries**(`entries`): [`UnwrappedAssetRegistryMetadataTuple`](../modules.md#unwrappedassetregistrymetadatatuple)[]

Static method to filter out metadata that can be unwrapped.ie. `Option.isSome !== true`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `entries` | [`AssetRegistryMetadataTuple`](../modules.md#assetregistrymetadatatuple)[] | The entries from the asset registry. |

#### Returns

[`UnwrappedAssetRegistryMetadataTuple`](../modules.md#unwrappedassetregistrymetadatatuple)[]

A list of all entries containing metadata.

#### Defined in

[src/parachain/asset-registry.ts:80](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L80)
