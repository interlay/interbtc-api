[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / address

# Namespace: address

[bitcoin](/modules/bitcoin.md).address

## Table of contents

### Interfaces

- [Base58CheckResult](/interfaces/bitcoin.address.base58checkresult.md)
- [Bech32Result](/interfaces/bitcoin.address.bech32result.md)

### Functions

- [fromBase58Check](/modules/bitcoin.address.md#frombase58check)
- [fromBech32](/modules/bitcoin.address.md#frombech32)
- [fromOutputScript](/modules/bitcoin.address.md#fromoutputscript)
- [toBase58Check](/modules/bitcoin.address.md#tobase58check)
- [toBech32](/modules/bitcoin.address.md#tobech32)
- [toOutputScript](/modules/bitcoin.address.md#tooutputscript)

## Functions

### fromBase58Check

▸ **fromBase58Check**(`address`: *string*): [*Base58CheckResult*](/interfaces/bitcoin.address.base58checkresult.md)

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |

**Returns:** [*Base58CheckResult*](/interfaces/bitcoin.address.base58checkresult.md)

Defined in: node_modules/bitcoinjs-lib/types/address.d.ts:11

___

### fromBech32

▸ **fromBech32**(`address`: *string*): [*Bech32Result*](/interfaces/bitcoin.address.bech32result.md)

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |

**Returns:** [*Bech32Result*](/interfaces/bitcoin.address.bech32result.md)

Defined in: node_modules/bitcoinjs-lib/types/address.d.ts:12

___

### fromOutputScript

▸ **fromOutputScript**(`output`: Buffer, `network?`: [*Network*](/interfaces/bitcoin.networks.network.md)): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`output` | Buffer |
`network?` | [*Network*](/interfaces/bitcoin.networks.network.md) |

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/address.d.ts:15

___

### toBase58Check

▸ **toBase58Check**(`hash`: Buffer, `version`: *number*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | Buffer |
`version` | *number* |

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/address.d.ts:13

___

### toBech32

▸ **toBech32**(`data`: Buffer, `version`: *number*, `prefix`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`data` | Buffer |
`version` | *number* |
`prefix` | *string* |

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/address.d.ts:14

___

### toOutputScript

▸ **toOutputScript**(`address`: *string*, `network?`: [*Network*](/interfaces/bitcoin.networks.network.md)): Buffer

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |
`network?` | [*Network*](/interfaces/bitcoin.networks.network.md) |

**Returns:** Buffer

Defined in: node_modules/bitcoinjs-lib/types/address.d.ts:16
