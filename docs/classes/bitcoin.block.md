[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / Block

# Class: Block

[bitcoin](/modules/bitcoin.md).Block

## Table of contents

### Constructors

- [constructor](/classes/bitcoin.block.md#constructor)

### Properties

- [\_\_checkMerkleRoot](/classes/bitcoin.block.md#__checkmerkleroot)
- [\_\_checkWitnessCommit](/classes/bitcoin.block.md#__checkwitnesscommit)
- [bits](/classes/bitcoin.block.md#bits)
- [merkleRoot](/classes/bitcoin.block.md#merkleroot)
- [nonce](/classes/bitcoin.block.md#nonce)
- [prevHash](/classes/bitcoin.block.md#prevhash)
- [timestamp](/classes/bitcoin.block.md#timestamp)
- [transactions](/classes/bitcoin.block.md#transactions)
- [version](/classes/bitcoin.block.md#version)
- [witnessCommit](/classes/bitcoin.block.md#witnesscommit)

### Methods

- [byteLength](/classes/bitcoin.block.md#bytelength)
- [checkProofOfWork](/classes/bitcoin.block.md#checkproofofwork)
- [checkTxRoots](/classes/bitcoin.block.md#checktxroots)
- [getHash](/classes/bitcoin.block.md#gethash)
- [getId](/classes/bitcoin.block.md#getid)
- [getUTCDate](/classes/bitcoin.block.md#getutcdate)
- [getWitnessCommit](/classes/bitcoin.block.md#getwitnesscommit)
- [hasWitness](/classes/bitcoin.block.md#haswitness)
- [hasWitnessCommit](/classes/bitcoin.block.md#haswitnesscommit)
- [toBuffer](/classes/bitcoin.block.md#tobuffer)
- [toHex](/classes/bitcoin.block.md#tohex)
- [weight](/classes/bitcoin.block.md#weight)
- [calculateMerkleRoot](/classes/bitcoin.block.md#calculatemerkleroot)
- [calculateTarget](/classes/bitcoin.block.md#calculatetarget)
- [fromBuffer](/classes/bitcoin.block.md#frombuffer)
- [fromHex](/classes/bitcoin.block.md#fromhex)

## Constructors

### constructor

\+ **new Block**(): [*Block*](/classes/bitcoin.block.md)

**Returns:** [*Block*](/classes/bitcoin.block.md)

## Properties

### \_\_checkMerkleRoot

• `Private` **\_\_checkMerkleRoot**: *any*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:27

___

### \_\_checkWitnessCommit

• `Private` **\_\_checkWitnessCommit**: *any*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:28

___

### bits

• **bits**: *number*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:12

___

### merkleRoot

• `Optional` **merkleRoot**: *undefined* \| *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:9

___

### nonce

• **nonce**: *number*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:13

___

### prevHash

• `Optional` **prevHash**: *undefined* \| *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:8

___

### timestamp

• **timestamp**: *number*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:10

___

### transactions

• `Optional` **transactions**: *undefined* \| [*Transaction*](/classes/bitcoin.transaction.md)[]

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:14

___

### version

• **version**: *number*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:7

___

### witnessCommit

• `Optional` **witnessCommit**: *undefined* \| *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:11

## Methods

### byteLength

▸ **byteLength**(`headersOnly?`: *boolean*, `allowWitness?`: *boolean*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`headersOnly?` | *boolean* |
`allowWitness?` | *boolean* |

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:19

___

### checkProofOfWork

▸ **checkProofOfWork**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:26

___

### checkTxRoots

▸ **checkTxRoots**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:25

___

### getHash

▸ **getHash**(): *Buffer*

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:20

___

### getId

▸ **getId**(): *string*

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:21

___

### getUTCDate

▸ **getUTCDate**(): Date

**Returns:** Date

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:22

___

### getWitnessCommit

▸ **getWitnessCommit**(): *null* \| *Buffer*

**Returns:** *null* \| *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:15

___

### hasWitness

▸ **hasWitness**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:17

___

### hasWitnessCommit

▸ **hasWitnessCommit**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:16

___

### toBuffer

▸ **toBuffer**(`headersOnly?`: *boolean*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`headersOnly?` | *boolean* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:23

___

### toHex

▸ **toHex**(`headersOnly?`: *boolean*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`headersOnly?` | *boolean* |

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:24

___

### weight

▸ **weight**(): *number*

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:18

___

### calculateMerkleRoot

▸ `Static`**calculateMerkleRoot**(`transactions`: [*Transaction*](/classes/bitcoin.transaction.md)[], `forWitness?`: *boolean*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`transactions` | [*Transaction*](/classes/bitcoin.transaction.md)[] |
`forWitness?` | *boolean* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:6

___

### calculateTarget

▸ `Static`**calculateTarget**(`bits`: *number*): *Buffer*

#### Parameters:

Name | Type |
:------ | :------ |
`bits` | *number* |

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:5

___

### fromBuffer

▸ `Static`**fromBuffer**(`buffer`: *Buffer*): [*Block*](/classes/bitcoin.block.md)

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | *Buffer* |

**Returns:** [*Block*](/classes/bitcoin.block.md)

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:3

___

### fromHex

▸ `Static`**fromHex**(`hex`: *string*): [*Block*](/classes/bitcoin.block.md)

#### Parameters:

Name | Type |
:------ | :------ |
`hex` | *string* |

**Returns:** [*Block*](/classes/bitcoin.block.md)

Defined in: node_modules/bitcoinjs-lib/types/block.d.ts:4
