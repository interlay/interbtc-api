[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / [ECPair](/modules/bitcoin.ecpair.md) / SignerAsync

# Interface: SignerAsync

[bitcoin](/modules/bitcoin.md).[ECPair](/modules/bitcoin.ecpair.md).SignerAsync

## Table of contents

### Properties

- [network](/interfaces/bitcoin.ecpair.signerasync.md#network)
- [publicKey](/interfaces/bitcoin.ecpair.signerasync.md#publickey)

### Methods

- [getPublicKey](/interfaces/bitcoin.ecpair.signerasync.md#getpublickey)
- [sign](/interfaces/bitcoin.ecpair.signerasync.md#sign)

## Properties

### network

• `Optional` **network**: *any*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:15

___

### publicKey

• **publicKey**: *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:14

## Methods

### getPublicKey

▸ `Optional`**getPublicKey**(): *Buffer*

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:17

___

### sign

▸ **sign**(`hash`: *Buffer*, `lowR?`: *boolean*): *Promise*<Buffer\>

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | *Buffer* |
`lowR?` | *boolean* |

**Returns:** *Promise*<Buffer\>

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:16
