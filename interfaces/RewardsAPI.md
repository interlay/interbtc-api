[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / RewardsAPI

# Interface: RewardsAPI

## Implemented by

- [`DefaultRewardsAPI`](../classes/DefaultRewardsAPI.md)

## Table of contents

### Methods

- [computeCollateralInStakingPool](RewardsAPI.md#computecollateralinstakingpool)
- [getStakingPoolNonce](RewardsAPI.md#getstakingpoolnonce)
- [withdrawRewards](RewardsAPI.md#withdrawrewards)

## Methods

### <a id="computecollateralinstakingpool" name="computecollateralinstakingpool"></a> computeCollateralInStakingPool

▸ **computeCollateralInStakingPool**(`vaultId`, `nominatorId`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | The account ID of the staking pool nominee |
| `nominatorId` | `AccountId` | The account ID of the staking pool nominator |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

A Monetary.js amount object, representing the collateral in the given currency

#### Defined in

[src/parachain/rewards.ts:28](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L28)

___

### <a id="getstakingpoolnonce" name="getstakingpoolnonce"></a> getStakingPoolNonce

▸ **getStakingPoolNonce**(`currency`, `vaultId`): `Promise`\<`number`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) | The staked currency |
| `vaultId` | `AccountId` | The account ID of the staking pool nominee |

#### Returns

`Promise`\<`number`\>

The current nonce of the staking pool

#### Defined in

[src/parachain/rewards.ts:22](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L22)

___

### <a id="withdrawrewards" name="withdrawrewards"></a> withdrawRewards

▸ **withdrawRewards**(`vaultId`, `nonce?`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | VaultId object |
| `nonce?` | `number` | Staking pool nonce |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Withdraw all rewards from the current account in the `vaultId` staking pool.

#### Defined in

[src/parachain/rewards.ts:38](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/rewards.ts#L38)
