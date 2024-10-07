[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / EscrowAPI

# Interface: EscrowAPI

## Implemented by

- [`DefaultEscrowAPI`](../classes/DefaultEscrowAPI.md)

## Table of contents

### Methods

- [createLock](EscrowAPI.md#createlock)
- [getMaxPeriod](EscrowAPI.md#getmaxperiod)
- [getRewardEstimate](EscrowAPI.md#getrewardestimate)
- [getRewards](EscrowAPI.md#getrewards)
- [getSpan](EscrowAPI.md#getspan)
- [getStakedBalance](EscrowAPI.md#getstakedbalance)
- [getTotalStakedBalance](EscrowAPI.md#gettotalstakedbalance)
- [increaseAmount](EscrowAPI.md#increaseamount)
- [increaseUnlockHeight](EscrowAPI.md#increaseunlockheight)
- [totalVotingSupply](EscrowAPI.md#totalvotingsupply)
- [votingBalance](EscrowAPI.md#votingbalance)
- [withdraw](EscrowAPI.md#withdraw)
- [withdrawRewards](EscrowAPI.md#withdrawrewards)

## Methods

### <a id="createlock" name="createlock"></a> createLock

▸ **createLock**(`amount`, `unlockHeight`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Governance token amount to lock (e.g. KINT or INTR) |
| `unlockHeight` | `number` | Block number to lock until |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

The amount can't be less than the max period (`getMaxPeriod` getter) to prevent rounding errors

#### Defined in

[src/parachain/escrow.ts:37](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L37)

___

### <a id="getmaxperiod" name="getmaxperiod"></a> getMaxPeriod

▸ **getMaxPeriod**(): `Promise`\<`BN`\>

#### Returns

`Promise`\<`BN`\>

The maximum time for locks.

#### Defined in

[src/parachain/escrow.ts:62](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L62)

___

### <a id="getrewardestimate" name="getrewardestimate"></a> getRewardEstimate

▸ **getRewardEstimate**(`accountId`, `amountToLock?`, `newLockEndHeight?`): `Promise`\<\{ `amount`: `MonetaryAmount`\<`Currency`\> ; `apy`: `Big`  }\>

Estimate the annualized rewards for an account's staked amounts while applying an optional amount to increase
the locked stake by, and an optional lock time extension.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | User account ID |
| `amountToLock?` | `MonetaryAmount`\<`Currency`\> | (optional) New amount to add to the current stake. Zero, null, or undefined are interpreted as no changes to the current stake for the estimation. |
| `newLockEndHeight?` | `number` | (optional) At which block number the stake lock should end. Zero, null, or undefined are interpreted as no lock extension used for the estimate. |

#### Returns

`Promise`\<\{ `amount`: `MonetaryAmount`\<`Currency`\> ; `apy`: `Big`  }\>

The estimated total reward amount and annualized reward percentage (APY).

#### Defined in

[src/parachain/escrow.ts:97](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L97)

___

### <a id="getrewards" name="getrewards"></a> getRewards

▸ **getRewards**(`accountId`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | User account ID |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The rewards that can be withdrawn by the account

**`Remarks`**

Implements https://spec.interlay.io/spec/reward.html#computereward

#### Defined in

[src/parachain/escrow.ts:84](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L84)

___

### <a id="getspan" name="getspan"></a> getSpan

▸ **getSpan**(): `Promise`\<`BN`\>

#### Returns

`Promise`\<`BN`\>

All future times are rounded by this.

#### Defined in

[src/parachain/escrow.ts:58](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L58)

___

### <a id="getstakedbalance" name="getstakedbalance"></a> getStakedBalance

▸ **getStakedBalance**(`accountId`): `Promise`\<[`StakedBalance`](../modules.md#stakedbalance)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | ID of the user whose stake to fetch |

#### Returns

`Promise`\<[`StakedBalance`](../modules.md#stakedbalance)\>

The staked amount and end block

#### Defined in

[src/parachain/escrow.ts:42](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L42)

___

### <a id="gettotalstakedbalance" name="gettotalstakedbalance"></a> getTotalStakedBalance

▸ **getTotalStakedBalance**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total amount of locked governance tokens

**`Remarks`**

- Expect poor performance from this function as more blocks are appended to the parachain.
It is not recommended to call this directly, but rather to query through interbtc-squid once implemented.

#### Defined in

[src/parachain/escrow.ts:49](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L49)

___

### <a id="increaseamount" name="increaseamount"></a> increaseAmount

▸ **increaseAmount**(`amount`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Governance token amount to lock (e.g. KINT or INTR) |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/escrow.ts:72](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L72)

___

### <a id="increaseunlockheight" name="increaseunlockheight"></a> increaseUnlockHeight

▸ **increaseUnlockHeight**(`unlockHeight`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `unlockHeight` | `number` | The unlock height to increase by. |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/escrow.ts:78](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L78)

___

### <a id="totalvotingsupply" name="totalvotingsupply"></a> totalVotingSupply

▸ **totalVotingSupply**(`blockNumber?`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `blockNumber?` | `number` | The number of block to query state at |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The voting balance

**`Remarks`**

- Expect poor performance from this function as more blocks are appended to the parachain.
It is not recommended to call this directly, but rather to query through the indexer (currently `interbtc-index`).
- Logic is duplicated from Escrow pallet in the parachain

#### Defined in

[src/parachain/escrow.ts:30](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L30)

___

### <a id="votingbalance" name="votingbalance"></a> votingBalance

▸ **votingBalance**(`accountId`, `blockNumber?`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | Account whose voting balance to fetch |
| `blockNumber?` | `number` | The number of block to query state at |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The voting balance

**`Remarks`**

Logic is duplicated from Escrow pallet in the parachain

#### Defined in

[src/parachain/escrow.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L21)

___

### <a id="withdraw" name="withdraw"></a> withdraw

▸ **withdraw**(): [`ExtrinsicData`](ExtrinsicData.md)

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Withdraws all locked governance currency

#### Defined in

[src/parachain/escrow.ts:54](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L54)

___

### <a id="withdrawrewards" name="withdrawrewards"></a> withdrawRewards

▸ **withdrawRewards**(): [`ExtrinsicData`](ExtrinsicData.md)

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Withdraws stake-to-vote rewards

#### Defined in

[src/parachain/escrow.ts:67](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L67)
