[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / VaultExt

# Class: VaultExt

## Table of contents

### Constructors

- [constructor](VaultExt.md#constructor)

### Properties

- [api](VaultExt.md#api)
- [backingCollateral](VaultExt.md#backingcollateral)
- [bannedUntil](VaultExt.md#banneduntil)
- [id](VaultExt.md#id)
- [issuedTokens](VaultExt.md#issuedtokens)
- [liquidatedCollateral](VaultExt.md#liquidatedcollateral)
- [oracleAPI](VaultExt.md#oracleapi)
- [replaceCollateral](VaultExt.md#replacecollateral)
- [secureCollateralThreshold](VaultExt.md#securecollateralthreshold)
- [status](VaultExt.md#status)
- [systemAPI](VaultExt.md#systemapi)
- [toBeIssuedTokens](VaultExt.md#tobeissuedtokens)
- [toBeRedeemedTokens](VaultExt.md#toberedeemedtokens)
- [toBeReplacedTokens](VaultExt.md#tobereplacedtokens)

### Methods

- [computeBackingCollateral](VaultExt.md#computebackingcollateral)
- [getBackedTokens](VaultExt.md#getbackedtokens)
- [getFreeCollateral](VaultExt.md#getfreecollateral)
- [getIssuableTokens](VaultExt.md#getissuabletokens)
- [getRedeemableTokens](VaultExt.md#getredeemabletokens)
- [getSecureCollateralThreshold](VaultExt.md#getsecurecollateralthreshold)
- [getStakingPoolNonce](VaultExt.md#getstakingpoolnonce)
- [getUsedCollateral](VaultExt.md#getusedcollateral)
- [isBanned](VaultExt.md#isbanned)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new VaultExt**(`api`, `oracleAPI`, `systemAPI`, `backingCollateral`, `id`, `status`, `bannedUntil`, `toBeIssuedTokens`, `issuedTokens`, `toBeRedeemedTokens`, `toBeReplacedTokens`, `replaceCollateral`, `liquidatedCollateral`, `secureCollateralThreshold`): [`VaultExt`](VaultExt.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `api` | `ApiPromise` |
| `oracleAPI` | [`OracleAPI`](../interfaces/OracleAPI.md) |
| `systemAPI` | [`SystemAPI`](../interfaces/SystemAPI.md) |
| `backingCollateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> |
| `id` | [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md) |
| `status` | [`VaultStatusExt`](../enums/VaultStatusExt.md) |
| `bannedUntil` | `undefined` \| `number` |
| `toBeIssuedTokens` | `MonetaryAmount`\<`Currency`\> |
| `issuedTokens` | `MonetaryAmount`\<`Currency`\> |
| `toBeRedeemedTokens` | `MonetaryAmount`\<`Currency`\> |
| `toBeReplacedTokens` | `MonetaryAmount`\<`Currency`\> |
| `replaceCollateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> |
| `liquidatedCollateral` | `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\> |
| `secureCollateralThreshold` | `Big` |

#### Returns

[`VaultExt`](VaultExt.md)

#### Defined in

[src/types/vault.ts:29](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L29)

## Properties

### <a id="api" name="api"></a> api

• `Private` **api**: `ApiPromise`

#### Defined in

[src/types/vault.ts:30](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L30)

___

### <a id="backingcollateral" name="backingcollateral"></a> backingCollateral

• **backingCollateral**: `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>

#### Defined in

[src/types/vault.ts:17](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L17)

___

### <a id="banneduntil" name="banneduntil"></a> bannedUntil

• **bannedUntil**: `undefined` \| `number`

#### Defined in

[src/types/vault.ts:20](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L20)

___

### <a id="id" name="id"></a> id

• **id**: [`InterbtcPrimitivesVaultId`](../interfaces/InterbtcPrimitivesVaultId.md)

#### Defined in

[src/types/vault.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L18)

___

### <a id="issuedtokens" name="issuedtokens"></a> issuedTokens

• **issuedTokens**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:22](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L22)

___

### <a id="liquidatedcollateral" name="liquidatedcollateral"></a> liquidatedCollateral

• **liquidatedCollateral**: `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>

#### Defined in

[src/types/vault.ts:26](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L26)

___

### <a id="oracleapi" name="oracleapi"></a> oracleAPI

• `Private` **oracleAPI**: [`OracleAPI`](../interfaces/OracleAPI.md)

#### Defined in

[src/types/vault.ts:31](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L31)

___

### <a id="replacecollateral" name="replacecollateral"></a> replaceCollateral

• **replaceCollateral**: `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>

#### Defined in

[src/types/vault.ts:25](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L25)

___

### <a id="securecollateralthreshold" name="securecollateralthreshold"></a> secureCollateralThreshold

• **secureCollateralThreshold**: `Big`

#### Defined in

[src/types/vault.ts:27](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L27)

___

### <a id="status" name="status"></a> status

• **status**: [`VaultStatusExt`](../enums/VaultStatusExt.md)

#### Defined in

[src/types/vault.ts:19](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L19)

___

### <a id="systemapi" name="systemapi"></a> systemAPI

• `Private` **systemAPI**: [`SystemAPI`](../interfaces/SystemAPI.md)

#### Defined in

[src/types/vault.ts:32](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L32)

___

### <a id="tobeissuedtokens" name="tobeissuedtokens"></a> toBeIssuedTokens

• **toBeIssuedTokens**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L21)

___

### <a id="toberedeemedtokens" name="toberedeemedtokens"></a> toBeRedeemedTokens

• **toBeRedeemedTokens**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:23](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L23)

___

### <a id="tobereplacedtokens" name="tobereplacedtokens"></a> toBeReplacedTokens

• **toBeReplacedTokens**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:24](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L24)

## Methods

### <a id="computebackingcollateral" name="computebackingcollateral"></a> computeBackingCollateral

▸ **computeBackingCollateral**(`nonce?`): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `nonce?` | `number` |

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Defined in

[src/types/vault.ts:108](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L108)

___

### <a id="getbackedtokens" name="getbackedtokens"></a> getBackedTokens

▸ **getBackedTokens**(): `MonetaryAmount`\<`Currency`\>

#### Returns

`MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:79](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L79)

___

### <a id="getfreecollateral" name="getfreecollateral"></a> getFreeCollateral

▸ **getFreeCollateral**(): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Defined in

[src/types/vault.ts:83](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L83)

___

### <a id="getissuabletokens" name="getissuabletokens"></a> getIssuableTokens

▸ **getIssuableTokens**(): `Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<`Currency`\>\>

#### Defined in

[src/types/vault.ts:62](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L62)

___

### <a id="getredeemabletokens" name="getredeemabletokens"></a> getRedeemableTokens

▸ **getRedeemableTokens**(): `MonetaryAmount`\<`Currency`\>

#### Returns

`MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:58](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L58)

___

### <a id="getsecurecollateralthreshold" name="getsecurecollateralthreshold"></a> getSecureCollateralThreshold

▸ **getSecureCollateralThreshold**(): `Big`

#### Returns

`Big`

#### Defined in

[src/types/vault.ts:102](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L102)

___

### <a id="getstakingpoolnonce" name="getstakingpoolnonce"></a> getStakingPoolNonce

▸ **getStakingPoolNonce**(): `Promise`\<`number`\>

#### Returns

`Promise`\<`number`\>

#### Defined in

[src/types/vault.ts:117](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L117)

___

### <a id="getusedcollateral" name="getusedcollateral"></a> getUsedCollateral

▸ **getUsedCollateral**(): `Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Returns

`Promise`\<`MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>\>

#### Defined in

[src/types/vault.ts:89](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L89)

___

### <a id="isbanned" name="isbanned"></a> isBanned

▸ **isBanned**(): `Promise`\<`boolean`\>

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/types/vault.ts:71](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L71)
