[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultSystemAPI

# Class: DefaultSystemAPI

## Implements

- [`SystemAPI`](../interfaces/SystemAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultSystemAPI.md#constructor)

### Properties

- [api](DefaultSystemAPI.md#api)

### Methods

- [getBlockHash](DefaultSystemAPI.md#getblockhash)
- [getCurrentActiveBlockNumber](DefaultSystemAPI.md#getcurrentactiveblocknumber)
- [getCurrentBlockNumber](DefaultSystemAPI.md#getcurrentblocknumber)
- [getFutureBlockNumber](DefaultSystemAPI.md#getfutureblocknumber)
- [setCode](DefaultSystemAPI.md#setcode)
- [subscribeToCurrentBlockHeads](DefaultSystemAPI.md#subscribetocurrentblockheads)
- [subscribeToFinalizedBlockHeads](DefaultSystemAPI.md#subscribetofinalizedblockheads)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultSystemAPI**(`api`): [`DefaultSystemAPI`](DefaultSystemAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |

#### Returns

[`DefaultSystemAPI`](DefaultSystemAPI.md)

#### Defined in

[src/parachain/system.ts:57](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L57)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/system.ts:57](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L57)

## Methods

### <a id="getblockhash" name="getblockhash"></a> getBlockHash

▸ **getBlockHash**(`blockNumber`): `Promise`\<`BlockHash`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `blockNumber` | `number` | The block number to get the hash for |

#### Returns

`Promise`\<`BlockHash`\>

The block hash for the given block number

#### Implementation of

[SystemAPI](../interfaces/SystemAPI.md).[getBlockHash](../interfaces/SystemAPI.md#getblockhash)

#### Defined in

[src/parachain/system.ts:88](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L88)

___

### <a id="getcurrentactiveblocknumber" name="getcurrentactiveblocknumber"></a> getCurrentActiveBlockNumber

▸ **getCurrentActiveBlockNumber**(`atBlock?`): `Promise`\<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `atBlock?` | `BlockHash` |

#### Returns

`Promise`\<`number`\>

The current active block number being processed.

#### Implementation of

[SystemAPI](../interfaces/SystemAPI.md).[getCurrentActiveBlockNumber](../interfaces/SystemAPI.md#getcurrentactiveblocknumber)

#### Defined in

[src/parachain/system.ts:63](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L63)

___

### <a id="getcurrentblocknumber" name="getcurrentblocknumber"></a> getCurrentBlockNumber

▸ **getCurrentBlockNumber**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The current block number being processed.

#### Implementation of

[SystemAPI](../interfaces/SystemAPI.md).[getCurrentBlockNumber](../interfaces/SystemAPI.md#getcurrentblocknumber)

#### Defined in

[src/parachain/system.ts:59](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L59)

___

### <a id="getfutureblocknumber" name="getfutureblocknumber"></a> getFutureBlockNumber

▸ **getFutureBlockNumber**(`secondsFromNow`): `Promise`\<`number`\>

Get number of block that will added in amount of seconds from now.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `secondsFromNow` | `number` | Amount of seconds in the future. |

#### Returns

`Promise`\<`number`\>

Number of block added in future.

**`Note`**

Based on approximate block time of 12 seconds.

#### Implementation of

[SystemAPI](../interfaces/SystemAPI.md).[getFutureBlockNumber](../interfaces/SystemAPI.md#getfutureblocknumber)

#### Defined in

[src/parachain/system.ts:92](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L92)

___

### <a id="setcode" name="setcode"></a> setCode

▸ **setCode**(`code`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `code` | `string` | Hex-encoded wasm blob |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Upgrades runtime using `sudoUncheckedWeight`

#### Implementation of

[SystemAPI](../interfaces/SystemAPI.md).[setCode](../interfaces/SystemAPI.md#setcode)

#### Defined in

[src/parachain/system.ts:83](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L83)

___

### <a id="subscribetocurrentblockheads" name="subscribetocurrentblockheads"></a> subscribeToCurrentBlockHeads

▸ **subscribeToCurrentBlockHeads**(`callback`): `Promise`\<() => `void`\>

On every new parachain block, call the callback function with the new block header

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callback` | (`blockHeader`: `Header`) => `void` | Function to be called with every new unfinalized block header |

#### Returns

`Promise`\<() => `void`\>

#### Implementation of

[SystemAPI](../interfaces/SystemAPI.md).[subscribeToCurrentBlockHeads](../interfaces/SystemAPI.md#subscribetocurrentblockheads)

#### Defined in

[src/parachain/system.ts:76](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L76)

___

### <a id="subscribetofinalizedblockheads" name="subscribetofinalizedblockheads"></a> subscribeToFinalizedBlockHeads

▸ **subscribeToFinalizedBlockHeads**(`callback`): `Promise`\<() => `void`\>

On every new parachain block, call the callback function with the new block header

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callback` | (`blockHeader`: `Header`) => `void` | Function to be called with every new block header |

#### Returns

`Promise`\<() => `void`\>

#### Implementation of

[SystemAPI](../interfaces/SystemAPI.md).[subscribeToFinalizedBlockHeads](../interfaces/SystemAPI.md#subscribetofinalizedblockheads)

#### Defined in

[src/parachain/system.ts:69](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L69)
