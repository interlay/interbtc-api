[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / VaultsAPI

# Interface: VaultsAPI

## Implemented by

- [`DefaultVaultsAPI`](../classes/DefaultVaultsAPI.md)

## Table of contents

### Methods

- [buildAcceptNewIssuesExtrinsic](VaultsAPI.md#buildacceptnewissuesextrinsic)
- [buildDepositCollateralExtrinsic](VaultsAPI.md#builddepositcollateralextrinsic)
- [buildRegisterPublicKeyExtrinsic](VaultsAPI.md#buildregisterpublickeyextrinsic)
- [buildRegisterVaultExtrinsic](VaultsAPI.md#buildregistervaultextrinsic)
- [buildWithdrawAllCollateralExtrinsic](VaultsAPI.md#buildwithdrawallcollateralextrinsic)
- [buildWithdrawCollateralExtrinsic](VaultsAPI.md#buildwithdrawcollateralextrinsic)
- [calculateCapacity](VaultsAPI.md#calculatecapacity)
- [computeBackingCollateral](VaultsAPI.md#computebackingcollateral)
- [computeReward](VaultsAPI.md#computereward)
- [depositCollateral](VaultsAPI.md#depositcollateral)
- [get](VaultsAPI.md#get)
- [getAPY](VaultsAPI.md#getapy)
- [getBlockRewardAPY](VaultsAPI.md#getblockrewardapy)
- [getCollateral](VaultsAPI.md#getcollateral)
- [getExchangeRateForLiquidation](VaultsAPI.md#getexchangerateforliquidation)
- [getGovernanceReward](VaultsAPI.md#getgovernancereward)
- [getIssuableTokensFromVault](VaultsAPI.md#getissuabletokensfromvault)
- [getIssuedAmount](VaultsAPI.md#getissuedamount)
- [getLiquidationCollateralThreshold](VaultsAPI.md#getliquidationcollateralthreshold)
- [getLiquidationVault](VaultsAPI.md#getliquidationvault)
- [getMaxNominationRatio](VaultsAPI.md#getmaxnominationratio)
- [getMinimumCollateral](VaultsAPI.md#getminimumcollateral)
- [getOrNull](VaultsAPI.md#getornull)
- [getPremiumRedeemThreshold](VaultsAPI.md#getpremiumredeemthreshold)
- [getPremiumRedeemVaults](VaultsAPI.md#getpremiumredeemvaults)
- [getPunishmentFee](VaultsAPI.md#getpunishmentfee)
- [getRequiredCollateralForVault](VaultsAPI.md#getrequiredcollateralforvault)
- [getSecureCollateralThreshold](VaultsAPI.md#getsecurecollateralthreshold)
- [getStakingCapacity](VaultsAPI.md#getstakingcapacity)
- [getTotalIssuableAmount](VaultsAPI.md#gettotalissuableamount)
- [getTotalIssuedAmount](VaultsAPI.md#gettotalissuedamount)
- [getVaultCollateralization](VaultsAPI.md#getvaultcollateralization)
- [getVaultsWithIssuableTokens](VaultsAPI.md#getvaultswithissuabletokens)
- [getVaultsWithRedeemableTokens](VaultsAPI.md#getvaultswithredeemabletokens)
- [getWrappedCurrency](VaultsAPI.md#getwrappedcurrency)
- [getWrappedReward](VaultsAPI.md#getwrappedreward)
- [isVaultFlaggedForTheft](VaultsAPI.md#isvaultflaggedfortheft)
- [list](VaultsAPI.md#list)
- [registerNewCollateralVault](VaultsAPI.md#registernewcollateralvault)
- [selectRandomVaultIssue](VaultsAPI.md#selectrandomvaultissue)
- [selectRandomVaultRedeem](VaultsAPI.md#selectrandomvaultredeem)
- [toggleIssueRequests](VaultsAPI.md#toggleissuerequests)
- [withdrawAllCollateral](VaultsAPI.md#withdrawallcollateral)
- [withdrawCollateral](VaultsAPI.md#withdrawcollateral)

## Methods

### <a id="buildacceptnewissuesextrinsic" name="buildacceptnewissuesextrinsic"></a> buildAcceptNewIssuesExtrinsic

▸ **buildAcceptNewIssuesExtrinsic**(`collateralCurrency`, `acceptNewIssues`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build accept new issues extrinsic without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | the collateral currency for which to change the accepting status, |
| `acceptNewIssues` | `boolean` | Boolean denoting whether issuing should be enabled or not |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

An accept new issues submittable extrinsic.

#### Defined in

[src/parachain/vaults.ts:356](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L356)

___

### <a id="builddepositcollateralextrinsic" name="builddepositcollateralextrinsic"></a> buildDepositCollateralExtrinsic

▸ **buildDepositCollateralExtrinsic**(`amount`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build deposit collateral extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The amount of extra collateral to lock |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A deposit collateral submittable extrinsic.

#### Defined in

[src/parachain/vaults.ts:252](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L252)

___

### <a id="buildregisterpublickeyextrinsic" name="buildregisterpublickeyextrinsic"></a> buildRegisterPublicKeyExtrinsic

▸ **buildRegisterPublicKeyExtrinsic**(`publicKey`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build extrinsic to register a public key.

This extrinsic can be used together with a register vault extrinsic (see: [buildRegisterVaultExtrinsic](VaultsAPI.md#buildregistervaultextrinsic))
to register the first vault for the logged in account id.

Registering the public key should only be done once per account id when it is not associated with a running vault, yet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `publicKey` | `string` | The BTC public key of the vault to derive deposit keys with the [On-Chain Key Derivation Scheme](https://spec.interlay.io/security_performance/xclaim-security.html#okd). |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A register vault submittable extrinsic.

#### Defined in

[src/parachain/vaults.ts:381](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L381)

___

### <a id="buildregistervaultextrinsic" name="buildregistervaultextrinsic"></a> buildRegisterVaultExtrinsic

▸ **buildRegisterVaultExtrinsic**(`collateralAmount`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build extrinsic to register a new vault.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralAmount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The collateral amount to register the vault with - in the new collateral currency. |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A register vault submittable extrinsic.

#### Defined in

[src/parachain/vaults.ts:389](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L389)

___

### <a id="buildwithdrawallcollateralextrinsic" name="buildwithdrawallcollateralextrinsic"></a> buildWithdrawAllCollateralExtrinsic

▸ **buildWithdrawAllCollateralExtrinsic**(`collateralCurrency`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

Build withdraw collateral extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The collateral currency for which to withdraw all |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

A withdraw collateral submittable extrinsic as promise.

#### Defined in

[src/parachain/vaults.ts:236](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L236)

___

### <a id="buildwithdrawcollateralextrinsic" name="buildwithdrawcollateralextrinsic"></a> buildWithdrawCollateralExtrinsic

▸ **buildWithdrawCollateralExtrinsic**(`amount`): `Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

Build withdraw collateral extrinsic (transaction) without sending it.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The amount of collateral to withdraw |

#### Returns

`Promise`\<`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>\>

A withdraw collateral submittable extrinsic as promise.

#### Defined in

[src/parachain/vaults.ts:220](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L220)

___

### <a id="calculatecapacity" name="calculatecapacity"></a> calculateCapacity

▸ **calculateCapacity**(`collateral`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | Amount of collateral to calculate issuable capacity for |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

Issuable amount by the vault, given the collateral amount

#### Defined in

[src/parachain/vaults.ts:137](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L137)

___

### <a id="computebackingcollateral" name="computebackingcollateral"></a> computeBackingCollateral

▸ **computeBackingCollateral**(`vaultId`, `nonce?`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | Vault ID object |
| `nonce?` | `number` | Nonce of the staking pool |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The entire collateral backing a vault's issued tokens.

#### Defined in

[src/parachain/vaults.ts:304](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L304)

___

### <a id="computereward" name="computereward"></a> computeReward

▸ **computeReward**(`vaultAccountId`, `collateralCurrency`, `rewardCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

Compute the total reward, including the staking (local) pool and the rewards (global) pool

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault ID whose reward pool to check |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | - |
| `rewardCurrency` | `Currency` | The reward currency, e.g. kBTC, KINT, interBTC, INTR |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

A Monetary.js amount object, representing the total reward in the given currency

#### Defined in

[src/parachain/vaults.ts:321](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L321)

___

### <a id="depositcollateral" name="depositcollateral"></a> depositCollateral

▸ **depositCollateral**(`amount`): [`ExtrinsicData`](ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The amount of extra collateral to lock |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/vaults.ts:260](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L260)

___

### <a id="get" name="get"></a> get

▸ **get**(`vaultAccountId`, `collateralCurrency`): `Promise`\<[`VaultExt`](../classes/VaultExt.md)\>

Get a vault by account ID and collateral currency. Rejects if no vault exists.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The ID of the vault to fetch |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by vault |

#### Returns

`Promise`\<[`VaultExt`](../classes/VaultExt.md)\>

A vault object, rejects if no vault with the given ID and currency pair exists

#### Defined in

[src/parachain/vaults.ts:67](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L67)

___

### <a id="getapy" name="getapy"></a> getAPY

▸ **getAPY**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`Big`\>

Get the total APY for a vault based on the income in wrapped and collateral tokens
divided by the locked collateral.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault account ID |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`Big`\>

the APY as a percentage string

**`Note`**

this does not account for interest compounding

#### Defined in

[src/parachain/vaults.ts:198](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L198)

___

### <a id="getblockrewardapy" name="getblockrewardapy"></a> getBlockRewardAPY

▸ **getBlockRewardAPY**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`Big`\>

Gets the estimated APY for just the block rewards (in governance tokens).

#### Parameters

| Name | Type |
| :------ | :------ |
| `vaultAccountId` | `AccountId` |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<`Big`\>

the APY as a percentage

#### Defined in

[src/parachain/vaults.ts:205](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L205)

___

### <a id="getcollateral" name="getcollateral"></a> getCollateral

▸ **getCollateral**(`vaultId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | `AccountId` | - |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The collateral of a vault, taking slashes into account.

#### Defined in

[src/parachain/vaults.ts:271](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L271)

___

### <a id="getexchangerateforliquidation" name="getexchangerateforliquidation"></a> getExchangeRateForLiquidation

▸ **getExchangeRateForLiquidation**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`undefined` \| `Big`\>

Get the target exchange rate at which a vault will be forced to liquidate, given its
current locked collateral and issued as well as to be issued tokens.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault's account ID |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The collateral currency for the vault with the account id above |

#### Returns

`Promise`\<`undefined` \| `Big`\>

The theoretical collateral per wrapped currency rate below which the vault would be liquidated.
 Returns undefined if a value cannot be calculated, eg. if the vault has no issued tokens.

#### Defined in

[src/parachain/vaults.ts:412](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L412)

___

### <a id="getgovernancereward" name="getgovernancereward"></a> getGovernanceReward

▸ **getGovernanceReward**(`vaultAccountId`, `vaultCollateral`, `governanceCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault ID whose reward pool to check |
| `vaultCollateral` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by the vault |
| `governanceCurrency` | `Currency` | The fee reward currency |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total reward collected by the vault

#### Defined in

[src/parachain/vaults.ts:343](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L343)

___

### <a id="getissuabletokensfromvault" name="getissuabletokensfromvault"></a> getIssuableTokensFromVault

▸ **getIssuableTokensFromVault**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

Returns issuable amount for a given vault

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault account ID |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The issuable amount of a vault

#### Defined in

[src/parachain/vaults.ts:281](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L281)

___

### <a id="getissuedamount" name="getissuedamount"></a> getIssuedAmount

▸ **getIssuedAmount**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault account ID |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The amount of wrapped tokens issued by the given vault

#### Defined in

[src/parachain/vaults.ts:120](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L120)

___

### <a id="getliquidationcollateralthreshold" name="getliquidationcollateralthreshold"></a> getLiquidationCollateralThreshold

▸ **getLiquidationCollateralThreshold**(`collateralCurrency`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<`Big`\>

The lower bound for vault collateralization.
If a Vault’s collateral rate
drops below this, automatic liquidation (forced Redeem) is triggered.

#### Defined in

[src/parachain/vaults.ts:173](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L173)

___

### <a id="getliquidationvault" name="getliquidationvault"></a> getLiquidationVault

▸ **getLiquidationVault**(`collateralCurrency`): `Promise`\<[`SystemVaultExt`](SystemVaultExt.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<[`SystemVaultExt`](SystemVaultExt.md)\>

A vault object representing the liquidation vault

#### Defined in

[src/parachain/vaults.ts:265](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L265)

___

### <a id="getmaxnominationratio" name="getmaxnominationratio"></a> getMaxNominationRatio

▸ **getMaxNominationRatio**(`collateralCurrency`): `Promise`\<`Big`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The collateral currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`Big`\>

The maximum collateral a vault can accept as nomination, as a ratio of its own collateral

#### Defined in

[src/parachain/vaults.ts:289](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L289)

___

### <a id="getminimumcollateral" name="getminimumcollateral"></a> getMinimumCollateral

▸ **getMinimumCollateral**(`collateralCurrency`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

Get the minimum secured collateral amount required to activate a vault

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

the minimum collateral to register a vault

#### Defined in

[src/parachain/vaults.ts:114](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L114)

___

### <a id="getornull" name="getornull"></a> getOrNull

▸ **getOrNull**(`vaultAccountId`, `collateralCurrency`): `Promise`\<``null`` \| [`VaultExt`](../classes/VaultExt.md)\>

Get a vault by account ID and collateral currency.
Does not reject if the vault does not exist, but returns null instead.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The ID of the vault to fetch |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by vault |

#### Returns

`Promise`\<``null`` \| [`VaultExt`](../classes/VaultExt.md)\>

A vault object, or null if no vault with the given ID and currency pair exists

#### Defined in

[src/parachain/vaults.ts:60](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L60)

___

### <a id="getpremiumredeemthreshold" name="getpremiumredeemthreshold"></a> getPremiumRedeemThreshold

▸ **getPremiumRedeemThreshold**(`collateralCurrency`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<`Big`\>

The collateral rate at which users receive
a premium allocated from the Vault’s collateral, when performing a redeem with this Vault.

#### Defined in

[src/parachain/vaults.ts:179](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L179)

___

### <a id="getpremiumredeemvaults" name="getpremiumredeemvaults"></a> getPremiumRedeemVaults

▸ **getPremiumRedeemVaults**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

Vaults below the premium redeem threshold, sorted in descending order of their redeemable tokens

#### Defined in

[src/parachain/vaults.ts:151](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L151)

___

### <a id="getpunishmentfee" name="getpunishmentfee"></a> getPunishmentFee

▸ **getPunishmentFee**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

Fee that a Vault has to pay, as a percentage, if it fails to execute
redeem or replace requests (for redeem, on top of the slashed wrapped-token-to-collateral
value of the request). The fee is paid in collateral currency based on the wrapped token
amount at the current exchange rate.

#### Defined in

[src/parachain/vaults.ts:212](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L212)

___

### <a id="getrequiredcollateralforvault" name="getrequiredcollateralforvault"></a> getRequiredCollateralForVault

▸ **getRequiredCollateralForVault**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

Get the amount of collateral required for the given vault to be at the
current SecureCollateralThreshold with the current exchange rate

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault account ID |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The required collateral the vault needs to deposit to stay
above the threshold limit

#### Defined in

[src/parachain/vaults.ts:105](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L105)

___

### <a id="getsecurecollateralthreshold" name="getsecurecollateralthreshold"></a> getSecureCollateralThreshold

▸ **getSecureCollateralThreshold**(`collateralCurrency`): `Promise`\<`Big`\>

Get the global secure collateral threshold.

#### Parameters

| Name | Type |
| :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<`Big`\>

The global over-collateralization rate for collateral locked
by Vaults, necessary for issuing wrapped tokens

#### Defined in

[src/parachain/vaults.ts:186](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L186)

___

### <a id="getstakingcapacity" name="getstakingcapacity"></a> getStakingCapacity

▸ **getStakingCapacity**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault account ID |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

Staking capacity, as a collateral currency (e.g. DOT)

#### Defined in

[src/parachain/vaults.ts:295](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L295)

___

### <a id="gettotalissuableamount" name="gettotalissuableamount"></a> getTotalIssuableAmount

▸ **getTotalIssuableAmount**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total amount of wrapped tokens that can be issued, considering the collateral
locked by the vaults

#### Defined in

[src/parachain/vaults.ts:132](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L132)

___

### <a id="gettotalissuedamount" name="gettotalissuedamount"></a> getTotalIssuedAmount

▸ **getTotalIssuedAmount**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total amount of wrapped tokens issued by the vaults

#### Defined in

[src/parachain/vaults.ts:127](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L127)

___

### <a id="getvaultcollateralization" name="getvaultcollateralization"></a> getVaultCollateralization

▸ **getVaultCollateralization**(`vaultAccountId`, `collateralCurrency`, `newCollateral?`, `onlyIssued?`): `Promise`\<`undefined` \| `Big`\>

Get the collateralization of a single vault measured by dividing the value of issued (wrapped) tokens
by the value of total locked collateral.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | the vault account id |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by vault |
| `newCollateral?` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | use this instead of the vault's actual collateral |
| `onlyIssued?` | `boolean` | optional, defaults to `false`. Specifies whether the collateralization should only include the issued tokens, leaving out unsettled ("to-be-issued") tokens |

#### Returns

`Promise`\<`undefined` \| `Big`\>

the vault collateralization

**`Remarks`**

Undefined collateralization is handled as infinite collateralization in the UI.
If no tokens have been issued, the `collateralFunds / issuedFunds` ratio divides by zero,
which means collateralization is infinite.

#### Defined in

[src/parachain/vaults.ts:82](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L82)

___

### <a id="getvaultswithissuabletokens" name="getvaultswithissuabletokens"></a> getVaultsWithIssuableTokens

▸ **getVaultsWithIssuableTokens**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

Vaults with issuable tokens, not sorted in any particular order.

**`Remarks`**

The result is not sorted as an attempt to randomize the assignment of requests to vaults.

#### Defined in

[src/parachain/vaults.ts:156](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L156)

___

### <a id="getvaultswithredeemabletokens" name="getvaultswithredeemabletokens"></a> getVaultsWithRedeemableTokens

▸ **getVaultsWithRedeemableTokens**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

Vaults with redeemable tokens, sorted in descending order.

#### Defined in

[src/parachain/vaults.ts:160](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L160)

___

### <a id="getwrappedcurrency" name="getwrappedcurrency"></a> getWrappedCurrency

▸ **getWrappedCurrency**(): `Currency`

#### Returns

`Currency`

The wrapped currency issued by the vaults

#### Defined in

[src/parachain/vaults.ts:312](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L312)

___

### <a id="getwrappedreward" name="getwrappedreward"></a> getWrappedReward

▸ **getWrappedReward**(`vaultAccountId`, `vaultCollateral`, `rewardCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault ID whose reward pool to check |
| `vaultCollateral` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by the vault |
| `rewardCurrency` | `Currency` | The fee reward currency |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total reward collected by the vault

#### Defined in

[src/parachain/vaults.ts:332](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L332)

___

### <a id="isvaultflaggedfortheft" name="isvaultflaggedfortheft"></a> isVaultFlaggedForTheft

▸ **isVaultFlaggedForTheft**(`vaultId`, `btcTxId`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | The vault ID |
| `btcTxId` | `string` | ID of the Bitcoin transaction to check |

#### Returns

`Promise`\<`boolean`\>

A bollean value

#### Defined in

[src/parachain/vaults.ts:166](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L166)

___

### <a id="list" name="list"></a> list

▸ **list**(`atBlock?`): `Promise`\<[`VaultExt`](../classes/VaultExt.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `atBlock?` | `BlockHash` |

#### Returns

`Promise`\<[`VaultExt`](../classes/VaultExt.md)[]\>

An array containing the vaults with non-zero backing collateral

#### Defined in

[src/parachain/vaults.ts:52](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L52)

___

### <a id="registernewcollateralvault" name="registernewcollateralvault"></a> registerNewCollateralVault

▸ **registerNewCollateralVault**(`collateralAmount`): [`ExtrinsicData`](ExtrinsicData.md)

Registers a new vault for the current account ID with a new collateral amount.
Only applicable if the connected account ID already has a running vault with a different collateral currency.

Rejects with an Error if unable to register.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralAmount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The collateral amount to register the vault with - in the new collateral currency |

#### Returns

[`ExtrinsicData`](ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/vaults.ts:402](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L402)

___

### <a id="selectrandomvaultissue" name="selectrandomvaultissue"></a> selectRandomVaultIssue

▸ **selectRandomVaultIssue**(`amount`): `Promise`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped tokens amount to issue |

#### Returns

`Promise`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md)\>

A vault that has sufficient collateral to issue the given amount

#### Defined in

[src/parachain/vaults.ts:142](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L142)

___

### <a id="selectrandomvaultredeem" name="selectrandomvaultredeem"></a> selectRandomVaultRedeem

▸ **selectRandomVaultRedeem**(`amount`): `Promise`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped tokens amount to redeem |

#### Returns

`Promise`\<[`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md)\>

A vault that has issued sufficient wrapped tokens to redeem the given amount

#### Defined in

[src/parachain/vaults.ts:147](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L147)

___

### <a id="toggleissuerequests" name="toggleissuerequests"></a> toggleIssueRequests

▸ **toggleIssueRequests**(`vaultId`, `acceptNewIssues`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

Enables or disables issue requests for given vault

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md) | The vault ID whose issuing will be toggled |
| `acceptNewIssues` | `boolean` | Boolean denoting whether issuing should be enabled or not |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/vaults.ts:367](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L367)

___

### <a id="withdrawallcollateral" name="withdrawallcollateral"></a> withdrawAllCollateral

▸ **withdrawAllCollateral**(`collateralCurrency`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The collateral currency for which to withdraw all |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/vaults.ts:244](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L244)

___

### <a id="withdrawcollateral" name="withdrawcollateral"></a> withdrawCollateral

▸ **withdrawCollateral**(`amount`): `Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The amount of collateral to withdraw |

#### Returns

`Promise`\<[`ExtrinsicData`](ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Defined in

[src/parachain/vaults.ts:228](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L228)
