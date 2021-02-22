[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / script

# Namespace: script

[bitcoin](/modules/bitcoin.md).script

## Table of contents

### Type aliases

- [OpCode](/modules/bitcoin.script.md#opcode)

### Variables

- [OPS](/modules/bitcoin.script.md#ops)
- [number](/modules/bitcoin.script.md#number)
- [signature](/modules/bitcoin.script.md#signature)

### Functions

- [compile](/modules/bitcoin.script.md#compile)
- [decompile](/modules/bitcoin.script.md#decompile)
- [fromASM](/modules/bitcoin.script.md#fromasm)
- [isCanonicalPubKey](/modules/bitcoin.script.md#iscanonicalpubkey)
- [isCanonicalScriptSignature](/modules/bitcoin.script.md#iscanonicalscriptsignature)
- [isDefinedHashType](/modules/bitcoin.script.md#isdefinedhashtype)
- [isPushOnly](/modules/bitcoin.script.md#ispushonly)
- [toASM](/modules/bitcoin.script.md#toasm)
- [toStack](/modules/bitcoin.script.md#tostack)

## Type aliases

### OpCode

Ƭ **OpCode**: *number*

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:4

## Variables

### OPS

• `Const` **OPS**: *object*

#### Type declaration:

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:5

___

### number

• `Const` **number**: *typeof* scriptNumber

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:17

___

### signature

• `Const` **signature**: *typeof* scriptSignature

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:18

## Functions

### compile

▸ **compile**(`chunks`: Buffer \| [*Stack*](/modules/bitcoin.payments.md#stack)): Buffer

#### Parameters:

Name | Type |
:------ | :------ |
`chunks` | Buffer \| [*Stack*](/modules/bitcoin.payments.md#stack) |

**Returns:** Buffer

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:9

___

### decompile

▸ **decompile**(`buffer`: Buffer \| (*number* \| Buffer)[]): (*number* \| Buffer)[] \| *null*

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | Buffer \| (*number* \| Buffer)[] |

**Returns:** (*number* \| Buffer)[] \| *null*

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:10

___

### fromASM

▸ **fromASM**(`asm`: *string*): Buffer

#### Parameters:

Name | Type |
:------ | :------ |
`asm` | *string* |

**Returns:** Buffer

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:12

___

### isCanonicalPubKey

▸ **isCanonicalPubKey**(`buffer`: Buffer): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | Buffer |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:14

___

### isCanonicalScriptSignature

▸ **isCanonicalScriptSignature**(`buffer`: Buffer): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | Buffer |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:16

___

### isDefinedHashType

▸ **isDefinedHashType**(`hashType`: *number*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`hashType` | *number* |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:15

___

### isPushOnly

▸ **isPushOnly**(`value`: [*Stack*](/modules/bitcoin.payments.md#stack)): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | [*Stack*](/modules/bitcoin.payments.md#stack) |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:8

___

### toASM

▸ **toASM**(`chunks`: Buffer \| (*number* \| Buffer)[]): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`chunks` | Buffer \| (*number* \| Buffer)[] |

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:11

___

### toStack

▸ **toStack**(`chunks`: Buffer \| (*number* \| Buffer)[]): Buffer[]

#### Parameters:

Name | Type |
:------ | :------ |
`chunks` | Buffer \| (*number* \| Buffer)[] |

**Returns:** Buffer[]

Defined in: node_modules/bitcoinjs-lib/types/script.d.ts:13
