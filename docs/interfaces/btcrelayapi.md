[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / BTCRelayAPI

# Interface: BTCRelayAPI

## Table of contents

### Methods

- [getLatestBlock](/interfaces/btcrelayapi.md#getlatestblock)
- [getLatestBlockHeight](/interfaces/btcrelayapi.md#getlatestblockheight)
- [getStableBitcoinConfirmations](/interfaces/btcrelayapi.md#getstablebitcoinconfirmations)
- [verifyTransactionInclusion](/interfaces/btcrelayapi.md#verifytransactioninclusion)

## Methods

### getLatestBlock

▸ **getLatestBlock**(): *Promise*<H256Le\>

**Returns:** *Promise*<H256Le\>

The raw transaction data, represented as a Buffer object

Defined in: [src/apis/btc-relay.ts:17](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-relay.ts#L17)

___

### getLatestBlockHeight

▸ **getLatestBlockHeight**(): *Promise*<u32\>

**Returns:** *Promise*<u32\>

The height of the latest Bitcoin block that was rekayed by the BTC-Relay

Defined in: [src/apis/btc-relay.ts:21](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-relay.ts#L21)

___

### getStableBitcoinConfirmations

▸ **getStableBitcoinConfirmations**(): *Promise*<number\>

**Returns:** *Promise*<number\>

A global security parameter: the required block confirmations
for a transaction to be considered stable

Defined in: [src/apis/btc-relay.ts:13](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-relay.ts#L13)

___

### verifyTransactionInclusion

▸ **verifyTransactionInclusion**(`txid`: *string*, `confirmations?`: *number*, `insecure?`: *boolean*): *Promise*<void\>

Verifies the inclusion of a transaction with `txid` in the Bitcoin blockchain

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`txid` | *string* | The ID of a Bitcoin transaction   |
`confirmations?` | *number* | The number of block confirmations needed to accept the inclusion proof. This parameter is only used if the `insecure` parameter is set to `true`.    |
`insecure?` | *boolean* | - |

**Returns:** *Promise*<void\>

Defined in: [src/apis/btc-relay.ts:29](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-relay.ts#L29)
