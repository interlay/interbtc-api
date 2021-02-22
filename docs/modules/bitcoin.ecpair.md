[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / ECPair

# Namespace: ECPair

[bitcoin](/modules/bitcoin.md).ECPair

## Table of contents

### Interfaces

- [ECPairInterface](/interfaces/bitcoin.ecpair.ecpairinterface.md)
- [Signer](/interfaces/bitcoin.ecpair.signer.md)
- [SignerAsync](/interfaces/bitcoin.ecpair.signerasync.md)

### Functions

- [fromPrivateKey](/modules/bitcoin.ecpair.md#fromprivatekey)
- [fromPublicKey](/modules/bitcoin.ecpair.md#frompublickey)
- [fromWIF](/modules/bitcoin.ecpair.md#fromwif)
- [makeRandom](/modules/bitcoin.ecpair.md#makerandom)

## Functions

### fromPrivateKey

▸ **fromPrivateKey**(`buffer`: Buffer, `options?`: ECPairOptions): ECPair

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | Buffer |
`options?` | ECPairOptions |

**Returns:** ECPair

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:40

___

### fromPublicKey

▸ **fromPublicKey**(`buffer`: Buffer, `options?`: ECPairOptions): ECPair

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | Buffer |
`options?` | ECPairOptions |

**Returns:** ECPair

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:41

___

### fromWIF

▸ **fromWIF**(`wifString`: *string*, `network?`: [*Network*](/interfaces/bitcoin.networks.network.md) \| [*Network*](/interfaces/bitcoin.networks.network.md)[]): ECPair

#### Parameters:

Name | Type |
:------ | :------ |
`wifString` | *string* |
`network?` | [*Network*](/interfaces/bitcoin.networks.network.md) \| [*Network*](/interfaces/bitcoin.networks.network.md)[] |

**Returns:** ECPair

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:42

___

### makeRandom

▸ **makeRandom**(`options?`: ECPairOptions): ECPair

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | ECPairOptions |

**Returns:** ECPair

Defined in: node_modules/bitcoinjs-lib/types/ecpair.d.ts:43
