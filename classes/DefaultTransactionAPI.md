[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultTransactionAPI

# Class: DefaultTransactionAPI

## Implements

- [`TransactionAPI`](../interfaces/TransactionAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultTransactionAPI.md#constructor)

### Properties

- [account](DefaultTransactionAPI.md#account)
- [api](DefaultTransactionAPI.md#api)

### Methods

- [buildBatchExtrinsic](DefaultTransactionAPI.md#buildbatchextrinsic)
- [dryRun](DefaultTransactionAPI.md#dryrun)
- [getAccount](DefaultTransactionAPI.md#getaccount)
- [getFeeEstimate](DefaultTransactionAPI.md#getfeeestimate)
- [removeAccount](DefaultTransactionAPI.md#removeaccount)
- [sendLogged](DefaultTransactionAPI.md#sendlogged)
- [setAccount](DefaultTransactionAPI.md#setaccount)
- [buildBatchExtrinsic](DefaultTransactionAPI.md#buildbatchextrinsic-1)
- [doesArrayContainEvent](DefaultTransactionAPI.md#doesarraycontainevent)
- [isDispatchError](DefaultTransactionAPI.md#isdispatcherror)
- [printEvents](DefaultTransactionAPI.md#printevents)
- [sendLogged](DefaultTransactionAPI.md#sendlogged-1)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultTransactionAPI**(`api`, `account?`): [`DefaultTransactionAPI`](DefaultTransactionAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `account?` | `AddressOrPair` |

#### Returns

[`DefaultTransactionAPI`](DefaultTransactionAPI.md)

#### Defined in

[src/parachain/transaction.ts:58](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L58)

## Properties

### <a id="account" name="account"></a> account

• `Private` `Optional` **account**: `AddressOrPair`

#### Defined in

[src/parachain/transaction.ts:58](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L58)

___

### <a id="api" name="api"></a> api

• **api**: `ApiPromise`

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[api](../interfaces/TransactionAPI.md#api)

#### Defined in

[src/parachain/transaction.ts:58](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L58)

## Methods

### <a id="buildbatchextrinsic" name="buildbatchextrinsic"></a> buildBatchExtrinsic

▸ **buildBatchExtrinsic**(`extrinsics`, `atomic?`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Builds a submittable extrinsic to send other extrinsic in batch.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `extrinsics` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>[] | `undefined` | An array of extrinsics to be submitted as batch. |
| `atomic` | `boolean` | `true` | Whether the given extrinsics should be handled atomically or not. When true (default) all extrinsics will rollback if one fails (batchAll), otherwise allows partial successes (batch). |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A batch/batchAll submittable extrinsic.

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[buildBatchExtrinsic](../interfaces/TransactionAPI.md#buildbatchextrinsic)

#### Defined in

[src/parachain/transaction.ts:107](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L107)

___

### <a id="dryrun" name="dryrun"></a> dryRun

▸ **dryRun**(`extrinsic`): `Promise`\<[`DryRunResult`](../interfaces/DryRunResult.md)\>

Tests extrinsic execution against runtime.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `extrinsic` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\> | Extrinsic to dry run. |

#### Returns

`Promise`\<[`DryRunResult`](../interfaces/DryRunResult.md)\>

Object consisting of `success` boolean that is true if extrinsic
was successfully executed, false otherwise. If execution fails, caught error is exposed.

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[dryRun](../interfaces/TransactionAPI.md#dryrun)

#### Defined in

[src/parachain/transaction.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L95)

___

### <a id="getaccount" name="getaccount"></a> getAccount

▸ **getAccount**(): `undefined` \| `AddressOrPair`

#### Returns

`undefined` \| `AddressOrPair`

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[getAccount](../interfaces/TransactionAPI.md#getaccount)

#### Defined in

[src/parachain/transaction.ts:68](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L68)

___

### <a id="getfeeestimate" name="getfeeestimate"></a> getFeeEstimate

▸ **getFeeEstimate**(`extrinsic`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

Getter for fee estimate of the extrinsic.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `extrinsic` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\> | Extrinsic to get fee estimation about. |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

amount of native currency that will be paid as transaction fee.

**`Note`**

This fee estimation does not include tip.

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[getFeeEstimate](../interfaces/TransactionAPI.md#getfeeestimate)

#### Defined in

[src/parachain/transaction.ts:83](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L83)

___

### <a id="removeaccount" name="removeaccount"></a> removeAccount

▸ **removeAccount**(): `void`

#### Returns

`void`

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[removeAccount](../interfaces/TransactionAPI.md#removeaccount)

#### Defined in

[src/parachain/transaction.ts:64](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L64)

___

### <a id="sendlogged" name="sendlogged"></a> sendLogged

▸ **sendLogged**\<`T`\>(`transaction`, `successEventType?`, `extrinsicStatus?`): `Promise`\<`ISubmittableResult`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AnyTuple` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transaction` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\> |
| `successEventType?` | `AugmentedEvent`\<`ApiTypes`, `T`\> |
| `extrinsicStatus?` | `ExtrinsicStatus` |

#### Returns

`Promise`\<`ISubmittableResult`\>

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[sendLogged](../interfaces/TransactionAPI.md#sendlogged)

#### Defined in

[src/parachain/transaction.ts:72](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L72)

___

### <a id="setaccount" name="setaccount"></a> setAccount

▸ **setAccount**(`account`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | `AddressOrPair` |

#### Returns

`void`

#### Implementation of

[TransactionAPI](../interfaces/TransactionAPI.md).[setAccount](../interfaces/TransactionAPI.md#setaccount)

#### Defined in

[src/parachain/transaction.ts:60](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L60)

___

### <a id="buildbatchextrinsic-1" name="buildbatchextrinsic-1"></a> buildBatchExtrinsic

▸ **buildBatchExtrinsic**(`api`, `extrinsics`, `atomic?`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Builds a submittable extrinsic to send other extrinsic in batch.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `api` | `ApiPromise` | `undefined` | The ApiPromis instance to construct the batch extrinsic with. |
| `extrinsics` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>[] | `undefined` | An array of extrinsics to be submitted as batch. |
| `atomic` | `boolean` | `true` | Whether the given extrinsics should be handled atomically or not. When true (default) all extrinsics will rollback if one fails (batchAll), otherwise allows partial successes (batch). |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A batch/batchAll submittable extrinsic.

#### Defined in

[src/parachain/transaction.ts:123](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L123)

___

### <a id="doesarraycontainevent" name="doesarraycontainevent"></a> doesArrayContainEvent

▸ **doesArrayContainEvent**\<`T`\>(`events`, `eventType`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AnyTuple` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `events` | `EventRecord`[] |
| `eventType` | `AugmentedEvent`\<`ApiTypes`, `T`\> |

#### Returns

`boolean`

#### Defined in

[src/parachain/transaction.ts:238](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L238)

___

### <a id="isdispatcherror" name="isdispatcherror"></a> isDispatchError

▸ **isDispatchError**(`eventData`): eventData is DispatchError

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventData` | `unknown` |

#### Returns

eventData is DispatchError

#### Defined in

[src/parachain/transaction.ts:234](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L234)

___

### <a id="printevents" name="printevents"></a> printEvents

▸ **printEvents**(`api`, `events`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `events` | `EventRecord`[] |

#### Returns

`void`

#### Defined in

[src/parachain/transaction.ts:204](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L204)

___

### <a id="sendlogged-1" name="sendlogged-1"></a> sendLogged

▸ **sendLogged**\<`T`\>(`api`, `account`, `transaction`, `successEventType?`, `extrinsicStatus?`): `Promise`\<`ISubmittableResult`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AnyTuple` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `account` | `AddressOrPair` |
| `transaction` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\> |
| `successEventType?` | `AugmentedEvent`\<`ApiTypes`, `T`\> |
| `extrinsicStatus?` | `ExtrinsicStatus` |

#### Returns

`Promise`\<`ISubmittableResult`\>

#### Defined in

[src/parachain/transaction.ts:132](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L132)
