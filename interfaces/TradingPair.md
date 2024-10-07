[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / TradingPair

# Interface: TradingPair

## Table of contents

### Properties

- [getOutputAmount](TradingPair.md#getoutputamount)
- [pathOf](TradingPair.md#pathof)
- [reserve0](TradingPair.md#reserve0)
- [reserve1](TradingPair.md#reserve1)
- [token0](TradingPair.md#token0)
- [token1](TradingPair.md#token1)

## Properties

### <a id="getoutputamount" name="getoutputamount"></a> getOutputAmount

• **getOutputAmount**: (`inputAmount`: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>) => `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Type declaration

▸ (`inputAmount`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `inputAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |

##### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/trade/types.ts:11](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/types.ts#L11)

___

### <a id="pathof" name="pathof"></a> pathOf

• **pathOf**: (`inputCurrency`: [`CurrencyExt`](../modules.md#currencyext)) => [`MultiPathElement`](../modules.md#multipathelement)

#### Type declaration

▸ (`inputCurrency`): [`MultiPathElement`](../modules.md#multipathelement)

##### Parameters

| Name | Type |
| :------ | :------ |
| `inputCurrency` | [`CurrencyExt`](../modules.md#currencyext) |

##### Returns

[`MultiPathElement`](../modules.md#multipathelement)

#### Defined in

[src/parachain/amm/trade/types.ts:12](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/types.ts#L12)

___

### <a id="reserve0" name="reserve0"></a> reserve0

• **reserve0**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/trade/types.ts:9](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/types.ts#L9)

___

### <a id="reserve1" name="reserve1"></a> reserve1

• **reserve1**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/trade/types.ts:10](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/types.ts#L10)

___

### <a id="token0" name="token0"></a> token0

• **token0**: [`CurrencyExt`](../modules.md#currencyext)

#### Defined in

[src/parachain/amm/trade/types.ts:7](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/types.ts#L7)

___

### <a id="token1" name="token1"></a> token1

• **token1**: [`CurrencyExt`](../modules.md#currencyext)

#### Defined in

[src/parachain/amm/trade/types.ts:8](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/trade/types.ts#L8)
