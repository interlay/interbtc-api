[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / AssetRegistryAPI

# Interface: AssetRegistryAPI

## Implemented by

- [`DefaultAssetRegistryAPI`](../classes/DefaultAssetRegistryAPI.md)

## Table of contents

### Methods

- [getCollateralForeignAssets](AssetRegistryAPI.md#getcollateralforeignassets)
- [getForeignAsset](AssetRegistryAPI.md#getforeignasset)
- [getForeignAssets](AssetRegistryAPI.md#getforeignassets)

## Methods

### <a id="getcollateralforeignassets" name="getcollateralforeignassets"></a> getCollateralForeignAssets

▸ **getCollateralForeignAssets**(): `Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

Get all foreign assets which have a registered collateral ceiling, meaning they can be used as collateral currency.

#### Returns

`Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

All foreign assets that have been registered as collateral currency

#### Defined in

[src/parachain/asset-registry.ts:32](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L32)

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

#### Defined in

[src/parachain/asset-registry.ts:25](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L25)

___

### <a id="getforeignassets" name="getforeignassets"></a> getForeignAssets

▸ **getForeignAssets**(): `Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

Get all currencies (foreign assets) in the asset registry.

#### Returns

`Promise`\<[`ForeignAsset`](../modules.md#foreignasset)[]\>

A list of currencies.

#### Defined in

[src/parachain/asset-registry.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/asset-registry.ts#L18)
