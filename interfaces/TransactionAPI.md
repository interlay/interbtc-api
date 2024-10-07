[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / TransactionAPI

# Interface: TransactionAPI

## Implemented by

- [`DefaultTransactionAPI`](../classes/DefaultTransactionAPI.md)

## Table of contents

### Properties

- [api](TransactionAPI.md#api)

### Methods

- [buildBatchExtrinsic](TransactionAPI.md#buildbatchextrinsic)
- [dryRun](TransactionAPI.md#dryrun)
- [getAccount](TransactionAPI.md#getaccount)
- [getFeeEstimate](TransactionAPI.md#getfeeestimate)
- [removeAccount](TransactionAPI.md#removeaccount)
- [sendLogged](TransactionAPI.md#sendlogged)
- [setAccount](TransactionAPI.md#setaccount)

## Properties

### <a id="api" name="api"></a> api

• **api**: `ApiPromise`

#### Defined in

[src/parachain/transaction.ts:15](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L15)

## Methods

### <a id="buildbatchextrinsic" name="buildbatchextrinsic"></a> buildBatchExtrinsic

▸ **buildBatchExtrinsic**(`extrinsics`, `atomic?`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Builds a submittable extrinsic to send other extrinsic in batch.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `extrinsics` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>[] | An array of extrinsics to be submitted as batch. |
| `atomic?` | `boolean` | Whether the given extrinsics should be handled atomically or not. When true (default) all extrinsics will rollback if one fails (batchAll), otherwise allows partial successes (batch). |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A batch/batchAll submittable extrinsic.

#### Defined in

[src/parachain/transaction.ts:33](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L33)

___

### <a id="dryrun" name="dryrun"></a> dryRun

▸ **dryRun**(`extrinsic`): `Promise`\<[`DryRunResult`](DryRunResult.md)\>

Tests extrinsic execution against runtime.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `extrinsic` | `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\> | Extrinsic to dry run. |

#### Returns

`Promise`\<[`DryRunResult`](DryRunResult.md)\>

Object consisting of `success` boolean that is true if extrinsic
was successfully executed, false otherwise. If execution fails, caught error is exposed.

#### Defined in

[src/parachain/transaction.ts:54](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L54)

___

### <a id="getaccount" name="getaccount"></a> getAccount

▸ **getAccount**(): `undefined` \| `AddressOrPair`

#### Returns

`undefined` \| `AddressOrPair`

#### Defined in

[src/parachain/transaction.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L18)

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

#### Defined in

[src/parachain/transaction.ts:45](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L45)

___

### <a id="removeaccount" name="removeaccount"></a> removeAccount

▸ **removeAccount**(): `void`

#### Returns

`void`

#### Defined in

[src/parachain/transaction.ts:17](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L17)

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

#### Defined in

[src/parachain/transaction.ts:19](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L19)

___

### <a id="setaccount" name="setaccount"></a> setAccount

▸ **setAccount**(`account`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | `AddressOrPair` |

#### Returns

`void`

#### Defined in

[src/parachain/transaction.ts:16](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/transaction.ts#L16)
