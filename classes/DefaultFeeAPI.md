[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultFeeAPI

# Class: DefaultFeeAPI

## Implements

- [`FeeAPI`](../interfaces/FeeAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultFeeAPI.md#constructor)

### Properties

- [api](DefaultFeeAPI.md#api)
- [oracleAPI](DefaultFeeAPI.md#oracleapi)

### Methods

- [calculateAPY](DefaultFeeAPI.md#calculateapy)
- [getGriefingCollateral](DefaultFeeAPI.md#getgriefingcollateral)
- [getIssueFee](DefaultFeeAPI.md#getissuefee)
- [getIssueGriefingCollateralRate](DefaultFeeAPI.md#getissuegriefingcollateralrate)
- [getReplaceGriefingCollateralRate](DefaultFeeAPI.md#getreplacegriefingcollateralrate)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultFeeAPI**(`api`, `oracleAPI`): [`DefaultFeeAPI`](DefaultFeeAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `oracleAPI` | [`OracleAPI`](../interfaces/OracleAPI.md) |

#### Returns

[`DefaultFeeAPI`](DefaultFeeAPI.md)

#### Defined in

[src/parachain/fee.ts:56](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L56)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/fee.ts:56](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L56)

___

### <a id="oracleapi" name="oracleapi"></a> oracleAPI

• `Private` **oracleAPI**: [`OracleAPI`](../interfaces/OracleAPI.md)

#### Defined in

[src/parachain/fee.ts:56](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L56)

## Methods

### <a id="calculateapy" name="calculateapy"></a> calculateAPY

▸ **calculateAPY**(`feesWrapped`, `lockedCollateral`, `exchangeRate?`): `Promise`\<`Big`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `feesWrapped` | `MonetaryAmount`\<`Currency`\> | Wrapped token fees accrued, in wrapped token (e.g. BTC) |
| `lockedCollateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | Collateral value representing the value locked to gain yield. |
| `exchangeRate?` | `ExchangeRate`\<`Currency`, [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | (Optional) Conversion rate, as a `Monetary.js` object |

#### Returns

`Promise`\<`Big`\>

The APY, given the parameters

#### Implementation of

[FeeAPI](../interfaces/FeeAPI.md).[calculateAPY](../interfaces/FeeAPI.md#calculateapy)

#### Defined in

[src/parachain/fee.ts:100](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L100)

___

### <a id="getgriefingcollateral" name="getgriefingcollateral"></a> getGriefingCollateral

▸ **getGriefingCollateral**(`amount`, `type`): `Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Amount, in BTC, for which to compute the required griefing collateral |
| `type` | [`GriefingCollateralType`](../enums/GriefingCollateralType.md) | Type of griefing collateral to compute (e.g. for issuing, replacing) |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

The griefing collateral

#### Implementation of

[FeeAPI](../interfaces/FeeAPI.md).[getGriefingCollateral](../interfaces/FeeAPI.md#getgriefingcollateral)

#### Defined in

[src/parachain/fee.ts:58](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L58)

___

### <a id="getissuefee" name="getissuefee"></a> getIssueFee

▸ **getIssueFee**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The percentage of issued token that is received by the vault as reward

#### Implementation of

[FeeAPI](../interfaces/FeeAPI.md).[getIssueFee](../interfaces/FeeAPI.md#getissuefee)

#### Defined in

[src/parachain/fee.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L95)

___

### <a id="getissuegriefingcollateralrate" name="getissuegriefingcollateralrate"></a> getIssueGriefingCollateralRate

▸ **getIssueGriefingCollateralRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The griefing collateral rate for issuing InterBTC

#### Implementation of

[FeeAPI](../interfaces/FeeAPI.md).[getIssueGriefingCollateralRate](../interfaces/FeeAPI.md#getissuegriefingcollateralrate)

#### Defined in

[src/parachain/fee.ts:85](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L85)

___

### <a id="getreplacegriefingcollateralrate" name="getreplacegriefingcollateralrate"></a> getReplaceGriefingCollateralRate

▸ **getReplaceGriefingCollateralRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The griefing collateral rate for the Vault replace request

#### Implementation of

[FeeAPI](../interfaces/FeeAPI.md).[getReplaceGriefingCollateralRate](../interfaces/FeeAPI.md#getreplacegriefingcollateralrate)

#### Defined in

[src/parachain/fee.ts:90](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L90)
