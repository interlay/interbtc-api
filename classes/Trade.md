[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / Trade

# Class: Trade

## Table of contents

### Constructors

- [constructor](Trade.md#constructor)

### Properties

- [executionPrice](Trade.md#executionprice)
- [inputAmount](Trade.md#inputamount)
- [outputAmount](Trade.md#outputamount)
- [path](Trade.md#path)
- [priceImpact](Trade.md#priceimpact)

### Methods

- [getMinimumOutputAmount](Trade.md#getminimumoutputamount)
- [isBetter](Trade.md#isbetter)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new Trade**(`path`, `inputAmount`, `outputAmount`): [`Trade`](Trade.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | [`MultiPath`](../modules.md#multipath) |
| `inputAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |
| `outputAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |

#### Returns

[`Trade`](Trade.md)

#### Defined in

[src/parachain/amm/trade/trade.ts:11](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L11)

## Properties

### <a id="executionprice" name="executionprice"></a> executionPrice

• **executionPrice**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/trade/trade.ts:9](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L9)

___

### <a id="inputamount" name="inputamount"></a> inputAmount

• **inputAmount**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/trade/trade.ts:13](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L13)

___

### <a id="outputamount" name="outputamount"></a> outputAmount

• **outputAmount**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/trade/trade.ts:14](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L14)

___

### <a id="path" name="path"></a> path

• **path**: [`MultiPath`](../modules.md#multipath)

#### Defined in

[src/parachain/amm/trade/trade.ts:12](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L12)

___

### <a id="priceimpact" name="priceimpact"></a> priceImpact

• **priceImpact**: `Big`

#### Defined in

[src/parachain/amm/trade/trade.ts:10](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L10)

## Methods

### <a id="getminimumoutputamount" name="getminimumoutputamount"></a> getMinimumOutputAmount

▸ **getMinimumOutputAmount**(`maxSlippage`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

Get minimum output amount for trade with provided maximum allowed slippage.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `maxSlippage` | `number` | Maximum slippage in percentage. |

#### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

Minimum output amount of trade allowed with provided slippage.

#### Defined in

[src/parachain/amm/trade/trade.ts:52](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L52)

___

### <a id="isbetter" name="isbetter"></a> isBetter

▸ **isBetter**(`anotherTrade`): `boolean`

Comparator for 2 trades with same input and output.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `anotherTrade` | ``null`` \| [`Trade`](Trade.md) | Trade to compare. |

#### Returns

`boolean`

true if `this` trade is better, false if `anotherTrade` is better.

**`Throws`**

When provided trade has different input or output currency.

#### Defined in

[src/parachain/amm/trade/trade.ts:28](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/trade.ts#L28)
