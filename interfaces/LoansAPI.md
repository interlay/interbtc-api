[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / LoansAPI

# Interface: LoansAPI

## Implemented by

- [`DefaultLoansAPI`](../classes/DefaultLoansAPI.md)

## Table of contents

### Methods

- [borrow](LoansAPI.md#borrow)
- [claimAllSubsidyRewards](LoansAPI.md#claimallsubsidyrewards)
- [disableAsCollateral](LoansAPI.md#disableascollateral)
- [enableAsCollateral](LoansAPI.md#enableascollateral)
- [getAccruedRewardsOfAccount](LoansAPI.md#getaccruedrewardsofaccount)
- [getBorrowPositionsOfAccount](LoansAPI.md#getborrowpositionsofaccount)
- [getBorrowerAccountIds](LoansAPI.md#getborroweraccountids)
- [getLendPositionsOfAccount](LoansAPI.md#getlendpositionsofaccount)
- [getLendTokenExchangeRates](LoansAPI.md#getlendtokenexchangerates)
- [getLendTokens](LoansAPI.md#getlendtokens)
- [getLendingStats](LoansAPI.md#getlendingstats)
- [getLiquidationThresholdLiquidity](LoansAPI.md#getliquidationthresholdliquidity)
- [getLoanAssets](LoansAPI.md#getloanassets)
- [getLoansMarkets](LoansAPI.md#getloansmarkets)
- [getUndercollateralizedBorrowers](LoansAPI.md#getundercollateralizedborrowers)
- [lend](LoansAPI.md#lend)
- [liquidateBorrowPosition](LoansAPI.md#liquidateborrowposition)
- [repay](LoansAPI.md#repay)
- [repayAll](LoansAPI.md#repayall)
- [withdraw](LoansAPI.md#withdraw)
- [withdrawAll](LoansAPI.md#withdrawall)

## Methods

### <a id="borrow" name="borrow"></a> borrow

▸ **borrow**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Borrow currency from the protocol.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to borrow. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to borrow. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no active market for `underlyingCurrency`.

**`Throws`**

If there is not enough collateral provided by account for
`amount` of `underlyingCurrency`.

**`Throws`**

If `amount` is higher than available amount of `underlyingCurrency`
in the protocol.

#### Defined in

[src/parachain/loans.ts:181](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L181)

___

### <a id="claimallsubsidyrewards" name="claimallsubsidyrewards"></a> claimAllSubsidyRewards

▸ **claimAllSubsidyRewards**(): [`ExtrinsicData`](ExtrinsicData.md)

Claim subsidy rewards for all markets available for account.

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/loans.ts:167](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L167)

___

### <a id="disableascollateral" name="disableascollateral"></a> disableAsCollateral

▸ **disableAsCollateral**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Enable lend position of account as collateral for borrowing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to enable as collateral. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no existing lend position for `currency`.

**`Throws`**

If disabling lend position of `currency` would bring
account under collateral threshold.

#### Defined in

[src/parachain/loans.ts:161](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L161)

___

### <a id="enableascollateral" name="enableascollateral"></a> enableAsCollateral

▸ **enableAsCollateral**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Enable lend position of account as collateral for borrowing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to enable as collateral. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no existing lend position for `currency`.

#### Defined in

[src/parachain/loans.ts:150](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L150)

___

### <a id="getaccruedrewardsofaccount" name="getaccruedrewardsofaccount"></a> getAccruedRewardsOfAccount

▸ **getAccruedRewardsOfAccount**(`accountId`): `Promise`\<[`AccruedRewards`](AccruedRewards.md)\>

Get accrued subsidy rewards amounts for the account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | Account to get rewards for |

#### Returns

`Promise`\<[`AccruedRewards`](AccruedRewards.md)\>

Total amount how much rewards the account can claim and rewards per market.

#### Defined in

[src/parachain/loans.ts:107](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L107)

___

### <a id="getborrowpositionsofaccount" name="getborrowpositionsofaccount"></a> getBorrowPositionsOfAccount

▸ **getBorrowPositionsOfAccount**(`accountId`): `Promise`\<[`BorrowPosition`](BorrowPosition.md)[]\>

Get the borrow positions for given account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | the account Id for which to get borrow positions |

#### Returns

`Promise`\<[`BorrowPosition`](BorrowPosition.md)[]\>

Array of borrow positions of account.

#### Defined in

[src/parachain/loans.ts:61](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L61)

___

### <a id="getborroweraccountids" name="getborroweraccountids"></a> getBorrowerAccountIds

▸ **getBorrowerAccountIds**(): `Promise`\<`AccountId`[]\>

#### Returns

`Promise`\<`AccountId`[]\>

An array of `AccountId`s which historically borrowed from the lending protocol.
This includes accounts with zero outstanding debt.

#### Defined in

[src/parachain/loans.ts:228](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L228)

___

### <a id="getlendpositionsofaccount" name="getlendpositionsofaccount"></a> getLendPositionsOfAccount

▸ **getLendPositionsOfAccount**(`accountId`): `Promise`\<[`CollateralPosition`](CollateralPosition.md)[]\>

Get the lend positions for given account.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountId` | `AccountId` | the account Id for which to get supply positions |

#### Returns

`Promise`\<[`CollateralPosition`](CollateralPosition.md)[]\>

Array of lend positions of account.

#### Defined in

[src/parachain/loans.ts:53](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L53)

___

### <a id="getlendtokenexchangerates" name="getlendtokenexchangerates"></a> getLendTokenExchangeRates

▸ **getLendTokenExchangeRates**(): `Promise`\<[`TickerToData`](../modules.md#tickertodata)\<`Big`\>\>

#### Returns

`Promise`\<[`TickerToData`](../modules.md#tickertodata)\<`Big`\>\>

Exchange rates for underlying currency -> lend token.
Representing amount of lend token equal to 1 of underlying currency.

#### Defined in

[src/parachain/loans.ts:99](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L99)

___

### <a id="getlendtokens" name="getlendtokens"></a> getLendTokens

▸ **getLendTokens**(): `Promise`\<[`LendToken`](../modules.md#lendtoken)[]\>

Get all lend token currencies.

#### Returns

`Promise`\<[`LendToken`](../modules.md#lendtoken)[]\>

Array of all LendToken currencies.

#### Defined in

[src/parachain/loans.ts:93](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L93)

___

### <a id="getlendingstats" name="getlendingstats"></a> getLendingStats

▸ **getLendingStats**(`lendPositions`, `borrowPositions`, `loanAssets`): `undefined` \| [`LendingStats`](LendingStats.md)

Get collateralization information about account's loans.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lendPositions` | [`CollateralPosition`](CollateralPosition.md)[] | Lend positions of account. |
| `borrowPositions` | [`BorrowPosition`](BorrowPosition.md)[] | Borrow positions of account. |
| `loanAssets` | [`TickerToData`](../modules.md#tickertodata)\<[`LoanAsset`](LoanAsset.md)\> | All loan assets data in TickerToData structure. |

#### Returns

`undefined` \| [`LendingStats`](LendingStats.md)

Collateral information about account based on passed positions.

**`Throws`**

When `loanAssets` does not contain all of the loan positions currencies.

#### Defined in

[src/parachain/loans.ts:72](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L72)

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

#### Defined in

[src/parachain/loans.ts:233](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L233)

___

### <a id="getloanassets" name="getloanassets"></a> getLoanAssets

▸ **getLoanAssets**(): `Promise`\<[`TickerToData`](../modules.md#tickertodata)\<[`LoanAsset`](LoanAsset.md)\>\>

Get all loan assets.

#### Returns

`Promise`\<[`TickerToData`](../modules.md#tickertodata)\<[`LoanAsset`](LoanAsset.md)\>\>

Array of all assets that can be lent and borrowed.

**`Remarks`**

Method could be refactored to compute APR in lib if we can get underlyingCurrency/rewardCurrency exchange rate,
but is it safe to assume that exchange rate for btc/underlyingCurrency will be
always fed to the oracle and available?

#### Defined in

[src/parachain/loans.ts:86](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L86)

___

### <a id="getloansmarkets" name="getloansmarkets"></a> getLoansMarkets

▸ **getLoansMarkets**(): `Promise`\<[[`CurrencyExt`](../modules.md#currencyext), [`LoansMarket`](LoansMarket.md)][]\>

#### Returns

`Promise`\<[[`CurrencyExt`](../modules.md#currencyext), [`LoansMarket`](LoansMarket.md)][]\>

An array of tuples denoting the underlying currency of a market, and the configuration of that market

#### Defined in

[src/parachain/loans.ts:237](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L237)

___

### <a id="getundercollateralizedborrowers" name="getundercollateralizedborrowers"></a> getUndercollateralizedBorrowers

▸ **getUndercollateralizedBorrowers**(): `Promise`\<[`UndercollateralizedPosition`](../modules.md#undercollateralizedposition)[]\>

#### Returns

`Promise`\<[`UndercollateralizedPosition`](../modules.md#undercollateralizedposition)[]\>

An array of `UndercollateralizedPosition`s, with all details needed to
liquidate them (accountId, shortfall - expressed in the wrapped currency, open borrow positions, collateral
deposits).

#### Defined in

[src/parachain/loans.ts:223](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L223)

___

### <a id="lend" name="lend"></a> lend

▸ **lend**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Lend currency to protocol for borrowing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to lend. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to lend. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is not active market for `underlyingCurrency`.

**`Throws`**

If `amount` is exceeding available balance of account.

#### Defined in

[src/parachain/loans.ts:118](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L118)

___

### <a id="liquidateborrowposition" name="liquidateborrowposition"></a> liquidateBorrowPosition

▸ **liquidateBorrowPosition**(`borrower`, `liquidationCurrency`, `repayAmount`, `collateralCurrency`): [`ExtrinsicData`](ExtrinsicData.md)

Liquidates borrow position for exchange of collateral.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `borrower` | `AccountId` | AccountId of borrower whose position will be liquidated. |
| `liquidationCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency of position that will be liquidated. |
| `repayAmount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount to be repaid. |
| `collateralCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Collateral currency which will be claimed by liquidator. |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/loans.ts:212](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L212)

___

### <a id="repay" name="repay"></a> repay

▸ **repay**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Repay borrowed loan.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to repay. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to repay. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

**`Throws`**

If there is no active market for `underlyingCurrency`.

**`Throws`**

If `amount` is higher than available balance of account.

**`Throws`**

If `amount` is higher than outstanding loan.

#### Defined in

[src/parachain/loans.ts:193](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L193)

___

### <a id="repayall" name="repayall"></a> repayAll

▸ **repayAll**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Same as `repay`, but repays full loan.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to repay. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/loans.ts:201](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L201)

___

### <a id="withdraw" name="withdraw"></a> withdraw

▸ **withdraw**(`underlyingCurrency`, `amount`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Withdraw previously lent currency from protocol.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to witdhraw. |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> | Amount of currency to withdraw. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

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

#### Defined in

[src/parachain/loans.ts:133](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L133)

___

### <a id="withdrawall" name="withdrawall"></a> withdrawAll

▸ **withdrawAll**(`underlyingCurrency`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Same as `withdraw`, but exits full position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `underlyingCurrency` | [`CurrencyExt`](../modules.md#currencyext) | Currency to fully withdraw. |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/loans.ts:141](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/loans.ts#L141)
