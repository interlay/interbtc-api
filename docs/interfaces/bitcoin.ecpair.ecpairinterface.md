[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / [ECPair](/modules/bitcoin.ecpair.md) / ECPairInterface

# Interface: ECPairInterface

[bitcoin](/modules/bitcoin.md).[ECPair](/modules/bitcoin.ecpair.md).ECPairInterface

## Hierarchy

* [*Signer*](/interfaces/bitcoin.ecpair.signer.md)

  ↳ **ECPairInterface**

## Table of contents

### Properties

- [compressed](/interfaces/bitcoin.ecpair.ecpairinterface.md#compressed)
- [lowR](/interfaces/bitcoin.ecpair.ecpairinterface.md#lowr)
- [network](/interfaces/bitcoin.ecpair.ecpairinterface.md#network)
- [privateKey](/interfaces/bitcoin.ecpair.ecpairinterface.md#privatekey)
- [publicKey](/interfaces/bitcoin.ecpair.ecpairinterface.md#publickey)

### Methods

- [getPublicKey](/interfaces/bitcoin.ecpair.ecpairinterface.md#getpublickey)
- [sign](/interfaces/bitcoin.ecpair.ecpairinterface.md#sign)
- [toWIF](/interfaces/bitcoin.ecpair.ecpairinterface.md#towif)
- [verify](/interfaces/bitcoin.ecpair.ecpairinterface.md#verify)

## Properties

### compressed

• **compressed**: *boolean*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:20

___

### lowR

• **lowR**: *boolean*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:22

___

### network

• **network**: [*Network*](/interfaces/bitcoin.networks.network.md)

Overrides: [Signer](/interfaces/bitcoin.ecpair.signer.md).[network](/interfaces/bitcoin.ecpair.signer.md#network)

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:21

___

### privateKey

• `Optional` **privateKey**: *undefined* \| *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:23

___

### publicKey

• **publicKey**: *Buffer*

Inherited from: [Signer](/interfaces/bitcoin.ecpair.signer.md).[publicKey](/interfaces/bitcoin.ecpair.signer.md#publickey)

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:8

## Methods

### getPublicKey

▸ `Optional`**getPublicKey**(): *Buffer*

**Returns:** *Buffer*

Inherited from: [Signer](/interfaces/bitcoin.ecpair.signer.md)

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

Inherited from: [Signer](/interfaces/bitcoin.ecpair.signer.md)

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:10

___

### toWIF

▸ **toWIF**(): *string*

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:24

___

### verify

▸ **verify**(`hash`: *Buffer*, `signature`: *Buffer*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | *Buffer* |
`signature` | *Buffer* |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:25
