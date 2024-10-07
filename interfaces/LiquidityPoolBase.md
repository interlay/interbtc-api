[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / LiquidityPoolBase

# Interface: LiquidityPoolBase

## Implemented by

- [`StableLiquidityPool`](../classes/StableLiquidityPool.md)
- [`StandardLiquidityPool`](../classes/StandardLiquidityPool.md)

## Table of contents

### Properties

- [isEmpty](LiquidityPoolBase.md#isempty)
- [lpToken](LiquidityPoolBase.md#lptoken)
- [pooledCurrencies](LiquidityPoolBase.md#pooledcurrencies)
- [rewardAmountsYearly](LiquidityPoolBase.md#rewardamountsyearly)
- [totalSupply](LiquidityPoolBase.md#totalsupply)
- [tradingFee](LiquidityPoolBase.md#tradingfee)
- [type](LiquidityPoolBase.md#type)

## Properties

### <a id="isempty" name="isempty"></a> isEmpty

• **isEmpty**: `boolean`

#### Defined in

[src/parachain/amm/types.ts:15](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/types.ts#L15)

___

### <a id="lptoken" name="lptoken"></a> lpToken

• **lpToken**: [`LpCurrency`](../modules.md#lpcurrency)

#### Defined in

[src/parachain/amm/types.ts:10](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/types.ts#L10)

___

### <a id="pooledcurrencies" name="pooledcurrencies"></a> pooledCurrencies

• **pooledCurrencies**: [`PooledCurrencies`](../modules.md#pooledcurrencies)

#### Defined in

[src/parachain/amm/types.ts:11](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/types.ts#L11)

___

### <a id="rewardamountsyearly" name="rewardamountsyearly"></a> rewardAmountsYearly

• **rewardAmountsYearly**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

#### Defined in

[src/parachain/amm/types.ts:14](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/types.ts#L14)

___

### <a id="totalsupply" name="totalsupply"></a> totalSupply

• **totalSupply**: `MonetaryAmount`\<[`LpCurrency`](../modules.md#lpcurrency)\>

#### Defined in

[src/parachain/amm/types.ts:13](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/types.ts#L13)

___

### <a id="tradingfee" name="tradingfee"></a> tradingFee

• **tradingFee**: `Big`

#### Defined in

[src/parachain/amm/types.ts:12](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/types.ts#L12)

___

### <a id="type" name="type"></a> type

• **type**: [`PoolType`](../enums/PoolType.md)

#### Defined in

[src/parachain/amm/types.ts:9](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/types.ts#L9)
