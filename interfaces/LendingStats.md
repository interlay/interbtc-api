[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / LendingStats

# Interface: LendingStats

## Table of contents

### Properties

- [borrowLimitBtc](LendingStats.md#borrowlimitbtc)
- [calculateBorrowLimitBtcChange](LendingStats.md#calculateborrowlimitbtcchange)
- [calculateLtvAndThresholdsChange](LendingStats.md#calculateltvandthresholdschange)
- [collateralThresholdWeightedAverage](LendingStats.md#collateralthresholdweightedaverage)
- [liquidationThresholdWeightedAverage](LendingStats.md#liquidationthresholdweightedaverage)
- [ltv](LendingStats.md#ltv)
- [totalBorrowedBtc](LendingStats.md#totalborrowedbtc)
- [totalCollateralBtc](LendingStats.md#totalcollateralbtc)
- [totalLentBtc](LendingStats.md#totallentbtc)

## Properties

### <a id="borrowlimitbtc" name="borrowlimitbtc"></a> borrowLimitBtc

• **borrowLimitBtc**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/loans.ts:24](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L24)

___

### <a id="calculateborrowlimitbtcchange" name="calculateborrowlimitbtcchange"></a> calculateBorrowLimitBtcChange

• **calculateBorrowLimitBtcChange**: (`action`: [`LoanAction`](../modules.md#loanaction), `amount`: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>) => `MonetaryAmount`\<`Currency`\>

#### Type declaration

▸ (`action`, `amount`): `MonetaryAmount`\<`Currency`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `action` | [`LoanAction`](../modules.md#loanaction) |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |

##### Returns

`MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/loans.ts:28](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L28)

___

### <a id="calculateltvandthresholdschange" name="calculateltvandthresholdschange"></a> calculateLtvAndThresholdsChange

• **calculateLtvAndThresholdsChange**: (`action`: [`LoanAction`](../modules.md#loanaction), `amount`: `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\>) => \{ `collateralThresholdWeightedAverage`: `Big` ; `liquidationThresholdWeightedAverage`: `Big` ; `ltv`: `Big`  }

#### Type declaration

▸ (`action`, `amount`): `Object`

##### Parameters

| Name | Type |
| :------ | :------ |
| `action` | [`LoanAction`](../modules.md#loanaction) |
| `amount` | `MonetaryAmount`\<[`CurrencyExt`](../modules.md#currencyext)\> |

##### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `collateralThresholdWeightedAverage` | `Big` |
| `liquidationThresholdWeightedAverage` | `Big` |
| `ltv` | `Big` |

#### Defined in

[src/types/loans.ts:29](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L29)

___

### <a id="collateralthresholdweightedaverage" name="collateralthresholdweightedaverage"></a> collateralThresholdWeightedAverage

• **collateralThresholdWeightedAverage**: `Big`

#### Defined in

[src/types/loans.ts:26](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L26)

___

### <a id="liquidationthresholdweightedaverage" name="liquidationthresholdweightedaverage"></a> liquidationThresholdWeightedAverage

• **liquidationThresholdWeightedAverage**: `Big`

#### Defined in

[src/types/loans.ts:27](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L27)

___

### <a id="ltv" name="ltv"></a> ltv

• **ltv**: `Big`

#### Defined in

[src/types/loans.ts:25](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L25)

___

### <a id="totalborrowedbtc" name="totalborrowedbtc"></a> totalBorrowedBtc

• **totalBorrowedBtc**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/loans.ts:22](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L22)

___

### <a id="totalcollateralbtc" name="totalcollateralbtc"></a> totalCollateralBtc

• **totalCollateralBtc**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/loans.ts:23](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L23)

___

### <a id="totallentbtc" name="totallentbtc"></a> totalLentBtc

• **totalLentBtc**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/loans.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/loans.ts#L21)
