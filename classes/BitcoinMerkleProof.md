[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / BitcoinMerkleProof

# Class: BitcoinMerkleProof

## Table of contents

### Constructors

- [constructor](BitcoinMerkleProof.md#constructor)

### Properties

- [blockHeader](BitcoinMerkleProof.md#blockheader)
- [flagBits](BitcoinMerkleProof.md#flagbits)
- [hashes](BitcoinMerkleProof.md#hashes)
- [transactionsCount](BitcoinMerkleProof.md#transactionscount)

### Methods

- [fromHex](BitcoinMerkleProof.md#fromhex)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new BitcoinMerkleProof**(`buffer`): [`BitcoinMerkleProof`](BitcoinMerkleProof.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `buffer` | `Buffer` |

#### Returns

[`BitcoinMerkleProof`](BitcoinMerkleProof.md)

#### Defined in

[src/utils/bitcoin.ts:193](https://github.com/interlay/interbtc-api/blob/27d057e05e7442cd84c91468f864b71505b7d536/src/utils/bitcoin.ts#L193)

## Properties

### <a id="blockheader" name="blockheader"></a> blockHeader

• **blockHeader**: `Block`

#### Defined in

[src/utils/bitcoin.ts:188](https://github.com/interlay/interbtc-api/blob/27d057e05e7442cd84c91468f864b71505b7d536/src/utils/bitcoin.ts#L188)

___

### <a id="flagbits" name="flagbits"></a> flagBits

• **flagBits**: `boolean`[]

#### Defined in

[src/utils/bitcoin.ts:191](https://github.com/interlay/interbtc-api/blob/27d057e05e7442cd84c91468f864b71505b7d536/src/utils/bitcoin.ts#L191)

___

### <a id="hashes" name="hashes"></a> hashes

• **hashes**: \`0x$\{string}\`[]

#### Defined in

[src/utils/bitcoin.ts:190](https://github.com/interlay/interbtc-api/blob/27d057e05e7442cd84c91468f864b71505b7d536/src/utils/bitcoin.ts#L190)

___

### <a id="transactionscount" name="transactionscount"></a> transactionsCount

• **transactionsCount**: `number`

#### Defined in

[src/utils/bitcoin.ts:189](https://github.com/interlay/interbtc-api/blob/27d057e05e7442cd84c91468f864b71505b7d536/src/utils/bitcoin.ts#L189)

## Methods

### <a id="fromhex" name="fromhex"></a> fromHex

▸ **fromHex**(`hex`): [`BitcoinMerkleProof`](BitcoinMerkleProof.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

[`BitcoinMerkleProof`](BitcoinMerkleProof.md)

#### Defined in

[src/utils/bitcoin.ts:220](https://github.com/interlay/interbtc-api/blob/27d057e05e7442cd84c91468f864b71505b7d536/src/utils/bitcoin.ts#L220)
