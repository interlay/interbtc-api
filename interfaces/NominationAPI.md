[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / NominationAPI

# Interface: NominationAPI

## Implemented by

- [`DefaultNominationAPI`](../classes/DefaultNominationAPI.md)

## Table of contents

### Methods

- [depositCollateral](NominationAPI.md#depositcollateral)
- [getActiveNominatorRewards](NominationAPI.md#getactivenominatorrewards)
- [getFilteredNominations](NominationAPI.md#getfilterednominations)
- [getNominatorReward](NominationAPI.md#getnominatorreward)
- [getNonces](NominationAPI.md#getnonces)
- [getTotalNomination](NominationAPI.md#gettotalnomination)
- [isNominationEnabled](NominationAPI.md#isnominationenabled)
- [isVaultOptedIn](NominationAPI.md#isvaultoptedin)
- [list](NominationAPI.md#list)
- [listNominatorRewards](NominationAPI.md#listnominatorrewards)
- [listVaults](NominationAPI.md#listvaults)
- [optIn](NominationAPI.md#optin)
- [optOut](NominationAPI.md#optout)
- [setNominationEnabled](NominationAPI.md#setnominationenabled)
- [withdrawCollateral](NominationAPI.md#withdrawcollateral)

## Methods

### <a id="depositcollateral" name="depositcollateral"></a> depositCollateral

▸ **depositCollateral**(`vaultAccountId`, `amount`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | Vault to nominate collateral to |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | Amount to deposit, as a `Monetary.js` object or `ForeignAsset` |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/nomination.ts:47](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L47)

___

### <a id="getactivenominatorrewards" name="getactivenominatorrewards"></a> getActiveNominatorRewards

▸ **getActiveNominatorRewards**(`nominatorId`): `Promise`\<[`NominationData`](../modules.md#nominationdata)[]\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `nominatorId` | `AccountId` | Id of user who nominated to one or more vaults |

#### Returns

`Promise`\<[`NominationData`](../modules.md#nominationdata)[]\>

The rewards a currently active nominator has accumulated

#### Defined in

[src/parachain/nomination.ts:124](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L124)

___

### <a id="getfilterednominations" name="getfilterednominations"></a> getFilteredNominations

▸ **getFilteredNominations**(`vaultAccountId?`, `collateralCurrency?`, `nominatorId?`): `Promise`\<[`Nomination`](../modules.md#nomination)[]\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId?` | `AccountId` | Id of vault who is opted in to nomination |
| `collateralCurrency?` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | - |
| `nominatorId?` | `AccountId` | Id of user who nominated to one or more vaults |

#### Returns

`Promise`\<[`Nomination`](../modules.md#nomination)[]\>

**`Remarks`**

At least one of the parameters must be specified

#### Defined in

[src/parachain/nomination.ts:102](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L102)

___

### <a id="getnominatorreward" name="getnominatorreward"></a> getNominatorReward

▸ **getNominatorReward**(`vaultId`, `collateralCurrency`, `rewardCurrency`, `nominatorId`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | `AccountId` | - |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency towards whose issuance the nomination was made |
| `rewardCurrency` | `Currency` | The reward currency, e.g. kBTC, KINT, interBTC, INTR |
| `nominatorId` | `AccountId` | Id of user who nominated to one or more vaults |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The rewards a (possibly inactive) nominator has accumulated

#### Defined in

[src/parachain/nomination.ts:132](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L132)

___

### <a id="getnonces" name="getnonces"></a> getNonces

▸ **getNonces**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `number`\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `number`\>\>

A map (vaultId => nonce), representing the nonces for each reward pool with the given currency

#### Defined in

[src/parachain/nomination.ts:141](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L141)

___

### <a id="gettotalnomination" name="gettotalnomination"></a> getTotalNomination

▸ **getTotalNomination**(`vaultAccountId?`, `collateralCurrency?`, `nominatorId?`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId?` | `AccountId` | Id of vault who is opted in to nomination |
| `collateralCurrency?` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The collateral currency of the nominations |
| `nominatorId?` | `AccountId` | Id of user who nominated to one or more vaults |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The total nominated amount, filtered using the given parameters

**`Remarks`**

At least one of the parameters must be specified

#### Defined in

[src/parachain/nomination.ts:114](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L114)

___

### <a id="isnominationenabled" name="isnominationenabled"></a> isNominationEnabled

▸ **isNominationEnabled**(): `Promise`\<`boolean`\>

#### Returns

`Promise`\<`boolean`\>

A boolean value representing whether the vault nomination feature is enabled

#### Defined in

[src/parachain/nomination.ts:77](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L77)

___

### <a id="isvaultoptedin" name="isvaultoptedin"></a> isVaultOptedIn

▸ **isVaultOptedIn**(`accountId`, `collateralCurrency`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<`boolean`\>

A boolean value

#### Defined in

[src/parachain/nomination.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L95)

___

### <a id="list" name="list"></a> list

▸ **list**(): `Promise`\<[`Nomination`](../modules.md#nomination)[]\>

#### Returns

`Promise`\<[`Nomination`](../modules.md#nomination)[]\>

All nominations for the wrapped currency set in the API

#### Defined in

[src/parachain/nomination.ts:81](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L81)

___

### <a id="listnominatorrewards" name="listnominatorrewards"></a> listNominatorRewards

▸ **listNominatorRewards**(): `Promise`\<[`NominationData`](../modules.md#nominationdata)[]\>

#### Returns

`Promise`\<[`NominationData`](../modules.md#nominationdata)[]\>

The rewards a nominator has accumulated, in wrapped token (e.g. interBTC, kBTC)

#### Defined in

[src/parachain/nomination.ts:86](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L86)

___

### <a id="listvaults" name="listvaults"></a> listVaults

▸ **listVaults**(): `Promise`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md)[]\>

#### Returns

`Promise`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md)[]\>

A list of all vaults that opted in to the nomination feature.

#### Defined in

[src/parachain/nomination.ts:90](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L90)

___

### <a id="optin" name="optin"></a> optIn

▸ **optIn**(`collateralCurrency`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Currency to accept as nomination |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Function callable by vaults to opt in to the nomination feature

#### Defined in

[src/parachain/nomination.ts:62](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L62)

___

### <a id="optout" name="optout"></a> optOut

▸ **optOut**(`collateralCurrency`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Currency to stop accepting as nomination |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Function callable by vaults to opt out of the nomination feature

#### Defined in

[src/parachain/nomination.ts:68](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L68)

___

### <a id="setnominationenabled" name="setnominationenabled"></a> setNominationEnabled

▸ **setNominationEnabled**(`enabled`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `enabled` | `boolean` |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Testnet utility function

#### Defined in

[src/parachain/nomination.ts:73](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L73)

___

### <a id="withdrawcollateral" name="withdrawcollateral"></a> withdrawCollateral

▸ **withdrawCollateral**(`vaultAccountId`, `amount`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | Vault that collateral was nominated to |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | Amount to withdraw, as a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/nomination.ts:53](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L53)
