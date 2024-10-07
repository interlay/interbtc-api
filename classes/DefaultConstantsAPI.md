[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultConstantsAPI

# Class: DefaultConstantsAPI

## Implements

- [`ConstantsAPI`](../interfaces/ConstantsAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultConstantsAPI.md#constructor)

### Properties

- [api](DefaultConstantsAPI.md#api)

### Methods

- [getSystemBlockHashCount](DefaultConstantsAPI.md#getsystemblockhashcount)
- [getSystemDbWeight](DefaultConstantsAPI.md#getsystemdbweight)
- [getTimestampMinimumPeriod](DefaultConstantsAPI.md#gettimestampminimumperiod)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultConstantsAPI**(`api`): [`DefaultConstantsAPI`](DefaultConstantsAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |

#### Returns

[`DefaultConstantsAPI`](DefaultConstantsAPI.md)

#### Defined in

[src/parachain/constants.ts:29](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L29)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/constants.ts:29](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L29)

## Methods

### <a id="getsystemblockhashcount" name="getsystemblockhashcount"></a> getSystemBlockHashCount

▸ **getSystemBlockHashCount**(): `BlockNumber`

#### Returns

`BlockNumber`

Maximum number of block number to block hash mappings to keep (oldest pruned first).

#### Implementation of

[ConstantsAPI](../interfaces/ConstantsAPI.md).[getSystemBlockHashCount](../interfaces/ConstantsAPI.md#getsystemblockhashcount)

#### Defined in

[src/parachain/constants.ts:31](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L31)

___

### <a id="getsystemdbweight" name="getsystemdbweight"></a> getSystemDbWeight

▸ **getSystemDbWeight**(): `SpWeightsRuntimeDbWeight`

#### Returns

`SpWeightsRuntimeDbWeight`

The weight of database operations that the runtime can invoke.

#### Implementation of

[ConstantsAPI](../interfaces/ConstantsAPI.md).[getSystemDbWeight](../interfaces/ConstantsAPI.md#getsystemdbweight)

#### Defined in

[src/parachain/constants.ts:35](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L35)

___

### <a id="gettimestampminimumperiod" name="gettimestampminimumperiod"></a> getTimestampMinimumPeriod

▸ **getTimestampMinimumPeriod**(): `Moment`

#### Returns

`Moment`

The minimum period between blocks. Beware that this is different to the *expected* period
that the block production apparatus provides. Your chosen consensus system will generally
work with this to determine a sensible block time. e.g. For Aura, it will be double this
period on default settings.

#### Implementation of

[ConstantsAPI](../interfaces/ConstantsAPI.md).[getTimestampMinimumPeriod](../interfaces/ConstantsAPI.md#gettimestampminimumperiod)

#### Defined in

[src/parachain/constants.ts:39](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L39)
