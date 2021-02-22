[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / OracleAPI

# Interface: OracleAPI

## Table of contents

### Methods

- [getBtcTxFeesPerByte](/interfaces/oracleapi.md#getbtctxfeesperbyte)
- [getExchangeRate](/interfaces/oracleapi.md#getexchangerate)
- [getFeed](/interfaces/oracleapi.md#getfeed)
- [getInfo](/interfaces/oracleapi.md#getinfo)
- [getLastExchangeRateTime](/interfaces/oracleapi.md#getlastexchangeratetime)
- [getOracleNames](/interfaces/oracleapi.md#getoraclenames)
- [getRawExchangeRate](/interfaces/oracleapi.md#getrawexchangerate)
- [isOnline](/interfaces/oracleapi.md#isonline)
- [setAccount](/interfaces/oracleapi.md#setaccount)
- [setBtcTxFeesPerByte](/interfaces/oracleapi.md#setbtctxfeesperbyte)
- [setExchangeRate](/interfaces/oracleapi.md#setexchangerate)

## Methods

### getBtcTxFeesPerByte

▸ **getBtcTxFeesPerByte**(): *Promise*<BtcTxFees\>

Obtains the current fees for BTC transactions, in satoshi/byte.

**Returns:** *Promise*<BtcTxFees\>

An object with the values `fast` (estimated fee for inclusion
in the next block - about 10 minutes), `half` (fee for the next 3 blocks or ~30 minutes)
and `hour` (fee for inclusion in the next 6 blocks, or ~60 minutes).

Defined in: [src/apis/oracle.ts:36](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L36)

___

### getExchangeRate

▸ **getExchangeRate**(): *Promise*<Big\>

**Returns:** *Promise*<Big\>

The DOT/BTC exchange rate

Defined in: [src/apis/oracle.ts:29](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L29)

___

### getFeed

▸ **getFeed**(): *Promise*<string\>

**Returns:** *Promise*<string\>

The feed name (such as "DOT/BTC")

Defined in: [src/apis/oracle.ts:40](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L40)

___

### getInfo

▸ **getInfo**(): *Promise*<OracleInfo\>

**Returns:** *Promise*<OracleInfo\>

An object of type OracleInfo

Defined in: [src/apis/oracle.ts:56](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L56)

___

### getLastExchangeRateTime

▸ **getLastExchangeRateTime**(): *Promise*<Date\>

**Returns:** *Promise*<Date\>

Last exchange rate time

Defined in: [src/apis/oracle.ts:44](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L44)

___

### getOracleNames

▸ **getOracleNames**(): *Promise*<string[]\>

**Returns:** *Promise*<string[]\>

An array with the oracle names

Defined in: [src/apis/oracle.ts:48](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L48)

___

### getRawExchangeRate

▸ **getRawExchangeRate**(): *Promise*<Big\>

**Returns:** *Promise*<Big\>

The Planck/Satoshi exchange rate

Defined in: [src/apis/oracle.ts:77](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L77)

___

### isOnline

▸ **isOnline**(): *Promise*<boolean\>

**Returns:** *Promise*<boolean\>

Boolean value indicating whether the oracle is online

Defined in: [src/apis/oracle.ts:52](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L52)

___

### setAccount

▸ **setAccount**(`account`: AddressOrPair): *void*

Set an account to use when sending transactions from this API

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | AddressOrPair | Keyring account    |

**Returns:** *void*

Defined in: [src/apis/oracle.ts:73](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L73)

___

### setBtcTxFeesPerByte

▸ **setBtcTxFeesPerByte**(`fees`: BtcTxFees): *Promise*<void\>

Send a transaction to set the current fee rates for BTC transactions

#### Parameters:

Name | Type |
:------ | :------ |
`fees` | BtcTxFees |

**Returns:** *Promise*<void\>

Defined in: [src/apis/oracle.ts:68](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L68)

___

### setExchangeRate

▸ **setExchangeRate**(`exchangeRate`: *string*): *Promise*<void\>

Send a transaction to set the DOT/BTC exchange rate

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`exchangeRate` | *string* | The rate to set    |

**Returns:** *Promise*<void\>

Defined in: [src/apis/oracle.ts:61](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/oracle.ts#L61)
