[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / ChainBalance

# Class: ChainBalance

## Table of contents

### Constructors

- [constructor](ChainBalance.md#constructor)

### Properties

- [currency](ChainBalance.md#currency)
- [free](ChainBalance.md#free)
- [reserved](ChainBalance.md#reserved)
- [transferable](ChainBalance.md#transferable)

### Methods

- [toString](ChainBalance.md#tostring)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new ChainBalance**(`currency`, `free?`, `transferable?`, `reserved?`): [`ChainBalance`](ChainBalance.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |
| `free?` | `BigSource` |
| `transferable?` | `BigSource` |
| `reserved?` | `BigSource` |

#### Returns

[`ChainBalance`](ChainBalance.md)

#### Defined in

[src/types/currency.ts:107](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/currency.ts#L107)

## Properties

### <a id="currency" name="currency"></a> currency

• **currency**: [`CurrencyExt`](../modules.md#currencyext)

#### Defined in

[src/types/currency.ts:105](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/currency.ts#L105)

___

### <a id="free" name="free"></a> free

• **free**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/types/currency.ts:102](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/currency.ts#L102)

___

### <a id="reserved" name="reserved"></a> reserved

• **reserved**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/types/currency.ts:104](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/currency.ts#L104)

___

### <a id="transferable" name="transferable"></a> transferable

• **transferable**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/types/currency.ts:103](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/currency.ts#L103)

## Methods

### <a id="tostring" name="tostring"></a> toString

▸ **toString**(): `string`

#### Returns

`string`

#### Defined in

[src/types/currency.ts:118](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/currency.ts#L118)
