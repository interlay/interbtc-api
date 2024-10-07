[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / StableLiquidityMetaPool

# Class: StableLiquidityMetaPool

## Hierarchy

- [`StableLiquidityPool`](StableLiquidityPool.md)

  ↳ **`StableLiquidityMetaPool`**

## Table of contents

### Constructors

- [constructor](StableLiquidityMetaPool.md#constructor)

### Properties

- [actuallyPooledCurrencies](StableLiquidityMetaPool.md#actuallypooledcurrencies)
- [amplificationCoefficient](StableLiquidityMetaPool.md#amplificationcoefficient)
- [basePool](StableLiquidityMetaPool.md#basepool)
- [isEmpty](StableLiquidityMetaPool.md#isempty)
- [lpToken](StableLiquidityMetaPool.md#lptoken)
- [poolId](StableLiquidityMetaPool.md#poolid)
- [pooledCurrencies](StableLiquidityMetaPool.md#pooledcurrencies)
- [rewardAmountsYearly](StableLiquidityMetaPool.md#rewardamountsyearly)
- [totalSupply](StableLiquidityMetaPool.md#totalsupply)
- [tradingFee](StableLiquidityMetaPool.md#tradingfee)
- [type](StableLiquidityMetaPool.md#type)

### Accessors

- [\_feePerToken](StableLiquidityMetaPool.md#_feepertoken)
- [xp](StableLiquidityMetaPool.md#xp)

### Methods

- [calculateRemoveLiquidityOneToken](StableLiquidityMetaPool.md#calculateremoveliquidityonetoken)
- [calculateSwap](StableLiquidityMetaPool.md#calculateswap)
- [calculateTokenAmount](StableLiquidityMetaPool.md#calculatetokenamount)
- [getLiquidityDepositInputAmounts](StableLiquidityMetaPool.md#getliquiditydepositinputamounts)
- [getLiquidityDepositLpTokenAmount](StableLiquidityMetaPool.md#getliquiditydepositlptokenamount)
- [getLiquidityWithdrawalPooledCurrencyAmounts](StableLiquidityMetaPool.md#getliquiditywithdrawalpooledcurrencyamounts)
- [getTokenIndex](StableLiquidityMetaPool.md#gettokenindex)
- [involvesToken](StableLiquidityMetaPool.md#involvestoken)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new StableLiquidityMetaPool**(`lpToken`, `metaPooledCurrencies`, `pooledCurrencies`, `rewardAmountsYearly`, `tradingFee`, `poolId`, `amplificationCoefficient`, `totalSupply`, `isEmpty`, `basePool`): [`StableLiquidityMetaPool`](StableLiquidityMetaPool.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `lpToken` | [`StableLpToken`](../modules.md#stablelptoken) |
| `metaPooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `pooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `rewardAmountsYearly` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[] |
| `tradingFee` | `Big` |
| `poolId` | `number` |
| `amplificationCoefficient` | `Big` |
| `totalSupply` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |
| `isEmpty` | `boolean` |
| `basePool` | [`StableLiquidityPool`](StableLiquidityPool.md) |

#### Returns

[`StableLiquidityMetaPool`](StableLiquidityMetaPool.md)

#### Overrides

[StableLiquidityPool](StableLiquidityPool.md).[constructor](StableLiquidityPool.md#constructor)

#### Defined in

[src/parachain/amm/liquidity-pool/stable-meta.ts:8](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable-meta.ts#L8)

## Properties

### <a id="actuallypooledcurrencies" name="actuallypooledcurrencies"></a> actuallyPooledCurrencies

• **actuallyPooledCurrencies**: [`PooledCurrencies`](../modules.md#pooledcurrencies)

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[actuallyPooledCurrencies](StableLiquidityPool.md#actuallypooledcurrencies)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:14](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L14)

___

### <a id="amplificationcoefficient" name="amplificationcoefficient"></a> amplificationCoefficient

• **amplificationCoefficient**: `Big`

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[amplificationCoefficient](StableLiquidityPool.md#amplificationcoefficient)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:20](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L20)

___

### <a id="basepool" name="basepool"></a> basePool

• **basePool**: [`StableLiquidityPool`](StableLiquidityPool.md)

#### Defined in

[src/parachain/amm/liquidity-pool/stable-meta.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable-meta.ts#L18)

___

### <a id="isempty" name="isempty"></a> isEmpty

• **isEmpty**: `boolean`

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[isEmpty](StableLiquidityPool.md#isempty)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:22](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L22)

___

### <a id="lptoken" name="lptoken"></a> lpToken

• **lpToken**: [`StableLpToken`](../modules.md#stablelptoken)

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[lpToken](StableLiquidityPool.md#lptoken)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:12](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L12)

___

### <a id="poolid" name="poolid"></a> poolId

• **poolId**: `number`

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[poolId](StableLiquidityPool.md#poolid)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:19](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L19)

___

### <a id="pooledcurrencies" name="pooledcurrencies"></a> pooledCurrencies

• **pooledCurrencies**: [`PooledCurrencies`](../modules.md#pooledcurrencies)

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[pooledCurrencies](StableLiquidityPool.md#pooledcurrencies)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:16](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L16)

___

### <a id="rewardamountsyearly" name="rewardamountsyearly"></a> rewardAmountsYearly

• **rewardAmountsYearly**: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[rewardAmountsYearly](StableLiquidityPool.md#rewardamountsyearly)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:17](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L17)

___

### <a id="totalsupply" name="totalsupply"></a> totalSupply

• **totalSupply**: `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\>

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[totalSupply](StableLiquidityPool.md#totalsupply)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L21)

___

### <a id="tradingfee" name="tradingfee"></a> tradingFee

• **tradingFee**: `Big`

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[tradingFee](StableLiquidityPool.md#tradingfee)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L18)

___

### <a id="type" name="type"></a> type

• **type**: [`STABLE_PLAIN`](../enums/PoolType.md#stable_plain) \| [`STABLE_META`](../enums/PoolType.md#stable_meta)

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[type](StableLiquidityPool.md#type)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:11](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L11)

## Accessors

### <a id="_feepertoken" name="_feepertoken"></a> \_feePerToken

• `get` **_feePerToken**(): `Big`

#### Returns

`Big`

#### Inherited from

StableLiquidityPool.\_feePerToken

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:35](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L35)

___

### <a id="xp" name="xp"></a> xp

• `get` **xp**(): `Big`[]

#### Returns

`Big`[]

#### Inherited from

StableLiquidityPool.xp

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:194](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L194)

## Methods

### <a id="calculateremoveliquidityonetoken" name="calculateremoveliquidityonetoken"></a> calculateRemoveLiquidityOneToken

▸ **calculateRemoveLiquidityOneToken**(`tokenLPAmount`, `outputCurrencyIndex`): [`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]

#### Parameters

| Name | Type |
| :------ | :------ |
| `tokenLPAmount` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |
| `outputCurrencyIndex` | `number` |

#### Returns

[`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[calculateRemoveLiquidityOneToken](StableLiquidityPool.md#calculateremoveliquidityonetoken)

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

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[calculateSwap](StableLiquidityPool.md#calculateswap)

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

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[calculateTokenAmount](StableLiquidityPool.md#calculatetokenamount)

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

[StableLiquidityPool](StableLiquidityPool.md).[getLiquidityDepositInputAmounts](StableLiquidityPool.md#getliquiditydepositinputamounts)

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

[StableLiquidityPool](StableLiquidityPool.md).[getLiquidityDepositLpTokenAmount](StableLiquidityPool.md#getliquiditydepositlptokenamount)

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

[StableLiquidityPool](StableLiquidityPool.md).[getLiquidityWithdrawalPooledCurrencyAmounts](StableLiquidityPool.md#getliquiditywithdrawalpooledcurrencyamounts)

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

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[getTokenIndex](StableLiquidityPool.md#gettokenindex)

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

#### Inherited from

[StableLiquidityPool](StableLiquidityPool.md).[involvesToken](StableLiquidityPool.md#involvestoken)

#### Defined in

[src/parachain/amm/liquidity-pool/stable.ts:182](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm/liquidity-pool/stable.ts#L182)
