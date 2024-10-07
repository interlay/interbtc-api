[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / IssueAPI

# Interface: IssueAPI

## Implemented by

- [`DefaultIssueAPI`](../classes/DefaultIssueAPI.md)

## Table of contents

### Methods

- [buildCancelIssueExtrinsic](IssueAPI.md#buildcancelissueextrinsic)
- [buildExecuteIssueExtrinsic](IssueAPI.md#buildexecuteissueextrinsic)
- [buildRequestIssueExtrinsic](IssueAPI.md#buildrequestissueextrinsic)
- [cancel](IssueAPI.md#cancel)
- [execute](IssueAPI.md#execute)
- [getDustValue](IssueAPI.md#getdustvalue)
- [getFeeRate](IssueAPI.md#getfeerate)
- [getFeesToPay](IssueAPI.md#getfeestopay)
- [getIssuePeriod](IssueAPI.md#getissueperiod)
- [getRequestById](IssueAPI.md#getrequestbyid)
- [getRequestLimits](IssueAPI.md#getrequestlimits)
- [getRequestsByIds](IssueAPI.md#getrequestsbyids)
- [getVaultIssuableAmount](IssueAPI.md#getvaultissuableamount)
- [list](IssueAPI.md#list)
- [request](IssueAPI.md#request)
- [requestAdvanced](IssueAPI.md#requestadvanced)
- [setIssuePeriod](IssueAPI.md#setissueperiod)

## Methods

### <a id="buildcancelissueextrinsic" name="buildcancelissueextrinsic"></a> buildCancelIssueExtrinsic

▸ **buildCancelIssueExtrinsic**(`issueId`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a cancel issue extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `issueId` | `string` | The ID returned by the issue request transaction |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A cancel issue submittable extrinsic.

#### Defined in

[src/parachain/issue.ts:123](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L123)

___

### <a id="buildexecuteissueextrinsic" name="buildexecuteissueextrinsic"></a> buildExecuteIssueExtrinsic

▸ **buildExecuteIssueExtrinsic**(`issueId`, `btcTxId`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

Build an issue execution extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `issueId` | `string` | The ID returned by the issue request transaction |
| `btcTxId` | `string` | Bitcoin transaction ID |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

An execute issue submittable extrinsic.

#### Defined in

[src/parachain/issue.ts:102](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L102)

___

### <a id="buildrequestissueextrinsic" name="buildrequestissueextrinsic"></a> buildRequestIssueExtrinsic

▸ **buildRequestIssueExtrinsic**(`vaultId`, `amount`, `griefingCollateralCurrency?`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build an issue request extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | The vault ID of the vault to issue with. |
| `amount` | `MonetaryAmount`\<`Currency`\> | wrapped token amount to issue. |
| `griefingCollateralCurrency?` | [`CurrencyExt`](../modules.md#currencyext) | (optional) Currency in which griefing collateral will be locked. |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

An execute issue submittable extrinsic.

#### Defined in

[src/parachain/issue.ts:55](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L55)

___

### <a id="cancel" name="cancel"></a> cancel

▸ **cancel**(`issueId`): [`ExtrinsicData`](ExtrinsicData.md)

Create an issue cancellation transaction. After the issue period has elapsed,
the issuance request can be cancelled. As a result, the griefing collateral
of the requester will be slashed and sent to the vault that had prepared to issue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `issueId` | `string` | The ID returned by the issue request transaction |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/issue.ts:132](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L132)

___

### <a id="execute" name="execute"></a> execute

▸ **execute**(`requestId`, `btcTxId`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Create an issue execution transaction

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestId` | `string` | - |
| `btcTxId` | `string` | Bitcoin transaction ID |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

If `txId` is not set, the `merkleProof` and `rawTx` must both be set.

#### Defined in

[src/parachain/issue.ts:115](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L115)

___

### <a id="getdustvalue" name="getdustvalue"></a> getDustValue

▸ **getDustValue**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The minimum amount of wrapped tokens that is accepted for issue requests; any lower values would
risk the bitcoin client to reject the payment

#### Defined in

[src/parachain/issue.ts:166](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L166)

___

### <a id="getfeerate" name="getfeerate"></a> getFeeRate

▸ **getFeeRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The fee charged for issuing. For instance, "0.005" stands for 0.5%

#### Defined in

[src/parachain/issue.ts:170](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L170)

___

### <a id="getfeestopay" name="getfeestopay"></a> getFeesToPay

▸ **getFeesToPay**(`amount`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount, in BTC, for which to compute the issue fees |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The fees, in BTC

#### Defined in

[src/parachain/issue.ts:175](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L175)

___

### <a id="getissueperiod" name="getissueperiod"></a> getIssuePeriod

▸ **getIssuePeriod**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The time difference in number of blocks between an issue request is created
and required completion time by a user. The issue period has an upper limit
to prevent griefing of vault collateral.

#### Defined in

[src/parachain/issue.ts:147](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L147)

___

### <a id="getrequestbyid" name="getrequestbyid"></a> getRequestById

▸ **getRequestById**(`issueId`): `Promise`\<[`Issue`](Issue.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `issueId` | `string` \| `H256` | The ID of the issue request to fetch |

#### Returns

`Promise`\<[`Issue`](Issue.md)\>

An issue request object

#### Defined in

[src/parachain/issue.ts:156](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L156)

___

### <a id="getrequestlimits" name="getrequestlimits"></a> getRequestLimits

▸ **getRequestLimits**(`vaults?`): `Promise`\<[`IssueLimits`](../modules.md#issuelimits)\>

Gets the threshold for issuing with a single vault, and the maximum total
issue request size. Additionally passes the list of vaults for caching.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaults?` | `Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | (optional) A list of the vaults available to issue from. If not provided, will fetch from the parachain (incurring an extra request). |

#### Returns

`Promise`\<[`IssueLimits`](../modules.md#issuelimits)\>

An object of type {singleVault, maxTotal, vaultsCache}

#### Defined in

[src/parachain/issue.ts:45](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L45)

___

### <a id="getrequestsbyids" name="getrequestsbyids"></a> getRequestsByIds

▸ **getRequestsByIds**(`issueIds`): `Promise`\<[`Issue`](Issue.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `issueIds` | (`string` \| `H256`)[] |

#### Returns

`Promise`\<[`Issue`](Issue.md)[]\>

The issue request objects

#### Defined in

[src/parachain/issue.ts:161](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L161)

___

### <a id="getvaultissuableamount" name="getvaultissuableamount"></a> getVaultIssuableAmount

▸ **getVaultIssuableAmount**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault account ID |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The amount of wrapped tokens issuable by this vault

#### Defined in

[src/parachain/issue.ts:181](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L181)

___

### <a id="list" name="list"></a> list

▸ **list**(): `Promise`\<[`Issue`](Issue.md)[]\>

#### Returns

`Promise`\<[`Issue`](Issue.md)[]\>

An array containing the issue requests

#### Defined in

[src/parachain/issue.ts:151](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L151)

___

### <a id="request" name="request"></a> request

▸ **request**(`amount`, `vaultAccountId?`, `collateralCurrency?`, `atomic?`, `availableVaults?`, `griefingCollateralCurrency?`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Request issuing wrapped tokens (e.g. interBTC, kBTC).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | wrapped token amount to issue. |
| `vaultAccountId?` | `AccountId` | - |
| `collateralCurrency?` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | (optional) Collateral currency for backing wrapped tokens |
| `atomic?` | `boolean` | (optional) Whether the issue request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. Defaults to false. |
| `availableVaults?` | `Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain. |
| `griefingCollateralCurrency?` | [`CurrencyExt`](../modules.md#currencyext) | (optional) Currency in which griefing collateral will be locked. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

An extrinsic with event.

#### Defined in

[src/parachain/issue.ts:72](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L72)

___

### <a id="requestadvanced" name="requestadvanced"></a> requestAdvanced

▸ **requestAdvanced**(`amountsPerVault`, `atomic`, `griefingCollateralCurrency?`): [`ExtrinsicData`](ExtrinsicData.md)

Create a batch of aggregated issue transactions (to one or more vaults).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountsPerVault` | `Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | A mapping of vaults to issue from, and wrapped token amounts to issue using each vault |
| `atomic` | `boolean` | Whether the issue request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. |
| `griefingCollateralCurrency?` | [`CurrencyExt`](../modules.md#currencyext) | (optional) Currency in which griefing collateral will be locked. |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/issue.ts:89](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L89)

___

### <a id="setissueperiod" name="setissueperiod"></a> setIssuePeriod

▸ **setIssuePeriod**(`blocks`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `blocks` | `number` | The time difference in number of blocks between an issue request is created and required completion time by a user. The issue period has an upper limit to prevent griefing of vault collateral. |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Testnet utility function

#### Defined in

[src/parachain/issue.ts:140](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L140)
