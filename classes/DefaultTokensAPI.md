[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultTokensAPI

# Class: DefaultTokensAPI

## Implements

- [`TokensAPI`](../interfaces/TokensAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultTokensAPI.md#constructor)

### Properties

- [api](DefaultTokensAPI.md#api)

### Methods

- [balance](DefaultTokensAPI.md#balance)
- [buildTransferExtrinsic](DefaultTokensAPI.md#buildtransferextrinsic)
- [getAccountData](DefaultTokensAPI.md#getaccountdata)
- [setBalance](DefaultTokensAPI.md#setbalance)
- [subscribeToBalance](DefaultTokensAPI.md#subscribetobalance)
- [total](DefaultTokensAPI.md#total)
- [transfer](DefaultTokensAPI.md#transfer)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultTokensAPI**(`api`): [`DefaultTokensAPI`](DefaultTokensAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |

#### Returns

[`DefaultTokensAPI`](DefaultTokensAPI.md)

#### Defined in

[src/parachain/tokens.ts:70](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L70)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/tokens.ts:70](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L70)

## Methods

### <a id="balance" name="balance"></a> balance

▸ **balance**(`currency`, `id`): `Promise`\<[`ChainBalance`](ChainBalance.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) | The currency specification, `Monetary.js` object or `ForeignAsset` |
| `id` | `AccountId` | The AccountId of a user |

#### Returns

`Promise`\<[`ChainBalance`](ChainBalance.md)\>

The user's balance

#### Implementation of

[TokensAPI](../interfaces/TokensAPI.md).[balance](../interfaces/TokensAPI.md#balance)

#### Defined in

[src/parachain/tokens.ts:82](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L82)

___

### <a id="buildtransferextrinsic" name="buildtransferextrinsic"></a> buildTransferExtrinsic

▸ **buildTransferExtrinsic**(`destination`, `amount`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a transfer extrinsic without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `destination` | `string` | The address of a user |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | The amount to transfer, as `Monetary.js` object or `ForeignAsset` |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A transfer submittable extrinsic.

#### Implementation of

[TokensAPI](../interfaces/TokensAPI.md).[buildTransferExtrinsic](../interfaces/TokensAPI.md#buildtransferextrinsic)

#### Defined in

[src/parachain/tokens.ts:111](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L111)

___

### <a id="getaccountdata" name="getaccountdata"></a> getAccountData

▸ **getAccountData**(`currency`, `id`): `Promise`\<`OrmlTokensAccountData`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |
| `id` | `AccountId` |

#### Returns

`Promise`\<`OrmlTokensAccountData`\>

#### Defined in

[src/parachain/tokens.ts:78](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L78)

___

### <a id="setbalance" name="setbalance"></a> setBalance

▸ **setBalance**(`accountId`, `freeBalance`, `lockedBalance?`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | Account whose balance to set |
| `freeBalance` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Free balance to set, as a Monetary.js object |
| `lockedBalance?` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Locked balance to set, as a Monetary.js object |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

This extrinsic is only valid if submitted by a sudo account

#### Implementation of

[TokensAPI](../interfaces/TokensAPI.md).[setBalance](../interfaces/TokensAPI.md#setbalance)

#### Defined in

[src/parachain/tokens.ts:129](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L129)

___

### <a id="subscribetobalance" name="subscribetobalance"></a> subscribeToBalance

▸ **subscribeToBalance**(`currency`, `account`, `callback`): `Promise`\<() => `void`\>

Subscribe to balance updates

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) | The currency specification, `Monetary.js` object or `ForeignAsset` |
| `account` | `string` | AccountId string |
| `callback` | (`account`: `string`, `accountData`: [`ChainBalance`](ChainBalance.md)) => `void` | Function to be called whenever the balance of an account is updated. Its parameters are (accountIdString, freeBalance) |

#### Returns

`Promise`\<() => `void`\>

#### Implementation of

[TokensAPI](../interfaces/TokensAPI.md).[subscribeToBalance](../interfaces/TokensAPI.md#subscribetobalance)

#### Defined in

[src/parachain/tokens.ts:87](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L87)

___

### <a id="total" name="total"></a> total

▸ **total**\<`CurrencyT`\>(`currency`): `Promise`\<`MonetaryAmount`\<`CurrencyT`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CurrencyT` | extends [`CurrencyExt`](../modules.md#currencyext) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currency` | `CurrencyT` | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<`CurrencyT`\>\>

The total amount in the system

#### Implementation of

[TokensAPI](../interfaces/TokensAPI.md).[total](../interfaces/TokensAPI.md#total)

#### Defined in

[src/parachain/tokens.ts:72](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L72)

___

### <a id="transfer" name="transfer"></a> transfer

▸ **transfer**(`destination`, `amount`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `destination` | `string` | The address of a user |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | The amount to transfer, as `Monetary.js` object or `ForeignAsset` |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[TokensAPI](../interfaces/TokensAPI.md).[transfer](../interfaces/TokensAPI.md#transfer)

#### Defined in

[src/parachain/tokens.ts:119](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L119)
