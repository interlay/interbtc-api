[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultBTCRelayAPI

# Class: DefaultBTCRelayAPI

## Implements

- [`BTCRelayAPI`](../interfaces/BTCRelayAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultBTCRelayAPI.md#constructor)

### Properties

- [api](DefaultBTCRelayAPI.md#api)

### Methods

- [getLatestBlock](DefaultBTCRelayAPI.md#getlatestblock)
- [getLatestBlockHeight](DefaultBTCRelayAPI.md#getlatestblockheight)
- [getStableBitcoinConfirmations](DefaultBTCRelayAPI.md#getstablebitcoinconfirmations)
- [getStableParachainConfirmations](DefaultBTCRelayAPI.md#getstableparachainconfirmations)
- [isBlockInRelay](DefaultBTCRelayAPI.md#isblockinrelay)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultBTCRelayAPI**(`api`): [`DefaultBTCRelayAPI`](DefaultBTCRelayAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |

#### Returns

[`DefaultBTCRelayAPI`](DefaultBTCRelayAPI.md)

#### Defined in

[src/parachain/btc-relay.ts:37](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L37)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/btc-relay.ts:37](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L37)

## Methods

### <a id="getlatestblock" name="getlatestblock"></a> getLatestBlock

▸ **getLatestBlock**(): `Promise`\<`BitcoinH256Le`\>

#### Returns

`Promise`\<`BitcoinH256Le`\>

The raw transaction data, represented as a Buffer object

#### Implementation of

[BTCRelayAPI](../interfaces/BTCRelayAPI.md).[getLatestBlock](../interfaces/BTCRelayAPI.md#getlatestblock)

#### Defined in

[src/parachain/btc-relay.ts:47](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L47)

___

### <a id="getlatestblockheight" name="getlatestblockheight"></a> getLatestBlockHeight

▸ **getLatestBlockHeight**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The height of the latest Bitcoin block that was rekayed by the BTC-Relay

#### Implementation of

[BTCRelayAPI](../interfaces/BTCRelayAPI.md).[getLatestBlockHeight](../interfaces/BTCRelayAPI.md#getlatestblockheight)

#### Defined in

[src/parachain/btc-relay.ts:51](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L51)

___

### <a id="getstablebitcoinconfirmations" name="getstablebitcoinconfirmations"></a> getStableBitcoinConfirmations

▸ **getStableBitcoinConfirmations**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

A global security parameter: the required block confirmations
for a transaction to be considered stable on Bitcoin

#### Implementation of

[BTCRelayAPI](../interfaces/BTCRelayAPI.md).[getStableBitcoinConfirmations](../interfaces/BTCRelayAPI.md#getstablebitcoinconfirmations)

#### Defined in

[src/parachain/btc-relay.ts:39](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L39)

___

### <a id="getstableparachainconfirmations" name="getstableparachainconfirmations"></a> getStableParachainConfirmations

▸ **getStableParachainConfirmations**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

A global security parameter: the required block confirmations
for a transaction to be considered stable on the parachain

#### Implementation of

[BTCRelayAPI](../interfaces/BTCRelayAPI.md).[getStableParachainConfirmations](../interfaces/BTCRelayAPI.md#getstableparachainconfirmations)

#### Defined in

[src/parachain/btc-relay.ts:43](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L43)

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

#### Implementation of

[BTCRelayAPI](../interfaces/BTCRelayAPI.md).[isBlockInRelay](../interfaces/BTCRelayAPI.md#isblockinrelay)

#### Defined in

[src/parachain/btc-relay.ts:55](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/btc-relay.ts#L55)
