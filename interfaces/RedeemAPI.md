[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / RedeemAPI

# Interface: RedeemAPI

## Implemented by

- [`DefaultRedeemAPI`](../classes/DefaultRedeemAPI.md)

## Table of contents

### Methods

- [buildCancelRedeemExtrinsic](RedeemAPI.md#buildcancelredeemextrinsic)
- [buildExecuteRedeemExtrinsic](RedeemAPI.md#buildexecuteredeemextrinsic)
- [buildLiquidationRedeemExtrinsic](RedeemAPI.md#buildliquidationredeemextrinsic)
- [buildRequestRedeemExtrinsic](RedeemAPI.md#buildrequestredeemextrinsic)
- [burn](RedeemAPI.md#burn)
- [cancel](RedeemAPI.md#cancel)
- [execute](RedeemAPI.md#execute)
- [getBurnExchangeRate](RedeemAPI.md#getburnexchangerate)
- [getCurrentInclusionFee](RedeemAPI.md#getcurrentinclusionfee)
- [getDustValue](RedeemAPI.md#getdustvalue)
- [getFeeRate](RedeemAPI.md#getfeerate)
- [getFeesToPay](RedeemAPI.md#getfeestopay)
- [getMaxBurnableTokens](RedeemAPI.md#getmaxburnabletokens)
- [getPremiumRedeemFeeRate](RedeemAPI.md#getpremiumredeemfeerate)
- [getRedeemPeriod](RedeemAPI.md#getredeemperiod)
- [getRequestById](RedeemAPI.md#getrequestbyid)
- [getRequestsByIds](RedeemAPI.md#getrequestsbyids)
- [list](RedeemAPI.md#list)
- [request](RedeemAPI.md#request)
- [requestAdvanced](RedeemAPI.md#requestadvanced)
- [setRedeemPeriod](RedeemAPI.md#setredeemperiod)

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

#### Defined in

[src/parachain/redeem.ts:119](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L119)

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

#### Defined in

[src/parachain/redeem.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L95)

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

#### Defined in

[src/parachain/redeem.ts:185](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L185)

___

### <a id="buildrequestredeemextrinsic" name="buildrequestredeemextrinsic"></a> buildRequestRedeemExtrinsic

▸ **buildRequestRedeemExtrinsic**(`vaultId`, `amount`, `btcAddress`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build a request redeem extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | ID of the vault to redeem with. |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped token amount to redeem |
| `btcAddress` | `string` | Bitcoin transaction ID |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A request redeem submittable extrinsic.

#### Defined in

[src/parachain/redeem.ts:50](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L50)

___

### <a id="burn" name="burn"></a> burn

▸ **burn**(`amount`, `collateralCurrency`): [`ExtrinsicData`](ExtrinsicData.md)

Burn wrapped tokens for a premium

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | The amount of wrapped tokens to burn |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Liquidated collateral currency to use when burning wrapped tokens |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/redeem.ts:196](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L196)

___

### <a id="cancel" name="cancel"></a> cancel

▸ **cancel**(`redeemId`, `reimburse?`): [`ExtrinsicData`](ExtrinsicData.md)

Send a redeem cancellation transaction. After the redeem period has elapsed,
the redeemal request can be cancelled. As a result, the griefing collateral
of the vault will be slashed and sent to the redeemer

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `redeemId` | `string` | The ID returned by the redeem request transaction |
| `reimburse?` | `boolean` | (Optional) In case of redeem failure: - (Default) `false` = retry redeeming, with a different Vault - `true` = accept reimbursement in wrapped token |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/redeem.ts:134](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L134)

___

### <a id="execute" name="execute"></a> execute

▸ **execute**(`requestId`, `btcTxId`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Send a redeem execution transaction

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

[src/parachain/redeem.ts:108](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L108)

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

#### Defined in

[src/parachain/redeem.ts:207](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L207)

___

### <a id="getcurrentinclusionfee" name="getcurrentinclusionfee"></a> getCurrentInclusionFee

▸ **getCurrentInclusionFee**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The current inclusion fee based on the expected number of bytes
in the transaction, and the inclusion fee rate reported by the oracle

#### Defined in

[src/parachain/redeem.ts:214](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L214)

___

### <a id="getdustvalue" name="getdustvalue"></a> getDustValue

▸ **getDustValue**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The minimum amount of wrapped tokens that is accepted for redeem requests; any lower values would
risk the bitcoin client to reject the payment

#### Defined in

[src/parachain/redeem.ts:162](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L162)

___

### <a id="getfeerate" name="getfeerate"></a> getFeeRate

▸ **getFeeRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

The fee charged for redeeming. For instance, "0.005" stands for 0.5%

#### Defined in

[src/parachain/redeem.ts:166](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L166)

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

#### Defined in

[src/parachain/redeem.ts:171](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L171)

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

#### Defined in

[src/parachain/redeem.ts:201](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L201)

___

### <a id="getpremiumredeemfeerate" name="getpremiumredeemfeerate"></a> getPremiumRedeemFeeRate

▸ **getPremiumRedeemFeeRate**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

If users execute a redeem with a Vault flagged for premium redeem,
they can earn a premium, slashed from the Vault's collateral.
This value is a percentage of the redeemed amount.

#### Defined in

[src/parachain/redeem.ts:177](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L177)

___

### <a id="getredeemperiod" name="getredeemperiod"></a> getRedeemPeriod

▸ **getRedeemPeriod**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

The time difference in number of blocks between a redeem request
is created and required completion time by a vault.
The redeem period has an upper limit to ensure the user gets their BTC in time
and to potentially punish a vault for inactivity or stealing BTC.

#### Defined in

[src/parachain/redeem.ts:151](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L151)

___

### <a id="getrequestbyid" name="getrequestbyid"></a> getRequestById

▸ **getRequestById**(`redeemId`): `Promise`\<[`Redeem`](Redeem.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `redeemId` | `string` \| `H256` | The ID of the redeem request to fetch |

#### Returns

`Promise`\<[`Redeem`](Redeem.md)\>

A redeem request object

#### Defined in

[src/parachain/redeem.ts:156](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L156)

___

### <a id="getrequestsbyids" name="getrequestsbyids"></a> getRequestsByIds

▸ **getRequestsByIds**(`redeemIds`): `Promise`\<[`Redeem`](Redeem.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `redeemIds` | (`string` \| `H256`)[] |

#### Returns

`Promise`\<[`Redeem`](Redeem.md)[]\>

#### Defined in

[src/parachain/redeem.ts:157](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L157)

___

### <a id="list" name="list"></a> list

▸ **list**(): `Promise`\<[`Redeem`](Redeem.md)[]\>

#### Returns

`Promise`\<[`Redeem`](Redeem.md)[]\>

An array containing the redeem requests

#### Defined in

[src/parachain/redeem.ts:40](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L40)

___

### <a id="request" name="request"></a> request

▸ **request**(`amount`, `btcAddressEnc`, `vaultId?`, `atomic?`, `availableVaults?`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Create a redeem request transaction

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped token amount to redeem |
| `btcAddressEnc` | `string` | Bitcoin address where the redeemed BTC should be sent |
| `vaultId?` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | (optional) ID of the vault to redeem with. |
| `atomic?` | `boolean` | (optional) Whether the request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. Defaults to false. |
| `availableVaults?` | `Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | (optional) A list of all vaults usable for redeem. If not provided, will fetch from the parachain. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/redeem.ts:65](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L65)

___

### <a id="requestadvanced" name="requestadvanced"></a> requestAdvanced

▸ **requestAdvanced**(`amountsPerVault`, `btcAddressEnc`, `atomic`): [`ExtrinsicData`](ExtrinsicData.md)

Create a batch of aggregated redeem transactions (to one or more vaults)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountsPerVault` | `Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\> | A mapping of vaults to redeem from, and wrapped token amounts to redeem using each vault |
| `btcAddressEnc` | `string` | Bitcoin address where the redeemed BTC should be sent |
| `atomic` | `boolean` | Whether the issue request should be handled atomically or not. Only makes a difference if more than one vault is needed to fulfil it. |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

Rejects the promise if none of the requests succeeded (or if at least one failed, when atomic=true).

#### Defined in

[src/parachain/redeem.ts:82](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L82)

___

### <a id="setredeemperiod" name="setredeemperiod"></a> setRedeemPeriod

▸ **setRedeemPeriod**(`blocks`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `blocks` | `number` | The time difference in number of blocks between a redeem request is created and required completion time by a vault. The redeem period has an upper limit to ensure the user gets their BTC in time and to potentially punish a vault for inactivity or stealing BTC. |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Remarks`**

Testnet utility function

#### Defined in

[src/parachain/redeem.ts:143](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/redeem.ts#L143)
