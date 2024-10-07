[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / SystemVaultExt

# Interface: SystemVaultExt

## Table of contents

### Properties

- [collateral](SystemVaultExt.md#collateral)
- [currencyPair](SystemVaultExt.md#currencypair)
- [issuedTokens](SystemVaultExt.md#issuedtokens)
- [toBeIssuedTokens](SystemVaultExt.md#tobeissuedtokens)
- [toBeRedeemedTokens](SystemVaultExt.md#toberedeemedtokens)

## Properties

### <a id="collateral" name="collateral"></a> collateral

• **collateral**: `MonetaryAmount`\<[`CollateralCurrencyExt`](../modules.md#collateralcurrencyext)\>

#### Defined in

[src/types/vault.ts:127](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L127)

___

### <a id="currencypair" name="currencypair"></a> currencyPair

• **currencyPair**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `collateralCurrency` | [`CollateralCurrencyExt`](../modules.md#collateralcurrencyext) |
| `wrappedCurrency` | `Currency` |

#### Defined in

[src/types/vault.ts:128](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L128)

___

### <a id="issuedtokens" name="issuedtokens"></a> issuedTokens

• **issuedTokens**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:125](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L125)

___

### <a id="tobeissuedtokens" name="tobeissuedtokens"></a> toBeIssuedTokens

• **toBeIssuedTokens**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:124](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L124)

___

### <a id="toberedeemedtokens" name="toberedeemedtokens"></a> toBeRedeemedTokens

• **toBeRedeemedTokens**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/vault.ts:126](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/vault.ts#L126)
