[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / [bip32](/modules/bitcoin.bip32.md) / BIP32Interface

# Interface: BIP32Interface

[bitcoin](/modules/bitcoin.md).[bip32](/modules/bitcoin.bip32.md).BIP32Interface

## Table of contents

### Properties

- [chainCode](/interfaces/bitcoin.bip32.bip32interface.md#chaincode)
- [depth](/interfaces/bitcoin.bip32.bip32interface.md#depth)
- [fingerprint](/interfaces/bitcoin.bip32.bip32interface.md#fingerprint)
- [identifier](/interfaces/bitcoin.bip32.bip32interface.md#identifier)
- [index](/interfaces/bitcoin.bip32.bip32interface.md#index)
- [lowR](/interfaces/bitcoin.bip32.bip32interface.md#lowr)
- [network](/interfaces/bitcoin.bip32.bip32interface.md#network)
- [parentFingerprint](/interfaces/bitcoin.bip32.bip32interface.md#parentfingerprint)
- [privateKey](/interfaces/bitcoin.bip32.bip32interface.md#privatekey)
- [publicKey](/interfaces/bitcoin.bip32.bip32interface.md#publickey)

### Methods

- [derive](/interfaces/bitcoin.bip32.bip32interface.md#derive)
- [deriveHardened](/interfaces/bitcoin.bip32.bip32interface.md#derivehardened)
- [derivePath](/interfaces/bitcoin.bip32.bip32interface.md#derivepath)
- [isNeutered](/interfaces/bitcoin.bip32.bip32interface.md#isneutered)
- [neutered](/interfaces/bitcoin.bip32.bip32interface.md#neutered)
- [sign](/interfaces/bitcoin.bip32.bip32interface.md#sign)
- [toBase58](/interfaces/bitcoin.bip32.bip32interface.md#tobase58)
- [toWIF](/interfaces/bitcoin.bip32.bip32interface.md#towif)
- [verify](/interfaces/bitcoin.bip32.bip32interface.md#verify)

## Properties

### chainCode

• **chainCode**: *Buffer*

Defined in: node_modules/bip32/types/bip32.d.ts:14

___

### depth

• **depth**: *number*

Defined in: node_modules/bip32/types/bip32.d.ts:17

___

### fingerprint

• **fingerprint**: *Buffer*

Defined in: node_modules/bip32/types/bip32.d.ts:23

___

### identifier

• **identifier**: *Buffer*

Defined in: node_modules/bip32/types/bip32.d.ts:22

___

### index

• **index**: *number*

Defined in: node_modules/bip32/types/bip32.d.ts:18

___

### lowR

• **lowR**: *boolean*

Defined in: node_modules/bip32/types/bip32.d.ts:16

___

### network

• **network**: Network

Defined in: node_modules/bip32/types/bip32.d.ts:15

___

### parentFingerprint

• **parentFingerprint**: *number*

Defined in: node_modules/bip32/types/bip32.d.ts:19

___

### privateKey

• `Optional` **privateKey**: *undefined* \| *Buffer*

Defined in: node_modules/bip32/types/bip32.d.ts:21

___

### publicKey

• **publicKey**: *Buffer*

Defined in: node_modules/bip32/types/bip32.d.ts:20

## Methods

### derive

▸ **derive**(`index`: *number*): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

#### Parameters:

Name | Type |
:------ | :------ |
`index` | *number* |

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:28

___

### deriveHardened

▸ **deriveHardened**(`index`: *number*): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

#### Parameters:

Name | Type |
:------ | :------ |
`index` | *number* |

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:29

___

### derivePath

▸ **derivePath**(`path`: *string*): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

#### Parameters:

Name | Type |
:------ | :------ |
`path` | *string* |

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:30

___

### isNeutered

▸ **isNeutered**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bip32/types/bip32.d.ts:24

___

### neutered

▸ **neutered**(): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:25

___

### sign

▸ **sign**(`hash`: *Buffer*, `lowR?`: *boolean*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | *Buffer* |
`lowR?` | *boolean* |

**Returns:** *Buffer*

Defined in: node_modules/bip32/types/bip32.d.ts:31

___

### toBase58

▸ **toBase58**(): *string*

**Returns:** *string*

Defined in: node_modules/bip32/types/bip32.d.ts:26

___

### toWIF

▸ **toWIF**(): *string*

**Returns:** *string*

Defined in: node_modules/bip32/types/bip32.d.ts:27

___

### verify

▸ **verify**(`hash`: *Buffer*, `signature`: *Buffer*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | *Buffer* |
`signature` | *Buffer* |

**Returns:** *boolean*

Defined in: node_modules/bip32/types/bip32.d.ts:32
