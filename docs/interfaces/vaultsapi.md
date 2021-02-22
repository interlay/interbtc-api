[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / VaultsAPI

# Interface: VaultsAPI

## Table of contents

### Methods

- [get](/interfaces/vaultsapi.md#get)
- [getAPY](/interfaces/vaultsapi.md#getapy)
- [getAuctionCollateralThreshold](/interfaces/vaultsapi.md#getauctioncollateralthreshold)
- [getFeesDOT](/interfaces/vaultsapi.md#getfeesdot)
- [getFeesPolkaBTC](/interfaces/vaultsapi.md#getfeespolkabtc)
- [getIssuablePolkaBTC](/interfaces/vaultsapi.md#getissuablepolkabtc)
- [getIssuedPolkaBTCAmount](/interfaces/vaultsapi.md#getissuedpolkabtcamount)
- [getLiquidationCollateralThreshold](/interfaces/vaultsapi.md#getliquidationcollateralthreshold)
- [getMaxSLA](/interfaces/vaultsapi.md#getmaxsla)
- [getPagedIterator](/interfaces/vaultsapi.md#getpagediterator)
- [getPolkaBTCCapacity](/interfaces/vaultsapi.md#getpolkabtccapacity)
- [getPremiumRedeemThreshold](/interfaces/vaultsapi.md#getpremiumredeemthreshold)
- [getPremiumRedeemVaults](/interfaces/vaultsapi.md#getpremiumredeemvaults)
- [getPunishmentFee](/interfaces/vaultsapi.md#getpunishmentfee)
- [getRequiredCollateralForVault](/interfaces/vaultsapi.md#getrequiredcollateralforvault)
- [getSLA](/interfaces/vaultsapi.md#getsla)
- [getSecureCollateralThreshold](/interfaces/vaultsapi.md#getsecurecollateralthreshold)
- [getSlashableCollateral](/interfaces/vaultsapi.md#getslashablecollateral)
- [getSystemCollateralization](/interfaces/vaultsapi.md#getsystemcollateralization)
- [getTotalIssuedPolkaBTCAmount](/interfaces/vaultsapi.md#gettotalissuedpolkabtcamount)
- [getVaultCollateralization](/interfaces/vaultsapi.md#getvaultcollateralization)
- [getVaultsWithIssuableTokens](/interfaces/vaultsapi.md#getvaultswithissuabletokens)
- [isVaultFlaggedForTheft](/interfaces/vaultsapi.md#isvaultflaggedfortheft)
- [list](/interfaces/vaultsapi.md#list)
- [listPaged](/interfaces/vaultsapi.md#listpaged)
- [mapIssueRequests](/interfaces/vaultsapi.md#mapissuerequests)
- [mapRedeemRequests](/interfaces/vaultsapi.md#mapredeemrequests)
- [mapReplaceRequests](/interfaces/vaultsapi.md#mapreplacerequests)
- [selectRandomVaultIssue](/interfaces/vaultsapi.md#selectrandomvaultissue)
- [selectRandomVaultRedeem](/interfaces/vaultsapi.md#selectrandomvaultredeem)

## Methods

### get

▸ **get**(`vaultId`: *AccountId*): *Promise*<VaultExt\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | The ID of the vault to fetch   |

**Returns:** *Promise*<VaultExt\>

A vault object

Defined in: [src/apis/vaults.ts:100](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L100)

___

### getAPY

▸ **getAPY**(`vaultId`: *string*): *Promise*<string\>

Get the total APY for a vault based on the income in PolkaBTC and DOT
divided by the locked DOT.

**`note`** this does not account for interest compounding

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *string* | the id of the vault   |

**Returns:** *Promise*<string\>

the APY as a percentage string

Defined in: [src/apis/vaults.ts:209](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L209)

___

### getAuctionCollateralThreshold

▸ **getAuctionCollateralThreshold**(): *Promise*<Big\>

**Returns:** *Promise*<Big\>

The collateral rate of Vaults at which the
BTC backed by the Vault are opened up for auction to other Vaults

Defined in: [src/apis/vaults.ts:184](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L184)

___

### getFeesDOT

▸ **getFeesDOT**(`vaultId`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *string* | The vault account ID   |

**Returns:** *Promise*<string\>

The total DOT reward collected by the vault, denoted in Planck

Defined in: [src/apis/vaults.ts:199](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L199)

___

### getFeesPolkaBTC

▸ **getFeesPolkaBTC**(`vaultId`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *string* | The vault account ID   |

**Returns:** *Promise*<string\>

The total PolkaBTC reward collected by the vault, denoted in Satoshi

Defined in: [src/apis/vaults.ts:194](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L194)

___

### getIssuablePolkaBTC

▸ **getIssuablePolkaBTC**(): *Promise*<string\>

**Returns:** *Promise*<string\>

The total amount of PolkaBTC that can be issued, considering the DOT
locked by the vaults

Defined in: [src/apis/vaults.ts:144](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L144)

___

### getIssuedPolkaBTCAmount

▸ **getIssuedPolkaBTCAmount**(`vaultId`: *AccountId*): *Promise*<PolkaBTC\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | The vault account ID   |

**Returns:** *Promise*<PolkaBTC\>

The amount of PolkaBTC issued by the given vault, denoted in Satoshi

Defined in: [src/apis/vaults.ts:135](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L135)

___

### getLiquidationCollateralThreshold

▸ **getLiquidationCollateralThreshold**(): *Promise*<Big\>

**Returns:** *Promise*<Big\>

The lower bound for the collateral rate in PolkaBTC.
If a Vault’s collateral rate
drops below this, automatic liquidation (forced Redeem) is triggered.

Defined in: [src/apis/vaults.ts:173](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L173)

___

### getMaxSLA

▸ **getMaxSLA**(): *Promise*<string\>

**Returns:** *Promise*<string\>

The maximum SLA score, a positive integer

Defined in: [src/apis/vaults.ts:218](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L218)

___

### getPagedIterator

▸ **getPagedIterator**(`perPage`: *number*): *AsyncGenerator*<Vault[], any, unknown\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`perPage` | *number* | Number of vaults to iterate through at a time   |

**Returns:** *AsyncGenerator*<Vault[], any, unknown\>

An AsyncGenerator to be used as an iterator

Defined in: [src/apis/vaults.ts:95](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L95)

___

### getPolkaBTCCapacity

▸ **getPolkaBTCCapacity**(): *Promise*<string\>

**Returns:** *Promise*<string\>

Total PolkaBTC that the total collateral in the system can back.
If every vault is properly collateralized, this value is equivalent to the sum of
issued PolkaBTC and issuable PolkaBTC

Defined in: [src/apis/vaults.ts:234](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L234)

___

### getPremiumRedeemThreshold

▸ **getPremiumRedeemThreshold**(): *Promise*<Big\>

**Returns:** *Promise*<Big\>

The collateral rate of Vaults at which users receive
a premium in DOT, allocated from the
Vault’s collateral, when performing a redeem with this Vault.

Defined in: [src/apis/vaults.ts:179](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L179)

___

### getPremiumRedeemVaults

▸ **getPremiumRedeemVaults**(): *Promise*<Map<AccountId, PolkaBTC\>\>

**Returns:** *Promise*<Map<AccountId, PolkaBTC\>\>

Vaults below the premium redeem threshold, sorted in descending order of their redeemable tokens

Defined in: [src/apis/vaults.ts:158](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L158)

___

### getPunishmentFee

▸ **getPunishmentFee**(): *Promise*<string\>

**Returns:** *Promise*<string\>

Fee that a Vault has to pay if it fails to execute redeem or replace requests
(for redeem, on top of the slashed BTC-in-DOT value of the request). The fee is
paid in DOT based on the PolkaBTC amount at the current exchange rate.

Defined in: [src/apis/vaults.ts:224](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L224)

___

### getRequiredCollateralForVault

▸ **getRequiredCollateralForVault**(`vaultId`: *AccountId*): *Promise*<DOT\>

Get the amount of collateral required for the given vault to be at the
current SecureCollateralThreshold with the current exchange rate

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | The vault account ID   |

**Returns:** *Promise*<DOT\>

The required collateral the vault needs to deposit to stay
above the threshold limit

Defined in: [src/apis/vaults.ts:130](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L130)

___

### getSLA

▸ **getSLA**(`vaultId`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *string* | The vault account ID   |

**Returns:** *Promise*<string\>

The SLA score of the given vault, an integer in the range [0, MaxSLA]

Defined in: [src/apis/vaults.ts:214](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L214)

___

### getSecureCollateralThreshold

▸ **getSecureCollateralThreshold**(): *Promise*<Big\>

**Returns:** *Promise*<Big\>

The over-collateralization rate for DOT collateral locked
by Vaults, necessary for issuing PolkaBTC

Defined in: [src/apis/vaults.ts:189](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L189)

___

### getSlashableCollateral

▸ **getSlashableCollateral**(`vaultId`: *string*, `amount`: *string*): *Promise*<string\>

This function is currently just a stub

#### Parameters:

Name | Type |
:------ | :------ |
`vaultId` | *string* |
`amount` | *string* |

**Returns:** *Promise*<string\>

Defined in: [src/apis/vaults.ts:228](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L228)

___

### getSystemCollateralization

▸ **getSystemCollateralization**(): *Promise*<undefined \| Big\>

Get the total system collateralization measured by the amount of issued PolkaBTC
divided by the total locked DOT collateral.

**Returns:** *Promise*<undefined \| Big\>

The total system collateralization

Defined in: [src/apis/vaults.ts:121](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L121)

___

### getTotalIssuedPolkaBTCAmount

▸ **getTotalIssuedPolkaBTCAmount**(): *Promise*<PolkaBTC\>

**Returns:** *Promise*<PolkaBTC\>

The total amount of PolkaBTC issued by the vaults, denoted in Satoshi

Defined in: [src/apis/vaults.ts:139](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L139)

___

### getVaultCollateralization

▸ **getVaultCollateralization**(`vaultId`: *AccountId*, `newCollateral?`: *DOT*, `onlyIssued?`: *boolean*): *Promise*<undefined \| Big\>

Get the collateralization of a single vault measured by the amount of issued PolkaBTC
divided by the total locked DOT collateral.

**`remarks`** Undefined collateralization is handled as infinite collateralization in the UI.
If no tokens have been issued, the `collateralFunds / issuedFunds` ratio divides by zero,
which means collateralization is infinite.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | the vault account id   |
`newCollateral?` | *DOT* | use this instead of the vault's actual collateral   |
`onlyIssued?` | *boolean* | optional, defaults to `false`. Specifies whether the collateralization should only include the issued tokens, leaving out unsettled ("to-be-issued") tokens   |

**Returns:** *Promise*<undefined \| Big\>

the vault collateralization

Defined in: [src/apis/vaults.ts:114](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L114)

___

### getVaultsWithIssuableTokens

▸ **getVaultsWithIssuableTokens**(): *Promise*<Map<AccountId, PolkaBTC\>\>

**Returns:** *Promise*<Map<AccountId, PolkaBTC\>\>

Vaults with issuable tokens, sorted in descending order of this value

Defined in: [src/apis/vaults.ts:162](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L162)

___

### isVaultFlaggedForTheft

▸ **isVaultFlaggedForTheft**(`vaultId`: *AccountId*): *Promise*<boolean\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | The vault account ID   |

**Returns:** *Promise*<boolean\>

A bollean value

Defined in: [src/apis/vaults.ts:167](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L167)

___

### list

▸ **list**(): *Promise*<VaultExt[]\>

**Returns:** *Promise*<VaultExt[]\>

An array containing the vaults

Defined in: [src/apis/vaults.ts:61](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L61)

___

### listPaged

▸ **listPaged**(): *Promise*<VaultExt[]\>

This function is not finalized

**Returns:** *Promise*<VaultExt[]\>

An array containing the vaults, paged. This function is meant to be used as an
iterator

Defined in: [src/apis/vaults.ts:68](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L68)

___

### mapIssueRequests

▸ **mapIssueRequests**(`vaultId`: *AccountId*): *Promise*<Map<H256, [*IssueRequestExt*](/interfaces/issuerequestext.md)\>\>

Fetch the issue requests associated with a vault

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | The AccountId of the vault used to filter issue requests   |

**Returns:** *Promise*<Map<H256, [*IssueRequestExt*](/interfaces/issuerequestext.md)\>\>

A map with issue ids to issue requests involving said vault

Defined in: [src/apis/vaults.ts:75](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L75)

___

### mapRedeemRequests

▸ **mapRedeemRequests**(`vaultId`: *AccountId*): *Promise*<Map<H256, [*RedeemRequestExt*](/interfaces/redeemrequestext.md)\>\>

Fetch the redeem requests associated with a vault

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | The AccountId of the vault used to filter redeem requests   |

**Returns:** *Promise*<Map<H256, [*RedeemRequestExt*](/interfaces/redeemrequestext.md)\>\>

A map with redeem ids to redeem requests involving said vault

Defined in: [src/apis/vaults.ts:82](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L82)

___

### mapReplaceRequests

▸ **mapReplaceRequests**(`vaultId`: *AccountId*): *Promise*<Map<H256, [*ReplaceRequestExt*](/interfaces/replacerequestext.md)\>\>

Fetch the replace requests associated with a vault. In the returned requests,
the vault is either the replaced or the replacing one.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`vaultId` | *AccountId* | The AccountId of the vault used to filter replace requests   |

**Returns:** *Promise*<Map<H256, [*ReplaceRequestExt*](/interfaces/replacerequestext.md)\>\>

A map with replace ids to replace requests involving said vault as new vault and old vault

Defined in: [src/apis/vaults.ts:90](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L90)

___

### selectRandomVaultIssue

▸ **selectRandomVaultIssue**(`btc`: *PolkaBTC*): *Promise*<AccountId\>

#### Parameters:

Name | Type |
:------ | :------ |
`btc` | *PolkaBTC* |

**Returns:** *Promise*<AccountId\>

A vault that has sufficient DOT collateral to issue the given PolkaBTC amount

Defined in: [src/apis/vaults.ts:149](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L149)

___

### selectRandomVaultRedeem

▸ **selectRandomVaultRedeem**(`btc`: *PolkaBTC*): *Promise*<AccountId\>

#### Parameters:

Name | Type |
:------ | :------ |
`btc` | *PolkaBTC* |

**Returns:** *Promise*<AccountId\>

A vault that has issued sufficient PolkaBTC to redeem the given PolkaBTC amount

Defined in: [src/apis/vaults.ts:154](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/vaults.ts#L154)
