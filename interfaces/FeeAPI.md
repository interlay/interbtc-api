[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / FeeAPI

# Interface: FeeAPI

## Implemented by

- [`DefaultFeeAPI`](../classes/DefaultFeeAPI.md)

## Table of contents

### Methods

- [calculateAPY](FeeAPI.md#calculateapy)
- [getGriefingCollateral](FeeAPI.md#getgriefingcollateral)
- [getIssueFee](FeeAPI.md#getissuefee)
- [getIssueGriefingCollateralRate](FeeAPI.md#getissuegriefingcollateralrate)
- [getReplaceGriefingCollateralRate](FeeAPI.md#getreplacegriefingcollateralrate)

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

#### Defined in

[src/parachain/fee.ts:36](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L36)

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

#### Defined in

[src/parachain/fee.ts:26](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L26)

___

### <a id="getissuefee" name="getissuefee"></a> getIssueFee

▸ **getIssueFee**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The percentage of issued token that is received by the vault as reward

#### Defined in

[src/parachain/fee.ts:52](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L52)

___

### <a id="getissuegriefingcollateralrate" name="getissuegriefingcollateralrate"></a> getIssueGriefingCollateralRate

▸ **getIssueGriefingCollateralRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The griefing collateral rate for issuing InterBTC

#### Defined in

[src/parachain/fee.ts:44](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L44)

___

### <a id="getreplacegriefingcollateralrate" name="getreplacegriefingcollateralrate"></a> getReplaceGriefingCollateralRate

▸ **getReplaceGriefingCollateralRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The griefing collateral rate for the Vault replace request

#### Defined in

[src/parachain/fee.ts:48](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/fee.ts#L48)
