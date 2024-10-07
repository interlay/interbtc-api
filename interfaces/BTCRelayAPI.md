[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / BTCRelayAPI

# Interface: BTCRelayAPI

## Implemented by

- [`DefaultBTCRelayAPI`](../classes/DefaultBTCRelayAPI.md)

## Table of contents

### Methods

- [getLatestBlock](BTCRelayAPI.md#getlatestblock)
- [getLatestBlockHeight](BTCRelayAPI.md#getlatestblockheight)
- [getStableBitcoinConfirmations](BTCRelayAPI.md#getstablebitcoinconfirmations)
- [getStableParachainConfirmations](BTCRelayAPI.md#getstableparachainconfirmations)
- [isBlockInRelay](BTCRelayAPI.md#isblockinrelay)

## Methods

### <a id="getlatestblock" name="getlatestblock"></a> getLatestBlock

▸ **getLatestBlock**(): `Promise`\<`BitcoinH256Le`\>

#### Returns

`Promise`\<`BitcoinH256Le`\>

The raw transaction data, represented as a Buffer object

#### Defined in

[src/parachain/btc-relay.ts:25](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L25)

___

### <a id="getlatestblockheight" name="getlatestblockheight"></a> getLatestBlockHeight

▸ **getLatestBlockHeight**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The height of the latest Bitcoin block that was rekayed by the BTC-Relay

#### Defined in

[src/parachain/btc-relay.ts:29](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L29)

___

### <a id="getstablebitcoinconfirmations" name="getstablebitcoinconfirmations"></a> getStableBitcoinConfirmations

▸ **getStableBitcoinConfirmations**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

A global security parameter: the required block confirmations
for a transaction to be considered stable on Bitcoin

#### Defined in

[src/parachain/btc-relay.ts:16](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L16)

___

### <a id="getstableparachainconfirmations" name="getstableparachainconfirmations"></a> getStableParachainConfirmations

▸ **getStableParachainConfirmations**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

A global security parameter: the required block confirmations
for a transaction to be considered stable on the parachain

#### Defined in

[src/parachain/btc-relay.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L21)

___

### <a id="isblockinrelay" name="isblockinrelay"></a> isBlockInRelay

▸ **isBlockInRelay**(`blockHash`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockHash` | `string` |

#### Returns

`Promise`\<`boolean`\>

True if the block is in the relay, false otherwise.

#### Defined in

[src/parachain/btc-relay.ts:33](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L33)
