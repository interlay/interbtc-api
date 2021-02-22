[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / Psbt

# Class: Psbt

[bitcoin](/modules/bitcoin.md).Psbt

Psbt class can parse and generate a PSBT binary based off of the BIP174.
There are 6 roles that this class fulfills. (Explained in BIP174)

Creator: This can be done with `new Psbt()`
Updater: This can be done with `psbt.addInput(input)`, `psbt.addInputs(inputs)`,
  `psbt.addOutput(output)`, `psbt.addOutputs(outputs)` when you are looking to
  add new inputs and outputs to the PSBT, and `psbt.updateGlobal(itemObject)`,
  `psbt.updateInput(itemObject)`, `psbt.updateOutput(itemObject)`
  addInput requires hash: Buffer | string; and index: number; as attributes
  and can also include any attributes that are used in updateInput method.
  addOutput requires script: Buffer; and value: number; and likewise can include
  data for updateOutput.
  For a list of what attributes should be what types. Check the bip174 library.
  Also, check the integration tests for some examples of usage.
Signer: There are a few methods. signAllInputs and signAllInputsAsync, which will search all input
  information for your pubkey or pubkeyhash, and only sign inputs where it finds
  your info. Or you can explicitly sign a specific input with signInput and
  signInputAsync. For the async methods you can create a SignerAsync object
  and use something like a hardware wallet to sign with. (You must implement this)
Combiner: psbts can be combined easily with `psbt.combine(psbt2, psbt3, psbt4 ...)`
  the psbt calling combine will always have precedence when a conflict occurs.
  Combine checks if the internal bitcoin transaction is the same, so be sure that
  all sequences, version, locktime, etc. are the same before combining.
Input Finalizer: This role is fairly important. Not only does it need to construct
  the input scriptSigs and witnesses, but it SHOULD verify the signatures etc.
  Before running `psbt.finalizeAllInputs()` please run `psbt.validateSignaturesOfAllInputs()`
  Running any finalize method will delete any data in the input(s) that are no longer
  needed due to the finalized scripts containing the information.
Transaction Extractor: This role will perform some checks before returning a
  Transaction object. Such as fee rate not being larger than maximumFeeRate etc.

## Table of contents

### Constructors

- [constructor](/classes/bitcoin.psbt.md#constructor)

### Properties

- [\_\_CACHE](/classes/bitcoin.psbt.md#__cache)
- [data](/classes/bitcoin.psbt.md#data)
- [inputCount](/classes/bitcoin.psbt.md#inputcount)
- [locktime](/classes/bitcoin.psbt.md#locktime)
- [opts](/classes/bitcoin.psbt.md#opts)
- [txInputs](/classes/bitcoin.psbt.md#txinputs)
- [txOutputs](/classes/bitcoin.psbt.md#txoutputs)
- [version](/classes/bitcoin.psbt.md#version)

### Methods

- [addInput](/classes/bitcoin.psbt.md#addinput)
- [addInputs](/classes/bitcoin.psbt.md#addinputs)
- [addOutput](/classes/bitcoin.psbt.md#addoutput)
- [addOutputs](/classes/bitcoin.psbt.md#addoutputs)
- [addUnknownKeyValToGlobal](/classes/bitcoin.psbt.md#addunknownkeyvaltoglobal)
- [addUnknownKeyValToInput](/classes/bitcoin.psbt.md#addunknownkeyvaltoinput)
- [addUnknownKeyValToOutput](/classes/bitcoin.psbt.md#addunknownkeyvaltooutput)
- [clearFinalizedInput](/classes/bitcoin.psbt.md#clearfinalizedinput)
- [clone](/classes/bitcoin.psbt.md#clone)
- [combine](/classes/bitcoin.psbt.md#combine)
- [extractTransaction](/classes/bitcoin.psbt.md#extracttransaction)
- [finalizeAllInputs](/classes/bitcoin.psbt.md#finalizeallinputs)
- [finalizeInput](/classes/bitcoin.psbt.md#finalizeinput)
- [getFee](/classes/bitcoin.psbt.md#getfee)
- [getFeeRate](/classes/bitcoin.psbt.md#getfeerate)
- [getInputType](/classes/bitcoin.psbt.md#getinputtype)
- [inputHasHDKey](/classes/bitcoin.psbt.md#inputhashdkey)
- [inputHasPubkey](/classes/bitcoin.psbt.md#inputhaspubkey)
- [outputHasHDKey](/classes/bitcoin.psbt.md#outputhashdkey)
- [outputHasPubkey](/classes/bitcoin.psbt.md#outputhaspubkey)
- [setInputSequence](/classes/bitcoin.psbt.md#setinputsequence)
- [setLocktime](/classes/bitcoin.psbt.md#setlocktime)
- [setMaximumFeeRate](/classes/bitcoin.psbt.md#setmaximumfeerate)
- [setVersion](/classes/bitcoin.psbt.md#setversion)
- [signAllInputs](/classes/bitcoin.psbt.md#signallinputs)
- [signAllInputsAsync](/classes/bitcoin.psbt.md#signallinputsasync)
- [signAllInputsHD](/classes/bitcoin.psbt.md#signallinputshd)
- [signAllInputsHDAsync](/classes/bitcoin.psbt.md#signallinputshdasync)
- [signInput](/classes/bitcoin.psbt.md#signinput)
- [signInputAsync](/classes/bitcoin.psbt.md#signinputasync)
- [signInputHD](/classes/bitcoin.psbt.md#signinputhd)
- [signInputHDAsync](/classes/bitcoin.psbt.md#signinputhdasync)
- [toBase64](/classes/bitcoin.psbt.md#tobase64)
- [toBuffer](/classes/bitcoin.psbt.md#tobuffer)
- [toHex](/classes/bitcoin.psbt.md#tohex)
- [updateGlobal](/classes/bitcoin.psbt.md#updateglobal)
- [updateInput](/classes/bitcoin.psbt.md#updateinput)
- [updateOutput](/classes/bitcoin.psbt.md#updateoutput)
- [validateSignaturesOfAllInputs](/classes/bitcoin.psbt.md#validatesignaturesofallinputs)
- [validateSignaturesOfInput](/classes/bitcoin.psbt.md#validatesignaturesofinput)
- [fromBase64](/classes/bitcoin.psbt.md#frombase64)
- [fromBuffer](/classes/bitcoin.psbt.md#frombuffer)
- [fromHex](/classes/bitcoin.psbt.md#fromhex)

## Constructors

### constructor

\+ **new Psbt**(`opts?`: PsbtOptsOptional, `data?`: *Psbt*): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`opts?` | PsbtOptsOptional |
`data?` | *Psbt* |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:50

## Properties

### \_\_CACHE

• `Private` **\_\_CACHE**: *any*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:49

___

### data

• `Readonly` **data**: *Psbt*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:45

___

### inputCount

• `Readonly` **inputCount**: *number*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:52

___

### locktime

• **locktime**: *number*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:54

___

### opts

• `Private` **opts**: *any*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:50

___

### txInputs

• `Readonly` **txInputs**: [*PsbtTxInput*](/interfaces/bitcoin.psbttxinput.md)[]

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:55

___

### txOutputs

• `Readonly` **txOutputs**: [*PsbtTxOutput*](/interfaces/bitcoin.psbttxoutput.md)[]

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:56

___

### version

• **version**: *number*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:53

## Methods

### addInput

▸ **addInput**(`inputData`: PsbtInputExtended): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputData` | PsbtInputExtended |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:64

___

### addInputs

▸ **addInputs**(`inputDatas`: PsbtInputExtended[]): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputDatas` | PsbtInputExtended[] |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:63

___

### addOutput

▸ **addOutput**(`outputData`: PsbtOutputExtended): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`outputData` | PsbtOutputExtended |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:66

___

### addOutputs

▸ **addOutputs**(`outputDatas`: PsbtOutputExtended[]): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`outputDatas` | PsbtOutputExtended[] |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:65

___

### addUnknownKeyValToGlobal

▸ **addUnknownKeyValToGlobal**(`keyVal`: KeyValue): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`keyVal` | KeyValue |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:93

___

### addUnknownKeyValToInput

▸ **addUnknownKeyValToInput**(`inputIndex`: *number*, `keyVal`: KeyValue): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`keyVal` | KeyValue |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:94

___

### addUnknownKeyValToOutput

▸ **addUnknownKeyValToOutput**(`outputIndex`: *number*, `keyVal`: KeyValue): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`outputIndex` | *number* |
`keyVal` | KeyValue |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:95

___

### clearFinalizedInput

▸ **clearFinalizedInput**(`inputIndex`: *number*): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:96

___

### clone

▸ **clone**(): [*Psbt*](/classes/bitcoin.psbt.md)

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:58

___

### combine

▸ **combine**(...`those`: [*Psbt*](/classes/bitcoin.psbt.md)[]): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`...those` | [*Psbt*](/classes/bitcoin.psbt.md)[] |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:57

___

### extractTransaction

▸ **extractTransaction**(`disableFeeCheck?`: *boolean*): [*Transaction*](/classes/bitcoin.transaction.md)

#### Parameters:

Name | Type |
:------ | :------ |
`disableFeeCheck?` | *boolean* |

**Returns:** [*Transaction*](/classes/bitcoin.transaction.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:67

___

### finalizeAllInputs

▸ **finalizeAllInputs**(): [*Psbt*](/classes/bitcoin.psbt.md)

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:70

___

### finalizeInput

▸ **finalizeInput**(`inputIndex`: *number*, `finalScriptsFunc?`: FinalScriptsFunc): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`finalScriptsFunc?` | FinalScriptsFunc |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:71

___

### getFee

▸ **getFee**(): *number*

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:69

___

### getFeeRate

▸ **getFeeRate**(): *number*

**Returns:** *number*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:68

___

### getInputType

▸ **getInputType**(`inputIndex`: *number*): AllScriptType

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |

**Returns:** AllScriptType

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:72

___

### inputHasHDKey

▸ **inputHasHDKey**(`inputIndex`: *number*, `root`: HDSigner): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`root` | HDSigner |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:74

___

### inputHasPubkey

▸ **inputHasPubkey**(`inputIndex`: *number*, `pubkey`: *Buffer*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`pubkey` | *Buffer* |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:73

___

### outputHasHDKey

▸ **outputHasHDKey**(`outputIndex`: *number*, `root`: HDSigner): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`outputIndex` | *number* |
`root` | HDSigner |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:76

___

### outputHasPubkey

▸ **outputHasPubkey**(`outputIndex`: *number*, `pubkey`: *Buffer*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`outputIndex` | *number* |
`pubkey` | *Buffer* |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:75

___

### setInputSequence

▸ **setInputSequence**(`inputIndex`: *number*, `sequence`: *number*): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`sequence` | *number* |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:62

___

### setLocktime

▸ **setLocktime**(`locktime`: *number*): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`locktime` | *number* |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:61

___

### setMaximumFeeRate

▸ **setMaximumFeeRate**(`satoshiPerByte`: *number*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`satoshiPerByte` | *number* |

**Returns:** *void*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:59

___

### setVersion

▸ **setVersion**(`version`: *number*): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`version` | *number* |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:60

___

### signAllInputs

▸ **signAllInputs**(`keyPair`: [*Signer*](/interfaces/bitcoin.ecpair.signer.md), `sighashTypes?`: *number*[]): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`keyPair` | [*Signer*](/interfaces/bitcoin.ecpair.signer.md) |
`sighashTypes?` | *number*[] |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:83

___

### signAllInputsAsync

▸ **signAllInputsAsync**(`keyPair`: [*Signer*](/interfaces/bitcoin.ecpair.signer.md) \| [*SignerAsync*](/interfaces/bitcoin.ecpair.signerasync.md), `sighashTypes?`: *number*[]): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`keyPair` | [*Signer*](/interfaces/bitcoin.ecpair.signer.md) \| [*SignerAsync*](/interfaces/bitcoin.ecpair.signerasync.md) |
`sighashTypes?` | *number*[] |

**Returns:** *Promise*<void\>

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:84

___

### signAllInputsHD

▸ **signAllInputsHD**(`hdKeyPair`: HDSigner, `sighashTypes?`: *number*[]): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`hdKeyPair` | HDSigner |
`sighashTypes?` | *number*[] |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:79

___

### signAllInputsHDAsync

▸ **signAllInputsHDAsync**(`hdKeyPair`: HDSigner \| HDSignerAsync, `sighashTypes?`: *number*[]): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`hdKeyPair` | HDSigner \| HDSignerAsync |
`sighashTypes?` | *number*[] |

**Returns:** *Promise*<void\>

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:80

___

### signInput

▸ **signInput**(`inputIndex`: *number*, `keyPair`: [*Signer*](/interfaces/bitcoin.ecpair.signer.md), `sighashTypes?`: *number*[]): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`keyPair` | [*Signer*](/interfaces/bitcoin.ecpair.signer.md) |
`sighashTypes?` | *number*[] |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:85

___

### signInputAsync

▸ **signInputAsync**(`inputIndex`: *number*, `keyPair`: [*Signer*](/interfaces/bitcoin.ecpair.signer.md) \| [*SignerAsync*](/interfaces/bitcoin.ecpair.signerasync.md), `sighashTypes?`: *number*[]): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`keyPair` | [*Signer*](/interfaces/bitcoin.ecpair.signer.md) \| [*SignerAsync*](/interfaces/bitcoin.ecpair.signerasync.md) |
`sighashTypes?` | *number*[] |

**Returns:** *Promise*<void\>

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:86

___

### signInputHD

▸ **signInputHD**(`inputIndex`: *number*, `hdKeyPair`: HDSigner, `sighashTypes?`: *number*[]): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`hdKeyPair` | HDSigner |
`sighashTypes?` | *number*[] |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:81

___

### signInputHDAsync

▸ **signInputHDAsync**(`inputIndex`: *number*, `hdKeyPair`: HDSigner \| HDSignerAsync, `sighashTypes?`: *number*[]): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`hdKeyPair` | HDSigner \| HDSignerAsync |
`sighashTypes?` | *number*[] |

**Returns:** *Promise*<void\>

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:82

___

### toBase64

▸ **toBase64**(): *string*

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:89

___

### toBuffer

▸ **toBuffer**(): *Buffer*

**Returns:** *Buffer*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:87

___

### toHex

▸ **toHex**(): *string*

**Returns:** *string*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:88

___

### updateGlobal

▸ **updateGlobal**(`updateData`: PsbtGlobalUpdate): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`updateData` | PsbtGlobalUpdate |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:90

___

### updateInput

▸ **updateInput**(`inputIndex`: *number*, `updateData`: PsbtInputUpdate): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`updateData` | PsbtInputUpdate |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:91

___

### updateOutput

▸ **updateOutput**(`outputIndex`: *number*, `updateData`: PsbtOutputUpdate): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`outputIndex` | *number* |
`updateData` | PsbtOutputUpdate |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:92

___

### validateSignaturesOfAllInputs

▸ **validateSignaturesOfAllInputs**(): *boolean*

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:77

___

### validateSignaturesOfInput

▸ **validateSignaturesOfInput**(`inputIndex`: *number*, `pubkey?`: *Buffer*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`inputIndex` | *number* |
`pubkey?` | *Buffer* |

**Returns:** *boolean*

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:78

___

### fromBase64

▸ `Static`**fromBase64**(`data`: *string*, `opts?`: PsbtOptsOptional): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`data` | *string* |
`opts?` | PsbtOptsOptional |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:46

___

### fromBuffer

▸ `Static`**fromBuffer**(`buffer`: *Buffer*, `opts?`: PsbtOptsOptional): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`buffer` | *Buffer* |
`opts?` | PsbtOptsOptional |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:48

___

### fromHex

▸ `Static`**fromHex**(`data`: *string*, `opts?`: PsbtOptsOptional): [*Psbt*](/classes/bitcoin.psbt.md)

#### Parameters:

Name | Type |
:------ | :------ |
`data` | *string* |
`opts?` | PsbtOptsOptional |

**Returns:** [*Psbt*](/classes/bitcoin.psbt.md)

Defined in: node_modules/bitcoinjs-lib/types/psbt.d.ts:47
