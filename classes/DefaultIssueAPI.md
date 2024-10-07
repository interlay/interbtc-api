[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultIssueAPI

# Class: DefaultIssueAPI

## Implements

- [`IssueAPI`](../interfaces/IssueAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultIssueAPI.md#constructor)

### Properties

- [api](DefaultIssueAPI.md#api)
- [btcNetwork](DefaultIssueAPI.md#btcnetwork)
- [electrsAPI](DefaultIssueAPI.md#electrsapi)
- [transactionAPI](DefaultIssueAPI.md#transactionapi)
- [vaultsAPI](DefaultIssueAPI.md#vaultsapi)
- [wrappedCurrency](DefaultIssueAPI.md#wrappedcurrency)

### Methods

- [buildCancelIssueExtrinsic](DefaultIssueAPI.md#buildcancelissueextrinsic)
- [buildExecuteIssueExtrinsic](DefaultIssueAPI.md#buildexecuteissueextrinsic)
- [buildRequestIssueExtrinsic](DefaultIssueAPI.md#buildrequestissueextrinsic)
- [cancel](DefaultIssueAPI.md#cancel)
- [execute](DefaultIssueAPI.md#execute)
- [getDustValue](DefaultIssueAPI.md#getdustvalue)
- [getFeeRate](DefaultIssueAPI.md#getfeerate)
- [getFeesToPay](DefaultIssueAPI.md#getfeestopay)
- [getIssuePeriod](DefaultIssueAPI.md#getissueperiod)
- [getRequestById](DefaultIssueAPI.md#getrequestbyid)
- [getRequestLimits](DefaultIssueAPI.md#getrequestlimits)
- [getRequestsByIds](DefaultIssueAPI.md#getrequestsbyids)
- [getVaultIssuableAmount](DefaultIssueAPI.md#getvaultissuableamount)
- [list](DefaultIssueAPI.md#list)
- [request](DefaultIssueAPI.md#request)
- [requestAdvanced](DefaultIssueAPI.md#requestadvanced)
- [setIssuePeriod](DefaultIssueAPI.md#setissueperiod)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultIssueAPI**(`api`, `btcNetwork`, `electrsAPI`, `wrappedCurrency`, `vaultsAPI`, `transactionAPI`): [`DefaultIssueAPI`](DefaultIssueAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `btcNetwork` | `Network` |
| `electrsAPI` | [`ElectrsAPI`](../interfaces/ElectrsAPI.md) |
| `wrappedCurrency` | `Currency` |
| `vaultsAPI` | [`VaultsAPI`](../interfaces/VaultsAPI.md) |
| `transactionAPI` | [`TransactionAPI`](../interfaces/TransactionAPI.md) |

#### Returns

[`DefaultIssueAPI`](DefaultIssueAPI.md)

#### Defined in

[src/parachain/issue.ts:188](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L188)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/issue.ts:189](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L189)

___

### <a id="btcnetwork" name="btcnetwork"></a> btcNetwork

• `Private` **btcNetwork**: `Network`

#### Defined in

[src/parachain/issue.ts:190](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L190)

___

### <a id="electrsapi" name="electrsapi"></a> electrsAPI

• `Private` **electrsAPI**: [`ElectrsAPI`](../interfaces/ElectrsAPI.md)

#### Defined in

[src/parachain/issue.ts:191](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L191)

___

### <a id="transactionapi" name="transactionapi"></a> transactionAPI

• `Private` **transactionAPI**: [`TransactionAPI`](../interfaces/TransactionAPI.md)

#### Defined in

[src/parachain/issue.ts:194](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L194)

___

### <a id="vaultsapi" name="vaultsapi"></a> vaultsAPI

• `Private` **vaultsAPI**: [`VaultsAPI`](../interfaces/VaultsAPI.md)

#### Defined in

[src/parachain/issue.ts:193](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L193)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/issue.ts:192](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L192)

## Methods

### <a id="buildcancelissueextrinsic" name="buildcancelissueextrinsic"></a> buildCancelIssueExtrinsic

▸ **buildCancelIssueExtrinsic**(`requestId`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a cancel issue extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestId` | `string` | The ID returned by the issue request transaction |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A cancel issue submittable extrinsic.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[buildCancelIssueExtrinsic](../interfaces/IssueAPI.md#buildcancelissueextrinsic)

#### Defined in

[src/parachain/issue.ts:295](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L295)

___

### <a id="buildexecuteissueextrinsic" name="buildexecuteissueextrinsic"></a> buildExecuteIssueExtrinsic

▸ **buildExecuteIssueExtrinsic**(`requestId`, `btcTxId`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

Build an issue execution extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestId` | `string` | The ID returned by the issue request transaction |
| `btcTxId` | `string` | Bitcoin transaction ID |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

An execute issue submittable extrinsic.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[buildExecuteIssueExtrinsic](../interfaces/IssueAPI.md#buildexecuteissueextrinsic)

#### Defined in

[src/parachain/issue.ts:281](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L281)

___

### <a id="buildrequestissueextrinsic" name="buildrequestissueextrinsic"></a> buildRequestIssueExtrinsic

▸ **buildRequestIssueExtrinsic**(`vaultId`, `amount`, `griefingCollateralCurrency?`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build an issue request extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | The vault ID of the vault to issue with. |
| `amount` | `MonetaryAmount`\<`Currency`\> | wrapped token amount to issue. |
| `griefingCollateralCurrency?` | [`CurrencyExt`](../modules.md#currencyext) | (optional) Currency in which griefing collateral will be locked. |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

An execute issue submittable extrinsic.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[buildRequestIssueExtrinsic](../interfaces/IssueAPI.md#buildrequestissueextrinsic)

#### Defined in

[src/parachain/issue.ts:256](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L256)

___

### <a id="cancel" name="cancel"></a> cancel

▸ **cancel**(`requestId`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Create an issue cancellation transaction. After the issue period has elapsed,
the issuance request can be cancelled. As a result, the griefing collateral
of the requester will be slashed and sent to the vault that had prepared to issue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestId` | `string` | The ID returned by the issue request transaction |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[cancel](../interfaces/IssueAPI.md#cancel)

#### Defined in

[src/parachain/issue.ts:300](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L300)

___

### <a id="execute" name="execute"></a> execute

▸ **execute**(`requestId`, `btcTxId`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Create an issue execution transaction

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestId` | `string` | - |
| `btcTxId` | `string` | Bitcoin transaction ID |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

If `txId` is not set, the `merkleProof` and `rawTx` must both be set.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[execute](../interfaces/IssueAPI.md#execute)

#### Defined in

[src/parachain/issue.ts:290](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L290)

___

### <a id="getdustvalue" name="getdustvalue"></a> getDustValue

▸ **getDustValue**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The minimum amount of wrapped tokens that is accepted for issue requests; any lower values would
risk the bitcoin client to reject the payment

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getDustValue](../interfaces/IssueAPI.md#getdustvalue)

#### Defined in

[src/parachain/issue.ts:333](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L333)

___

### <a id="getfeerate" name="getfeerate"></a> getFeeRate

▸ **getFeeRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The fee charged for issuing. For instance, "0.005" stands for 0.5%

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getFeeRate](../interfaces/IssueAPI.md#getfeerate)

#### Defined in

[src/parachain/issue.ts:338](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L338)

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

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getFeesToPay](../interfaces/IssueAPI.md#getfeestopay)

#### Defined in

[src/parachain/issue.ts:328](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L328)

___

### <a id="getissueperiod" name="getissueperiod"></a> getIssuePeriod

▸ **getIssuePeriod**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The time difference in number of blocks between an issue request is created
and required completion time by a user. The issue period has an upper limit
to prevent griefing of vault collateral.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getIssuePeriod](../interfaces/IssueAPI.md#getissueperiod)

#### Defined in

[src/parachain/issue.ts:311](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L311)

___

### <a id="getrequestbyid" name="getrequestbyid"></a> getRequestById

▸ **getRequestById**(`issueId`): `Promise`\<[`Issue`](../interfaces/Issue.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `issueId` | `string` \| `H256` | The ID of the issue request to fetch |

#### Returns

`Promise`\<[`Issue`](../interfaces/Issue.md)\>

An issue request object

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getRequestById](../interfaces/IssueAPI.md#getrequestbyid)

#### Defined in

[src/parachain/issue.ts:343](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L343)

___

### <a id="getrequestlimits" name="getrequestlimits"></a> getRequestLimits

▸ **getRequestLimits**(`vaults?`): `Promise`\<[`IssueLimits`](../modules.md#issuelimits)\>

Gets the threshold for issuing with a single vault, and the maximum total
issue request size. Additionally passes the list of vaults for caching.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaults?` | `Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | (optional) A list of the vaults available to issue from. If not provided, will fetch from the parachain (incurring an extra request). |

#### Returns

`Promise`\<[`IssueLimits`](../modules.md#issuelimits)\>

An object of type {singleVault, maxTotal, vaultsCache}

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getRequestLimits](../interfaces/IssueAPI.md#getrequestlimits)

#### Defined in

[src/parachain/issue.ts:197](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L197)

___

### <a id="getrequestsbyids" name="getrequestsbyids"></a> getRequestsByIds

▸ **getRequestsByIds**(`issueIds`): `Promise`\<[`Issue`](../interfaces/Issue.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `issueIds` | (`string` \| `H256`)[] |

#### Returns

`Promise`\<[`Issue`](../interfaces/Issue.md)[]\>

The issue request objects

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getRequestsByIds](../interfaces/IssueAPI.md#getrequestsbyids)

#### Defined in

[src/parachain/issue.ts:347](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L347)

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

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[getVaultIssuableAmount](../interfaces/IssueAPI.md#getvaultissuableamount)

#### Defined in

[src/parachain/issue.ts:371](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L371)

___

### <a id="list" name="list"></a> list

▸ **list**(): `Promise`\<[`Issue`](../interfaces/Issue.md)[]\>

#### Returns

`Promise`\<[`Issue`](../interfaces/Issue.md)[]\>

An array containing the issue requests

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[list](../interfaces/IssueAPI.md#list)

#### Defined in

[src/parachain/issue.ts:316](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L316)

___

### <a id="request" name="request"></a> request

▸ **request**(`amount`, `vaultAccountId?`, `collateralCurrency?`, `atomic?`, `cachedVaults?`, `griefingCollateralCurrency?`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Request issuing wrapped tokens (e.g. interBTC, kBTC).

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | `undefined` | wrapped token amount to issue. |
| `vaultAccountId?` | `AccountId` | `undefined` | - |
| `collateralCurrency?` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | `undefined` | (optional) Collateral currency for backing wrapped tokens |
| `atomic` | `boolean` | `true` | (optional) Whether the issue request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. Defaults to false. |
| `cachedVaults?` | `Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | `undefined` | (optional) A list of all vaults usable for issue. If not provided, will fetch from the parachain. |
| `griefingCollateralCurrency?` | [`CurrencyExt`](../modules.md#currencyext) | `undefined` | (optional) Currency in which griefing collateral will be locked. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

An extrinsic with event.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[request](../interfaces/IssueAPI.md#request)

#### Defined in

[src/parachain/issue.ts:219](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L219)

___

### <a id="requestadvanced" name="requestadvanced"></a> requestAdvanced

▸ **requestAdvanced**(`amountsPerVault`, `atomic`, `griefingCollateralCurrency?`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Create a batch of aggregated issue transactions (to one or more vaults).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountsPerVault` | `Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | A mapping of vaults to issue from, and wrapped token amounts to issue using each vault |
| `atomic` | `boolean` | Whether the issue request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. |
| `griefingCollateralCurrency?` | [`CurrencyExt`](../modules.md#currencyext) | (optional) Currency in which griefing collateral will be locked. |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[requestAdvanced](../interfaces/IssueAPI.md#requestadvanced)

#### Defined in

[src/parachain/issue.ts:269](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L269)

___

### <a id="setissueperiod" name="setissueperiod"></a> setIssuePeriod

▸ **setIssuePeriod**(`blocks`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `blocks` | `number` | The time difference in number of blocks between an issue request is created and required completion time by a user. The issue period has an upper limit to prevent griefing of vault collateral. |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Testnet utility function

#### Implementation of

[IssueAPI](../interfaces/IssueAPI.md).[setIssuePeriod](../interfaces/IssueAPI.md#setissueperiod)

#### Defined in

[src/parachain/issue.ts:305](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/issue.ts#L305)
