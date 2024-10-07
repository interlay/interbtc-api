[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultEscrowAPI

# Class: DefaultEscrowAPI

## Implements

- [`EscrowAPI`](../interfaces/EscrowAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultEscrowAPI.md#constructor)

### Properties

- [api](DefaultEscrowAPI.md#api)
- [governanceCurrency](DefaultEscrowAPI.md#governancecurrency)
- [systemApi](DefaultEscrowAPI.md#systemapi)

### Methods

- [createLock](DefaultEscrowAPI.md#createlock)
- [getEscrowStake](DefaultEscrowAPI.md#getescrowstake)
- [getEscrowTotalStake](DefaultEscrowAPI.md#getescrowtotalstake)
- [getMaxPeriod](DefaultEscrowAPI.md#getmaxperiod)
- [getRewardEstimate](DefaultEscrowAPI.md#getrewardestimate)
- [getRewardPerBlock](DefaultEscrowAPI.md#getrewardperblock)
- [getRewardPerToken](DefaultEscrowAPI.md#getrewardpertoken)
- [getRewardTally](DefaultEscrowAPI.md#getrewardtally)
- [getRewards](DefaultEscrowAPI.md#getrewards)
- [getSpan](DefaultEscrowAPI.md#getspan)
- [getStakedBalance](DefaultEscrowAPI.md#getstakedbalance)
- [getTotalStakedBalance](DefaultEscrowAPI.md#gettotalstakedbalance)
- [increaseAmount](DefaultEscrowAPI.md#increaseamount)
- [increaseUnlockHeight](DefaultEscrowAPI.md#increaseunlockheight)
- [totalVotingSupply](DefaultEscrowAPI.md#totalvotingsupply)
- [votingBalance](DefaultEscrowAPI.md#votingbalance)
- [withdraw](DefaultEscrowAPI.md#withdraw)
- [withdrawRewards](DefaultEscrowAPI.md#withdrawrewards)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultEscrowAPI**(`api`, `governanceCurrency`, `systemApi`): [`DefaultEscrowAPI`](DefaultEscrowAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `governanceCurrency` | `Currency` |
| `systemApi` | [`SystemAPI`](../interfaces/SystemAPI.md) |

#### Returns

[`DefaultEscrowAPI`](DefaultEscrowAPI.md)

#### Defined in

[src/parachain/escrow.ts:108](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L108)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/escrow.ts:109](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L109)

___

### <a id="governancecurrency" name="governancecurrency"></a> governanceCurrency

• `Private` **governanceCurrency**: `Currency`

#### Defined in

[src/parachain/escrow.ts:110](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L110)

___

### <a id="systemapi" name="systemapi"></a> systemApi

• `Private` **systemApi**: [`SystemAPI`](../interfaces/SystemAPI.md)

#### Defined in

[src/parachain/escrow.ts:111](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L111)

## Methods

### <a id="createlock" name="createlock"></a> createLock

▸ **createLock**(`amount`, `unlockHeight`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Governance token amount to lock (e.g. KINT or INTR) |
| `unlockHeight` | `number` | Block number to lock until |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

The amount can't be less than the max period (`getMaxPeriod` getter) to prevent rounding errors

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[createLock](../interfaces/EscrowAPI.md#createlock)

#### Defined in

[src/parachain/escrow.ts:114](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L114)

___

### <a id="getescrowstake" name="getescrowstake"></a> getEscrowStake

▸ **getEscrowStake**(`accountId`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/escrow.ts:206](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L206)

___

### <a id="getescrowtotalstake" name="getescrowtotalstake"></a> getEscrowTotalStake

▸ **getEscrowTotalStake**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/escrow.ts:211](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L211)

___

### <a id="getmaxperiod" name="getmaxperiod"></a> getMaxPeriod

▸ **getMaxPeriod**(): `Promise`\<`BN`\>

#### Returns

`Promise`\<`BN`\>

The maximum time for locks.

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[getMaxPeriod](../interfaces/EscrowAPI.md#getmaxperiod)

#### Defined in

[src/parachain/escrow.ts:265](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L265)

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

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[getRewardEstimate](../interfaces/EscrowAPI.md#getrewardestimate)

#### Defined in

[src/parachain/escrow.ts:147](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L147)

___

### <a id="getrewardperblock" name="getrewardperblock"></a> getRewardPerBlock

▸ **getRewardPerBlock**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Defined in

[src/parachain/escrow.ts:228](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L228)

___

### <a id="getrewardpertoken" name="getrewardpertoken"></a> getRewardPerToken

▸ **getRewardPerToken**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/escrow.ts:222](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L222)

___

### <a id="getrewardtally" name="getrewardtally"></a> getRewardTally

▸ **getRewardTally**(`accountId`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/escrow.ts:216](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L216)

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

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[getRewards](../interfaces/EscrowAPI.md#getrewards)

#### Defined in

[src/parachain/escrow.ts:139](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L139)

___

### <a id="getspan" name="getspan"></a> getSpan

▸ **getSpan**(): `Promise`\<`BN`\>

#### Returns

`Promise`\<`BN`\>

All future times are rounded by this.

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[getSpan](../interfaces/EscrowAPI.md#getspan)

#### Defined in

[src/parachain/escrow.ts:261](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L261)

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

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[getStakedBalance](../interfaces/EscrowAPI.md#getstakedbalance)

#### Defined in

[src/parachain/escrow.ts:233](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L233)

___

### <a id="gettotalstakedbalance" name="gettotalstakedbalance"></a> getTotalStakedBalance

▸ **getTotalStakedBalance**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total amount of locked governance tokens

**`Remarks`**

- Expect poor performance from this function as more blocks are appended to the parachain.
It is not recommended to call this directly, but rather to query through interbtc-squid once implemented.

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[getTotalStakedBalance](../interfaces/EscrowAPI.md#gettotalstakedbalance)

#### Defined in

[src/parachain/escrow.ts:238](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L238)

___

### <a id="increaseamount" name="increaseamount"></a> increaseAmount

▸ **increaseAmount**(`amount`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Governance token amount to lock (e.g. KINT or INTR) |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[increaseAmount](../interfaces/EscrowAPI.md#increaseamount)

#### Defined in

[src/parachain/escrow.ts:129](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L129)

___

### <a id="increaseunlockheight" name="increaseunlockheight"></a> increaseUnlockHeight

▸ **increaseUnlockHeight**(`unlockHeight`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `unlockHeight` | `number` | The unlock height to increase by. |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[increaseUnlockHeight](../interfaces/EscrowAPI.md#increaseunlockheight)

#### Defined in

[src/parachain/escrow.ts:134](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L134)

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

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[totalVotingSupply](../interfaces/EscrowAPI.md#totalvotingsupply)

#### Defined in

[src/parachain/escrow.ts:255](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L255)

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

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[votingBalance](../interfaces/EscrowAPI.md#votingbalance)

#### Defined in

[src/parachain/escrow.ts:249](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L249)

___

### <a id="withdraw" name="withdraw"></a> withdraw

▸ **withdraw**(): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Withdraws all locked governance currency

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[withdraw](../interfaces/EscrowAPI.md#withdraw)

#### Defined in

[src/parachain/escrow.ts:119](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L119)

___

### <a id="withdrawrewards" name="withdrawrewards"></a> withdrawRewards

▸ **withdrawRewards**(): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Withdraws stake-to-vote rewards

#### Implementation of

[EscrowAPI](../interfaces/EscrowAPI.md).[withdrawRewards](../interfaces/EscrowAPI.md#withdrawrewards)

#### Defined in

[src/parachain/escrow.ts:124](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/escrow.ts#L124)
