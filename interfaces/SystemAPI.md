[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / SystemAPI

# Interface: SystemAPI

## Implemented by

- [`DefaultSystemAPI`](../classes/DefaultSystemAPI.md)

## Table of contents

### Methods

- [getBlockHash](SystemAPI.md#getblockhash)
- [getCurrentActiveBlockNumber](SystemAPI.md#getcurrentactiveblocknumber)
- [getCurrentBlockNumber](SystemAPI.md#getcurrentblocknumber)
- [getFutureBlockNumber](SystemAPI.md#getfutureblocknumber)
- [setCode](SystemAPI.md#setcode)
- [subscribeToCurrentBlockHeads](SystemAPI.md#subscribetocurrentblockheads)
- [subscribeToFinalizedBlockHeads](SystemAPI.md#subscribetofinalizedblockheads)

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

#### Defined in

[src/parachain/system.ts:43](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L43)

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

#### Defined in

[src/parachain/system.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L18)

___

### <a id="getcurrentblocknumber" name="getcurrentblocknumber"></a> getCurrentBlockNumber

▸ **getCurrentBlockNumber**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The current block number being processed.

#### Defined in

[src/parachain/system.ts:13](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L13)

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

#### Defined in

[src/parachain/system.ts:53](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L53)

___

### <a id="setcode" name="setcode"></a> setCode

▸ **setCode**(`code`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `code` | `string` | Hex-encoded wasm blob |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Upgrades runtime using `sudoUncheckedWeight`

#### Defined in

[src/parachain/system.ts:37](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L37)

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

#### Defined in

[src/parachain/system.ts:30](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L30)

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

#### Defined in

[src/parachain/system.ts:24](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/system.ts#L24)
