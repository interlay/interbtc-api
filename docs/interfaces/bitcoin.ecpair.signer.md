[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / [ECPair](/modules/bitcoin.ecpair.md) / Signer

# Interface: Signer

[bitcoin](/modules/bitcoin.md).[ECPair](/modules/bitcoin.ecpair.md).Signer

## Hierarchy

* **Signer**

  ↳ [*ECPairInterface*](/interfaces/bitcoin.ecpair.ecpairinterface.md)

## Table of contents

### Properties

- [network](/interfaces/bitcoin.ecpair.signer.md#network)
- [publicKey](/interfaces/bitcoin.ecpair.signer.md#publickey)

### Methods

- [getPublicKey](/interfaces/bitcoin.ecpair.signer.md#getpublickey)
- [sign](/interfaces/bitcoin.ecpair.signer.md#sign)

## Properties

### network

• `Optional` **network**: *any*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:9

___

### publicKey

• **publicKey**: *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:8

## Methods

### getPublicKey

▸ `Optional`**getPublicKey**(): *Buffer*

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:11

___

### sign

▸ **sign**(`hash`: *Buffer*, `lowR?`: *boolean*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | *Buffer* |
`lowR?` | *boolean* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:10
