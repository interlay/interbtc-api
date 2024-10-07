[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultRedeemAPI

# Class: DefaultRedeemAPI

## Implements

- [`RedeemAPI`](../interfaces/RedeemAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultRedeemAPI.md#constructor)

### Properties

- [api](DefaultRedeemAPI.md#api)
- [btcNetwork](DefaultRedeemAPI.md#btcnetwork)
- [electrsAPI](DefaultRedeemAPI.md#electrsapi)
- [oracleAPI](DefaultRedeemAPI.md#oracleapi)
- [systemAPI](DefaultRedeemAPI.md#systemapi)
- [transactionAPI](DefaultRedeemAPI.md#transactionapi)
- [vaultsAPI](DefaultRedeemAPI.md#vaultsapi)
- [wrappedCurrency](DefaultRedeemAPI.md#wrappedcurrency)

### Methods

- [buildCancelRedeemExtrinsic](DefaultRedeemAPI.md#buildcancelredeemextrinsic)
- [buildExecuteRedeemExtrinsic](DefaultRedeemAPI.md#buildexecuteredeemextrinsic)
- [buildLiquidationRedeemExtrinsic](DefaultRedeemAPI.md#buildliquidationredeemextrinsic)
- [buildRequestRedeemExtrinsic](DefaultRedeemAPI.md#buildrequestredeemextrinsic)
- [burn](DefaultRedeemAPI.md#burn)
- [cancel](DefaultRedeemAPI.md#cancel)
- [execute](DefaultRedeemAPI.md#execute)
- [getBurnExchangeRate](DefaultRedeemAPI.md#getburnexchangerate)
- [getCurrentInclusionFee](DefaultRedeemAPI.md#getcurrentinclusionfee)
- [getDustValue](DefaultRedeemAPI.md#getdustvalue)
- [getFeeRate](DefaultRedeemAPI.md#getfeerate)
- [getFeesToPay](DefaultRedeemAPI.md#getfeestopay)
- [getMaxBurnableTokens](DefaultRedeemAPI.md#getmaxburnabletokens)
- [getPremiumRedeemFeeRate](DefaultRedeemAPI.md#getpremiumredeemfeerate)
- [getRedeemPeriod](DefaultRedeemAPI.md#getredeemperiod)
- [getRequestById](DefaultRedeemAPI.md#getrequestbyid)
- [getRequestsByIds](DefaultRedeemAPI.md#getrequestsbyids)
- [list](DefaultRedeemAPI.md#list)
- [request](DefaultRedeemAPI.md#request)
- [requestAdvanced](DefaultRedeemAPI.md#requestadvanced)
- [setRedeemPeriod](DefaultRedeemAPI.md#setredeemperiod)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultRedeemAPI**(`api`, `btcNetwork`, `electrsAPI`, `wrappedCurrency`, `vaultsAPI`, `oracleAPI`, `transactionAPI`, `systemAPI`): [`DefaultRedeemAPI`](DefaultRedeemAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `btcNetwork` | `Network` |
| `electrsAPI` | [`ElectrsAPI`](../interfaces/ElectrsAPI.md) |
| `wrappedCurrency` | `Currency` |
| `vaultsAPI` | [`VaultsAPI`](../interfaces/VaultsAPI.md) |
| `oracleAPI` | [`OracleAPI`](../interfaces/OracleAPI.md) |
| `transactionAPI` | [`TransactionAPI`](../interfaces/TransactionAPI.md) |
| `systemAPI` | [`SystemAPI`](../interfaces/SystemAPI.md) |

#### Returns

[`DefaultRedeemAPI`](DefaultRedeemAPI.md)

#### Defined in

[src/parachain/redeem.ts:218](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L218)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/redeem.ts:219](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L219)

___

### <a id="btcnetwork" name="btcnetwork"></a> btcNetwork

• `Private` **btcNetwork**: `Network`

#### Defined in

[src/parachain/redeem.ts:220](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L220)

___

### <a id="electrsapi" name="electrsapi"></a> electrsAPI

• `Private` **electrsAPI**: [`ElectrsAPI`](../interfaces/ElectrsAPI.md)

#### Defined in

[src/parachain/redeem.ts:221](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L221)

___

### <a id="oracleapi" name="oracleapi"></a> oracleAPI

• `Private` **oracleAPI**: [`OracleAPI`](../interfaces/OracleAPI.md)

#### Defined in

[src/parachain/redeem.ts:224](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L224)

___

### <a id="systemapi" name="systemapi"></a> systemAPI

• `Private` **systemAPI**: [`SystemAPI`](../interfaces/SystemAPI.md)

#### Defined in

[src/parachain/redeem.ts:226](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L226)

___

### <a id="transactionapi" name="transactionapi"></a> transactionAPI

• `Private` **transactionAPI**: [`TransactionAPI`](../interfaces/TransactionAPI.md)

#### Defined in

[src/parachain/redeem.ts:225](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L225)

___

### <a id="vaultsapi" name="vaultsapi"></a> vaultsAPI

• `Private` **vaultsAPI**: [`VaultsAPI`](../interfaces/VaultsAPI.md)

#### Defined in

[src/parachain/redeem.ts:223](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L223)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/redeem.ts:222](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L222)

## Methods

### <a id="buildcancelredeemextrinsic" name="buildcancelredeemextrinsic"></a> buildCancelRedeemExtrinsic

▸ **buildCancelRedeemExtrinsic**(`redeemId`, `reimburse`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a cancel redeem extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `redeemId` | `string` | The ID returned by the redeem request transaction |
| `reimburse` | `boolean` | In case of redeem failure: - `false` = retry redeeming, with a different Vault - `true` = accept reimbursement in wrapped token |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A cancel redeem submittable extrinsic.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[buildCancelRedeemExtrinsic](../interfaces/RedeemAPI.md#buildcancelredeemextrinsic)

#### Defined in

[src/parachain/redeem.ts:292](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L292)

___

### <a id="buildexecuteredeemextrinsic" name="buildexecuteredeemextrinsic"></a> buildExecuteRedeemExtrinsic

▸ **buildExecuteRedeemExtrinsic**(`redeemId`, `btcTxId`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

Build a redeem execution extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `redeemId` | `string` | The ID returned by the issue request transaction |
| `btcTxId` | `string` | Bitcoin transaction ID |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

An execute redeem submittable extrinsic.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[buildExecuteRedeemExtrinsic](../interfaces/RedeemAPI.md#buildexecuteredeemextrinsic)

#### Defined in

[src/parachain/redeem.ts:278](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L278)

___

### <a id="buildliquidationredeemextrinsic" name="buildliquidationredeemextrinsic"></a> buildLiquidationRedeemExtrinsic

▸ **buildLiquidationRedeemExtrinsic**(`amount`, `collateralCurrency`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build liquidation redeem extrinsic (without sending it) to burn wrapped tokens for a premium

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount of wrapped tokens to burn |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Liquidated collateral currency to use when burning wrapped tokens |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A liquidation redeem submittable extrinsic.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[buildLiquidationRedeemExtrinsic](../interfaces/RedeemAPI.md#buildliquidationredeemextrinsic)

#### Defined in

[src/parachain/redeem.ts:305](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L305)

___

### <a id="buildrequestredeemextrinsic" name="buildrequestredeemextrinsic"></a> buildRequestRedeemExtrinsic

▸ **buildRequestRedeemExtrinsic**(`vaultId`, `amount`, `btcAddressEnc`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a request redeem extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | ID of the vault to redeem with. |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped token amount to redeem |
| `btcAddressEnc` | `string` | Bitcoin transaction ID |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A request redeem submittable extrinsic.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[buildRequestRedeemExtrinsic](../interfaces/RedeemAPI.md#buildrequestredeemextrinsic)

#### Defined in

[src/parachain/redeem.ts:253](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L253)

___

### <a id="burn" name="burn"></a> burn

▸ **burn**(`amount`, `collateralCurrency`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Burn wrapped tokens for a premium

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount of wrapped tokens to burn |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Liquidated collateral currency to use when burning wrapped tokens |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[burn](../interfaces/RedeemAPI.md#burn)

#### Defined in

[src/parachain/redeem.ts:314](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L314)

___

### <a id="cancel" name="cancel"></a> cancel

▸ **cancel**(`requestId`, `reimburse?`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Send a redeem cancellation transaction. After the redeem period has elapsed,
the redeemal request can be cancelled. As a result, the griefing collateral
of the vault will be slashed and sent to the redeemer

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `requestId` | `string` | `undefined` | The ID returned by the redeem request transaction |
| `reimburse` | `boolean` | `false` | (Optional) In case of redeem failure: - (Default) `false` = retry redeeming, with a different Vault - `true` = accept reimbursement in wrapped token |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[cancel](../interfaces/RedeemAPI.md#cancel)

#### Defined in

[src/parachain/redeem.ts:300](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L300)

___

### <a id="execute" name="execute"></a> execute

▸ **execute**(`requestId`, `btcTxId`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Send a redeem execution transaction

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

[RedeemAPI](../interfaces/RedeemAPI.md).[execute](../interfaces/RedeemAPI.md#execute)

#### Defined in

[src/parachain/redeem.ts:287](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L287)

___

### <a id="getburnexchangerate" name="getburnexchangerate"></a> getBurnExchangeRate

▸ **getBurnExchangeRate**(`collateralCurrency`): `Promise`\<`ExchangeRate`\<`Currency`, [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Currency whose exchange rate with BTC to fetch |

#### Returns

`Promise`\<`ExchangeRate`\<`Currency`, [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The exchange rate (collateral currency to wrapped token currency)
used when burning tokens

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getBurnExchangeRate](../interfaces/RedeemAPI.md#getburnexchangerate)

#### Defined in

[src/parachain/redeem.ts:350](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L350)

___

### <a id="getcurrentinclusionfee" name="getcurrentinclusionfee"></a> getCurrentInclusionFee

▸ **getCurrentInclusionFee**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The current inclusion fee based on the expected number of bytes
in the transaction, and the inclusion fee rate reported by the oracle

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getCurrentInclusionFee](../interfaces/RedeemAPI.md#getcurrentinclusionfee)

#### Defined in

[src/parachain/redeem.ts:365](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L365)

___

### <a id="getdustvalue" name="getdustvalue"></a> getDustValue

▸ **getDustValue**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The minimum amount of wrapped tokens that is accepted for redeem requests; any lower values would
risk the bitcoin client to reject the payment

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getDustValue](../interfaces/RedeemAPI.md#getdustvalue)

#### Defined in

[src/parachain/redeem.ts:412](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L412)

___

### <a id="getfeerate" name="getfeerate"></a> getFeeRate

▸ **getFeeRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The fee charged for redeeming. For instance, "0.005" stands for 0.5%

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getFeeRate](../interfaces/RedeemAPI.md#getfeerate)

#### Defined in

[src/parachain/redeem.ts:407](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L407)

___

### <a id="getfeestopay" name="getfeestopay"></a> getFeesToPay

▸ **getFeesToPay**(`amount`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount of wrapped tokens for which to compute the redeem fees |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The fees

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getFeesToPay](../interfaces/RedeemAPI.md#getfeestopay)

#### Defined in

[src/parachain/redeem.ts:402](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L402)

___

### <a id="getmaxburnabletokens" name="getmaxburnabletokens"></a> getMaxBurnableTokens

▸ **getMaxBurnableTokens**(`collateralCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Liquidated collateral currency to use when burning wrapped tokens |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The maximum amount of tokens that can be burned through a liquidation redeem

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getMaxBurnableTokens](../interfaces/RedeemAPI.md#getmaxburnabletokens)

#### Defined in

[src/parachain/redeem.ts:330](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L330)

___

### <a id="getpremiumredeemfeerate" name="getpremiumredeemfeerate"></a> getPremiumRedeemFeeRate

▸ **getPremiumRedeemFeeRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

If users execute a redeem with a Vault flagged for premium redeem,
they can earn a premium, slashed from the Vault's collateral.
This value is a percentage of the redeemed amount.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getPremiumRedeemFeeRate](../interfaces/RedeemAPI.md#getpremiumredeemfeerate)

#### Defined in

[src/parachain/redeem.ts:417](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L417)

___

### <a id="getredeemperiod" name="getredeemperiod"></a> getRedeemPeriod

▸ **getRedeemPeriod**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The time difference in number of blocks between a redeem request
is created and required completion time by a vault.
The redeem period has an upper limit to ensure the user gets their BTC in time
and to potentially punish a vault for inactivity or stealing BTC.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getRedeemPeriod](../interfaces/RedeemAPI.md#getredeemperiod)

#### Defined in

[src/parachain/redeem.ts:325](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L325)

___

### <a id="getrequestbyid" name="getrequestbyid"></a> getRequestById

▸ **getRequestById**(`redeemId`): `Promise`\<[`Redeem`](../interfaces/Redeem.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `redeemId` | `string` \| `H256` | The ID of the redeem request to fetch |

#### Returns

`Promise`\<[`Redeem`](../interfaces/Redeem.md)\>

A redeem request object

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getRequestById](../interfaces/RedeemAPI.md#getrequestbyid)

#### Defined in

[src/parachain/redeem.ts:422](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L422)

___

### <a id="getrequestsbyids" name="getrequestsbyids"></a> getRequestsByIds

▸ **getRequestsByIds**(`redeemIds`): `Promise`\<[`Redeem`](../interfaces/Redeem.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `redeemIds` | (`string` \| `H256`)[] |

#### Returns

`Promise`\<[`Redeem`](../interfaces/Redeem.md)[]\>

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[getRequestsByIds](../interfaces/RedeemAPI.md#getrequestsbyids)

#### Defined in

[src/parachain/redeem.ts:427](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L427)

___

### <a id="list" name="list"></a> list

▸ **list**(): `Promise`\<[`Redeem`](../interfaces/Redeem.md)[]\>

#### Returns

`Promise`\<[`Redeem`](../interfaces/Redeem.md)[]\>

An array containing the redeem requests

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[list](../interfaces/RedeemAPI.md#list)

#### Defined in

[src/parachain/redeem.ts:374](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L374)

___

### <a id="request" name="request"></a> request

▸ **request**(`amount`, `btcAddressEnc`, `vaultId?`, `atomic?`, `cachedVaults?`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Create a redeem request transaction

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | `undefined` | Wrapped token amount to redeem |
| `btcAddressEnc` | `string` | `undefined` | Bitcoin address where the redeemed BTC should be sent |
| `vaultId?` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | `undefined` | (optional) ID of the vault to redeem with. |
| `atomic` | `boolean` | `true` | (optional) Whether the request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. Defaults to false. |
| `cachedVaults?` | `Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | `undefined` | (optional) A list of all vaults usable for redeem. If not provided, will fetch from the parachain. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[request](../interfaces/RedeemAPI.md#request)

#### Defined in

[src/parachain/redeem.ts:229](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L229)

___

### <a id="requestadvanced" name="requestadvanced"></a> requestAdvanced

▸ **requestAdvanced**(`amountsPerVault`, `btcAddressEnc`, `atomic`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Create a batch of aggregated redeem transactions (to one or more vaults)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountsPerVault` | `Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | A mapping of vaults to redeem from, and wrapped token amounts to redeem using each vault |
| `btcAddressEnc` | `string` | Bitcoin address where the redeemed BTC should be sent |
| `atomic` | `boolean` | Whether the issue request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

Rejects the promise if none of the requests succeeded (or if at least one failed, when atomic=true).

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[requestAdvanced](../interfaces/RedeemAPI.md#requestadvanced)

#### Defined in

[src/parachain/redeem.ts:266](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L266)

___

### <a id="setredeemperiod" name="setredeemperiod"></a> setRedeemPeriod

▸ **setRedeemPeriod**(`blocks`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `blocks` | `number` | The time difference in number of blocks between a redeem request is created and required completion time by a vault. The redeem period has an upper limit to ensure the user gets their BTC in time and to potentially punish a vault for inactivity or stealing BTC. |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Testnet utility function

#### Implementation of

[RedeemAPI](../interfaces/RedeemAPI.md).[setRedeemPeriod](../interfaces/RedeemAPI.md#setredeemperiod)

#### Defined in

[src/parachain/redeem.ts:319](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L319)
