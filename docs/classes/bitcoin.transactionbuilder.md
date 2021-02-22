[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / TransactionBuilder

# Class: TransactionBuilder

[bitcoin](/modules/bitcoin.md).TransactionBuilder

## Table of contents

### Constructors

- [constructor](/classes/bitcoin.transactionbuilder.md#constructor)

### Properties

- [\_\_INPUTS](/classes/bitcoin.transactionbuilder.md#__inputs)
- [\_\_PREV\_TX\_SET](/classes/bitcoin.transactionbuilder.md#__prev_tx_set)
- [\_\_TX](/classes/bitcoin.transactionbuilder.md#__tx)
- [\_\_USE\_LOW\_R](/classes/bitcoin.transactionbuilder.md#__use_low_r)
- [\_\_addInputUnsafe](/classes/bitcoin.transactionbuilder.md#__addinputunsafe)
- [\_\_build](/classes/bitcoin.transactionbuilder.md#__build)
- [\_\_canModifyInputs](/classes/bitcoin.transactionbuilder.md#__canmodifyinputs)
- [\_\_canModifyOutputs](/classes/bitcoin.transactionbuilder.md#__canmodifyoutputs)
- [\_\_needsOutputs](/classes/bitcoin.transactionbuilder.md#__needsoutputs)
- [\_\_overMaximumFees](/classes/bitcoin.transactionbuilder.md#__overmaximumfees)
- [maximumFeeRate](/classes/bitcoin.transactionbuilder.md#maximumfeerate)
- [network](/classes/bitcoin.transactionbuilder.md#network)

### Methods

- [addInput](/classes/bitcoin.transactionbuilder.md#addinput)
- [addOutput](/classes/bitcoin.transactionbuilder.md#addoutput)
- [build](/classes/bitcoin.transactionbuilder.md#build)
- [buildIncomplete](/classes/bitcoin.transactionbuilder.md#buildincomplete)
- [setLockTime](/classes/bitcoin.transactionbuilder.md#setlocktime)
- [setLowR](/classes/bitcoin.transactionbuilder.md#setlowr)
- [setVersion](/classes/bitcoin.transactionbuilder.md#setversion)
- [sign](/classes/bitcoin.transactionbuilder.md#sign)
- [fromTransaction](/classes/bitcoin.transactionbuilder.md#fromtransaction)

## Constructors

### constructor

\+ **new TransactionBuilder**(`network?`: [*Network*](/interfaces/bitcoin.networks.network.md), `maximumFeeRate?`: *number*): [*TransactionBuilder*](/classes/bitcoin.transactionbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`network?` | [*Network*](/interfaces/bitcoin.networks.network.md) |
`maximumFeeRate?` | *number* |

**Returns:** [*TransactionBuilder*](/classes/bitcoin.transactionbuilder.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:20

## Properties

### \_\_INPUTS

• `Private` **\_\_INPUTS**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:18

___

### \_\_PREV\_TX\_SET

• `Private` **\_\_PREV\_TX\_SET**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:17

___

### \_\_TX

• `Private` **\_\_TX**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:19

___

### \_\_USE\_LOW\_R

• `Private` **\_\_USE\_LOW\_R**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:20

___

### \_\_addInputUnsafe

• `Private` **\_\_addInputUnsafe**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:30

___

### \_\_build

• `Private` **\_\_build**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:31

___

### \_\_canModifyInputs

• `Private` **\_\_canModifyInputs**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:32

___

### \_\_canModifyOutputs

• `Private` **\_\_canModifyOutputs**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:34

___

### \_\_needsOutputs

• `Private` **\_\_needsOutputs**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:33

___

### \_\_overMaximumFees

• `Private` **\_\_overMaximumFees**: *any*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:35

___

### maximumFeeRate

• **maximumFeeRate**: *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:15

___

### network

• **network**: [*Network*](/interfaces/bitcoin.networks.network.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:14

## Methods

### addInput

▸ **addInput**(`txHash`: *string* \| *Buffer* \| [*Transaction*](/classes/bitcoin.transaction.md), `vout`: *number*, `sequence?`: *number*, `prevOutScript?`: *Buffer*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`txHash` | *string* \| *Buffer* \| [*Transaction*](/classes/bitcoin.transaction.md) |
`vout` | *number* |
`sequence?` | *number* |
`prevOutScript?` | *Buffer* |

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:25

___

### addOutput

▸ **addOutput**(`scriptPubKey`: *string* \| *Buffer*, `value`: *number*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`scriptPubKey` | *string* \| *Buffer* |
`value` | *number* |

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:26

___

### build

▸ **build**(): [*Transaction*](/classes/bitcoin.transaction.md)

**Returns:** [*Transaction*](/classes/bitcoin.transaction.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:27

___

### buildIncomplete

▸ **buildIncomplete**(): [*Transaction*](/classes/bitcoin.transaction.md)

**Returns:** [*Transaction*](/classes/bitcoin.transaction.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:28

___

### setLockTime

▸ **setLockTime**(`locktime`: *number*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`locktime` | *number* |

**Returns:** *void*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:23

___

### setLowR

▸ **setLowR**(`setting?`: *boolean*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`setting?` | *boolean* |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:22

___

### setVersion

▸ **setVersion**(`version`: *number*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`version` | *number* |

**Returns:** *void*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:24

___

### sign

▸ **sign**(`signParams`: *number* \| TxbSignArg, `keyPair?`: [*Signer*](/interfaces/bitcoin.ecpair.signer.md), `redeemScript?`: *Buffer*, `hashType?`: *number*, `witnessValue?`: *number*, `witnessScript?`: *Buffer*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`signParams` | *number* \| TxbSignArg |
`keyPair?` | [*Signer*](/interfaces/bitcoin.ecpair.signer.md) |
`redeemScript?` | *Buffer* |
`hashType?` | *number* |
`witnessValue?` | *number* |
`witnessScript?` | *Buffer* |

**Returns:** *void*

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:29

___

### fromTransaction

▸ `Static`**fromTransaction**(`transaction`: [*Transaction*](/classes/bitcoin.transaction.md), `network?`: [*Network*](/interfaces/bitcoin.networks.network.md)): [*TransactionBuilder*](/classes/bitcoin.transactionbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`transaction` | [*Transaction*](/classes/bitcoin.transaction.md) |
`network?` | [*Network*](/interfaces/bitcoin.networks.network.md) |

**Returns:** [*TransactionBuilder*](/classes/bitcoin.transactionbuilder.md)

Defined in: node_modules/bitcoinjs-lib/types/transaction_builder.d.ts:16
