[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / StandardLiquidityPool

# Class: StandardLiquidityPool

## Hierarchy

- `LiquidityPoolCalculator`\<[`StandardLpToken`](../modules.md#standardlptoken)\>

  ↳ **`StandardLiquidityPool`**

## Implements

- [`LiquidityPoolBase`](../interfaces/LiquidityPoolBase.md)

## Table of contents

### Constructors

- [constructor](StandardLiquidityPool.md#constructor)

### Properties

- [isEmpty](StandardLiquidityPool.md#isempty)
- [isTradingActive](StandardLiquidityPool.md#istradingactive)
- [lpToken](StandardLiquidityPool.md#lptoken)
- [pooledCurrencies](StandardLiquidityPool.md#pooledcurrencies)
- [reserve0](StandardLiquidityPool.md#reserve0)
- [reserve1](StandardLiquidityPool.md#reserve1)
- [rewardAmountsYearly](StandardLiquidityPool.md#rewardamountsyearly)
- [token0](StandardLiquidityPool.md#token0)
- [token1](StandardLiquidityPool.md#token1)
- [totalSupply](StandardLiquidityPool.md#totalsupply)
- [tradingFee](StandardLiquidityPool.md#tradingfee)
- [type](StandardLiquidityPool.md#type)

### Methods

- [getLiquidityDepositInputAmounts](StandardLiquidityPool.md#getliquiditydepositinputamounts)
- [getLiquidityDepositLpTokenAmount](StandardLiquidityPool.md#getliquiditydepositlptokenamount)
- [getLiquidityWithdrawalPooledCurrencyAmounts](StandardLiquidityPool.md#getliquiditywithdrawalpooledcurrencyamounts)
- [getOutputAmount](StandardLiquidityPool.md#getoutputamount)
- [pathOf](StandardLiquidityPool.md#pathof)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new StandardLiquidityPool**(`lpToken`, `pooledCurrencies`, `rewardAmountsYearly`, `tradingFee`, `isTradingActive`, `totalSupply`, `isEmpty`): [`StandardLiquidityPool`](StandardLiquidityPool.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `lpToken` | [`StandardLpToken`](../modules.md#standardlptoken) |
| `pooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `rewardAmountsYearly` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[] |
| `tradingFee` | `Big` |
| `isTradingActive` | `boolean` |
| `totalSupply` | `MonetaryAmount`\<[`StandardLpToken`](../modules.md#standardlptoken)\> |
| `isEmpty` | `boolean` |

#### Returns

[`StandardLiquidityPool`](StandardLiquidityPool.md)

#### Overrides

LiquidityPoolCalculator\&lt;StandardLpToken\&gt;.constructor

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:15](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L15)

## Properties

### <a id="isempty" name="isempty"></a> isEmpty

• **isEmpty**: `boolean`

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[isEmpty](../interfaces/LiquidityPoolBase.md#isempty)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:22](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L22)

___

### <a id="istradingactive" name="istradingactive"></a> isTradingActive

• **isTradingActive**: `boolean`

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:20](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L20)

___

### <a id="lptoken" name="lptoken"></a> lpToken

• **lpToken**: [`StandardLpToken`](../modules.md#standardlptoken)

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[lpToken](../interfaces/LiquidityPoolBase.md#lptoken)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:16](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L16)

___

### <a id="pooledcurrencies" name="pooledcurrencies"></a> pooledCurrencies

• **pooledCurrencies**: [`PooledCurrencies`](../modules.md#pooledcurrencies)

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[pooledCurrencies](../interfaces/LiquidityPoolBase.md#pooledcurrencies)

#### Inherited from

LiquidityPoolCalculator.pooledCurrencies

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:17](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L17)

___

### <a id="reserve0" name="reserve0"></a> reserve0

• **reserve0**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:13](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L13)

___

### <a id="reserve1" name="reserve1"></a> reserve1

• **reserve1**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:14](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L14)

___

### <a id="rewardamountsyearly" name="rewardamountsyearly"></a> rewardAmountsYearly

• **rewardAmountsYearly**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[rewardAmountsYearly](../interfaces/LiquidityPoolBase.md#rewardamountsyearly)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L18)

___

### <a id="token0" name="token0"></a> token0

• **token0**: [`CurrencyExt`](../modules.md#currencyext)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:11](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L11)

___

### <a id="token1" name="token1"></a> token1

• **token1**: [`CurrencyExt`](../modules.md#currencyext)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:12](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L12)

___

### <a id="totalsupply" name="totalsupply"></a> totalSupply

• **totalSupply**: `MonetaryAmount`\<[`StandardLpToken`](../modules.md#standardlptoken)\>

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[totalSupply](../interfaces/LiquidityPoolBase.md#totalsupply)

#### Inherited from

LiquidityPoolCalculator.totalSupply

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L21)

___

### <a id="tradingfee" name="tradingfee"></a> tradingFee

• **tradingFee**: `Big`

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[tradingFee](../interfaces/LiquidityPoolBase.md#tradingfee)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:19](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L19)

___

### <a id="type" name="type"></a> type

• **type**: [`PoolType`](../enums/PoolType.md) = `PoolType.STANDARD`

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[type](../interfaces/LiquidityPoolBase.md#type)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:10](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L10)

## Methods

### <a id="getliquiditydepositinputamounts" name="getliquiditydepositinputamounts"></a> getLiquidityDepositInputAmounts

▸ **getLiquidityDepositInputAmounts**(`amount`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

Calculates how much of pooled currencies needs to be deposited
into pool with current ratio of currencies.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of one of the pooled currencies. |

#### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

Monetary amounts of all pooled currencies in balanced proportion.

**`Throws`**

If pool is empty. Note: handle by checking `isEmpty` property of pool.

#### Inherited from

LiquidityPoolCalculator.getLiquidityDepositInputAmounts

#### Defined in

[src/parachain/amm/liquidity-pool/calculator.ts:29](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/calculator.ts#L29)

___

### <a id="getliquiditydepositlptokenamount" name="getliquiditydepositlptokenamount"></a> getLiquidityDepositLpTokenAmount

▸ **getLiquidityDepositLpTokenAmount**(`amount`): `MonetaryAmount`\<[`StandardLpToken`](../modules.md#standardlptoken)\>

Calculates expected amount of LP token account will get after depositing
`amount` of pooled currency into pool.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of one of the pooled currencies. |

#### Returns

`MonetaryAmount`\<[`StandardLpToken`](../modules.md#standardlptoken)\>

Expected amount of lp token that will be received after `amount` is added to pool.

**`Note`**

This method assumes all pooled currencies will be added in balance.

**`Throws`**

If pool is empty. Note: handle by checking `isEmpty` property of pool.

#### Inherited from

LiquidityPoolCalculator.getLiquidityDepositLpTokenAmount

#### Defined in

[src/parachain/amm/liquidity-pool/calculator.ts:47](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/calculator.ts#L47)

___

### <a id="getliquiditywithdrawalpooledcurrencyamounts" name="getliquiditywithdrawalpooledcurrencyamounts"></a> getLiquidityWithdrawalPooledCurrencyAmounts

▸ **getLiquidityWithdrawalPooledCurrencyAmounts**(`amount`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

Calculates expected amount of pooled currencies account will get
after withdrawing `amount` of LP token.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`StandardLpToken`](../modules.md#standardlptoken)\> | Amount of liquidity in LP token to be withdrawn. |

#### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

Amounts of pooled currencies to be returned to account.

**`Note`**

This method assumes all pooled currencies will be withdrawn in balance.

**`Throws`**

If pool is empty. Note: handle by checking `isEmpty` property of pool.

#### Inherited from

LiquidityPoolCalculator.getLiquidityWithdrawalPooledCurrencyAmounts

#### Defined in

[src/parachain/amm/liquidity-pool/calculator.ts:64](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/calculator.ts#L64)

___

### <a id="getoutputamount" name="getoutputamount"></a> getOutputAmount

▸ **getOutputAmount**(`inputAmount`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

Get output amount of pool after swap of `inputAmount` is made.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `inputAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Input amount of currency to swap. |

#### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

Output amount after swap of `inputAmount` is made.

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:51](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L51)

___

### <a id="pathof" name="pathof"></a> pathOf

▸ **pathOf**(`inputCurrency`): [`MultiPathElementStandard`](../interfaces/MultiPathElementStandard.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `inputCurrency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

[`MultiPathElementStandard`](../interfaces/MultiPathElementStandard.md)

#### Defined in

[src/parachain/amm/liquidity-pool/standard.ts:35](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/standard.ts#L35)
