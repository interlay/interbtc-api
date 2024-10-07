[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultLoansAPI

# Class: DefaultLoansAPI

## Implements

- [`LoansAPI`](../interfaces/LoansAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultLoansAPI.md#constructor)

### Properties

- [api](DefaultLoansAPI.md#api)
- [oracleAPI](DefaultLoansAPI.md#oracleapi)
- [wrappedCurrency](DefaultLoansAPI.md#wrappedcurrency)

### Methods

- [\_calculateAccumulatedDebt](DefaultLoansAPI.md#_calculateaccumulateddebt)
- [\_calculateLiquidityAndCapacityAmounts](DefaultLoansAPI.md#_calculateliquidityandcapacityamounts)
- [\_checkLoanAssetDataAvailability](DefaultLoansAPI.md#_checkloanassetdataavailability)
- [\_checkMarketState](DefaultLoansAPI.md#_checkmarketstate)
- [\_getAccruedBorrowReward](DefaultLoansAPI.md#_getaccruedborrowreward)
- [\_getAccruedSupplyReward](DefaultLoansAPI.md#_getaccruedsupplyreward)
- [\_getBorrowApy](DefaultLoansAPI.md#_getborrowapy)
- [\_getBorrowPosition](DefaultLoansAPI.md#_getborrowposition)
- [\_getLatestBorrowIndex](DefaultLoansAPI.md#_getlatestborrowindex)
- [\_getLatestSupplyIndex](DefaultLoansAPI.md#_getlatestsupplyindex)
- [\_getLendAndBorrowYearlyRewardAmount](DefaultLoansAPI.md#_getlendandborrowyearlyrewardamount)
- [\_getLendApy](DefaultLoansAPI.md#_getlendapy)
- [\_getLendPosition](DefaultLoansAPI.md#_getlendposition)
- [\_getLoanAsset](DefaultLoansAPI.md#_getloanasset)
- [\_getPositionsOfAccount](DefaultLoansAPI.md#_getpositionsofaccount)
- [\_getRewardCurrency](DefaultLoansAPI.md#_getrewardcurrency)
- [\_getSubsidyReward](DefaultLoansAPI.md#_getsubsidyreward)
- [\_getTotalLiquidityCapacityAndBorrows](DefaultLoansAPI.md#_gettotalliquiditycapacityandborrows)
- [borrow](DefaultLoansAPI.md#borrow)
- [claimAllSubsidyRewards](DefaultLoansAPI.md#claimallsubsidyrewards)
- [convertLendTokenToUnderlyingCurrency](DefaultLoansAPI.md#convertlendtokentounderlyingcurrency)
- [disableAsCollateral](DefaultLoansAPI.md#disableascollateral)
- [enableAsCollateral](DefaultLoansAPI.md#enableascollateral)
- [getAccruedRewardsOfAccount](DefaultLoansAPI.md#getaccruedrewardsofaccount)
- [getBorrowPositionsOfAccount](DefaultLoansAPI.md#getborrowpositionsofaccount)
- [getBorrowerAccountIds](DefaultLoansAPI.md#getborroweraccountids)
- [getLendPositionAmounts](DefaultLoansAPI.md#getlendpositionamounts)
- [getLendPositionsOfAccount](DefaultLoansAPI.md#getlendpositionsofaccount)
- [getLendTokenExchangeRates](DefaultLoansAPI.md#getlendtokenexchangerates)
- [getLendTokenIdFromUnderlyingCurrency](DefaultLoansAPI.md#getlendtokenidfromunderlyingcurrency)
- [getLendTokens](DefaultLoansAPI.md#getlendtokens)
- [getLendingStats](DefaultLoansAPI.md#getlendingstats)
- [getLiquidationThresholdLiquidity](DefaultLoansAPI.md#getliquidationthresholdliquidity)
- [getLoanAssets](DefaultLoansAPI.md#getloanassets)
- [getLoansMarkets](DefaultLoansAPI.md#getloansmarkets)
- [getUndercollateralizedBorrowers](DefaultLoansAPI.md#getundercollateralizedborrowers)
- [lend](DefaultLoansAPI.md#lend)
- [liquidateBorrowPosition](DefaultLoansAPI.md#liquidateborrowposition)
- [repay](DefaultLoansAPI.md#repay)
- [repayAll](DefaultLoansAPI.md#repayall)
- [withdraw](DefaultLoansAPI.md#withdraw)
- [withdrawAll](DefaultLoansAPI.md#withdrawall)
- [getLendTokenFromUnderlyingCurrency](DefaultLoansAPI.md#getlendtokenfromunderlyingcurrency)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultLoansAPI**(`api`, `wrappedCurrency`, `oracleAPI`): [`DefaultLoansAPI`](DefaultLoansAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `wrappedCurrency` | `Currency` |
| `oracleAPI` | [`OracleAPI`](../interfaces/OracleAPI.md) |

#### Returns

[`DefaultLoansAPI`](DefaultLoansAPI.md)

#### Defined in

[src/parachain/loans.ts:241](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L241)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/loans.ts:241](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L241)

___

### <a id="oracleapi" name="oracleapi"></a> oracleAPI

• `Private` **oracleAPI**: [`OracleAPI`](../interfaces/OracleAPI.md)

#### Defined in

[src/parachain/loans.ts:241](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L241)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/loans.ts:241](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L241)

## Methods

### <a id="_calculateaccumulateddebt" name="_calculateaccumulateddebt"></a> \_calculateAccumulatedDebt

▸ **_calculateAccumulatedDebt**(`borrowedAmount`, `snapshotBorrowIndex`, `currentBorrowIndex`): `Big`

#### Parameters

| Name | Type |
| :------ | :------ |
| `borrowedAmount` | `Big` |
| `snapshotBorrowIndex` | `Big` |
| `currentBorrowIndex` | `Big` |

#### Returns

`Big`

#### Defined in

[src/parachain/loans.ts:402](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L402)

___

### <a id="_calculateliquidityandcapacityamounts" name="_calculateliquidityandcapacityamounts"></a> \_calculateLiquidityAndCapacityAmounts

▸ **_calculateLiquidityAndCapacityAmounts**(`underlyingCurrency`, `lendTokenTotalIssuance`, `totalBorrows`, `exchangeRate`): [`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]

#### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) |
| `lendTokenTotalIssuance` | `Big` |
| `totalBorrows` | `Big` |
| `exchangeRate` | `Big` |

#### Returns

[`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]

#### Defined in

[src/parachain/loans.ts:583](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L583)

___

### <a id="_checkloanassetdataavailability" name="_checkloanassetdataavailability"></a> \_checkLoanAssetDataAvailability

▸ **_checkLoanAssetDataAvailability**(`positions`, `loanAssets`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `positions` | [`LoanPosition`](../interfaces/LoanPosition.md)[] |
| `loanAssets` | [`TickerToData`](../modules.md#tickertodata)\<[`LoanAsset`](../interfaces/LoanAsset.md)\> |

#### Returns

`void`

#### Defined in

[src/parachain/loans.ts:459](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L459)

___

### <a id="_checkmarketstate" name="_checkmarketstate"></a> \_checkMarketState

▸ **_checkMarketState**(`currency`, `action`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |
| `action` | `string` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/parachain/loans.ts:843](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L843)

___

### <a id="_getaccruedborrowreward" name="_getaccruedborrowreward"></a> \_getAccruedBorrowReward

▸ **_getAccruedBorrowReward**(`accountId`, `underlyingCurrencyId`, `rewardCurrency`, `currentBlock`): `Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |
| `underlyingCurrencyId` | [`CurrencyId`](../interfaces/CurrencyId.md) |
| `rewardCurrency` | [`CurrencyExt`](../modules.md#currencyext) |
| `currentBlock` | `number` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

#### Defined in

[src/parachain/loans.ts:784](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L784)

___

### <a id="_getaccruedsupplyreward" name="_getaccruedsupplyreward"></a> \_getAccruedSupplyReward

▸ **_getAccruedSupplyReward**(`accountId`, `underlyingCurrencyId`, `lendTokenId`, `rewardCurrency`, `currentBlock`): `Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |
| `underlyingCurrencyId` | [`CurrencyId`](../interfaces/CurrencyId.md) |
| `lendTokenId` | [`CurrencyId`](../interfaces/CurrencyId.md) |
| `rewardCurrency` | [`CurrencyExt`](../modules.md#currencyext) |
| `currentBlock` | `number` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>\>

#### Defined in

[src/parachain/loans.ts:740](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L740)

___

### <a id="_getborrowapy" name="_getborrowapy"></a> \_getBorrowApy

▸ **_getBorrowApy**(`underlyingCurrencyId`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingCurrencyId` | `InterbtcPrimitivesCurrencyId` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/loans.ts:553](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L553)

___

### <a id="_getborrowposition" name="_getborrowposition"></a> \_getBorrowPosition

▸ **_getBorrowPosition**(`accountId`, `underlyingCurrency`): `Promise`\<``null`` \| [`BorrowPosition`](../interfaces/BorrowPosition.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

`Promise`\<``null`` \| [`BorrowPosition`](../interfaces/BorrowPosition.md)\>

#### Defined in

[src/parachain/loans.ts:412](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L412)

___

### <a id="_getlatestborrowindex" name="_getlatestborrowindex"></a> \_getLatestBorrowIndex

▸ **_getLatestBorrowIndex**(`underlyingCurrencyId`, `currentBlockNumber`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingCurrencyId` | [`CurrencyId`](../interfaces/CurrencyId.md) |
| `currentBlockNumber` | `number` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/loans.ts:761](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L761)

___

### <a id="_getlatestsupplyindex" name="_getlatestsupplyindex"></a> \_getLatestSupplyIndex

▸ **_getLatestSupplyIndex**(`underlyingCurrencyId`, `lendTokenId`, `currentBlockNumber`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingCurrencyId` | [`CurrencyId`](../interfaces/CurrencyId.md) |
| `lendTokenId` | [`CurrencyId`](../interfaces/CurrencyId.md) |
| `currentBlockNumber` | `number` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/loans.ts:713](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L713)

___

### <a id="_getlendandborrowyearlyrewardamount" name="_getlendandborrowyearlyrewardamount"></a> \_getLendAndBorrowYearlyRewardAmount

▸ **_getLendAndBorrowYearlyRewardAmount**(`underlyingCurrencyId`, `totalLiquidity`, `totalBorrows`): `Promise`\<[`Big`, `Big`]\>

Get the lend and borrow annual rewards for 1 UNIT of a given underlying currency id.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrencyId` | `InterbtcPrimitivesCurrencyId` | currency id to get reward amounts for. |
| `totalLiquidity` | `Big` | - |
| `totalBorrows` | `Big` | - |

#### Returns

`Promise`\<[`Big`, `Big`]\>

Annualized lend and borrow rewards for 1 unit of the given underlying currency.

#### Defined in

[src/parachain/loans.ts:605](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L605)

___

### <a id="_getlendapy" name="_getlendapy"></a> \_getLendApy

▸ **_getLendApy**(`underlyingCurrencyId`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingCurrencyId` | `InterbtcPrimitivesCurrencyId` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/loans.ts:546](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L546)

___

### <a id="_getlendposition" name="_getlendposition"></a> \_getLendPosition

▸ **_getLendPosition**(`accountId`, `underlyingCurrency`, `lendTokenId`): `Promise`\<``null`` \| [`CollateralPosition`](../interfaces/CollateralPosition.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) |
| `lendTokenId` | `InterbtcPrimitivesCurrencyId` |

#### Returns

`Promise`\<``null`` \| [`CollateralPosition`](../interfaces/CollateralPosition.md)\>

#### Defined in

[src/parachain/loans.ts:373](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L373)

___

### <a id="_getloanasset" name="_getloanasset"></a> \_getLoanAsset

▸ **_getLoanAsset**(`underlyingCurrencyId`, `marketData`): `Promise`\<[[`CurrencyExt`](../modules.md#currencyext), [`LoanAsset`](../interfaces/LoanAsset.md)]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingCurrencyId` | `InterbtcPrimitivesCurrencyId` |
| `marketData` | [`LoansMarket`](../interfaces/LoansMarket.md) |

#### Returns

`Promise`\<[[`CurrencyExt`](../modules.md#currencyext), [`LoanAsset`](../interfaces/LoanAsset.md)]\>

#### Defined in

[src/parachain/loans.ts:647](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L647)

___

### <a id="_getpositionsofaccount" name="_getpositionsofaccount"></a> \_getPositionsOfAccount

▸ **_getPositionsOfAccount**\<`Position`\>(`accountId`, `getSinglePosition`): `Promise`\<`Position`[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Position` | extends [`LoanPosition`](../interfaces/LoanPosition.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountId` | `AccountId` |
| `getSinglePosition` | (`accountId`: `AccountId`, `underlyingCurrency`: [`CurrencyExt`](../modules.md#currencyext), `lendTokenId`: `InterbtcPrimitivesCurrencyId`) => `Promise`\<``null`` \| `Position`\> |

#### Returns

`Promise`\<`Position`[]\>

#### Defined in

[src/parachain/loans.ts:433](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L433)

___

### <a id="_getrewardcurrency" name="_getrewardcurrency"></a> \_getRewardCurrency

▸ **_getRewardCurrency**(): `Promise`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Returns

`Promise`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/loans.ts:632](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L632)

___

### <a id="_getsubsidyreward" name="_getsubsidyreward"></a> \_getSubsidyReward

▸ **_getSubsidyReward**(`amount`, `rewardCurrency`): ``null`` \| `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `Big` |
| `rewardCurrency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

``null`` \| `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>

#### Defined in

[src/parachain/loans.ts:638](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L638)

___

### <a id="_gettotalliquiditycapacityandborrows" name="_gettotalliquiditycapacityandborrows"></a> \_getTotalLiquidityCapacityAndBorrows

▸ **_getTotalLiquidityCapacityAndBorrows**(`underlyingCurrency`, `underlyingCurrencyId`): `Promise`\<[`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) |
| `underlyingCurrencyId` | `InterbtcPrimitivesCurrencyId` |

#### Returns

`Promise`\<[`MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>, `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>]\>

#### Defined in

[src/parachain/loans.ts:560](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L560)

___

### <a id="borrow" name="borrow"></a> borrow

▸ **borrow**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Borrow currency from the protocol.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to borrow. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to borrow. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no active market for `underlyingCurrency`.

**`Throws`**

If there is not enough collateral provided by account for
`amount` of `underlyingCurrency`.

**`Throws`**

If `amount` is higher than available amount of `underlyingCurrency`
in the protocol.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[borrow](../interfaces/LoansAPI.md#borrow)

#### Defined in

[src/parachain/loans.ts:906](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L906)

___

### <a id="claimallsubsidyrewards" name="claimallsubsidyrewards"></a> claimAllSubsidyRewards

▸ **claimAllSubsidyRewards**(): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Claim subsidy rewards for all markets available for account.

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[claimAllSubsidyRewards](../interfaces/LoansAPI.md#claimallsubsidyrewards)

#### Defined in

[src/parachain/loans.ts:900](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L900)

___

### <a id="convertlendtokentounderlyingcurrency" name="convertlendtokentounderlyingcurrency"></a> convertLendTokenToUnderlyingCurrency

▸ **convertLendTokenToUnderlyingCurrency**(`amount`, `underlyingCurrencyId`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `Big` |
| `underlyingCurrencyId` | `InterbtcPrimitivesCurrencyId` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/loans.ts:275](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L275)

___

### <a id="disableascollateral" name="disableascollateral"></a> disableAsCollateral

▸ **disableAsCollateral**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Enable lend position of account as collateral for borrowing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to enable as collateral. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no existing lend position for `currency`.

**`Throws`**

If disabling lend position of `currency` would bring
account under collateral threshold.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[disableAsCollateral](../interfaces/LoansAPI.md#disableascollateral)

#### Defined in

[src/parachain/loans.ts:891](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L891)

___

### <a id="enableascollateral" name="enableascollateral"></a> enableAsCollateral

▸ **enableAsCollateral**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Enable lend position of account as collateral for borrowing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to enable as collateral. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no existing lend position for `currency`.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[enableAsCollateral](../interfaces/LoansAPI.md#enableascollateral)

#### Defined in

[src/parachain/loans.ts:882](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L882)

___

### <a id="getaccruedrewardsofaccount" name="getaccruedrewardsofaccount"></a> getAccruedRewardsOfAccount

▸ **getAccruedRewardsOfAccount**(`accountId`): `Promise`\<[`AccruedRewards`](../interfaces/AccruedRewards.md)\>

Get accrued subsidy rewards amounts for the account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | Account to get rewards for |

#### Returns

`Promise`\<[`AccruedRewards`](../interfaces/AccruedRewards.md)\>

Total amount how much rewards the account can claim and rewards per market.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getAccruedRewardsOfAccount](../interfaces/LoansAPI.md#getaccruedrewardsofaccount)

#### Defined in

[src/parachain/loans.ts:803](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L803)

___

### <a id="getborrowpositionsofaccount" name="getborrowpositionsofaccount"></a> getBorrowPositionsOfAccount

▸ **getBorrowPositionsOfAccount**(`accountId`): `Promise`\<[`BorrowPosition`](../interfaces/BorrowPosition.md)[]\>

Get the borrow positions for given account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | the account Id for which to get borrow positions |

#### Returns

`Promise`\<[`BorrowPosition`](../interfaces/BorrowPosition.md)[]\>

Array of borrow positions of account.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getBorrowPositionsOfAccount](../interfaces/LoansAPI.md#getborrowpositionsofaccount)

#### Defined in

[src/parachain/loans.ts:455](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L455)

___

### <a id="getborroweraccountids" name="getborroweraccountids"></a> getBorrowerAccountIds

▸ **getBorrowerAccountIds**(): `Promise`\<`AccountId`[]\>

#### Returns

`Promise`\<`AccountId`[]\>

An array of `AccountId`s which historically borrowed from the lending protocol.
This includes accounts with zero outstanding debt.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getBorrowerAccountIds](../interfaces/LoansAPI.md#getborroweraccountids)

#### Defined in

[src/parachain/loans.ts:337](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L337)

___

### <a id="getlendpositionamounts" name="getlendpositionamounts"></a> getLendPositionAmounts

▸ **getLendPositionAmounts**(`accountId`, `lendTokenId`, `underlyingCurrencyId`): `Promise`\<[`Big`, `Big`]\>

Get lend position amounts in both underlying and lend currencies.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | AccountId to get position information about |
| `lendTokenId` | `InterbtcPrimitivesCurrencyId` | LendToken CurrencyId of the position |
| `underlyingCurrencyId` | `InterbtcPrimitivesCurrencyId` | Underlying CurrencyId of the position |

#### Returns

`Promise`\<[`Big`, `Big`]\>

Lend position amounts in underlying currency and lend token

#### Defined in

[src/parachain/loans.ts:293](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L293)

___

### <a id="getlendpositionsofaccount" name="getlendpositionsofaccount"></a> getLendPositionsOfAccount

▸ **getLendPositionsOfAccount**(`accountId`): `Promise`\<[`CollateralPosition`](../interfaces/CollateralPosition.md)[]\>

Get the lend positions for given account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | the account Id for which to get supply positions |

#### Returns

`Promise`\<[`CollateralPosition`](../interfaces/CollateralPosition.md)[]\>

Array of lend positions of account.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getLendPositionsOfAccount](../interfaces/LoansAPI.md#getlendpositionsofaccount)

#### Defined in

[src/parachain/loans.ts:451](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L451)

___

### <a id="getlendtokenexchangerates" name="getlendtokenexchangerates"></a> getLendTokenExchangeRates

▸ **getLendTokenExchangeRates**(): `Promise`\<[`TickerToData`](../modules.md#tickertodata)\<`Big`\>\>

#### Returns

`Promise`\<[`TickerToData`](../modules.md#tickertodata)\<`Big`\>\>

Exchange rates for underlying currency -> lend token.
Representing amount of lend token equal to 1 of underlying currency.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getLendTokenExchangeRates](../interfaces/LoansAPI.md#getlendtokenexchangerates)

#### Defined in

[src/parachain/loans.ts:322](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L322)

___

### <a id="getlendtokenidfromunderlyingcurrency" name="getlendtokenidfromunderlyingcurrency"></a> getLendTokenIdFromUnderlyingCurrency

▸ **getLendTokenIdFromUnderlyingCurrency**(`currency`): `Promise`\<`InterbtcPrimitivesCurrencyId`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |

#### Returns

`Promise`\<`InterbtcPrimitivesCurrencyId`\>

#### Defined in

[src/parachain/loans.ts:269](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L269)

___

### <a id="getlendtokens" name="getlendtokens"></a> getLendTokens

▸ **getLendTokens**(): `Promise`\<[`LendToken`](../modules.md#lendtoken)[]\>

Get all lend token currencies.

#### Returns

`Promise`\<[`LendToken`](../modules.md#lendtoken)[]\>

Array of all LendToken currencies.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getLendTokens](../interfaces/LoansAPI.md#getlendtokens)

#### Defined in

[src/parachain/loans.ts:315](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L315)

___

### <a id="getlendingstats" name="getlendingstats"></a> getLendingStats

▸ **getLendingStats**(`lendPositions`, `borrowPositions`, `loanAssets`): [`LendingStats`](../interfaces/LendingStats.md)

Get collateralization information about account's loans.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lendPositions` | [`CollateralPosition`](../interfaces/CollateralPosition.md)[] | Lend positions of account. |
| `borrowPositions` | [`BorrowPosition`](../interfaces/BorrowPosition.md)[] | Borrow positions of account. |
| `loanAssets` | [`TickerToData`](../modules.md#tickertodata)\<[`LoanAsset`](../interfaces/LoanAsset.md)\> | All loan assets data in TickerToData structure. |

#### Returns

[`LendingStats`](../interfaces/LendingStats.md)

Collateral information about account based on passed positions.

**`Throws`**

When `loanAssets` does not contain all of the loan positions currencies.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getLendingStats](../interfaces/LoansAPI.md#getlendingstats)

#### Defined in

[src/parachain/loans.ts:467](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L467)

___

### <a id="getliquidationthresholdliquidity" name="getliquidationthresholdliquidity"></a> getLiquidationThresholdLiquidity

▸ **getLiquidationThresholdLiquidity**(`accountId`): `Promise`\<[`AccountLiquidity`](../modules.md#accountliquidity)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | The account whose liquidity to query from the chain |

#### Returns

`Promise`\<[`AccountLiquidity`](../modules.md#accountliquidity)\>

An `AccountLiquidity` object, which is valid even for accounts that didn't use the loans pallet at all

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getLiquidationThresholdLiquidity](../interfaces/LoansAPI.md#getliquidationthresholdliquidity)

#### Defined in

[src/parachain/loans.ts:365](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L365)

___

### <a id="getloanassets" name="getloanassets"></a> getLoanAssets

▸ **getLoanAssets**(): `Promise`\<[`TickerToData`](../modules.md#tickertodata)\<[`LoanAsset`](../interfaces/LoanAsset.md)\>\>

Get all loan assets.

#### Returns

`Promise`\<[`TickerToData`](../modules.md#tickertodata)\<[`LoanAsset`](../interfaces/LoanAsset.md)\>\>

Array of all assets that can be lent and borrowed.

**`Remarks`**

Method could be refactored to compute APR in lib if we can get underlyingCurrency/rewardCurrency exchange rate,
but is it safe to assume that exchange rate for btc/underlyingCurrency will be
always fed to the oracle and available?

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getLoanAssets](../interfaces/LoansAPI.md#getloanassets)

#### Defined in

[src/parachain/loans.ts:697](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L697)

___

### <a id="getloansmarkets" name="getloansmarkets"></a> getLoansMarkets

▸ **getLoansMarkets**(): `Promise`\<[[`CurrencyExt`](../modules.md#currencyext), [`LoansMarket`](../interfaces/LoansMarket.md)][]\>

#### Returns

`Promise`\<[[`CurrencyExt`](../modules.md#currencyext), [`LoansMarket`](../interfaces/LoansMarket.md)][]\>

An array of tuples denoting the underlying currency of a market, and the configuration of that market

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getLoansMarkets](../interfaces/LoansAPI.md#getloansmarkets)

#### Defined in

[src/parachain/loans.ts:243](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L243)

___

### <a id="getundercollateralizedborrowers" name="getundercollateralizedborrowers"></a> getUndercollateralizedBorrowers

▸ **getUndercollateralizedBorrowers**(): `Promise`\<[`UndercollateralizedPosition`](../modules.md#undercollateralizedposition)[]\>

#### Returns

`Promise`\<[`UndercollateralizedPosition`](../modules.md#undercollateralizedposition)[]\>

An array of `UndercollateralizedPosition`s, with all details needed to
liquidate them (accountId, shortfall - expressed in the wrapped currency, open borrow positions, collateral
deposits).

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[getUndercollateralizedBorrowers](../interfaces/LoansAPI.md#getundercollateralizedborrowers)

#### Defined in

[src/parachain/loans.ts:346](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L346)

___

### <a id="lend" name="lend"></a> lend

▸ **lend**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Lend currency to protocol for borrowing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to lend. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to lend. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is not active market for `underlyingCurrency`.

**`Throws`**

If `amount` is exceeding available balance of account.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[lend](../interfaces/LoansAPI.md#lend)

#### Defined in

[src/parachain/loans.ts:855](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L855)

___

### <a id="liquidateborrowposition" name="liquidateborrowposition"></a> liquidateBorrowPosition

▸ **liquidateBorrowPosition**(`borrower`, `liquidationCurrency`, `repayAmount`, `collateralCurrency`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Liquidates borrow position for exchange of collateral.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `borrower` | `AccountId` | AccountId of borrower whose position will be liquidated. |
| `liquidationCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency of position that will be liquidated. |
| `repayAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount to be repaid. |
| `collateralCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Collateral currency which will be claimed by liquidator. |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[liquidateBorrowPosition](../interfaces/LoansAPI.md#liquidateborrowposition)

#### Defined in

[src/parachain/loans.ts:933](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L933)

___

### <a id="repay" name="repay"></a> repay

▸ **repay**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Repay borrowed loan.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to repay. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to repay. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no active market for `underlyingCurrency`.

**`Throws`**

If `amount` is higher than available balance of account.

**`Throws`**

If `amount` is higher than outstanding loan.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[repay](../interfaces/LoansAPI.md#repay)

#### Defined in

[src/parachain/loans.ts:915](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L915)

___

### <a id="repayall" name="repayall"></a> repayAll

▸ **repayAll**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Same as `repay`, but repays full loan.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to repay. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[repayAll](../interfaces/LoansAPI.md#repayall)

#### Defined in

[src/parachain/loans.ts:924](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L924)

___

### <a id="withdraw" name="withdraw"></a> withdraw

▸ **withdraw**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Withdraw previously lent currency from protocol.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to witdhraw. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to withdraw. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is not active market for `underlyingCurrency`.

**`Throws`**

If `amount` is exceeding lent amount of account.

**`Throws`**

If `underlyingCurrency` is used as collateral and withdrawal of
`amount` would bring account under collateral threshold.

**`Throws`**

If there is not enough of underlying currency currently
available in the protocol.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[withdraw](../interfaces/LoansAPI.md#withdraw)

#### Defined in

[src/parachain/loans.ts:864](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L864)

___

### <a id="withdrawall" name="withdrawall"></a> withdrawAll

▸ **withdrawAll**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Same as `withdraw`, but exits full position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to fully withdraw. |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[LoansAPI](../interfaces/LoansAPI.md).[withdrawAll](../interfaces/LoansAPI.md#withdrawall)

#### Defined in

[src/parachain/loans.ts:873](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L873)

___

### <a id="getlendtokenfromunderlyingcurrency" name="getlendtokenfromunderlyingcurrency"></a> getLendTokenFromUnderlyingCurrency

▸ **getLendTokenFromUnderlyingCurrency**(`currency`, `lendTokenId`): [`LendToken`](../modules.md#lendtoken)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currency` | [`CurrencyExt`](../modules.md#currencyext) |
| `lendTokenId` | `InterbtcPrimitivesCurrencyId` |

#### Returns

[`LendToken`](../modules.md#lendtoken)

#### Defined in

[src/parachain/loans.ts:255](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L255)
