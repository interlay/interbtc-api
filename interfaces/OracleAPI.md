[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / OracleAPI

# Interface: OracleAPI

## Implemented by

- [`DefaultOracleAPI`](../classes/DefaultOracleAPI.md)

## Table of contents

### Methods

- [convertCollateralToWrapped](OracleAPI.md#convertcollateraltowrapped)
- [convertWrappedToCurrency](OracleAPI.md#convertwrappedtocurrency)
- [getBitcoinFees](OracleAPI.md#getbitcoinfees)
- [getExchangeRate](OracleAPI.md#getexchangerate)
- [getOnlineTimeout](OracleAPI.md#getonlinetimeout)
- [getRawValuesUpdated](OracleAPI.md#getrawvaluesupdated)
- [getSourcesById](OracleAPI.md#getsourcesbyid)
- [getValidUntil](OracleAPI.md#getvaliduntil)
- [isOnline](OracleAPI.md#isonline)
- [setBitcoinFees](OracleAPI.md#setbitcoinfees)
- [setExchangeRate](OracleAPI.md#setexchangerate)

## Methods

### <a id="convertcollateraltowrapped" name="convertcollateraltowrapped"></a> convertCollateralToWrapped

▸ **convertCollateralToWrapped**(`amount`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The amount of collateral tokens to convert |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

Converted value

#### Defined in

[src/parachain/oracle.ts:81](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L81)

___

### <a id="convertwrappedtocurrency" name="convertwrappedtocurrency"></a> convertWrappedToCurrency

▸ **convertWrappedToCurrency**(`amount`, `currency`): `Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount of wrapped tokens to convert |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) | A `Monetary.js` object |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

Converted value

#### Defined in

[src/parachain/oracle.ts:73](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L73)

___

### <a id="getbitcoinfees" name="getbitcoinfees"></a> getBitcoinFees

▸ **getBitcoinFees**(): `Promise`\<`Big`\>

Obtains the current fees for BTC transactions, in satoshi/byte.

#### Returns

`Promise`\<`Big`\>

Big value for the current inclusion fees.

#### Defined in

[src/parachain/oracle.ts:42](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L42)

___

### <a id="getexchangerate" name="getexchangerate"></a> getExchangeRate

▸ **getExchangeRate**(`collateralCurrency`, `wrappedCurrency?`): `Promise`\<`ExchangeRate`\<`Currency`, [`CurrencyExt`](../modules.md#currencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CurrencyExt`](../modules.md#currencyext) | - |
| `wrappedCurrency?` | `Currency` | The wrapped currency to use in the returned exchange rate type, defaults to `Bitcoin` |

#### Returns

`Promise`\<`ExchangeRate`\<`Currency`, [`CurrencyExt`](../modules.md#currencyext)\>\>

The exchange rate between Bitcoin and the provided collateral currency

#### Defined in

[src/parachain/oracle.ts:34](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L34)

___

### <a id="getonlinetimeout" name="getonlinetimeout"></a> getOnlineTimeout

▸ **getOnlineTimeout**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The period of time (in milliseconds) after an oracle's last submission
during which it is considered online

#### Defined in

[src/parachain/oracle.ts:86](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L86)

___

### <a id="getrawvaluesupdated" name="getrawvaluesupdated"></a> getRawValuesUpdated

▸ **getRawValuesUpdated**(`key`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `InterbtcPrimitivesOracleKey` | A key defining an exchange rate or a BTC network fee estimate |

#### Returns

`Promise`\<`boolean`\>

Whether the oracle entr for the given key has been updated

#### Defined in

[src/parachain/oracle.ts:91](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L91)

___

### <a id="getsourcesbyid" name="getsourcesbyid"></a> getSourcesById

▸ **getSourcesById**(): `Promise`\<`Map`\<`string`, `string`\>\>

#### Returns

`Promise`\<`Map`\<`string`, `string`\>\>

A map from the oracle's account id to its name

#### Defined in

[src/parachain/oracle.ts:50](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L50)

___

### <a id="getvaliduntil" name="getvaliduntil"></a> getValidUntil

▸ **getValidUntil**(`counterCurrency`): `Promise`\<`Date`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `counterCurrency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

`Promise`\<`Date`\>

Last exchange rate time

#### Defined in

[src/parachain/oracle.ts:46](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L46)

___

### <a id="isonline" name="isonline"></a> isOnline

▸ **isOnline**(`currency`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) | Currency for which we check status of oracle. |

#### Returns

`Promise`\<`boolean`\>

Boolean value indicating whether the oracle is online for currency

#### Defined in

[src/parachain/oracle.ts:55](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L55)

___

### <a id="setbitcoinfees" name="setbitcoinfees"></a> setBitcoinFees

▸ **setBitcoinFees**(`fees`): [`ExtrinsicData`](ExtrinsicData.md)

Create a transaction to set the current fee estimate for BTC transactions

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fees` | `Big` | Estimated Satoshis per bytes to get a transaction included |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/oracle.ts:67](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L67)

___

### <a id="setexchangerate" name="setexchangerate"></a> setExchangeRate

▸ **setExchangeRate**(`exchangeRate`): [`ExtrinsicData`](ExtrinsicData.md)

Create a transaction to set the exchange rate between Bitcoin and a collateral currency

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `exchangeRate` | `ExchangeRate`\<`Currency`, [`CurrencyExt`](../modules.md#currencyext)\> | The rate to set |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/oracle.ts:61](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L61)
