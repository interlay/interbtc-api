[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / TokensAPI

# Interface: TokensAPI

## Implemented by

- [`DefaultTokensAPI`](../classes/DefaultTokensAPI.md)

## Table of contents

### Methods

- [balance](TokensAPI.md#balance)
- [buildTransferExtrinsic](TokensAPI.md#buildtransferextrinsic)
- [setBalance](TokensAPI.md#setbalance)
- [subscribeToBalance](TokensAPI.md#subscribetobalance)
- [total](TokensAPI.md#total)
- [transfer](TokensAPI.md#transfer)

## Methods

### <a id="balance" name="balance"></a> balance

▸ **balance**(`currency`, `id`): `Promise`\<[`ChainBalance`](../classes/ChainBalance.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) | The currency specification, `Monetary.js` object or `ForeignAsset` |
| `id` | `AccountId` | The AccountId of a user |

#### Returns

`Promise`\<[`ChainBalance`](../classes/ChainBalance.md)\>

The user's balance

#### Defined in

[src/parachain/tokens.ts:25](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L25)

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

#### Defined in

[src/parachain/tokens.ts:33](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L33)

___

### <a id="setbalance" name="setbalance"></a> setBalance

▸ **setBalance**(`accountId`, `freeBalance`, `lockedBalance?`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | Account whose balance to set |
| `freeBalance` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Free balance to set, as a Monetary.js object |
| `lockedBalance?` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Locked balance to set, as a Monetary.js object |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

This extrinsic is only valid if submitted by a sudo account

#### Defined in

[src/parachain/tokens.ts:62](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L62)

___

### <a id="subscribetobalance" name="subscribetobalance"></a> subscribeToBalance

▸ **subscribeToBalance**(`currency`, `account`, `callback`): `Promise`\<() => `void`\>

Subscribe to balance updates

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) | The currency specification, `Monetary.js` object or `ForeignAsset` |
| `account` | `string` | AccountId string |
| `callback` | (`account`: `string`, `balance`: [`ChainBalance`](../classes/ChainBalance.md)) => `void` | Function to be called whenever the balance of an account is updated. Its parameters are (accountIdString, freeBalance) |

#### Returns

`Promise`\<() => `void`\>

#### Defined in

[src/parachain/tokens.ts:50](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L50)

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

#### Defined in

[src/parachain/tokens.ts:19](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L19)

___

### <a id="transfer" name="transfer"></a> transfer

▸ **transfer**(`destination`, `amount`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `destination` | `string` | The address of a user |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | The amount to transfer, as `Monetary.js` object or `ForeignAsset` |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/tokens.ts:42](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/tokens.ts#L42)
