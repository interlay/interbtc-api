[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultOracleAPI

# Class: DefaultOracleAPI

## Implements

- [`OracleAPI`](../interfaces/OracleAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultOracleAPI.md#constructor)

### Properties

- [api](DefaultOracleAPI.md#api)
- [wrappedCurrency](DefaultOracleAPI.md#wrappedcurrency)

### Methods

- [convertCollateralToWrapped](DefaultOracleAPI.md#convertcollateraltowrapped)
- [convertWrappedToCurrency](DefaultOracleAPI.md#convertwrappedtocurrency)
- [getBitcoinFees](DefaultOracleAPI.md#getbitcoinfees)
- [getExchangeRate](DefaultOracleAPI.md#getexchangerate)
- [getOnlineTimeout](DefaultOracleAPI.md#getonlinetimeout)
- [getRawValuesUpdated](DefaultOracleAPI.md#getrawvaluesupdated)
- [getSourcesById](DefaultOracleAPI.md#getsourcesbyid)
- [getValidUntil](DefaultOracleAPI.md#getvaliduntil)
- [isOnline](DefaultOracleAPI.md#isonline)
- [setBitcoinFees](DefaultOracleAPI.md#setbitcoinfees)
- [setExchangeRate](DefaultOracleAPI.md#setexchangerate)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultOracleAPI**(`api`, `wrappedCurrency`): [`DefaultOracleAPI`](DefaultOracleAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `wrappedCurrency` | `Currency` |

#### Returns

[`DefaultOracleAPI`](DefaultOracleAPI.md)

#### Defined in

[src/parachain/oracle.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L95)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/oracle.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L95)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/oracle.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L95)

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

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[convertCollateralToWrapped](../interfaces/OracleAPI.md#convertcollateraltowrapped)

#### Defined in

[src/parachain/oracle.ts:152](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L152)

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

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[convertWrappedToCurrency](../interfaces/OracleAPI.md#convertwrappedtocurrency)

#### Defined in

[src/parachain/oracle.ts:144](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L144)

___

### <a id="getbitcoinfees" name="getbitcoinfees"></a> getBitcoinFees

▸ **getBitcoinFees**(): `Promise`\<`Big`\>

Obtains the current fees for BTC transactions, in satoshi/byte.

#### Returns

`Promise`\<`Big`\>

Big value for the current inclusion fees.

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[getBitcoinFees](../interfaces/OracleAPI.md#getbitcoinfees)

#### Defined in

[src/parachain/oracle.ts:171](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L171)

___

### <a id="getexchangerate" name="getexchangerate"></a> getExchangeRate

▸ **getExchangeRate**(`currency`): `Promise`\<`ExchangeRate`\<`Currency`, [`CurrencyExt`](../modules.md#currencyext)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

`Promise`\<`ExchangeRate`\<`Currency`, [`CurrencyExt`](../modules.md#currencyext)\>\>

The exchange rate between Bitcoin and the provided collateral currency

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[getExchangeRate](../interfaces/OracleAPI.md#getexchangerate)

#### Defined in

[src/parachain/oracle.ts:97](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L97)

___

### <a id="getonlinetimeout" name="getonlinetimeout"></a> getOnlineTimeout

▸ **getOnlineTimeout**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The period of time (in milliseconds) after an oracle's last submission
during which it is considered online

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[getOnlineTimeout](../interfaces/OracleAPI.md#getonlinetimeout)

#### Defined in

[src/parachain/oracle.ts:159](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L159)

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

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[getRawValuesUpdated](../interfaces/OracleAPI.md#getrawvaluesupdated)

#### Defined in

[src/parachain/oracle.ts:220](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L220)

___

### <a id="getsourcesbyid" name="getsourcesbyid"></a> getSourcesById

▸ **getSourcesById**(): `Promise`\<`Map`\<`string`, `string`\>\>

#### Returns

`Promise`\<`Map`\<`string`, `string`\>\>

A map from the oracle's account id to its name

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[getSourcesById](../interfaces/OracleAPI.md#getsourcesbyid)

#### Defined in

[src/parachain/oracle.ts:199](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L199)

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

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[getValidUntil](../interfaces/OracleAPI.md#getvaliduntil)

#### Defined in

[src/parachain/oracle.ts:206](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L206)

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

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[isOnline](../interfaces/OracleAPI.md#isonline)

#### Defined in

[src/parachain/oracle.ts:212](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L212)

___

### <a id="setbitcoinfees" name="setbitcoinfees"></a> setBitcoinFees

▸ **setBitcoinFees**(`fees`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Create a transaction to set the current fee estimate for BTC transactions

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fees` | `Big` | Estimated Satoshis per bytes to get a transaction included |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[setBitcoinFees](../interfaces/OracleAPI.md#setbitcoinfees)

#### Defined in

[src/parachain/oracle.ts:186](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L186)

___

### <a id="setexchangerate" name="setexchangerate"></a> setExchangeRate

▸ **setExchangeRate**(`exchangeRate`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Create a transaction to set the exchange rate between Bitcoin and a collateral currency

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `exchangeRate` | `ExchangeRate`\<`Currency`, [`CurrencyExt`](../modules.md#currencyext)\> | The rate to set |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[OracleAPI](../interfaces/OracleAPI.md).[setExchangeRate](../interfaces/OracleAPI.md#setexchangerate)

#### Defined in

[src/parachain/oracle.ts:164](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/oracle.ts#L164)
