[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultNominationAPI

# Class: DefaultNominationAPI

## Implements

- [`NominationAPI`](../interfaces/NominationAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultNominationAPI.md#constructor)

### Properties

- [api](DefaultNominationAPI.md#api)
- [rewardsAPI](DefaultNominationAPI.md#rewardsapi)
- [vaultsAPI](DefaultNominationAPI.md#vaultsapi)
- [wrappedCurrency](DefaultNominationAPI.md#wrappedcurrency)

### Methods

- [depositCollateral](DefaultNominationAPI.md#depositcollateral)
- [getActiveNominatorRewards](DefaultNominationAPI.md#getactivenominatorrewards)
- [getFilteredNominations](DefaultNominationAPI.md#getfilterednominations)
- [getNominationStatus](DefaultNominationAPI.md#getnominationstatus)
- [getNominatorReward](DefaultNominationAPI.md#getnominatorreward)
- [getNonces](DefaultNominationAPI.md#getnonces)
- [getTotalNomination](DefaultNominationAPI.md#gettotalnomination)
- [isNominationEnabled](DefaultNominationAPI.md#isnominationenabled)
- [isVaultOptedIn](DefaultNominationAPI.md#isvaultoptedin)
- [list](DefaultNominationAPI.md#list)
- [listAllNominations](DefaultNominationAPI.md#listallnominations)
- [listNominatorRewards](DefaultNominationAPI.md#listnominatorrewards)
- [listVaults](DefaultNominationAPI.md#listvaults)
- [optIn](DefaultNominationAPI.md#optin)
- [optOut](DefaultNominationAPI.md#optout)
- [setNominationEnabled](DefaultNominationAPI.md#setnominationenabled)
- [withdrawCollateral](DefaultNominationAPI.md#withdrawcollateral)
- [buildDepositCollateralExtrinsic](DefaultNominationAPI.md#builddepositcollateralextrinsic)
- [buildWithdrawAllCollateralExtrinsic](DefaultNominationAPI.md#buildwithdrawallcollateralextrinsic)
- [buildWithdrawCollateralExtrinsic](DefaultNominationAPI.md#buildwithdrawcollateralextrinsic)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultNominationAPI**(`api`, `wrappedCurrency`, `vaultsAPI`, `rewardsAPI`): [`DefaultNominationAPI`](DefaultNominationAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `wrappedCurrency` | `Currency` |
| `vaultsAPI` | [`VaultsAPI`](../interfaces/VaultsAPI.md) |
| `rewardsAPI` | [`RewardsAPI`](../interfaces/RewardsAPI.md) |

#### Returns

[`DefaultNominationAPI`](DefaultNominationAPI.md)

#### Defined in

[src/parachain/nomination.ts:145](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L145)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/nomination.ts:146](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L146)

___

### <a id="rewardsapi" name="rewardsapi"></a> rewardsAPI

• `Private` **rewardsAPI**: [`RewardsAPI`](../interfaces/RewardsAPI.md)

#### Defined in

[src/parachain/nomination.ts:149](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L149)

___

### <a id="vaultsapi" name="vaultsapi"></a> vaultsAPI

• `Private` **vaultsAPI**: [`VaultsAPI`](../interfaces/VaultsAPI.md)

#### Defined in

[src/parachain/nomination.ts:148](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L148)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/nomination.ts:147](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L147)

## Methods

### <a id="depositcollateral" name="depositcollateral"></a> depositCollateral

▸ **depositCollateral**(`vaultAccountId`, `amount`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | Vault to nominate collateral to |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | Amount to deposit, as a `Monetary.js` object or `ForeignAsset` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[depositCollateral](../interfaces/NominationAPI.md#depositcollateral)

#### Defined in

[src/parachain/nomination.ts:163](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L163)

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

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[getActiveNominatorRewards](../interfaces/NominationAPI.md#getactivenominatorrewards)

#### Defined in

[src/parachain/nomination.ts:304](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L304)

___

### <a id="getfilterednominations" name="getfilterednominations"></a> getFilteredNominations

▸ **getFilteredNominations**(`vaultId?`, `collateralCurrency?`, `nominatorId?`): `Promise`\<[`Nomination`](../modules.md#nomination)[]\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId?` | `AccountId` | Id of vault who is opted in to nomination |
| `collateralCurrency?` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | - |
| `nominatorId?` | `AccountId` | Id of user who nominated to one or more vaults |

#### Returns

`Promise`\<[`Nomination`](../modules.md#nomination)[]\>

**`Remarks`**

At least one of the parameters must be specified

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[getFilteredNominations](../interfaces/NominationAPI.md#getfilterednominations)

#### Defined in

[src/parachain/nomination.ts:323](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L323)

___

### <a id="getnominationstatus" name="getnominationstatus"></a> getNominationStatus

▸ **getNominationStatus**(`vaultId`, `collateralCurrency`, `nominatorId`): `Promise`\<[`NominationStatus`](../enums/NominationStatus.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `vaultId` | `AccountId` |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |
| `nominatorId` | `AccountId` |

#### Returns

`Promise`\<[`NominationStatus`](../enums/NominationStatus.md)\>

#### Defined in

[src/parachain/nomination.ts:366](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L366)

___

### <a id="getnominatorreward" name="getnominatorreward"></a> getNominatorReward

▸ **getNominatorReward**(`vaultId`, `collateralCurrency`, `rewardCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | `AccountId` | - |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency towards whose issuance the nomination was made |
| `rewardCurrency` | `Currency` | The reward currency, e.g. kBTC, KINT, interBTC, INTR |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The rewards a (possibly inactive) nominator has accumulated

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[getNominatorReward](../interfaces/NominationAPI.md#getnominatorreward)

#### Defined in

[src/parachain/nomination.ts:311](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L311)

___

### <a id="getnonces" name="getnonces"></a> getNonces

▸ **getNonces**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `number`\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `number`\>\>

A map (vaultId => nonce), representing the nonces for each reward pool with the given currency

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[getNonces](../interfaces/NominationAPI.md#getnonces)

#### Defined in

[src/parachain/nomination.ts:240](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L240)

___

### <a id="gettotalnomination" name="gettotalnomination"></a> getTotalNomination

▸ **getTotalNomination**(`vaultId?`, `collateralCurrency?`, `nominatorId?`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId?` | `AccountId` | Id of vault who is opted in to nomination |
| `collateralCurrency?` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The collateral currency of the nominations |
| `nominatorId?` | `AccountId` | Id of user who nominated to one or more vaults |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The total nominated amount, filtered using the given parameters

**`Remarks`**

At least one of the parameters must be specified

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[getTotalNomination](../interfaces/NominationAPI.md#gettotalnomination)

#### Defined in

[src/parachain/nomination.ts:384](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L384)

___

### <a id="isnominationenabled" name="isnominationenabled"></a> isNominationEnabled

▸ **isNominationEnabled**(): `Promise`\<`boolean`\>

#### Returns

`Promise`\<`boolean`\>

A boolean value representing whether the vault nomination feature is enabled

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[isNominationEnabled](../interfaces/NominationAPI.md#isnominationenabled)

#### Defined in

[src/parachain/nomination.ts:235](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L235)

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

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[isVaultOptedIn](../interfaces/NominationAPI.md#isvaultoptedin)

#### Defined in

[src/parachain/nomination.ts:425](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L425)

___

### <a id="list" name="list"></a> list

▸ **list**(): `Promise`\<[`Nomination`](../modules.md#nomination)[]\>

#### Returns

`Promise`\<[`Nomination`](../modules.md#nomination)[]\>

All nominations for the wrapped currency set in the API

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[list](../interfaces/NominationAPI.md#list)

#### Defined in

[src/parachain/nomination.ts:319](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L319)

___

### <a id="listallnominations" name="listallnominations"></a> listAllNominations

▸ **listAllNominations**(): `Promise`\<[`RawNomination`](../modules.md#rawnomination)[]\>

#### Returns

`Promise`\<[`RawNomination`](../modules.md#rawnomination)[]\>

#### Defined in

[src/parachain/nomination.ts:253](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L253)

___

### <a id="listnominatorrewards" name="listnominatorrewards"></a> listNominatorRewards

▸ **listNominatorRewards**(): `Promise`\<[`NominationData`](../modules.md#nominationdata)[]\>

#### Returns

`Promise`\<[`NominationData`](../modules.md#nominationdata)[]\>

The rewards a nominator has accumulated, in wrapped token (e.g. interBTC, kBTC)

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[listNominatorRewards](../interfaces/NominationAPI.md#listnominatorrewards)

#### Defined in

[src/parachain/nomination.ts:285](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L285)

___

### <a id="listvaults" name="listvaults"></a> listVaults

▸ **listVaults**(): `Promise`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md)[]\>

#### Returns

`Promise`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md)[]\>

A list of all vaults that opted in to the nomination feature.

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[listVaults](../interfaces/NominationAPI.md#listvaults)

#### Defined in

[src/parachain/nomination.ts:420](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L420)

___

### <a id="optin" name="optin"></a> optIn

▸ **optIn**(`collateralCurrency`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Currency to accept as nomination |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Function callable by vaults to opt in to the nomination feature

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[optIn](../interfaces/NominationAPI.md#optin)

#### Defined in

[src/parachain/nomination.ts:218](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L218)

___

### <a id="optout" name="optout"></a> optOut

▸ **optOut**(`collateralCurrency`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Currency to stop accepting as nomination |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Function callable by vaults to opt out of the nomination feature

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[optOut](../interfaces/NominationAPI.md#optout)

#### Defined in

[src/parachain/nomination.ts:224](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L224)

___

### <a id="setnominationenabled" name="setnominationenabled"></a> setNominationEnabled

▸ **setNominationEnabled**(`enabled`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `enabled` | `boolean` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Testnet utility function

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[setNominationEnabled](../interfaces/NominationAPI.md#setnominationenabled)

#### Defined in

[src/parachain/nomination.ts:230](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L230)

___

### <a id="withdrawcollateral" name="withdrawcollateral"></a> withdrawCollateral

▸ **withdrawCollateral**(`vaultAccountId`, `amount`, `nonce?`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | Vault that collateral was nominated to |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | Amount to withdraw, as a `Monetary.js` object or `ForeignAsset` |
| `nonce?` | `number` | - |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[NominationAPI](../interfaces/NominationAPI.md).[withdrawCollateral](../interfaces/NominationAPI.md#withdrawcollateral)

#### Defined in

[src/parachain/nomination.ts:202](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L202)

___

### <a id="builddepositcollateralextrinsic" name="builddepositcollateralextrinsic"></a> buildDepositCollateralExtrinsic

▸ **buildDepositCollateralExtrinsic**(`api`, `vaultAccountId`, `amount`, `wrappedCurrency`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `vaultAccountId` | `AccountId` |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> |
| `wrappedCurrency` | `Currency` |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

#### Defined in

[src/parachain/nomination.ts:152](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L152)

___

### <a id="buildwithdrawallcollateralextrinsic" name="buildwithdrawallcollateralextrinsic"></a> buildWithdrawAllCollateralExtrinsic

▸ **buildWithdrawAllCollateralExtrinsic**(`api`, `rewardsAPI`, `vaultAccountId`, `collateralCurrency`, `wrappedCurrency`, `nonce?`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `rewardsAPI` | [`RewardsAPI`](../interfaces/RewardsAPI.md) |
| `vaultAccountId` | `AccountId` |
| `collateralCurrency` | `Currency` |
| `wrappedCurrency` | `Currency` |
| `nonce?` | `number` |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

#### Defined in

[src/parachain/nomination.ts:188](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L188)

___

### <a id="buildwithdrawcollateralextrinsic" name="buildwithdrawcollateralextrinsic"></a> buildWithdrawCollateralExtrinsic

▸ **buildWithdrawCollateralExtrinsic**(`api`, `rewardsAPI`, `vaultAccountId`, `amount`, `wrappedCurrency`, `nonce?`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `rewardsAPI` | [`RewardsAPI`](../interfaces/RewardsAPI.md) |
| `vaultAccountId` | `AccountId` |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> |
| `wrappedCurrency` | `Currency` |
| `nonce?` | `number` |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

#### Defined in

[src/parachain/nomination.ts:173](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/nomination.ts#L173)
