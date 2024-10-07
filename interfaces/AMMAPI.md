[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / AMMAPI

# Interface: AMMAPI

## Implemented by

- [`DefaultAMMAPI`](../classes/DefaultAMMAPI.md)

## Table of contents

### Methods

- [addLiquidity](AMMAPI.md#addliquidity)
- [claimFarmingRewards](AMMAPI.md#claimfarmingrewards)
- [getClaimableFarmingRewards](AMMAPI.md#getclaimablefarmingrewards)
- [getLiquidityPools](AMMAPI.md#getliquiditypools)
- [getLiquidityProvidedByAccount](AMMAPI.md#getliquidityprovidedbyaccount)
- [getLpTokens](AMMAPI.md#getlptokens)
- [getOptimalTrade](AMMAPI.md#getoptimaltrade)
- [removeLiquidity](AMMAPI.md#removeliquidity)
- [swap](AMMAPI.md#swap)

## Methods

### <a id="addliquidity" name="addliquidity"></a> addLiquidity

▸ **addLiquidity**(`amounts`, `pool`, `maxSlippage`, `deadline`, `recipient`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

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

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/amm.ts:134](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L134)

___

### <a id="claimfarmingrewards" name="claimfarmingrewards"></a> claimFarmingRewards

▸ **claimFarmingRewards**(`claimableRewards`): [`ExtrinsicData`](ExtrinsicData.md)

Claim all pending farming rewards.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `claimableRewards` | `Map`\<[`LpCurrency`](../modules.md#lpcurrency), `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>[]\> | Map of LpToken -> Array of reward monetary amounts -> supposed to be output of `getClaimableFarmingRewards` |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/amm.ts:168](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L168)

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

#### Defined in

[src/parachain/amm.ts:101](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L101)

___

### <a id="getliquiditypools" name="getliquiditypools"></a> getLiquidityPools

▸ **getLiquidityPools**(): `Promise`\<[`LiquidityPool`](../modules.md#liquiditypool)[]\>

Get all liquidity pools.

#### Returns

`Promise`\<[`LiquidityPool`](../modules.md#liquiditypool)[]\>

All liquidity pools.

#### Defined in

[src/parachain/amm.ts:91](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L91)

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

#### Defined in

[src/parachain/amm.ts:84](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L84)

___

### <a id="getlptokens" name="getlptokens"></a> getLpTokens

▸ **getLpTokens**(): `Promise`\<[`LpCurrency`](../modules.md#lpcurrency)[]\>

Get all LP tokens.

#### Returns

`Promise`\<[`LpCurrency`](../modules.md#lpcurrency)[]\>

Array of all standard and stable LP tokens.

#### Defined in

[src/parachain/amm.ts:61](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L61)

___

### <a id="getoptimaltrade" name="getoptimaltrade"></a> getOptimalTrade

▸ **getOptimalTrade**(`inputAmount`, `outputCurrency`, `pools`): ``null`` \| [`Trade`](../classes/Trade.md)

Get optimal trade for provided trade type and amount.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `inputAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount to be exchanged. |
| `outputCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to purchase. |
| `pools` | [`LiquidityPool`](../modules.md#liquiditypool)[] | Array of all liquidity pools. |

#### Returns

``null`` \| [`Trade`](../classes/Trade.md)

Optimal trade information or null if the trade is not possible.

#### Defined in

[src/parachain/amm.ts:71](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L71)

___

### <a id="removeliquidity" name="removeliquidity"></a> removeLiquidity

▸ **removeLiquidity**(`amount`, `pool`, `maxSlippage`, `deadline`, `recipient`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

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

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Note`**

Removes `amount` of liquidity in LP token, breaks it down and transfers to account.

#### Defined in

[src/parachain/amm.ts:153](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L153)

___

### <a id="swap" name="swap"></a> swap

▸ **swap**(`trade`, `minimumAmountOut`, `recipient`, `deadline`): [`ExtrinsicData`](ExtrinsicData.md)

Swap assets.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `trade` | [`Trade`](../classes/Trade.md) | Trade object containing information about the trade. |
| `minimumAmountOut` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Minimum output amount to be received. |
| `recipient` | `AddressOrPair` | Recipient address. |
| `deadline` | `string` \| `number` | Deadline block for the swap transaction. |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/amm.ts:116](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/amm.ts#L116)
