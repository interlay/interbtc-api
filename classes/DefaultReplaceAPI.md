[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultReplaceAPI

# Class: DefaultReplaceAPI

## Implements

- [`ReplaceAPI`](../interfaces/ReplaceAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultReplaceAPI.md#constructor)

### Properties

- [api](DefaultReplaceAPI.md#api)
- [btcNetwork](DefaultReplaceAPI.md#btcnetwork)
- [electrsAPI](DefaultReplaceAPI.md#electrsapi)
- [wrappedCurrency](DefaultReplaceAPI.md#wrappedcurrency)

### Methods

- [accept](DefaultReplaceAPI.md#accept)
- [buildAcceptReplaceExtrinsic](DefaultReplaceAPI.md#buildacceptreplaceextrinsic)
- [buildExecuteReplaceExtrinsic](DefaultReplaceAPI.md#buildexecutereplaceextrinsic)
- [buildRequestReplaceExtrinsic](DefaultReplaceAPI.md#buildrequestreplaceextrinsic)
- [buildWithdrawReplaceExtrinsic](DefaultReplaceAPI.md#buildwithdrawreplaceextrinsic)
- [execute](DefaultReplaceAPI.md#execute)
- [getDustValue](DefaultReplaceAPI.md#getdustvalue)
- [getNewVaultReplaceRequests](DefaultReplaceAPI.md#getnewvaultreplacerequests)
- [getOldVaultReplaceRequests](DefaultReplaceAPI.md#getoldvaultreplacerequests)
- [getReplacePeriod](DefaultReplaceAPI.md#getreplaceperiod)
- [getRequestById](DefaultReplaceAPI.md#getrequestbyid)
- [list](DefaultReplaceAPI.md#list)
- [map](DefaultReplaceAPI.md#map)
- [mapReplaceRequests](DefaultReplaceAPI.md#mapreplacerequests)
- [parseRequestsAsync](DefaultReplaceAPI.md#parserequestsasync)
- [request](DefaultReplaceAPI.md#request)
- [withdraw](DefaultReplaceAPI.md#withdraw)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultReplaceAPI**(`api`, `btcNetwork`, `electrsAPI`, `wrappedCurrency`): [`DefaultReplaceAPI`](DefaultReplaceAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `btcNetwork` | `Network` |
| `electrsAPI` | [`ElectrsAPI`](../interfaces/ElectrsAPI.md) |
| `wrappedCurrency` | `Currency` |

#### Returns

[`DefaultReplaceAPI`](DefaultReplaceAPI.md)

#### Defined in

[src/parachain/replace.ts:154](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L154)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/replace.ts:155](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L155)

___

### <a id="btcnetwork" name="btcnetwork"></a> btcNetwork

• `Private` **btcNetwork**: `Network`

#### Defined in

[src/parachain/replace.ts:156](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L156)

___

### <a id="electrsapi" name="electrsapi"></a> electrsAPI

• `Private` **electrsAPI**: [`ElectrsAPI`](../interfaces/ElectrsAPI.md)

#### Defined in

[src/parachain/replace.ts:157](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L157)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/replace.ts:158](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L158)

## Methods

### <a id="accept" name="accept"></a> accept

▸ **accept**(`oldVault`, `amount`, `collateral`, `btcAddress`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Accept a replace request

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `oldVault` | `AccountId` | ID of the old vault that to be (possibly partially) replaced |
| `amount` | `MonetaryAmount`\<`Currency`\> | Amount of issued tokens to be replaced |
| `collateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The collateral for replacement |
| `btcAddress` | `string` | The address that old-vault should transfer the btc to |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[accept](../interfaces/ReplaceAPI.md#accept)

#### Defined in

[src/parachain/replace.ts:209](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L209)

___

### <a id="buildacceptreplaceextrinsic" name="buildacceptreplaceextrinsic"></a> buildAcceptReplaceExtrinsic

▸ **buildAcceptReplaceExtrinsic**(`oldVault`, `amount`, `collateral`, `btcAddress`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build an accept replace extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `oldVault` | `AccountId` | account ID of the old vault that to be (possibly partially) replaced |
| `amount` | `MonetaryAmount`\<`Currency`\> | Amount of issued tokens to be replaced |
| `collateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The collateral for replacement |
| `btcAddress` | `string` | The address that old-vault should transfer the btc to |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

An accept replace submittable extrinsic.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[buildAcceptReplaceExtrinsic](../interfaces/ReplaceAPI.md#buildacceptreplaceextrinsic)

#### Defined in

[src/parachain/replace.ts:190](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L190)

___

### <a id="buildexecutereplaceextrinsic" name="buildexecutereplaceextrinsic"></a> buildExecuteReplaceExtrinsic

▸ **buildExecuteReplaceExtrinsic**(`requestId`, `btcTxId`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

Build an execute replace extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestId` | `string` | The ID generated by the replace request transaction |
| `btcTxId` | `string` | Bitcoin transaction ID |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

An execute replace submittable extrinsic.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[buildExecuteReplaceExtrinsic](../interfaces/ReplaceAPI.md#buildexecutereplaceextrinsic)

#### Defined in

[src/parachain/replace.ts:219](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L219)

___

### <a id="buildrequestreplaceextrinsic" name="buildrequestreplaceextrinsic"></a> buildRequestReplaceExtrinsic

▸ **buildRequestReplaceExtrinsic**(`amount`, `collateralCurrency`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a request replace extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped token amount to replace. |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral currency to have replaced |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A request replace submittable extrinsic.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[buildRequestReplaceExtrinsic](../interfaces/ReplaceAPI.md#buildrequestreplaceextrinsic)

#### Defined in

[src/parachain/replace.ts:161](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L161)

___

### <a id="buildwithdrawreplaceextrinsic" name="buildwithdrawreplaceextrinsic"></a> buildWithdrawReplaceExtrinsic

▸ **buildWithdrawReplaceExtrinsic**(`amount`, `collateralCurrency`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a withdraw replace extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount of wrapped tokens to withdraw from the amount requested to have replaced. |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral currency to have replaced |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A withdraw replace submittable extrinsic.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[buildWithdrawReplaceExtrinsic](../interfaces/ReplaceAPI.md#buildwithdrawreplaceextrinsic)

#### Defined in

[src/parachain/replace.ts:176](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L176)

___

### <a id="execute" name="execute"></a> execute

▸ **execute**(`requestId`, `btcTxId`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Execute a replace request

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestId` | `string` | The ID generated by the replace request transaction |
| `btcTxId` | `string` | Bitcoin transaction ID |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

If `txId` is not set, the `merkleProof` and `rawTx` must both be set.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[execute](../interfaces/ReplaceAPI.md#execute)

#### Defined in

[src/parachain/replace.ts:228](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L228)

___

### <a id="getdustvalue" name="getdustvalue"></a> getDustValue

▸ **getDustValue**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The minimum amount of btc that is accepted for replace requests; any lower values would
risk the bitcoin client to reject the payment

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[getDustValue](../interfaces/ReplaceAPI.md#getdustvalue)

#### Defined in

[src/parachain/replace.ts:233](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L233)

___

### <a id="getnewvaultreplacerequests" name="getnewvaultreplacerequests"></a> getNewVaultReplaceRequests

▸ **getNewVaultReplaceRequests**(`vaultAccountId`): `Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `vaultAccountId` | `AccountId` |

#### Returns

`Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

#### Defined in

[src/parachain/replace.ts:326](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L326)

___

### <a id="getoldvaultreplacerequests" name="getoldvaultreplacerequests"></a> getOldVaultReplaceRequests

▸ **getOldVaultReplaceRequests**(`vaultAccountId`): `Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `vaultAccountId` | `AccountId` |

#### Returns

`Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

#### Defined in

[src/parachain/replace.ts:320](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L320)

___

### <a id="getreplaceperiod" name="getreplaceperiod"></a> getReplacePeriod

▸ **getReplacePeriod**(): `Promise`\<`BlockNumber`\>

#### Returns

`Promise`\<`BlockNumber`\>

The time difference in number of blocks between when a replace request is created
and required completion time by a vault. The replace period has an upper limit
to prevent griefing of vault collateral.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[getReplacePeriod](../interfaces/ReplaceAPI.md#getreplaceperiod)

#### Defined in

[src/parachain/replace.ts:238](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L238)

___

### <a id="getrequestbyid" name="getrequestbyid"></a> getRequestById

▸ **getRequestById**(`replaceId`, `atBlock?`): `Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `replaceId` | `string` \| `H256` | The ID of the replace request to fetch |
| `atBlock?` | `BlockHash` | - |

#### Returns

`Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)\>

A replace request object

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[getRequestById](../interfaces/ReplaceAPI.md#getrequestbyid)

#### Defined in

[src/parachain/replace.ts:291](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L291)

___

### <a id="list" name="list"></a> list

▸ **list**(): `Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

#### Returns

`Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

An array containing the replace requests

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[list](../interfaces/ReplaceAPI.md#list)

#### Defined in

[src/parachain/replace.ts:242](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L242)

___

### <a id="map" name="map"></a> map

▸ **map**(): `Promise`\<`Map`\<`H256`, [`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)\>\>

#### Returns

`Promise`\<`Map`\<`H256`, [`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)\>\>

A mapping from the replace request ID to the replace request object

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[map](../interfaces/ReplaceAPI.md#map)

#### Defined in

[src/parachain/replace.ts:262](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L262)

___

### <a id="mapreplacerequests" name="mapreplacerequests"></a> mapReplaceRequests

▸ **mapReplaceRequests**(`vaultAccountId`): `Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

Fetch the replace requests associated with a vault. In the returned requests,
the vault is either the replaced or the replacing one.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The AccountId of the vault used to filter replace requests |

#### Returns

`Promise`\<[`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)[]\>

An array with replace requests involving said vault

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[mapReplaceRequests](../interfaces/ReplaceAPI.md#mapreplacerequests)

#### Defined in

[src/parachain/replace.ts:308](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L308)

___

### <a id="parserequestsasync" name="parserequestsasync"></a> parseRequestsAsync

▸ **parseRequestsAsync**(`requestPairs`): `Promise`\<[`H256`, [`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)][]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestPairs` | [`H256`, `InterbtcPrimitivesReplaceReplaceRequest`][] |

#### Returns

`Promise`\<[`H256`, [`ReplaceRequestExt`](../interfaces/ReplaceRequestExt.md)][]\>

#### Defined in

[src/parachain/replace.ts:332](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L332)

___

### <a id="request" name="request"></a> request

▸ **request**(`amount`, `collateralCurrency`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Amount issued, denoted in Bitcoin, to have replaced by another vault |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral currency to have replaced |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[request](../interfaces/ReplaceAPI.md#request)

#### Defined in

[src/parachain/replace.ts:171](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L171)

___

### <a id="withdraw" name="withdraw"></a> withdraw

▸ **withdraw**(`amount`, `collateralCurrency`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Wihdraw a replace request

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount of wrapped tokens to withdraw from the amount requested to have replaced. |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral currency of the request |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[ReplaceAPI](../interfaces/ReplaceAPI.md).[withdraw](../interfaces/ReplaceAPI.md#withdraw)

#### Defined in

[src/parachain/replace.ts:185](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/replace.ts#L185)
