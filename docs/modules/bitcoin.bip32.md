[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / bip32

# Namespace: bip32

[bitcoin](/modules/bitcoin.md).bip32

## Table of contents

### Interfaces

- [BIP32Interface](/interfaces/bitcoin.bip32.bip32interface.md)

### Functions

- [fromBase58](/modules/bitcoin.bip32.md#frombase58)
- [fromPrivateKey](/modules/bitcoin.bip32.md#fromprivatekey)
- [fromPublicKey](/modules/bitcoin.bip32.md#frompublickey)
- [fromSeed](/modules/bitcoin.bip32.md#fromseed)

## Functions

### fromBase58

▸ **fromBase58**(`inString`: *string*, `network?`: Network): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inString` | *string* |
`network?` | Network |

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:34

___

### fromPrivateKey

▸ **fromPrivateKey**(`privateKey`: Buffer, `chainCode`: Buffer, `network?`: Network): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

#### Parameters:

Name | Type |
:------ | :------ |
`privateKey` | Buffer |
`chainCode` | Buffer |
`network?` | Network |

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:35

___

### fromPublicKey

▸ **fromPublicKey**(`publicKey`: Buffer, `chainCode`: Buffer, `network?`: Network): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

#### Parameters:

Name | Type |
:------ | :------ |
`publicKey` | Buffer |
`chainCode` | Buffer |
`network?` | Network |

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:36

___

### fromSeed

▸ **fromSeed**(`seed`: Buffer, `network?`: Network): [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

#### Parameters:

Name | Type |
:------ | :------ |
`seed` | Buffer |
`network?` | Network |

**Returns:** [*BIP32Interface*](/interfaces/bitcoin.bip32.bip32interface.md)

Defined in: node_modules/bip32/types/bip32.d.ts:37
