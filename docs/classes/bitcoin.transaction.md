[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / Transaction

# Class: Transaction

[bitcoin](/modules/bitcoin.md).Transaction

## Table of contents

### Constructors

- [constructor](/classes/bitcoin.transaction.md#constructor)

### Properties

- [\_\_toBuffer](/classes/bitcoin.transaction.md#__tobuffer)
- [ins](/classes/bitcoin.transaction.md#ins)
- [locktime](/classes/bitcoin.transaction.md#locktime)
- [outs](/classes/bitcoin.transaction.md#outs)
- [version](/classes/bitcoin.transaction.md#version)
- [ADVANCED\_TRANSACTION\_FLAG](/classes/bitcoin.transaction.md#advanced_transaction_flag)
- [ADVANCED\_TRANSACTION\_MARKER](/classes/bitcoin.transaction.md#advanced_transaction_marker)
- [DEFAULT\_SEQUENCE](/classes/bitcoin.transaction.md#default_sequence)
- [SIGHASH\_ALL](/classes/bitcoin.transaction.md#sighash_all)
- [SIGHASH\_ANYONECANPAY](/classes/bitcoin.transaction.md#sighash_anyonecanpay)
- [SIGHASH\_NONE](/classes/bitcoin.transaction.md#sighash_none)
- [SIGHASH\_SINGLE](/classes/bitcoin.transaction.md#sighash_single)

### Methods

- [addInput](/classes/bitcoin.transaction.md#addinput)
- [addOutput](/classes/bitcoin.transaction.md#addoutput)
- [byteLength](/classes/bitcoin.transaction.md#bytelength)
- [clone](/classes/bitcoin.transaction.md#clone)
- [getHash](/classes/bitcoin.transaction.md#gethash)
- [getId](/classes/bitcoin.transaction.md#getid)
- [hasWitnesses](/classes/bitcoin.transaction.md#haswitnesses)
- [hashForSignature](/classes/bitcoin.transaction.md#hashforsignature)
- [hashForWitnessV0](/classes/bitcoin.transaction.md#hashforwitnessv0)
- [isCoinbase](/classes/bitcoin.transaction.md#iscoinbase)
- [setInputScript](/classes/bitcoin.transaction.md#setinputscript)
- [setWitness](/classes/bitcoin.transaction.md#setwitness)
- [toBuffer](/classes/bitcoin.transaction.md#tobuffer)
- [toHex](/classes/bitcoin.transaction.md#tohex)
- [virtualSize](/classes/bitcoin.transaction.md#virtualsize)
- [weight](/classes/bitcoin.transaction.md#weight)
- [fromBuffer](/classes/bitcoin.transaction.md#frombuffer)
- [fromHex](/classes/bitcoin.transaction.md#fromhex)
- [isCoinbaseHash](/classes/bitcoin.transaction.md#iscoinbasehash)

## Constructors

### constructor

\+ **new Transaction**(): [*Transaction*](/classes/bitcoin.transaction.md)

**Returns:** [*Transaction*](/classes/bitcoin.transaction.md)

## Properties

### \_\_toBuffer

• `Private` **\_\_toBuffer**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:51

___

### ins

• **ins**: [*TxInput*](/interfaces/bitcoin.txinput.md)[]

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:25

___

### locktime

• **locktime**: *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:24

___

### outs

• **outs**: [*TxOutput*](/interfaces/bitcoin.txoutput.md)[]

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:26

___

### version

• **version**: *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:23

___

### ADVANCED\_TRANSACTION\_FLAG

▪ `Readonly` `Static` **ADVANCED\_TRANSACTION\_FLAG**: *1*= 1

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:19

___

### ADVANCED\_TRANSACTION\_MARKER

▪ `Readonly` `Static` **ADVANCED\_TRANSACTION\_MARKER**: *0*= 0

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:18

___

### DEFAULT\_SEQUENCE

▪ `Readonly` `Static` **DEFAULT\_SEQUENCE**: *4294967295*= 4294967295

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:13

___

### SIGHASH\_ALL

▪ `Readonly` `Static` **SIGHASH\_ALL**: *1*= 1

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:14

___

### SIGHASH\_ANYONECANPAY

▪ `Readonly` `Static` **SIGHASH\_ANYONECANPAY**: *128*= 128

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:17

___

### SIGHASH\_NONE

▪ `Readonly` `Static` **SIGHASH\_NONE**: *2*= 2

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:15

___

### SIGHASH\_SINGLE

▪ `Readonly` `Static` **SIGHASH\_SINGLE**: *3*= 3

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:16

## Methods

### addInput

▸ **addInput**(`hash`: *Buffer*, `index`: *number*, `sequence?`: *number*, `scriptSig?`: *Buffer*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`hash` | *Buffer* |
`index` | *number* |
`sequence?` | *number* |
`scriptSig?` | *Buffer* |

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:28

___

### addOutput

▸ **addOutput**(`scriptPubKey`: *Buffer*, `value`: *number*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`scriptPubKey` | *Buffer* |
`value` | *number* |

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:29

___

### byteLength

▸ **byteLength**(`_ALLOW_WITNESS?`: *boolean*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`_ALLOW_WITNESS?` | *boolean* |

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:33

___

### clone

▸ **clone**(): [*Transaction*](/classes/bitcoin.transaction.md)

**Returns:** [*Transaction*](/classes/bitcoin.transaction.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:34

___

### getHash

▸ **getHash**(`forWitness?`: *boolean*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`forWitness?` | *boolean* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:45

___

### getId

▸ **getId**(): *string*

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:46

___

### hasWitnesses

▸ **hasWitnesses**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:30

___

### hashForSignature

▸ **hashForSignature**(`inIndex`: *number*, `prevOutScript`: *Buffer*, `hashType`: *number*): *Buffer*

Hash transaction for signing a specific input.

Bitcoin uses a different hash for each signed transaction input.
This method copies the transaction, makes the necessary changes based on the
hashType, and then hashes the result.
This hash can then be used to sign the provided transaction input.

#### Parameters:

Name | Type |
:------ | :------ |
`inIndex` | *number* |
`prevOutScript` | *Buffer* |
`hashType` | *number* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:43

___

### hashForWitnessV0

▸ **hashForWitnessV0**(`inIndex`: *number*, `prevOutScript`: *Buffer*, `value`: *number*, `hashType`: *number*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`inIndex` | *number* |
`prevOutScript` | *Buffer* |
`value` | *number* |
`hashType` | *number* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:44

___

### isCoinbase

▸ **isCoinbase**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:27

___

### setInputScript

▸ **setInputScript**(`index`: *number*, `scriptSig`: *Buffer*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`index` | *number* |
`scriptSig` | *Buffer* |

**Returns:** *void*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:49

___

### setWitness

▸ **setWitness**(`index`: *number*, `witness`: *Buffer*[]): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`index` | *number* |
`witness` | *Buffer*[] |

**Returns:** *void*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:50

___

### toBuffer

▸ **toBuffer**(`buffer?`: *Buffer*, `initialOffset?`: *number*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`buffer?` | *Buffer* |
`initialOffset?` | *number* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:47

___

### toHex

▸ **toHex**(): *string*

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:48

___

### virtualSize

▸ **virtualSize**(): *number*

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:32

___

### weight

▸ **weight**(): *number*

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:31

___

### fromBuffer

▸ `Static`**fromBuffer**(`buffer`: *Buffer*, `_NO_STRICT?`: *boolean*): [*Transaction*](/classes/bitcoin.transaction.md)

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | *Buffer* |
`_NO_STRICT?` | *boolean* |

**Returns:** [*Transaction*](/classes/bitcoin.transaction.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:20

___

### fromHex

▸ `Static`**fromHex**(`hex`: *string*): [*Transaction*](/classes/bitcoin.transaction.md)

#### Parameters:

Name | Type |
:------ | :------ |
`hex` | *string* |

**Returns:** [*Transaction*](/classes/bitcoin.transaction.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:21

___

### isCoinbaseHash

▸ `Static`**isCoinbaseHash**(`buffer`: *Buffer*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | *Buffer* |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/transaction.d.ts:22
