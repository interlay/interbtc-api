[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultElectrsAPI

# Class: DefaultElectrsAPI

Bitcoin Core API

## Implements

- [`ElectrsAPI`](../interfaces/ElectrsAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultElectrsAPI.md#constructor)

### Properties

- [addressApi](DefaultElectrsAPI.md#addressapi)
- [blockApi](DefaultElectrsAPI.md#blockapi)
- [scripthashApi](DefaultElectrsAPI.md#scripthashapi)
- [txApi](DefaultElectrsAPI.md#txapi)

### Methods

- [broadcastRawTransaction](DefaultElectrsAPI.md#broadcastrawtransaction)
- [getCoinbaseTxId](DefaultElectrsAPI.md#getcoinbasetxid)
- [getData](DefaultElectrsAPI.md#getdata)
- [getEarliestPaymentToRecipientAddressTxId](DefaultElectrsAPI.md#getearliestpaymenttorecipientaddresstxid)
- [getLargestPaymentToRecipientAddressTxId](DefaultElectrsAPI.md#getlargestpaymenttorecipientaddresstxid)
- [getLatestBlock](DefaultElectrsAPI.md#getlatestblock)
- [getLatestBlockHeight](DefaultElectrsAPI.md#getlatestblockheight)
- [getMerkleProof](DefaultElectrsAPI.md#getmerkleproof)
- [getParsedExecutionParameters](DefaultElectrsAPI.md#getparsedexecutionparameters)
- [getRawTransaction](DefaultElectrsAPI.md#getrawtransaction)
- [getTransactionBlockHeight](DefaultElectrsAPI.md#gettransactionblockheight)
- [getTransactionStatus](DefaultElectrsAPI.md#gettransactionstatus)
- [getTx](DefaultElectrsAPI.md#gettx)
- [getTxIdByOpReturn](DefaultElectrsAPI.md#gettxidbyopreturn)
- [getTxStatus](DefaultElectrsAPI.md#gettxstatus)
- [getUtxoAmount](DefaultElectrsAPI.md#getutxoamount)
- [txOutputHasRecipientAndAmount](DefaultElectrsAPI.md#txoutputhasrecipientandamount)
- [txoHasAtLeastAmount](DefaultElectrsAPI.md#txohasatleastamount)
- [waitForOpreturn](DefaultElectrsAPI.md#waitforopreturn)
- [waitForTxInclusion](DefaultElectrsAPI.md#waitfortxinclusion)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultElectrsAPI**(`network?`): [`DefaultElectrsAPI`](DefaultElectrsAPI.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `network` | `string` | `"mainnet"` |

#### Returns

[`DefaultElectrsAPI`](DefaultElectrsAPI.md)

#### Defined in

[src/external/electrs.ts:167](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L167)

## Properties

### <a id="addressapi" name="addressapi"></a> addressApi

• `Private` **addressApi**: `AddressApi`

#### Defined in

[src/external/electrs.ts:165](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L165)

___

### <a id="blockapi" name="blockapi"></a> blockApi

• `Private` **blockApi**: `BlockApi`

#### Defined in

[src/external/electrs.ts:162](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L162)

___

### <a id="scripthashapi" name="scripthashapi"></a> scripthashApi

• `Private` **scripthashApi**: `ScripthashApi`

#### Defined in

[src/external/electrs.ts:164](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L164)

___

### <a id="txapi" name="txapi"></a> txApi

• `Private` **txApi**: `TxApi`

#### Defined in

[src/external/electrs.ts:163](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L163)

## Methods

### <a id="broadcastrawtransaction" name="broadcastrawtransaction"></a> broadcastRawTransaction

▸ **broadcastRawTransaction**(`hex`): `Promise`\<`AxiosResponse`\<`string`\>\>

Broadcasts a transaction to the Bitcoin network configured in the constructor

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `hex` | `string` | A hex-encoded raw transaction to be broadcast to the Bitcoin blockchain |

#### Returns

`Promise`\<`AxiosResponse`\<`string`\>\>

The txid of the transaction

#### Defined in

[src/external/electrs.ts:390](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L390)

___

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getCoinbaseTxId](../interfaces/ElectrsAPI.md#getcoinbasetxid)

#### Defined in

[src/external/electrs.ts:432](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L432)

___

### <a id="getdata" name="getdata"></a> getData

▸ **getData**\<`T`\>(`response`): `Promise`\<`T`\>

Parse an AxiosResponse Promise

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `response` | `Promise`\<`AxiosResponse`\<`T`\>\> | A generic AxiosResponse Promise |

#### Returns

`Promise`\<`T`\>

The data in the response

#### Defined in

[src/external/electrs.ts:456](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L456)

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

For most cases where this is used today, [getLargestPaymentToRecipientAddressTxId](../interfaces/ElectrsAPI.md#getlargestpaymenttorecipientaddresstxid) is better suited.

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getEarliestPaymentToRecipientAddressTxId](../interfaces/ElectrsAPI.md#getearliestpaymenttorecipientaddresstxid)

#### Defined in

[src/external/electrs.ts:252](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L252)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getLargestPaymentToRecipientAddressTxId](../interfaces/ElectrsAPI.md#getlargestpaymenttorecipientaddresstxid)

#### Defined in

[src/external/electrs.ts:222](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L222)

___

### <a id="getlatestblock" name="getlatestblock"></a> getLatestBlock

▸ **getLatestBlock**(): `Promise`\<`string`\>

#### Returns

`Promise`\<`string`\>

The block hash of the latest Bitcoin block

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getLatestBlock](../interfaces/ElectrsAPI.md#getlatestblock)

#### Defined in

[src/external/electrs.ts:189](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L189)

___

### <a id="getlatestblockheight" name="getlatestblockheight"></a> getLatestBlockHeight

▸ **getLatestBlockHeight**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The height of the latest Bitcoin block

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getLatestBlockHeight](../interfaces/ElectrsAPI.md#getlatestblockheight)

#### Defined in

[src/external/electrs.ts:193](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L193)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getMerkleProof](../interfaces/ElectrsAPI.md#getmerkleproof)

#### Defined in

[src/external/electrs.ts:197](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L197)

___

### <a id="getparsedexecutionparameters" name="getparsedexecutionparameters"></a> getParsedExecutionParameters

▸ **getParsedExecutionParameters**(`txid`): `Promise`\<[[`BitcoinMerkleProof`](BitcoinMerkleProof.md), `Transaction`]\>

Get the parsed (as Bytes) merkle proof and raw transaction

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | A Bitcoin transaction ID |

#### Returns

`Promise`\<[[`BitcoinMerkleProof`](BitcoinMerkleProof.md), `Transaction`]\>

A tuple representing [merkleProof, transaction]

**`Remarks`**

Performs the lookup using an external service, Esplora

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getParsedExecutionParameters](../interfaces/ElectrsAPI.md#getparsedexecutionparameters)

#### Defined in

[src/external/electrs.ts:422](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L422)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getRawTransaction](../interfaces/ElectrsAPI.md#getrawtransaction)

#### Defined in

[src/external/electrs.ts:428](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L428)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getTransactionBlockHeight](../interfaces/ElectrsAPI.md#gettransactionblockheight)

#### Defined in

[src/external/electrs.ts:418](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L418)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getTransactionStatus](../interfaces/ElectrsAPI.md#gettransactionstatus)

#### Defined in

[src/external/electrs.ts:394](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L394)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getTx](../interfaces/ElectrsAPI.md#gettx)

#### Defined in

[src/external/electrs.ts:201](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L201)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getTxIdByOpReturn](../interfaces/ElectrsAPI.md#gettxidbyopreturn)

#### Defined in

[src/external/electrs.ts:297](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L297)

___

### <a id="gettxstatus" name="gettxstatus"></a> getTxStatus

▸ **getTxStatus**(`txid`): `Promise`\<`Status`\>

Use the TxAPI to get the confirmationation

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txid` | `string` | The ID of a Bitcoin transaction |

#### Returns

`Promise`\<`Status`\>

A Status object, containing transaction settlement information

#### Defined in

[src/external/electrs.ts:447](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L447)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[getUtxoAmount](../interfaces/ElectrsAPI.md#getutxoamount)

#### Defined in

[src/external/electrs.ts:205](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L205)

___

### <a id="txoutputhasrecipientandamount" name="txoutputhasrecipientandamount"></a> txOutputHasRecipientAndAmount

▸ **txOutputHasRecipientAndAmount**(`vout`, `recipientAddress?`, `amount?`): `boolean`

Check if a given UTXO sends at least `amountAsBTC` to a certain `recipientAddress`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vout` | `VOut` | UTXO object |
| `recipientAddress?` | `string` | (Optional) Address of recipient |
| `amount?` | `BitcoinAmount` | - |

#### Returns

`boolean`

Boolean value

#### Defined in

[src/external/electrs.ts:375](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L375)

___

### <a id="txohasatleastamount" name="txohasatleastamount"></a> txoHasAtLeastAmount

▸ **txoHasAtLeastAmount**(`txo`, `amount?`): `boolean`

Check if a given UTXO has at least `amountAsBTC`

#### Parameters

| Name | Type |
| :------ | :------ |
| `txo` | `VOut` \| `UTXO` |
| `amount?` | `BitcoinAmount` |

#### Returns

`boolean`

Boolean value

#### Defined in

[src/external/electrs.ts:284](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L284)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[waitForOpreturn](../interfaces/ElectrsAPI.md#waitforopreturn)

#### Defined in

[src/external/electrs.ts:326](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L326)

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

#### Implementation of

[ElectrsAPI](../interfaces/ElectrsAPI.md).[waitForTxInclusion](../interfaces/ElectrsAPI.md#waitfortxinclusion)

#### Defined in

[src/external/electrs.ts:345](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/external/electrs.ts#L345)
