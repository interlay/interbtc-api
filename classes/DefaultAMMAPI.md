[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultAMMAPI

# Class: DefaultAMMAPI

## Implements

- [`AMMAPI`](../interfaces/AMMAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultAMMAPI.md#constructor)

### Properties

- [api](DefaultAMMAPI.md#api)
- [tokensAPI](DefaultAMMAPI.md#tokensapi)

### Methods

- [\_getClaimableFarmingRewardsByPool](DefaultAMMAPI.md#_getclaimablefarmingrewardsbypool)
- [\_getFarmingRewardCurrencyIds](DefaultAMMAPI.md#_getfarmingrewardcurrencyids)
- [\_getLiquidityDepositStablePoolParams](DefaultAMMAPI.md#_getliquiditydepositstablepoolparams)
- [\_getLiquidityDepositStandardPoolParams](DefaultAMMAPI.md#_getliquiditydepositstandardpoolparams)
- [\_getLiquidityWithdrawalStablePoolParams](DefaultAMMAPI.md#_getliquiditywithdrawalstablepoolparams)
- [\_getLiquidityWithdrawalStandardPoolParams](DefaultAMMAPI.md#_getliquiditywithdrawalstandardpoolparams)
- [\_getPoolRewardAmountsYearly](DefaultAMMAPI.md#_getpoolrewardamountsyearly)
- [\_getStableBasePooledCurrenciesAdjustedToLpTokenAmount](DefaultAMMAPI.md#_getstablebasepooledcurrenciesadjustedtolptokenamount)
- [\_getStableLiquidityPool](DefaultAMMAPI.md#_getstableliquiditypool)
- [\_getStableLiquidityPoolData](DefaultAMMAPI.md#_getstableliquiditypooldata)
- [\_getStableLpTokens](DefaultAMMAPI.md#_getstablelptokens)
- [\_getStableMetaPoolBasePool](DefaultAMMAPI.md#_getstablemetapoolbasepool)
- [\_getStablePoolAmplificationCoefficient](DefaultAMMAPI.md#_getstablepoolamplificationcoefficient)
- [\_getStablePoolPooledCurrencies](DefaultAMMAPI.md#_getstablepoolpooledcurrencies)
- [\_getStandardLiquidityPool](DefaultAMMAPI.md#_getstandardliquiditypool)
- [\_getStandardLpTokens](DefaultAMMAPI.md#_getstandardlptokens)
- [\_getStandardPoolReserveBalances](DefaultAMMAPI.md#_getstandardpoolreservebalances)
- [\_poolHasZeroLiquidity](DefaultAMMAPI.md#_poolhaszeroliquidity)
- [\_swapThroughStandardAndStablePools](DefaultAMMAPI.md#_swapthroughstandardandstablepools)
- [\_swapThroughStandardPoolsOnly](DefaultAMMAPI.md#_swapthroughstandardpoolsonly)
- [addLiquidity](DefaultAMMAPI.md#addliquidity)
- [claimFarmingRewards](DefaultAMMAPI.md#claimfarmingrewards)
- [getClaimableFarmingRewards](DefaultAMMAPI.md#getclaimablefarmingrewards)
- [getLiquidityPools](DefaultAMMAPI.md#getliquiditypools)
- [getLiquidityProvidedByAccount](DefaultAMMAPI.md#getliquidityprovidedbyaccount)
- [getLpTokens](DefaultAMMAPI.md#getlptokens)
- [getOptimalTrade](DefaultAMMAPI.md#getoptimaltrade)
- [getStableLiquidityPools](DefaultAMMAPI.md#getstableliquiditypools)
- [getStandardLiquidityPools](DefaultAMMAPI.md#getstandardliquiditypools)
- [removeLiquidity](DefaultAMMAPI.md#removeliquidity)
- [swap](DefaultAMMAPI.md#swap)
- [getStableLpTokenFromPoolData](DefaultAMMAPI.md#getstablelptokenfrompooldata)
- [getStablePoolInfo](DefaultAMMAPI.md#getstablepoolinfo)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultAMMAPI**(`api`, `tokensAPI`): [`DefaultAMMAPI`](DefaultAMMAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `tokensAPI` | [`TokensAPI`](../interfaces/TokensAPI.md) |

#### Returns

[`DefaultAMMAPI`](DefaultAMMAPI.md)

#### Defined in

[src/parachain/amm.ts:197](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L197)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/amm.ts:197](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L197)

___

### <a id="tokensapi" name="tokensapi"></a> tokensAPI

• `Private` **tokensAPI**: [`TokensAPI`](../interfaces/TokensAPI.md)

#### Defined in

[src/parachain/amm.ts:197](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L197)

## Methods

### <a id="_getclaimablefarmingrewardsbypool" name="_getclaimablefarmingrewardsbypool"></a> \_getClaimableFarmingRewardsByPool

▸ **_getClaimableFarmingRewardsByPool**(`accountId`, `lpToken`): `Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |
| `lpToken` | [`LpCurrency`](../modules.md#lpcurrency) |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>

#### Defined in

[src/parachain/amm.ts:607](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L607)

___

### <a id="_getfarmingrewardcurrencyids" name="_getfarmingrewardcurrencyids"></a> \_getFarmingRewardCurrencyIds

▸ **_getFarmingRewardCurrencyIds**(`lpTokenCurrencyId`): `Promise`\<[`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `lpTokenCurrencyId` | [`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md) |

#### Returns

`Promise`\<[`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md)[]\>

#### Defined in

[src/parachain/amm.ts:597](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L597)

___

### <a id="_getliquiditydepositstablepoolparams" name="_getliquiditydepositstablepoolparams"></a> \_getLiquidityDepositStablePoolParams

▸ **_getLiquidityDepositStablePoolParams**(`amounts`, `pool`, `maxSlippageComplement`, `deadline`, `recipient`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `amounts` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `pool` | [`StableLiquidityPool`](StableLiquidityPool.md) |
| `maxSlippageComplement` | `number` |
| `deadline` | `number` |
| `recipient` | `AddressOrPair` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Defined in

[src/parachain/amm.ts:706](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L706)

___

### <a id="_getliquiditydepositstandardpoolparams" name="_getliquiditydepositstandardpoolparams"></a> \_getLiquidityDepositStandardPoolParams

▸ **_getLiquidityDepositStandardPoolParams**(`amounts`, `pool`, `maxSlippageComplement`, `deadline`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `amounts` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `pool` | [`StandardLiquidityPool`](StandardLiquidityPool.md) |
| `maxSlippageComplement` | `number` |
| `deadline` | `number` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Defined in

[src/parachain/amm.ts:670](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L670)

___

### <a id="_getliquiditywithdrawalstablepoolparams" name="_getliquiditywithdrawalstablepoolparams"></a> \_getLiquidityWithdrawalStablePoolParams

▸ **_getLiquidityWithdrawalStablePoolParams**(`amount`, `pool`, `maxSlippageComplement`, `recipient`, `deadline`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |
| `pool` | [`StableLiquidityPool`](StableLiquidityPool.md) |
| `maxSlippageComplement` | `number` |
| `recipient` | `AddressOrPair` |
| `deadline` | `number` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Defined in

[src/parachain/amm.ts:830](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L830)

___

### <a id="_getliquiditywithdrawalstandardpoolparams" name="_getliquiditywithdrawalstandardpoolparams"></a> \_getLiquidityWithdrawalStandardPoolParams

▸ **_getLiquidityWithdrawalStandardPoolParams**(`amount`, `pool`, `maxSlippageComplement`, `recipient`, `deadline`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `MonetaryAmount`\<[`StandardLpToken`](../modules.md#standardlptoken)\> |
| `pool` | [`StandardLiquidityPool`](StandardLiquidityPool.md) |
| `maxSlippageComplement` | `number` |
| `recipient` | `AddressOrPair` |
| `deadline` | `number` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Defined in

[src/parachain/amm.ts:806](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L806)

___

### <a id="_getpoolrewardamountsyearly" name="_getpoolrewardamountsyearly"></a> \_getPoolRewardAmountsYearly

▸ **_getPoolRewardAmountsYearly**(`lpTokenCurrencyId`, `blockTimeMs`): `Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `lpTokenCurrencyId` | [`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md) |
| `blockTimeMs` | `number` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>

#### Defined in

[src/parachain/amm.ts:276](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L276)

___

### <a id="_getstablebasepooledcurrenciesadjustedtolptokenamount" name="_getstablebasepooledcurrenciesadjustedtolptokenamount"></a> \_getStableBasePooledCurrenciesAdjustedToLpTokenAmount

▸ **_getStableBasePooledCurrenciesAdjustedToLpTokenAmount**(`basePooledCurrencies`, `lpTokenTotalSupply`, `metaPoolLpTokenAmount`): `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `basePooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `lpTokenTotalSupply` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |
| `metaPoolLpTokenAmount` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |

#### Returns

`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]

#### Defined in

[src/parachain/amm.ts:395](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L395)

___

### <a id="_getstableliquiditypool" name="_getstableliquiditypool"></a> \_getStableLiquidityPool

▸ **_getStableLiquidityPool**(`poolId`, `poolData`, `blockTimeMs`, `metaPoolLpTokenAmount?`): `Promise`\<``null`` \| [`StableLiquidityPool`](StableLiquidityPool.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `poolId` | `number` |
| `poolData` | `DexStablePrimitivesPool` |
| `blockTimeMs` | `number` |
| `metaPoolLpTokenAmount?` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |

#### Returns

`Promise`\<``null`` \| [`StableLiquidityPool`](StableLiquidityPool.md)\>

#### Defined in

[src/parachain/amm.ts:472](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L472)

___

### <a id="_getstableliquiditypooldata" name="_getstableliquiditypooldata"></a> \_getStableLiquidityPoolData

▸ **_getStableLiquidityPoolData**(`poolId`, `poolData`, `blockTimeMs`, `metaPoolLpTokenAmount?`): `Promise`\<``null`` \| \{ `actuallyPooledCurrencies`: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[] ; `amplificationCoefficient`: `Big` ; `lpToken`: [`StableLpToken`](../modules.md#stablelptoken) ; `totalSupply`: `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> ; `tradingFee`: `Big` ; `yearlyRewards`: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `poolId` | `number` |
| `poolData` | `DexStablePrimitivesPool` |
| `blockTimeMs` | `number` |
| `metaPoolLpTokenAmount?` | `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> |

#### Returns

`Promise`\<``null`` \| \{ `actuallyPooledCurrencies`: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[] ; `amplificationCoefficient`: `Big` ; `lpToken`: [`StableLpToken`](../modules.md#stablelptoken) ; `totalSupply`: `MonetaryAmount`\<[`StableLpToken`](../modules.md#stablelptoken)\> ; `tradingFee`: `Big` ; `yearlyRewards`: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]  }\>

#### Defined in

[src/parachain/amm.ts:404](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L404)

___

### <a id="_getstablelptokens" name="_getstablelptokens"></a> \_getStableLpTokens

▸ **_getStableLpTokens**(): `Promise`\<[`StableLpToken`](../modules.md#stablelptoken)[]\>

#### Returns

`Promise`\<[`StableLpToken`](../modules.md#stablelptoken)[]\>

#### Defined in

[src/parachain/amm.ts:233](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L233)

___

### <a id="_getstablemetapoolbasepool" name="_getstablemetapoolbasepool"></a> \_getStableMetaPoolBasePool

▸ **_getStableMetaPoolBasePool**(`poolData`, `pooledCurrencies`, `blockTimeMs`): `Promise`\<[`StableLiquidityPool`](StableLiquidityPool.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `poolData` | `DexStablePrimitivesMetaPool` |
| `pooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |
| `blockTimeMs` | `number` |

#### Returns

`Promise`\<[`StableLiquidityPool`](StableLiquidityPool.md)\>

#### Defined in

[src/parachain/amm.ts:442](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L442)

___

### <a id="_getstablepoolamplificationcoefficient" name="_getstablepoolamplificationcoefficient"></a> \_getStablePoolAmplificationCoefficient

▸ **_getStablePoolAmplificationCoefficient**(`poolId`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `poolId` | `number` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/amm.ts:380](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L380)

___

### <a id="_getstablepoolpooledcurrencies" name="_getstablepoolpooledcurrencies"></a> \_getStablePoolPooledCurrencies

▸ **_getStablePoolPooledCurrencies**(`currencyIds`, `balances`): `Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyIds` | [`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md)[] |
| `balances` | `u128`[] |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>

#### Defined in

[src/parachain/amm.ts:365](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L365)

___

### <a id="_getstandardliquiditypool" name="_getstandardliquiditypool"></a> \_getStandardLiquidityPool

▸ **_getStandardLiquidityPool**(`pairCurrencies`, `lpTokenCurrencyId`, `pairStatus`, `blockTimeMs`): `Promise`\<``null`` \| [`StandardLiquidityPool`](StandardLiquidityPool.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `pairCurrencies` | [[`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md), [`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md)] |
| `lpTokenCurrencyId` | [`InterbtcPrimitivesCurrencyId`](../interfaces/InterbtcPrimitivesCurrencyId.md) |
| `pairStatus` | `DexGeneralPrimitivesPairStatus` |
| `blockTimeMs` | `number` |

#### Returns

`Promise`\<``null`` \| [`StandardLiquidityPool`](StandardLiquidityPool.md)\>

#### Defined in

[src/parachain/amm.ts:293](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L293)

___

### <a id="_getstandardlptokens" name="_getstandardlptokens"></a> \_getStandardLpTokens

▸ **_getStandardLpTokens**(): `Promise`\<[`StandardLpToken`](../modules.md#standardlptoken)[]\>

#### Returns

`Promise`\<[`StandardLpToken`](../modules.md#standardlptoken)[]\>

#### Defined in

[src/parachain/amm.ts:222](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L222)

___

### <a id="_getstandardpoolreservebalances" name="_getstandardpoolreservebalances"></a> \_getStandardPoolReserveBalances

▸ **_getStandardPoolReserveBalances**(`token0`, `token1`, `pairAccount`): `Promise`\<[`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `token0` | [`CurrencyExt`](../modules.md#currencyext) |
| `token1` | [`CurrencyExt`](../modules.md#currencyext) |
| `pairAccount` | `AccountId` |

#### Returns

`Promise`\<[`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]\>

#### Defined in

[src/parachain/amm.ts:261](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L261)

___

### <a id="_poolhaszeroliquidity" name="_poolhaszeroliquidity"></a> \_poolHasZeroLiquidity

▸ **_poolHasZeroLiquidity**(`pooledCurrencies`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pooledCurrencies` | [`PooledCurrencies`](../modules.md#pooledcurrencies) |

#### Returns

`boolean`

#### Defined in

[src/parachain/amm.ts:257](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L257)

___

### <a id="_swapthroughstandardandstablepools" name="_swapthroughstandardandstablepools"></a> \_swapThroughStandardAndStablePools

▸ **_swapThroughStandardAndStablePools**(`trade`, `minimumAmountOut`, `recipient`, `deadline`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `trade` | [`Trade`](Trade.md) |
| `minimumAmountOut` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |
| `recipient` | `AddressOrPair` |
| `deadline` | `string` \| `number` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Defined in

[src/parachain/amm.ts:575](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L575)

___

### <a id="_swapthroughstandardpoolsonly" name="_swapthroughstandardpoolsonly"></a> \_swapThroughStandardPoolsOnly

▸ **_swapThroughStandardPoolsOnly**(`trade`, `minimumAmountOut`, `recipient`, `deadline`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `trade` | [`Trade`](Trade.md) |
| `minimumAmountOut` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |
| `recipient` | `AddressOrPair` |
| `deadline` | `string` \| `number` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Defined in

[src/parachain/amm.ts:552](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L552)

___

### <a id="addliquidity" name="addliquidity"></a> addLiquidity

▸ **addLiquidity**(`amounts`, `pool`, `maxSlippage`, `deadline`, `recipient`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Adds liquidity to liquidity pool

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amounts` | [`PooledCurrencies`](../modules.md#pooledcurrencies) | Array of monetary amounts of pooled currencies sorted in the same order as in the pool. |
| `pool` | [`LiquidityPool`](../modules.md#liquiditypool) | Type of liquidity pool. |
| `maxSlippage` | `number` | Maximum allowed slippage. |
| `deadline` | `number` | Deadline block number. |
| `recipient` | `AddressOrPair` | Recipient of the liquidity pool token. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[addLiquidity](../interfaces/AMMAPI.md#addliquidity)

#### Defined in

[src/parachain/amm.ts:770](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L770)

___

### <a id="claimfarmingrewards" name="claimfarmingrewards"></a> claimFarmingRewards

▸ **claimFarmingRewards**(`claimableRewards`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Claim all pending farming rewards.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `claimableRewards` | `Map`\<[`LpCurrency`](../modules.md#lpcurrency), `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\> | Map of LpToken -> Array of reward monetary amounts -> supposed to be output of `getClaimableFarmingRewards` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[claimFarmingRewards](../interfaces/AMMAPI.md#claimfarmingrewards)

#### Defined in

[src/parachain/amm.ts:930](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L930)

___

### <a id="getclaimablefarmingrewards" name="getclaimablefarmingrewards"></a> getClaimableFarmingRewards

▸ **getClaimableFarmingRewards**(`accountId`, `accountLiquidity`, `pools`): `Promise`\<`Map`\<[`LpCurrency`](../modules.md#lpcurrency), `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>\>

Get claimable farming reward amounts for all farmed liquidity provided by account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | Account id for which to get claimable rewards. |
| `accountLiquidity` | `MonetaryAmount`\<[`LpCurrency`](../modules.md#lpcurrency)\>[] | Amount of liquidity the account has provided. |
| `pools` | [`LiquidityPool`](../modules.md#liquiditypool)[] | All liquidity pools. |

#### Returns

`Promise`\<`Map`\<[`LpCurrency`](../modules.md#lpcurrency), `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\>\>

Map of LpCurrency -> Array of reward monetary amounts.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[getClaimableFarmingRewards](../interfaces/AMMAPI.md#getclaimablefarmingrewards)

#### Defined in

[src/parachain/amm.ts:631](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L631)

___

### <a id="getliquiditypools" name="getliquiditypools"></a> getLiquidityPools

▸ **getLiquidityPools**(): `Promise`\<[`LiquidityPool`](../modules.md#liquiditypool)[]\>

Get all liquidity pools.

#### Returns

`Promise`\<[`LiquidityPool`](../modules.md#liquiditypool)[]\>

All liquidity pools.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[getLiquidityPools](../interfaces/AMMAPI.md#getliquiditypools)

#### Defined in

[src/parachain/amm.ts:542](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L542)

___

### <a id="getliquidityprovidedbyaccount" name="getliquidityprovidedbyaccount"></a> getLiquidityProvidedByAccount

▸ **getLiquidityProvidedByAccount**(`accountId`): `Promise`\<`MonetaryAmount`\<[`LpCurrency`](../modules.md#lpcurrency)\>[]\>

Get liquidity provided by account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | Account to get provided liquidity information about. |

#### Returns

`Promise`\<`MonetaryAmount`\<[`LpCurrency`](../modules.md#lpcurrency)\>[]\>

Array of LP token amounts that represent
         account's positions in respective liquidity pools.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[getLiquidityProvidedByAccount](../interfaces/AMMAPI.md#getliquidityprovidedbyaccount)

#### Defined in

[src/parachain/amm.ts:213](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L213)

___

### <a id="getlptokens" name="getlptokens"></a> getLpTokens

▸ **getLpTokens**(): `Promise`\<[`LpCurrency`](../modules.md#lpcurrency)[]\>

Get all LP tokens.

#### Returns

`Promise`\<[`LpCurrency`](../modules.md#lpcurrency)[]\>

Array of all standard and stable LP tokens.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[getLpTokens](../interfaces/AMMAPI.md#getlptokens)

#### Defined in

[src/parachain/amm.ts:248](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L248)

___

### <a id="getoptimaltrade" name="getoptimaltrade"></a> getOptimalTrade

▸ **getOptimalTrade**(`inputAmount`, `outputCurrency`, `pools`): ``null`` \| [`Trade`](Trade.md)

Get optimal trade for provided trade type and amount.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `inputAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount to be exchanged. |
| `outputCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to purchase. |
| `pools` | [`LiquidityPool`](../modules.md#liquiditypool)[] | Array of all liquidity pools. |

#### Returns

``null`` \| [`Trade`](Trade.md)

Optimal trade information or null if the trade is not possible.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[getOptimalTrade](../interfaces/AMMAPI.md#getoptimaltrade)

#### Defined in

[src/parachain/amm.ts:199](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L199)

___

### <a id="getstableliquiditypools" name="getstableliquiditypools"></a> getStableLiquidityPools

▸ **getStableLiquidityPools**(`blockTimeMs`): `Promise`\<[`StableLiquidityPool`](StableLiquidityPool.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockTimeMs` | `number` |

#### Returns

`Promise`\<[`StableLiquidityPool`](StableLiquidityPool.md)[]\>

#### Defined in

[src/parachain/amm.ts:530](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L530)

___

### <a id="getstandardliquiditypools" name="getstandardliquiditypools"></a> getStandardLiquidityPools

▸ **getStandardLiquidityPools**(`blockTimeMs`): `Promise`\<[`StandardLiquidityPool`](StandardLiquidityPool.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockTimeMs` | `number` |

#### Returns

`Promise`\<[`StandardLiquidityPool`](StandardLiquidityPool.md)[]\>

#### Defined in

[src/parachain/amm.ts:345](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L345)

___

### <a id="removeliquidity" name="removeliquidity"></a> removeLiquidity

▸ **removeLiquidity**(`amount`, `pool`, `maxSlippage`, `deadline`, `recipient`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Removes liquidity from pool.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`LpCurrency`](../modules.md#lpcurrency)\> | Amount of LP token to be removed |
| `pool` | [`LiquidityPool`](../modules.md#liquiditypool) | Liquidity pool to remove from. |
| `maxSlippage` | `number` | Maximum allowed slippage. |
| `deadline` | `number` | Deadline block number. |
| `recipient` | `AddressOrPair` | Recipient of the pooled currencies. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Note`**

Removes `amount` of liquidity in LP token, breaks it down and transfers to account.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[removeLiquidity](../interfaces/AMMAPI.md#removeliquidity)

#### Defined in

[src/parachain/amm.ts:882](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L882)

___

### <a id="swap" name="swap"></a> swap

▸ **swap**(`trade`, `minimumAmountOut`, `recipient`, `deadline`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Swap assets.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `trade` | [`Trade`](Trade.md) | Trade object containing information about the trade. |
| `minimumAmountOut` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Minimum output amount to be received. |
| `recipient` | `AddressOrPair` | Recipient address. |
| `deadline` | `string` \| `number` | Deadline block for the swap transaction. |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[AMMAPI](../interfaces/AMMAPI.md).[swap](../interfaces/AMMAPI.md#swap)

#### Defined in

[src/parachain/amm.ts:656](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L656)

___

### <a id="getstablelptokenfrompooldata" name="getstablelptokenfrompooldata"></a> getStableLpTokenFromPoolData

▸ **getStableLpTokenFromPoolData**(`poolId`, `basePoolData`): [`StableLpToken`](../modules.md#stablelptoken)

#### Parameters

| Name | Type |
| :------ | :------ |
| `poolId` | `number` |
| `basePoolData` | `DexStablePrimitivesBasePool` |

#### Returns

[`StableLpToken`](../modules.md#stablelptoken)

#### Defined in

[src/parachain/amm.ts:182](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L182)

___

### <a id="getstablepoolinfo" name="getstablepoolinfo"></a> getStablePoolInfo

▸ **getStablePoolInfo**(`poolData`): ``null`` \| `DexStablePrimitivesBasePool`

#### Parameters

| Name | Type |
| :------ | :------ |
| `poolData` | `DexStablePrimitivesPool` |

#### Returns

``null`` \| `DexStablePrimitivesBasePool`

#### Defined in

[src/parachain/amm.ts:172](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L172)
