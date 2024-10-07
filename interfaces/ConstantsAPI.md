[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / ConstantsAPI

# Interface: ConstantsAPI

## Implemented by

- [`DefaultConstantsAPI`](../classes/DefaultConstantsAPI.md)

## Table of contents

### Methods

- [getSystemBlockHashCount](ConstantsAPI.md#getsystemblockhashcount)
- [getSystemDbWeight](ConstantsAPI.md#getsystemdbweight)
- [getTimestampMinimumPeriod](ConstantsAPI.md#gettimestampminimumperiod)

## Methods

### <a id="getsystemblockhashcount" name="getsystemblockhashcount"></a> getSystemBlockHashCount

▸ **getSystemBlockHashCount**(): `BlockNumber`

#### Returns

`BlockNumber`

Maximum number of block number to block hash mappings to keep (oldest pruned first).

#### Defined in

[src/parachain/constants.ts:14](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L14)

___

### <a id="getsystemdbweight" name="getsystemdbweight"></a> getSystemDbWeight

▸ **getSystemDbWeight**(): `SpWeightsRuntimeDbWeight`

#### Returns

`SpWeightsRuntimeDbWeight`

The weight of database operations that the runtime can invoke.

#### Defined in

[src/parachain/constants.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L18)

___

### <a id="gettimestampminimumperiod" name="gettimestampminimumperiod"></a> getTimestampMinimumPeriod

▸ **getTimestampMinimumPeriod**(): `Moment`

#### Returns

`Moment`

The minimum period between blocks. Beware that this is different to the *expected* period
that the block production apparatus provides. Your chosen consensus system will generally
work with this to determine a sensible block time. e.g. For Aura, it will be double this
period on default settings.

#### Defined in

[src/parachain/constants.ts:25](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/constants.ts#L25)
