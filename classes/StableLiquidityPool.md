[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / StableLiquidityPool

# Class: StableLiquidityPool

## Hierarchy

- `LiquidityPoolCalculator`\<[`StableLpToken`](../modules.md#stablelptoken)\>

  ↳ **`StableLiquidityPool`**

  ↳↳ [`StableLiquidityMetaPool`](StableLiquidityMetaPool.md)

## Implements

- [`LiquidityPoolBase`](../interfaces/LiquidityPoolBase.md)

## Table of contents

### Constructors

- [constructor](StableLiquidityPool.md#constructor)

### Properties

- [actuallyPooledCurrencies](StableLiquidityPool.md#actuallypooledcurrencies)
- [amplificationCoefficient](StableLiquidityPool.md#amplificationcoefficient)
- [isEmpty](StableLiquidityPool.md#isempty)
- [lpToken](StableLiquidityPool.md#lptoken)
- [poolId](StableLiquidityPool.md#poolid)
- [pooledCurrencies](StableLiquidityPool.md#pooledcurrencies)
- [rewardAmountsYearly](StableLiquidityPool.md#rewardamountsyearly)
- [totalSupply](StableLiquidityPool.md#totalsupply)
- [tradingFee](StableLiquidityPool.md#tradingfee)
- [type](StableLiquidityPool.md#type)

### Accessors

- [\_feePerToken](StableLiquidityPool.md#_feepertoken)
- [xp](StableLiquidityPool.md#xp)

### Methods

- [\_distance](StableLiquidityPool.md#_distance)
- [\_getD](StableLiquidityPool.md#_getd)
- [\_getY](StableLiquidityPool.md#_gety)
- [\_getYD](StableLiquidityPool.md#_getyd)
- [\_sortAmounts](StableLiquidityPool.md#_sortamounts)
- [\_xp](StableLiquidityPool.md#_xp)
- [calculateRemoveLiquidityOneToken](StableLiquidityPool.md#calculateremoveliquidityonetoken)
- [calculateSwap](StableLiquidityPool.md#calculateswap)
- [calculateTokenAmount](StableLiquidityPool.md#calculatetokenamount)
- [getLiquidityDepositInputAmounts](StableLiquidityPool.md#getliquiditydepositinputamounts)
- [getLiquidityDepositLpTokenAmount](StableLiquidityPool.md#getliquiditydepositlptokenamount)
- [getLiquidityWithdrawalPooledCurrencyAmounts](StableLiquidityPool.md#getliquiditywithdrawalpooledcurrencyamounts)
- [getTokenIndex](StableLiquidityPool.md#gettokenindex)
- [involvesToken](StableLiquidityPool.md#involvestoken)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new StableLiquidityPool**(`type`, `lpToken`, `actuallyPooledCurrencies`, `pooledCurrencies`, `rewardAmountsYearly`, `tradingFee`, `poolId`, `amplificationCoefficient`, `totalSupply`, `isEmpty`): [`StableLiquidityPool`](StableLiquidityPool.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`STABLE_PLAIN`](../enums/PoolType.md#stable_plain) \| [`STABLE_META`](../enums/PoolType.md#stable_meta) |
| `lpToken` | [`StableLpToken`](../modules.md#stablelptoken) |
| `actuallyPooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `pooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `rewardAmountsYearly` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[] |
| `tradingFee` | `Big` |
| `poolId` | `number` |
| `amplificationCoefficient` | `Big` |
| `totalSupply` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |
| `isEmpty` | `boolean` |

#### Returns

[`StableLiquidityPool`](StableLiquidityPool.md)

#### Overrides

LiquidityPoolCalculator\&lt;StableLpToken\&gt;.constructor

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:10](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L10)

## Properties

### <a id="actuallypooledcurrencies" name="actuallypooledcurrencies"></a> actuallyPooledCurrencies

• **actuallyPooledCurrencies**: [`PooledCurrencies`](../modules.md#pooledcurrencies)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:14](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L14)

___

### <a id="amplificationcoefficient" name="amplificationcoefficient"></a> amplificationCoefficient

• **amplificationCoefficient**: `Big`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:20](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L20)

___

### <a id="isempty" name="isempty"></a> isEmpty

• **isEmpty**: `boolean`

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[isEmpty](../interfaces/LiquidityPoolBase.md#isempty)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:22](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L22)

___

### <a id="lptoken" name="lptoken"></a> lpToken

• **lpToken**: [`StableLpToken`](../modules.md#stablelptoken)

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[lpToken](../interfaces/LiquidityPoolBase.md#lptoken)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:12](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L12)

___

### <a id="poolid" name="poolid"></a> poolId

• **poolId**: `number`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:19](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L19)

___

### <a id="pooledcurrencies" name="pooledcurrencies"></a> pooledCurrencies

• **pooledCurrencies**: [`PooledCurrencies`](../modules.md#pooledcurrencies)

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[pooledCurrencies](../interfaces/LiquidityPoolBase.md#pooledcurrencies)

#### Inherited from

LiquidityPoolCalculator.pooledCurrencies

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:16](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L16)

___

### <a id="rewardamountsyearly" name="rewardamountsyearly"></a> rewardAmountsYearly

• **rewardAmountsYearly**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[rewardAmountsYearly](../interfaces/LiquidityPoolBase.md#rewardamountsyearly)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:17](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L17)

___

### <a id="totalsupply" name="totalsupply"></a> totalSupply

• **totalSupply**: `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\>

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[totalSupply](../interfaces/LiquidityPoolBase.md#totalsupply)

#### Inherited from

LiquidityPoolCalculator.totalSupply

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L21)

___

### <a id="tradingfee" name="tradingfee"></a> tradingFee

• **tradingFee**: `Big`

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[tradingFee](../interfaces/LiquidityPoolBase.md#tradingfee)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L18)

___

### <a id="type" name="type"></a> type

• **type**: [`STABLE_PLAIN`](../enums/PoolType.md#stable_plain) \| [`STABLE_META`](../enums/PoolType.md#stable_meta)

#### Implementation of

[LiquidityPoolBase](../interfaces/LiquidityPoolBase.md).[type](../interfaces/LiquidityPoolBase.md#type)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:11](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L11)

## Accessors

### <a id="_feepertoken" name="_feepertoken"></a> \_feePerToken

• `get` **_feePerToken**(): `Big`

#### Returns

`Big`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:35](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L35)

___

### <a id="xp" name="xp"></a> xp

• `get` **xp**(): `Big`[]

#### Returns

`Big`[]

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:194](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L194)

## Methods

### <a id="_distance" name="_distance"></a> \_distance

▸ **_distance**(`x`, `y`): `Big`

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `Big` |
| `y` | `Big` |

#### Returns

`Big`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:31](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L31)

___

### <a id="_getd" name="_getd"></a> \_getD

▸ **_getD**(`amountsInBaseDenomination`, `amp`): `Big`

#### Parameters

| Name | Type |
| :------ | :------ |
| `amountsInBaseDenomination` | `Big`[] |
| `amp` | `Big` |

#### Returns

`Big`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:41](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L41)

___

### <a id="_gety" name="_gety"></a> \_getY

▸ **_getY**(`inIndex`, `outIndex`, `inBalance`, `normalizedBalances`): `Big`

#### Parameters

| Name | Type |
| :------ | :------ |
| `inIndex` | `number` |
| `outIndex` | `number` |
| `inBalance` | `Big` |
| `normalizedBalances` | `Big`[] |

#### Returns

`Big`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:74](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L74)

___

### <a id="_getyd" name="_getyd"></a> \_getYD

▸ **_getYD**(`A`, `index`, `xp`, `D`): `Big`

#### Parameters

| Name | Type |
| :------ | :------ |
| `A` | `Big` |
| `index` | `number` |
| `xp` | `Big`[] |
| `D` | `Big` |

#### Returns

`Big`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:115](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L115)

___

### <a id="_sortamounts" name="_sortamounts"></a> \_sortAmounts

▸ **_sortAmounts**(`amounts`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

Sort amounts in same order as `actuallyPooledCurrencies`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amounts` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[] | Array of monetary |

#### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

Amounts containing currency amounts at the same index as `this.actuallyPooledCurrencies`

**`Throws`**

When currencies of `amounts` differ from `actuallyPooledCurrencies`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:156](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L156)

___

### <a id="_xp" name="_xp"></a> \_xp

▸ **_xp**(`amounts`): `Big`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `amounts` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[] |

#### Returns

`Big`[]

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:27](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L27)

___

### <a id="calculateremoveliquidityonetoken" name="calculateremoveliquidityonetoken"></a> calculateRemoveLiquidityOneToken

▸ **calculateRemoveLiquidityOneToken**(`tokenLPAmount`, `outputCurrencyIndex`): [`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]

#### Parameters

| Name | Type |
| :------ | :------ |
| `tokenLPAmount` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |
| `outputCurrencyIndex` | `number` |

#### Returns

[`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:223](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L223)

___

### <a id="calculateswap" name="calculateswap"></a> calculateSwap

▸ **calculateSwap**(`inputIndex`, `outputIndex`, `inputAmount`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `inputIndex` | `number` |
| `outputIndex` | `number` |
| `inputAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |

#### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:263](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L263)

___

### <a id="calculatetokenamount" name="calculatetokenamount"></a> calculateTokenAmount

▸ **calculateTokenAmount**(`amounts`, `deposit`): `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amounts` | [`PooledCurrencies`](../modules.md#pooledcurrencies) | Array of monetary amount for each pooled currency of this pool. |
| `deposit` | `boolean` | True for deposit, false for withdrawal |

#### Returns

`MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\>

LP token amount that will be minted/burned after operation.

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:204](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L204)

___

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

▸ **getLiquidityDepositLpTokenAmount**(`amount`): `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\>

Calculates expected amount of LP token account will get after depositing
`amount` of pooled currency into pool.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of one of the pooled currencies. |

#### Returns

`MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\>

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
| `amount` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> | Amount of liquidity in LP token to be withdrawn. |

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

### <a id="gettokenindex" name="gettokenindex"></a> getTokenIndex

▸ **getTokenIndex**(`currency`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

`number`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:188](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L188)

___

### <a id="involvestoken" name="involvestoken"></a> involvesToken

▸ **involvesToken**(`currency`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

`boolean`

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:182](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L182)
