[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultVaultsAPI

# Class: DefaultVaultsAPI

## Implements

- [`VaultsAPI`](../interfaces/VaultsAPI.md)

## Table of contents

### Constructors

- [constructor](DefaultVaultsAPI.md#constructor)

### Properties

- [api](DefaultVaultsAPI.md#api)
- [electrsAPI](DefaultVaultsAPI.md#electrsapi)
- [feeAPI](DefaultVaultsAPI.md#feeapi)
- [governanceCurrency](DefaultVaultsAPI.md#governancecurrency)
- [oracleAPI](DefaultVaultsAPI.md#oracleapi)
- [rewardsAPI](DefaultVaultsAPI.md#rewardsapi)
- [systemAPI](DefaultVaultsAPI.md#systemapi)
- [tokensAPI](DefaultVaultsAPI.md#tokensapi)
- [transactionAPI](DefaultVaultsAPI.md#transactionapi)
- [wrappedCurrency](DefaultVaultsAPI.md#wrappedcurrency)

### Methods

- [backingCollateralProportion](DefaultVaultsAPI.md#backingcollateralproportion)
- [buildAcceptNewIssuesExtrinsic](DefaultVaultsAPI.md#buildacceptnewissuesextrinsic)
- [buildDepositCollateralExtrinsic](DefaultVaultsAPI.md#builddepositcollateralextrinsic)
- [buildRegisterPublicKeyExtrinsic](DefaultVaultsAPI.md#buildregisterpublickeyextrinsic)
- [buildRegisterVaultExtrinsic](DefaultVaultsAPI.md#buildregistervaultextrinsic)
- [buildWithdrawAllCollateralExtrinsic](DefaultVaultsAPI.md#buildwithdrawallcollateralextrinsic)
- [buildWithdrawCollateralExtrinsic](DefaultVaultsAPI.md#buildwithdrawcollateralextrinsic)
- [calculateCapacity](DefaultVaultsAPI.md#calculatecapacity)
- [computeBackingCollateral](DefaultVaultsAPI.md#computebackingcollateral)
- [computeReward](DefaultVaultsAPI.md#computereward)
- [depositCollateral](DefaultVaultsAPI.md#depositcollateral)
- [get](DefaultVaultsAPI.md#get)
- [getAPY](DefaultVaultsAPI.md#getapy)
- [getBlockRewardAPY](DefaultVaultsAPI.md#getblockrewardapy)
- [getCollateral](DefaultVaultsAPI.md#getcollateral)
- [getCollateralizationFromVault](DefaultVaultsAPI.md#getcollateralizationfromvault)
- [getCollateralizationFromVaultAndCollateral](DefaultVaultsAPI.md#getcollateralizationfromvaultandcollateral)
- [getExchangeRateForLiquidation](DefaultVaultsAPI.md#getexchangerateforliquidation)
- [getGovernanceReward](DefaultVaultsAPI.md#getgovernancereward)
- [getIssuableTokensFromVault](DefaultVaultsAPI.md#getissuabletokensfromvault)
- [getIssuedAmount](DefaultVaultsAPI.md#getissuedamount)
- [getLiquidationCollateralThreshold](DefaultVaultsAPI.md#getliquidationcollateralthreshold)
- [getLiquidationVault](DefaultVaultsAPI.md#getliquidationvault)
- [getMaxNominationRatio](DefaultVaultsAPI.md#getmaxnominationratio)
- [getMinimumCollateral](DefaultVaultsAPI.md#getminimumcollateral)
- [getOrNull](DefaultVaultsAPI.md#getornull)
- [getPremiumRedeemThreshold](DefaultVaultsAPI.md#getpremiumredeemthreshold)
- [getPremiumRedeemVaults](DefaultVaultsAPI.md#getpremiumredeemvaults)
- [getPunishmentFee](DefaultVaultsAPI.md#getpunishmentfee)
- [getRegisterVaultEvent](DefaultVaultsAPI.md#getregistervaultevent)
- [getRequiredCollateralForVault](DefaultVaultsAPI.md#getrequiredcollateralforvault)
- [getRequiredCollateralForWrapped](DefaultVaultsAPI.md#getrequiredcollateralforwrapped)
- [getSecureCollateralThreshold](DefaultVaultsAPI.md#getsecurecollateralthreshold)
- [getStakingCapacity](DefaultVaultsAPI.md#getstakingcapacity)
- [getSystemCollateralization](DefaultVaultsAPI.md#getsystemcollateralization)
- [getTotalIssuableAmount](DefaultVaultsAPI.md#gettotalissuableamount)
- [getTotalIssuedAmount](DefaultVaultsAPI.md#gettotalissuedamount)
- [getVaultCollateralization](DefaultVaultsAPI.md#getvaultcollateralization)
- [getVaultsEligibleForRedeeming](DefaultVaultsAPI.md#getvaultseligibleforredeeming)
- [getVaultsWithIssuableTokens](DefaultVaultsAPI.md#getvaultswithissuabletokens)
- [getVaultsWithRedeemableTokens](DefaultVaultsAPI.md#getvaultswithredeemabletokens)
- [getWrappedCurrency](DefaultVaultsAPI.md#getwrappedcurrency)
- [getWrappedReward](DefaultVaultsAPI.md#getwrappedreward)
- [isBelowPremiumThreshold](DefaultVaultsAPI.md#isbelowpremiumthreshold)
- [isNoTokensIssuedError](DefaultVaultsAPI.md#isnotokensissuederror)
- [isVaultEligibleForRedeem](DefaultVaultsAPI.md#isvaulteligibleforredeem)
- [isVaultFlaggedForTheft](DefaultVaultsAPI.md#isvaultflaggedfortheft)
- [list](DefaultVaultsAPI.md#list)
- [parseVault](DefaultVaultsAPI.md#parsevault)
- [parseVaultStatus](DefaultVaultsAPI.md#parsevaultstatus)
- [registerNewCollateralVault](DefaultVaultsAPI.md#registernewcollateralvault)
- [selectRandomVaultIssue](DefaultVaultsAPI.md#selectrandomvaultissue)
- [selectRandomVaultRedeem](DefaultVaultsAPI.md#selectrandomvaultredeem)
- [toggleIssueRequests](DefaultVaultsAPI.md#toggleissuerequests)
- [withdrawAllCollateral](DefaultVaultsAPI.md#withdrawallcollateral)
- [withdrawCollateral](DefaultVaultsAPI.md#withdrawcollateral)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultVaultsAPI**(`api`, `electrsAPI`, `wrappedCurrency`, `governanceCurrency`, `tokensAPI`, `oracleAPI`, `feeAPI`, `rewardsAPI`, `systemAPI`, `transactionAPI`): [`DefaultVaultsAPI`](DefaultVaultsAPI.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `electrsAPI` | [`ElectrsAPI`](../interfaces/ElectrsAPI.md) |
| `wrappedCurrency` | `Currency` |
| `governanceCurrency` | `Currency` |
| `tokensAPI` | [`TokensAPI`](../interfaces/TokensAPI.md) |
| `oracleAPI` | [`OracleAPI`](../interfaces/OracleAPI.md) |
| `feeAPI` | [`FeeAPI`](../interfaces/FeeAPI.md) |
| `rewardsAPI` | [`RewardsAPI`](../interfaces/RewardsAPI.md) |
| `systemAPI` | [`SystemAPI`](../interfaces/SystemAPI.md) |
| `transactionAPI` | [`TransactionAPI`](../interfaces/TransactionAPI.md) |

#### Returns

[`DefaultVaultsAPI`](DefaultVaultsAPI.md)

#### Defined in

[src/parachain/vaults.ts:421](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L421)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/parachain/vaults.ts:422](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L422)

___

### <a id="electrsapi" name="electrsapi"></a> electrsAPI

• `Private` **electrsAPI**: [`ElectrsAPI`](../interfaces/ElectrsAPI.md)

#### Defined in

[src/parachain/vaults.ts:423](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L423)

___

### <a id="feeapi" name="feeapi"></a> feeAPI

• `Private` **feeAPI**: [`FeeAPI`](../interfaces/FeeAPI.md)

#### Defined in

[src/parachain/vaults.ts:428](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L428)

___

### <a id="governancecurrency" name="governancecurrency"></a> governanceCurrency

• `Private` **governanceCurrency**: `Currency`

#### Defined in

[src/parachain/vaults.ts:425](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L425)

___

### <a id="oracleapi" name="oracleapi"></a> oracleAPI

• `Private` **oracleAPI**: [`OracleAPI`](../interfaces/OracleAPI.md)

#### Defined in

[src/parachain/vaults.ts:427](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L427)

___

### <a id="rewardsapi" name="rewardsapi"></a> rewardsAPI

• `Private` **rewardsAPI**: [`RewardsAPI`](../interfaces/RewardsAPI.md)

#### Defined in

[src/parachain/vaults.ts:429](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L429)

___

### <a id="systemapi" name="systemapi"></a> systemAPI

• `Private` **systemAPI**: [`SystemAPI`](../interfaces/SystemAPI.md)

#### Defined in

[src/parachain/vaults.ts:430](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L430)

___

### <a id="tokensapi" name="tokensapi"></a> tokensAPI

• `Private` **tokensAPI**: [`TokensAPI`](../interfaces/TokensAPI.md)

#### Defined in

[src/parachain/vaults.ts:426](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L426)

___

### <a id="transactionapi" name="transactionapi"></a> transactionAPI

• `Private` **transactionAPI**: [`TransactionAPI`](../interfaces/TransactionAPI.md)

#### Defined in

[src/parachain/vaults.ts:431](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L431)

___

### <a id="wrappedcurrency" name="wrappedcurrency"></a> wrappedCurrency

• `Private` **wrappedCurrency**: `Currency`

#### Defined in

[src/parachain/vaults.ts:424](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L424)

## Methods

### <a id="backingcollateralproportion" name="backingcollateralproportion"></a> backingCollateralProportion

▸ **backingCollateralProportion**(`vaultAccountId`, `nominatorId`, `collateralCurrency`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `vaultAccountId` | `AccountId` |
| `nominatorId` | `AccountId` |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/vaults.ts:606](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L606)

___

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[buildAcceptNewIssuesExtrinsic](../interfaces/VaultsAPI.md#buildacceptnewissuesextrinsic)

#### Defined in

[src/parachain/vaults.ts:1009](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L1009)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[buildDepositCollateralExtrinsic](../interfaces/VaultsAPI.md#builddepositcollateralextrinsic)

#### Defined in

[src/parachain/vaults.ts:513](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L513)

___

### <a id="buildregisterpublickeyextrinsic" name="buildregisterpublickeyextrinsic"></a> buildRegisterPublicKeyExtrinsic

▸ **buildRegisterPublicKeyExtrinsic**(`publicKey`): `SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

Build extrinsic to register a public key.

This extrinsic can be used together with a register vault extrinsic (see: [buildRegisterVaultExtrinsic](../interfaces/VaultsAPI.md#buildregistervaultextrinsic))
to register the first vault for the logged in account id.

Registering the public key should only be done once per account id when it is not associated with a running vault, yet.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `publicKey` | `string` | The BTC public key of the vault to derive deposit keys with the [On-Chain Key Derivation Scheme](https://spec.interlay.io/security_performance/xclaim-security.html#okd). |

#### Returns

`SubmittableExtrinsic`\<``"promise"``, `ISubmittableResult`\>

A register vault submittable extrinsic.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[buildRegisterPublicKeyExtrinsic](../interfaces/VaultsAPI.md#buildregisterpublickeyextrinsic)

#### Defined in

[src/parachain/vaults.ts:463](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L463)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[buildRegisterVaultExtrinsic](../interfaces/VaultsAPI.md#buildregistervaultextrinsic)

#### Defined in

[src/parachain/vaults.ts:455](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L455)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[buildWithdrawAllCollateralExtrinsic](../interfaces/VaultsAPI.md#buildwithdrawallcollateralextrinsic)

#### Defined in

[src/parachain/vaults.ts:490](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L490)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[buildWithdrawCollateralExtrinsic](../interfaces/VaultsAPI.md#buildwithdrawcollateralextrinsic)

#### Defined in

[src/parachain/vaults.ts:467](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L467)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[calculateCapacity](../interfaces/VaultsAPI.md#calculatecapacity)

#### Defined in

[src/parachain/vaults.ts:812](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L812)

___

### <a id="computebackingcollateral" name="computebackingcollateral"></a> computeBackingCollateral

▸ **computeBackingCollateral**(`vaultId`, `nonce?`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | Vault ID object |
| `nonce?` | `number` | Nonce of the staking pool |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The entire collateral backing a vault's issued tokens.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[computeBackingCollateral](../interfaces/VaultsAPI.md#computebackingcollateral)

#### Defined in

[src/parachain/vaults.ts:593](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L593)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[computeReward](../interfaces/VaultsAPI.md#computereward)

#### Defined in

[src/parachain/vaults.ts:645](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L645)

___

### <a id="depositcollateral" name="depositcollateral"></a> depositCollateral

▸ **depositCollateral**(`amount`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The amount of extra collateral to lock |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[depositCollateral](../interfaces/VaultsAPI.md#depositcollateral)

#### Defined in

[src/parachain/vaults.ts:530](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L530)

___

### <a id="get" name="get"></a> get

▸ **get**(`vaultAccountId`, `collateralCurrency`): `Promise`\<[`VaultExt`](VaultExt.md)\>

Get a vault by account ID and collateral currency. Rejects if no vault exists.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The ID of the vault to fetch |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by vault |

#### Returns

`Promise`\<[`VaultExt`](VaultExt.md)\>

A vault object, rejects if no vault with the given ID and currency pair exists

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[get](../interfaces/VaultsAPI.md#get)

#### Defined in

[src/parachain/vaults.ts:555](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L555)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getAPY](../interfaces/VaultsAPI.md#getapy)

#### Defined in

[src/parachain/vaults.ts:957](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L957)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getBlockRewardAPY](../interfaces/VaultsAPI.md#getblockrewardapy)

#### Defined in

[src/parachain/vaults.ts:632](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L632)

___

### <a id="getcollateral" name="getcollateral"></a> getCollateral

▸ **getCollateral**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | - |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The collateral of a vault, taking slashes into account.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getCollateral](../interfaces/VaultsAPI.md#getcollateral)

#### Defined in

[src/parachain/vaults.ts:566](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L566)

___

### <a id="getcollateralizationfromvault" name="getcollateralizationfromvault"></a> getCollateralizationFromVault

▸ **getCollateralizationFromVault**(`vaultId`, `onlyIssued?`): `Promise`\<`Big`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | `undefined` |
| `onlyIssued` | `boolean` | `false` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/vaults.ts:743](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L743)

___

### <a id="getcollateralizationfromvaultandcollateral" name="getcollateralizationfromvaultandcollateral"></a> getCollateralizationFromVaultAndCollateral

▸ **getCollateralizationFromVaultAndCollateral**(`vaultId`, `newCollateral`, `onlyIssued`): `Promise`\<`Big`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) |
| `newCollateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> |
| `onlyIssued` | `boolean` |

#### Returns

`Promise`\<`Big`\>

#### Defined in

[src/parachain/vaults.ts:748](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L748)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getExchangeRateForLiquidation](../interfaces/VaultsAPI.md#getexchangerateforliquidation)

#### Defined in

[src/parachain/vaults.ts:1023](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L1023)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getGovernanceReward](../interfaces/VaultsAPI.md#getgovernancereward)

#### Defined in

[src/parachain/vaults.ts:666](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L666)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getIssuableTokensFromVault](../interfaces/VaultsAPI.md#getissuabletokensfromvault)

#### Defined in

[src/parachain/vaults.ts:827](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L827)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getIssuedAmount](../interfaces/VaultsAPI.md#getissuedamount)

#### Defined in

[src/parachain/vaults.ts:788](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L788)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getLiquidationCollateralThreshold](../interfaces/VaultsAPI.md#getliquidationcollateralthreshold)

#### Defined in

[src/parachain/vaults.ts:933](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L933)

___

### <a id="getliquidationvault" name="getliquidationvault"></a> getLiquidationVault

▸ **getLiquidationVault**(`collateralCurrency`): `Promise`\<[`SystemVaultExt`](../interfaces/SystemVaultExt.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<[`SystemVaultExt`](../interfaces/SystemVaultExt.md)\>

A vault object representing the liquidation vault

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getLiquidationVault](../interfaces/VaultsAPI.md#getliquidationvault)

#### Defined in

[src/parachain/vaults.ts:686](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L686)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getMaxNominationRatio](../interfaces/VaultsAPI.md#getmaxnominationratio)

#### Defined in

[src/parachain/vaults.ts:585](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L585)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getMinimumCollateral](../interfaces/VaultsAPI.md#getminimumcollateral)

#### Defined in

[src/parachain/vaults.ts:576](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L576)

___

### <a id="getornull" name="getornull"></a> getOrNull

▸ **getOrNull**(`vaultAccountId`, `collateralCurrency`): `Promise`\<``null`` \| [`VaultExt`](VaultExt.md)\>

Get a vault by account ID and collateral currency.
Does not reject if the vault does not exist, but returns null instead.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The ID of the vault to fetch |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by vault |

#### Returns

`Promise`\<``null`` \| [`VaultExt`](VaultExt.md)\>

A vault object, or null if no vault with the given ID and currency pair exists

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getOrNull](../interfaces/VaultsAPI.md#getornull)

#### Defined in

[src/parachain/vaults.ts:542](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L542)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getPremiumRedeemThreshold](../interfaces/VaultsAPI.md#getpremiumredeemthreshold)

#### Defined in

[src/parachain/vaults.ts:942](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L942)

___

### <a id="getpremiumredeemvaults" name="getpremiumredeemvaults"></a> getPremiumRedeemVaults

▸ **getPremiumRedeemVaults**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

Vaults below the premium redeem threshold, sorted in descending order of their redeemable tokens

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getPremiumRedeemVaults](../interfaces/VaultsAPI.md#getpremiumredeemvaults)

#### Defined in

[src/parachain/vaults.ts:863](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L863)

___

### <a id="getpunishmentfee" name="getpunishmentfee"></a> getPunishmentFee

▸ **getPunishmentFee**(): `Promise`\<`Big`\>

#### Returns

`Promise`\<`Big`\>

Fee that a Vault has to pay, as a percentage, if it fails to execute
redeem or replace requests (for redeem, on top of the slashed wrapped-token-to-collateral
value of the request). The fee is paid in collateral currency based on the wrapped token
amount at the current exchange rate.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getPunishmentFee](../interfaces/VaultsAPI.md#getpunishmentfee)

#### Defined in

[src/parachain/vaults.ts:966](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L966)

___

### <a id="getregistervaultevent" name="getregistervaultevent"></a> getRegisterVaultEvent

▸ **getRegisterVaultEvent**(): `AugmentedEvent`\<`ApiTypes`, `AnyTuple`\>

#### Returns

`AugmentedEvent`\<`ApiTypes`, `AnyTuple`\>

#### Defined in

[src/parachain/vaults.ts:451](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L451)

___

### <a id="getrequiredcollateralforvault" name="getrequiredcollateralforvault"></a> getRequiredCollateralForVault

▸ **getRequiredCollateralForVault**(`vaultAccountId`, `currency`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

Get the amount of collateral required for the given vault to be at the
current SecureCollateralThreshold with the current exchange rate

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault account ID |
| `currency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The currency specification, a `Monetary.js` object or `ForeignAsset` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

The required collateral the vault needs to deposit to stay
above the threshold limit

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getRequiredCollateralForVault](../interfaces/VaultsAPI.md#getrequiredcollateralforvault)

#### Defined in

[src/parachain/vaults.ts:770](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L770)

___

### <a id="getrequiredcollateralforwrapped" name="getrequiredcollateralforwrapped"></a> getRequiredCollateralForWrapped

▸ **getRequiredCollateralForWrapped**(`wrappedAmount`, `currency`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `wrappedAmount` | `MonetaryAmount`\<`Currency`\> |
| `currency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Defined in

[src/parachain/vaults.ts:779](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L779)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getSecureCollateralThreshold](../interfaces/VaultsAPI.md#getsecurecollateralthreshold)

#### Defined in

[src/parachain/vaults.ts:951](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L951)

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

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getStakingCapacity](../interfaces/VaultsAPI.md#getstakingcapacity)

#### Defined in

[src/parachain/vaults.ts:674](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L674)

___

### <a id="getsystemcollateralization" name="getsystemcollateralization"></a> getSystemCollateralization

▸ **getSystemCollateralization**(): `Promise`\<`undefined` \| `Big`\>

#### Returns

`Promise`\<`undefined` \| `Big`\>

#### Defined in

[src/parachain/vaults.ts:765](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L765)

___

### <a id="gettotalissuableamount" name="gettotalissuableamount"></a> getTotalIssuableAmount

▸ **getTotalIssuableAmount**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total amount of wrapped tokens that can be issued, considering the collateral
locked by the vaults

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getTotalIssuableAmount](../interfaces/VaultsAPI.md#gettotalissuableamount)

#### Defined in

[src/parachain/vaults.ts:801](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L801)

___

### <a id="gettotalissuedamount" name="gettotalissuedamount"></a> getTotalIssuedAmount

▸ **getTotalIssuedAmount**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total amount of wrapped tokens issued by the vaults

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getTotalIssuedAmount](../interfaces/VaultsAPI.md#gettotalissuedamount)

#### Defined in

[src/parachain/vaults.ts:796](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L796)

___

### <a id="getvaultcollateralization" name="getvaultcollateralization"></a> getVaultCollateralization

▸ **getVaultCollateralization**(`vaultAccountId`, `collateralCurrency`, `newCollateral?`, `onlyIssued?`): `Promise`\<`undefined` \| `Big`\>

Get the collateralization of a single vault measured by dividing the value of issued (wrapped) tokens
by the value of total locked collateral.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | `undefined` | the vault account id |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | `undefined` | Collateral used by vault |
| `newCollateral?` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | `undefined` | use this instead of the vault's actual collateral |
| `onlyIssued` | `boolean` | `false` | optional, defaults to `false`. Specifies whether the collateralization should only include the issued tokens, leaving out unsettled ("to-be-issued") tokens |

#### Returns

`Promise`\<`undefined` \| `Big`\>

the vault collateralization

**`Remarks`**

Undefined collateralization is handled as infinite collateralization in the UI.
If no tokens have been issued, the `collateralFunds / issuedFunds` ratio divides by zero,
which means collateralization is infinite.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getVaultCollateralization](../interfaces/VaultsAPI.md#getvaultcollateralization)

#### Defined in

[src/parachain/vaults.ts:713](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L713)

___

### <a id="getvaultseligibleforredeeming" name="getvaultseligibleforredeeming"></a> getVaultsEligibleForRedeeming

▸ **getVaultsEligibleForRedeeming**(): `Promise`\<[`VaultExt`](VaultExt.md)[]\>

#### Returns

`Promise`\<[`VaultExt`](VaultExt.md)[]\>

#### Defined in

[src/parachain/vaults.ts:898](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L898)

___

### <a id="getvaultswithissuabletokens" name="getvaultswithissuabletokens"></a> getVaultsWithIssuableTokens

▸ **getVaultsWithIssuableTokens**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

Vaults with issuable tokens, not sorted in any particular order.

**`Remarks`**

The result is not sorted as an attempt to randomize the assignment of requests to vaults.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getVaultsWithIssuableTokens](../interfaces/VaultsAPI.md#getvaultswithissuabletokens)

#### Defined in

[src/parachain/vaults.ts:876](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L876)

___

### <a id="getvaultswithredeemabletokens" name="getvaultswithredeemabletokens"></a> getVaultsWithRedeemableTokens

▸ **getVaultsWithRedeemableTokens**(): `Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

#### Returns

`Promise`\<`Map`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md), `MonetaryAmount`\<`Currency`\>\>\>

Vaults with redeemable tokens, sorted in descending order.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getVaultsWithRedeemableTokens](../interfaces/VaultsAPI.md#getvaultswithredeemabletokens)

#### Defined in

[src/parachain/vaults.ts:912](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L912)

___

### <a id="getwrappedcurrency" name="getwrappedcurrency"></a> getWrappedCurrency

▸ **getWrappedCurrency**(): `Currency`

#### Returns

`Currency`

The wrapped currency issued by the vaults

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getWrappedCurrency](../interfaces/VaultsAPI.md#getwrappedcurrency)

#### Defined in

[src/parachain/vaults.ts:434](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L434)

___

### <a id="getwrappedreward" name="getwrappedreward"></a> getWrappedReward

▸ **getWrappedReward**(`vaultAccountId`, `collateralCurrency`): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultAccountId` | `AccountId` | The vault ID whose reward pool to check |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | Collateral used by the vault |

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

The total reward collected by the vault

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[getWrappedReward](../interfaces/VaultsAPI.md#getwrappedreward)

#### Defined in

[src/parachain/vaults.ts:659](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L659)

___

### <a id="isbelowpremiumthreshold" name="isbelowpremiumthreshold"></a> isBelowPremiumThreshold

▸ **isBelowPremiumThreshold**(`vaultId`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) |

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/parachain/vaults.ts:705](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L705)

___

### <a id="isnotokensissuederror" name="isnotokensissuederror"></a> isNoTokensIssuedError

▸ **isNoTokensIssuedError**(`e`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `string` |

#### Returns

`boolean`

#### Defined in

[src/parachain/vaults.ts:701](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L701)

___

### <a id="isvaulteligibleforredeem" name="isvaulteligibleforredeem"></a> isVaultEligibleForRedeem

▸ **isVaultEligibleForRedeem**(`vault`, `activeBlockNumber`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `vault` | [`VaultExt`](VaultExt.md) |
| `activeBlockNumber` | `number` |

#### Returns

`boolean`

#### Defined in

[src/parachain/vaults.ts:889](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L889)

___

### <a id="isvaultflaggedfortheft" name="isvaultflaggedfortheft"></a> isVaultFlaggedForTheft

▸ **isVaultFlaggedForTheft**(`vaultId`, `btcTxId`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | The vault ID |
| `btcTxId` | `string` | ID of the Bitcoin transaction to check |

#### Returns

`Promise`\<`boolean`\>

A bollean value

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[isVaultFlaggedForTheft](../interfaces/VaultsAPI.md#isvaultflaggedfortheft)

#### Defined in

[src/parachain/vaults.ts:926](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L926)

___

### <a id="list" name="list"></a> list

▸ **list**(`atBlock?`): `Promise`\<[`VaultExt`](VaultExt.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `atBlock?` | `BlockHash` |

#### Returns

`Promise`\<[`VaultExt`](VaultExt.md)[]\>

An array containing the vaults with non-zero backing collateral

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[list](../interfaces/VaultsAPI.md#list)

#### Defined in

[src/parachain/vaults.ts:535](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L535)

___

### <a id="parsevault" name="parsevault"></a> parseVault

▸ **parseVault**(`vault`): `Promise`\<[`VaultExt`](VaultExt.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `vault` | [`VaultRegistryVault`](../interfaces/VaultRegistryVault.md) |

#### Returns

`Promise`\<[`VaultExt`](VaultExt.md)\>

#### Defined in

[src/parachain/vaults.ts:981](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L981)

___

### <a id="parsevaultstatus" name="parsevaultstatus"></a> parseVaultStatus

▸ **parseVaultStatus**(`status`): [`VaultStatusExt`](../enums/VaultStatusExt.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `status` | `VaultRegistryVaultStatus` |

#### Returns

[`VaultStatusExt`](../enums/VaultStatusExt.md)

#### Defined in

[src/parachain/vaults.ts:971](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L971)

___

### <a id="registernewcollateralvault" name="registernewcollateralvault"></a> registerNewCollateralVault

▸ **registerNewCollateralVault**(`collateralAmount`): [`ExtrinsicData`](../interfaces/ExtrinsicData.md)

Registers a new vault for the current account ID with a new collateral amount.
Only applicable if the connected account ID already has a running vault with a different collateral currency.

Rejects with an Error if unable to register.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralAmount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The collateral amount to register the vault with - in the new collateral currency |

#### Returns

[`ExtrinsicData`](../interfaces/ExtrinsicData.md)

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[registerNewCollateralVault](../interfaces/VaultsAPI.md#registernewcollateralvault)

#### Defined in

[src/parachain/vaults.ts:438](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L438)

___

### <a id="selectrandomvaultissue" name="selectrandomvaultissue"></a> selectRandomVaultIssue

▸ **selectRandomVaultIssue**(`amount`): `Promise`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped tokens amount to issue |

#### Returns

`Promise`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md)\>

A vault that has sufficient collateral to issue the given amount

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[selectRandomVaultIssue](../interfaces/VaultsAPI.md#selectrandomvaultissue)

#### Defined in

[src/parachain/vaults.ts:842](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L842)

___

### <a id="selectrandomvaultredeem" name="selectrandomvaultredeem"></a> selectRandomVaultRedeem

▸ **selectRandomVaultRedeem**(`amount`): `Promise`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<`Currency`\> | Wrapped tokens amount to redeem |

#### Returns

`Promise`\<[`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md)\>

A vault that has issued sufficient wrapped tokens to redeem the given amount

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[selectRandomVaultRedeem](../interfaces/VaultsAPI.md#selectrandomvaultredeem)

#### Defined in

[src/parachain/vaults.ts:852](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L852)

___

### <a id="toggleissuerequests" name="toggleissuerequests"></a> toggleIssueRequests

▸ **toggleIssueRequests**(`vaultId`, `acceptNewIssues`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

Enables or disables issue requests for given vault

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vaultId` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) | The vault ID whose issuing will be toggled |
| `acceptNewIssues` | `boolean` | Boolean denoting whether issuing should be enabled or not |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[toggleIssueRequests](../interfaces/VaultsAPI.md#toggleissuerequests)

#### Defined in

[src/parachain/vaults.ts:1017](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L1017)

___

### <a id="withdrawallcollateral" name="withdrawallcollateral"></a> withdrawAllCollateral

▸ **withdrawAllCollateral**(`collateralCurrency`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) | The collateral currency for which to withdraw all |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[withdrawAllCollateral](../interfaces/VaultsAPI.md#withdrawallcollateral)

#### Defined in

[src/parachain/vaults.ts:508](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L508)

___

### <a id="withdrawcollateral" name="withdrawcollateral"></a> withdrawCollateral

▸ **withdrawCollateral**(`amount`): `Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> | The amount of collateral to withdraw |

#### Returns

`Promise`\<[`ExtrinsicData`](../interfaces/ExtrinsicData.md)\>

A submittable extrinsic and an event that is emitted when extrinsic is submitted.

#### Implementation of

[VaultsAPI](../interfaces/VaultsAPI.md).[withdrawCollateral](../interfaces/VaultsAPI.md#withdrawcollateral)

#### Defined in

[src/parachain/vaults.ts:485](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/parachain/vaults.ts#L485)
