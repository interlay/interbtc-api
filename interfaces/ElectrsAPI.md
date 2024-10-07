[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / ElectrsAPI

# Interface: ElectrsAPI

Bitcoin Core API

## Implemented by

- [`DefaultElectrsAPI`](../classes/DefaultElectrsAPI.md)

## Table of contents

### Methods

- [getCoinbaseTxId](ElectrsAPI.md#getcoinbasetxid)
- [getEarliestPaymentToRecipientAddressTxId](ElectrsAPI.md#getearliestpaymenttorecipientaddresstxid)
- [getLargestPaymentToRecipientAddressTxId](ElectrsAPI.md#getlargestpaymenttorecipientaddresstxid)
- [getLatestBlock](ElectrsAPI.md#getlatestblock)
- [getLatestBlockHeight](ElectrsAPI.md#getlatestblockheight)
- [getMerkleProof](ElectrsAPI.md#getmerkleproof)
- [getParsedExecutionParameters](ElectrsAPI.md#getparsedexecutionparameters)
- [getRawTransaction](ElectrsAPI.md#getrawtransaction)
- [getTransactionBlockHeight](ElectrsAPI.md#gettransactionblockheight)
- [getTransactionStatus](ElectrsAPI.md#gettransactionstatus)
- [getTx](ElectrsAPI.md#gettx)
- [getTxIdByOpReturn](ElectrsAPI.md#gettxidbyopreturn)
- [getUtxoAmount](ElectrsAPI.md#getutxoamount)
- [waitForOpreturn](ElectrsAPI.md#waitforopreturn)
- [waitForTxInclusion](ElectrsAPI.md#waitfortxinclusion)

## Methods

### <a id="getcoinbasetxid" name="getcoinbasetxid"></a> getCoinbaseTxId

▸ **getCoinbaseTxId**(`userTxId`): `Promise`\<`undefined` \| `string`\>

Returns tx id of the coinbase tx of block in which `userTxId` was included.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userTxId` | `string` | User tx ID which block's txId will be returned. |

#### Returns

`Promise`\<`undefined` \| `string`\>

Tx ID of coinbase transaction or undefined if block was not found.

#### Defined in

[src/external/electrs.ts:138](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L138)

___

### <a id="getearliestpaymenttorecipientaddresstxid" name="getearliestpaymenttorecipientaddresstxid"></a> getEarliestPaymentToRecipientAddressTxId

▸ **getEarliestPaymentToRecipientAddressTxId**(`recipientAddress`, `amount?`): `Promise`\<`string`\>

Fetch the earliest/oldest bitcoin transaction ID based on the recipient address and amount.
Throw an error if no such transaction is found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `recipientAddress` | `string` | Match the receiving address of a transaction output |
| `amount?` | `BitcoinAmount` | Match the amount (in BTC) of a transaction output that contains said recipientAddress. |

#### Returns

`Promise`\<`string`\>

A Bitcoin transaction ID

**`Remarks`**

Performs the lookup using an external service, Esplora

**`Deprecated`**

For most cases where this is used today, [getLargestPaymentToRecipientAddressTxId](ElectrsAPI.md#getlargestpaymenttorecipientaddresstxid) is better suited.

#### Defined in

[src/external/electrs.ts:97](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L97)

___

### <a id="getlargestpaymenttorecipientaddresstxid" name="getlargestpaymenttorecipientaddresstxid"></a> getLargestPaymentToRecipientAddressTxId

▸ **getLargestPaymentToRecipientAddressTxId**(`recipientAddress`): `Promise`\<`string`\>

Fetch the bitcoin transaction ID with the largest payment based on the recipient address.
Throw an error if no transactions are found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `recipientAddress` | `string` | Match the receiving address of a transaction output |

#### Returns

`Promise`\<`string`\>

A Bitcoin transaction ID

**`Remarks`**

Performs the lookup using an external service, Esplora

#### Defined in

[src/external/electrs.ts:83](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L83)

___

### <a id="getlatestblock" name="getlatestblock"></a> getLatestBlock

▸ **getLatestBlock**(): `Promise`\<`string`\>

#### Returns

`Promise`\<`string`\>

The block hash of the latest Bitcoin block

#### Defined in

[src/external/electrs.ts:31](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L31)

___

### <a id="getlatestblockheight" name="getlatestblockheight"></a> getLatestBlockHeight

▸ **getLatestBlockHeight**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The height of the latest Bitcoin block

#### Defined in

[src/external/electrs.ts:35](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L35)

___

### <a id="getmerkleproof" name="getmerkleproof"></a> getMerkleProof

▸ **getMerkleProof**(`txid`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | The ID of a Bitcoin transaction |

#### Returns

`Promise`\<`string`\>

The merkle inclusion proof for the transaction using bitcoind's merkleblock format.

#### Defined in

[src/external/electrs.ts:40](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L40)

___

### <a id="getparsedexecutionparameters" name="getparsedexecutionparameters"></a> getParsedExecutionParameters

▸ **getParsedExecutionParameters**(`txid`): `Promise`\<[[`BitcoinMerkleProof`](../classes/BitcoinMerkleProof.md), `Transaction`]\>

Get the parsed (as Bytes) merkle proof and raw transaction

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | A Bitcoin transaction ID |

#### Returns

`Promise`\<[[`BitcoinMerkleProof`](../classes/BitcoinMerkleProof.md), `Transaction`]\>

A tuple representing [merkleProof, transaction]

**`Remarks`**

Performs the lookup using an external service, Esplora

#### Defined in

[src/external/electrs.ts:131](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L131)

___

### <a id="getrawtransaction" name="getrawtransaction"></a> getRawTransaction

▸ **getRawTransaction**(`txid`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | The ID of a Bitcoin transaction |

#### Returns

`Promise`\<`string`\>

The raw transaction data, represented as a hex string

#### Defined in

[src/external/electrs.ts:56](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L56)

___

### <a id="gettransactionblockheight" name="gettransactionblockheight"></a> getTransactionBlockHeight

▸ **getTransactionBlockHeight**(`txid`): `Promise`\<`undefined` \| `number`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | The ID of a Bitcoin transaction |

#### Returns

`Promise`\<`undefined` \| `number`\>

The height of the block the transaction was included in. If the block has not been confirmed, returns undefined.

#### Defined in

[src/external/electrs.ts:51](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L51)

___

### <a id="gettransactionstatus" name="gettransactionstatus"></a> getTransactionStatus

▸ **getTransactionStatus**(`txid`): `Promise`\<[`TxStatus`](../modules.md#txstatus)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | The ID of a Bitcoin transaction |

#### Returns

`Promise`\<[`TxStatus`](../modules.md#txstatus)\>

A TxStatus object, containing the confirmation status and number of confirmations, plus block height if
the tx is included in the blockchain

#### Defined in

[src/external/electrs.ts:46](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L46)

___

### <a id="gettx" name="gettx"></a> getTx

▸ **getTx**(`txid`): `Promise`\<`Transaction`\>

Fetch the Bitcoin transaction that matches the given TxId

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | A Bitcoin transaction ID |

#### Returns

`Promise`\<`Transaction`\>

A Bitcoin Transaction object

**`Remarks`**

Performs the lookup using an external service, Esplora

#### Defined in

[src/external/electrs.ts:108](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L108)

___

### <a id="gettxidbyopreturn" name="gettxidbyopreturn"></a> getTxIdByOpReturn

▸ **getTxIdByOpReturn**(`opReturn`, `recipientAddress?`, `amount?`): `Promise`\<`string`\>

Fetch the first bitcoin transaction ID based on the OP_RETURN field, recipient and amount.
Throw an error unless there is exactly one transaction with the given opcode.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `opReturn` | `string` | Data string used for matching the OP_CODE of Bitcoin transactions |
| `recipientAddress?` | `string` | Match the receiving address of a transaction that contains said op_return |
| `amount?` | `BitcoinAmount` | Match the amount (in BTC) of a transaction that contains said op_return and recipientAddress. This parameter is only considered if `recipientAddress` is defined. |

#### Returns

`Promise`\<`string`\>

A Bitcoin transaction ID

**`Remarks`**

Performs the lookup using an external service, Esplora. Requires the input string to be a hex

#### Defined in

[src/external/electrs.ts:71](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L71)

___

### <a id="getutxoamount" name="getutxoamount"></a> getUtxoAmount

▸ **getUtxoAmount**(`txid`, `recipient`): `Promise`\<`number`\>

Fetch the Bitcoin UTXO amount that matches the given TxId and recipient

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | A Bitcoin transaction ID |
| `recipient` | `string` | A Bitcoin scriptpubkey address |

#### Returns

`Promise`\<`number`\>

A UTXO amount if found, 0 otherwise

**`Remarks`**

Performs the lookup using an external service, Esplora

#### Defined in

[src/external/electrs.ts:120](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L120)

___

### <a id="waitforopreturn" name="waitforopreturn"></a> waitForOpreturn

▸ **waitForOpreturn**(`data`, `timeoutMs`, `retryIntervalMs`): `Promise`\<`string`\>

Return a promise that either resolves to the first txid with the given opreturn `data`,
or rejects if the `timeout` has elapsed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `string` | The opReturn of the bitcoin transaction |
| `timeoutMs` | `number` | The duration until the Promise times out (in milliseconds) |
| `retryIntervalMs` | `number` | The time to wait (in milliseconds) between retries |

#### Returns

`Promise`\<`string`\>

The Bitcoin txid

**`Remarks`**

Every 5 seconds, performs the lookup using an external service, Esplora

#### Defined in

[src/external/electrs.ts:152](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L152)

___

### <a id="waitfortxinclusion" name="waitfortxinclusion"></a> waitForTxInclusion

▸ **waitForTxInclusion**(`txid`, `timeoutMs`, `retryIntervalMs`): `Promise`\<[`TxStatus`](../modules.md#txstatus)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | The ID of a Bitcoin transaction |
| `timeoutMs` | `number` | - |
| `retryIntervalMs` | `number` | - |

#### Returns

`Promise`\<[`TxStatus`](../modules.md#txstatus)\>

A TxStatus object, containing the confirmation status and number of confirmations, plus block height if
the tx is included in the blockchain

#### Defined in

[src/external/electrs.ts:158](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L158)
