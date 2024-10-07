[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultRewardsAPI

# Class: DefaultRewardsAPI

## Implements

- [`RewardsAPI`](../interfaces/RewardsAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultRewardsAPI.md#constructor)

### Properties

- [api](DefaultRewardsAPI.md#api)
- [wrappedCurrency](DefaultRewardsAPI.md#wrappedcurrency)

### Methods

- [computeCollateralInStakingPool](DefaultRewardsAPI.md#computecollateralinstakingpool)
- [getStakingPoolNonce](DefaultRewardsAPI.md#getstakingpoolnonce)
- [withdrawRewards](DefaultRewardsAPI.md#withdrawrewards)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultRewardsAPI**(`api`, `wrappedCurrency`): [`DefaultRewardsAPI`](DefaultRewardsAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `wrappedCurrency` | `Currency` |

#### Returns

[`DefaultRewardsAPI`](DefaultRewardsAPI.md)

#### Defined in

[src/parachain/rewards.ts:42](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L42)

## Properties

### <a id="api" name="api"></a> api

• **api**: `ApiPromise`

#### Defined in

[src/parachain/rewards.ts:42](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L42)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/rewards.ts:42](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L42)

## Methods

### <a id="computecollateralinstakingpool" name="computecollateralinstakingpool"></a> computeCollateralInStakingPool

▸ **computeCollateralInStakingPool**(`vaultId`, `nominatorId`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | The account ID of the staking pool nominee |
| `nominatorId` | `AccountId` | The account ID of the staking pool nominator |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

A Monetary.js amount object, representing the collateral in the given currency

#### Implementation of

[RewardsAPI](../interfaces/RewardsAPI.md).[computeCollateralInStakingPool](../interfaces/RewardsAPI.md#computecollateralinstakingpool)

#### Defined in

[src/parachain/rewards.ts:50](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L50)

___

### <a id="getstakingpoolnonce" name="getstakingpoolnonce"></a> getStakingPoolNonce

▸ **getStakingPoolNonce**(`collateralCurrency`, `vaultAccountId`): `Promise`\<`number`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The staked currency |
| `vaultAccountId` | `AccountId` | The account ID of the staking pool nominee |

#### Returns

`Promise`\<`number`\>

The current nonce of the staking pool

#### Implementation of

[RewardsAPI](../interfaces/RewardsAPI.md).[getStakingPoolNonce](../interfaces/RewardsAPI.md#getstakingpoolnonce)

#### Defined in

[src/parachain/rewards.ts:44](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L44)

___

### <a id="withdrawrewards" name="withdrawrewards"></a> withdrawRewards

▸ **withdrawRewards**(`vaultId`, `nonce?`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | VaultId object |
| `nonce?` | `number` | Staking pool nonce |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Withdraw all rewards from the current account in the `vaultId` staking pool.

#### Implementation of

[RewardsAPI](../interfaces/RewardsAPI.md).[withdrawRewards](../interfaces/RewardsAPI.md#withdrawrewards)

#### Defined in

[src/parachain/rewards.ts:70](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L70)
