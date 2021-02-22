[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / BTCCoreAPI

# Interface: BTCCoreAPI

Bitcoin Core API

## Table of contents

### Methods

- [getLatestBlock](/interfaces/btccoreapi.md#getlatestblock)
- [getLatestBlockHeight](/interfaces/btccoreapi.md#getlatestblockheight)
- [getMerkleProof](/interfaces/btccoreapi.md#getmerkleproof)
- [getRawTransaction](/interfaces/btccoreapi.md#getrawtransaction)
- [getTransactionBlockHeight](/interfaces/btccoreapi.md#gettransactionblockheight)
- [getTransactionStatus](/interfaces/btccoreapi.md#gettransactionstatus)
- [getTxIdByOpReturn](/interfaces/btccoreapi.md#gettxidbyopreturn)
- [getTxIdByRecipientAddress](/interfaces/btccoreapi.md#gettxidbyrecipientaddress)

## Methods

### getLatestBlock

▸ **getLatestBlock**(): *Promise*<string\>

**Returns:** *Promise*<string\>

The block hash of the latest Bitcoin block

Defined in: [src/apis/btc-core.ts:53](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L53)

___

### getLatestBlockHeight

▸ **getLatestBlockHeight**(): *Promise*<number\>

**Returns:** *Promise*<number\>

The height of the latest Bitcoin block

Defined in: [src/apis/btc-core.ts:57](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L57)

___

### getMerkleProof

▸ **getMerkleProof**(`txid`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`txid` | *string* | The ID of a Bitcoin transaction   |

**Returns:** *Promise*<string\>

The merkle inclusion proof for the transaction using bitcoind's merkleblock format.

Defined in: [src/apis/btc-core.ts:62](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L62)

___

### getRawTransaction

▸ **getRawTransaction**(`txid`: *string*): *Promise*<Buffer\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`txid` | *string* | The ID of a Bitcoin transaction   |

**Returns:** *Promise*<Buffer\>

The raw transaction data, represented as a Buffer object

Defined in: [src/apis/btc-core.ts:77](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L77)

___

### getTransactionBlockHeight

▸ **getTransactionBlockHeight**(`txid`: *string*): *Promise*<undefined \| number\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`txid` | *string* | The ID of a Bitcoin transaction   |

**Returns:** *Promise*<undefined \| number\>

The height of the block the transaction was included in. If the block has not been confirmed, returns undefined.

Defined in: [src/apis/btc-core.ts:72](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L72)

___

### getTransactionStatus

▸ **getTransactionStatus**(`txid`: *string*): *Promise*<TxStatus\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`txid` | *string* | The ID of a Bitcoin transaction   |

**Returns:** *Promise*<TxStatus\>

A TxStatus object, containing the confirmation status and number of confirmations

Defined in: [src/apis/btc-core.ts:67](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L67)

___

### getTxIdByOpReturn

▸ **getTxIdByOpReturn**(`opReturn`: *string*, `recipientAddress?`: *string*, `amountAsBTC?`: *string*): *Promise*<string\>

Fetch the first bitcoin transaction ID based on the OP_RETURN field, recipient and amount.
Throw an error unless there is exactly one transaction with the given opcode.

**`remarks`** 
Performs the lookup using an external service, Esplora. Requires the input string to be a hex

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`opReturn` | *string* | Data string used for matching the OP_CODE of Bitcoin transactions   |
`recipientAddress?` | *string* | Match the receiving address of a transaction that contains said op_return   |
`amountAsBTC?` | *string* | Match the amount (in BTC) of a transaction that contains said op_return and recipientAddress. This parameter is only considered if `recipientAddress` is defined.    |

**Returns:** *Promise*<string\>

A Bitcoin transaction ID

Defined in: [src/apis/btc-core.ts:92](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L92)

___

### getTxIdByRecipientAddress

▸ **getTxIdByRecipientAddress**(`recipientAddress`: *string*, `amountAsBTC?`: *string*): *Promise*<string\>

Fetch the last bitcoin transaction ID based on the recipient address and amount.
Throw an error if no such transaction is found.

**`remarks`** 
Performs the lookup using an external service, Esplora

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`recipientAddress` | *string* | Match the receiving address of a UTXO   |
`amountAsBTC?` | *string* | Match the amount (in BTC) of a UTXO that contains said recipientAddress.    |

**Returns:** *Promise*<string\>

A Bitcoin transaction ID

Defined in: [src/apis/btc-core.ts:105](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/btc-core.ts#L105)
