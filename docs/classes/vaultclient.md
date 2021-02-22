[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / VaultClient

# Class: VaultClient

## Hierarchy

* *JsonRpcClient*

  ↳ **VaultClient**

## Table of contents

### Constructors

- [constructor](/classes/vaultclient.md#constructor)

### Properties

- [constr](/classes/vaultclient.md#constr)
- [registry](/classes/vaultclient.md#registry)
- [url](/classes/vaultclient.md#url)

### Methods

- [getAccountId](/classes/vaultclient.md#getaccountid)
- [isConnected](/classes/vaultclient.md#isconnected)
- [lockAdditionalCollateral](/classes/vaultclient.md#lockadditionalcollateral)
- [post](/classes/vaultclient.md#post)
- [registerVault](/classes/vaultclient.md#registervault)
- [requestReplace](/classes/vaultclient.md#requestreplace)
- [withdrawCollateral](/classes/vaultclient.md#withdrawcollateral)
- [withdrawReplace](/classes/vaultclient.md#withdrawreplace)

## Constructors

### constructor

\+ **new VaultClient**(`url`: *string*): [*VaultClient*](/classes/vaultclient.md)

#### Parameters:

Name | Type |
:------ | :------ |
`url` | *string* |

**Returns:** [*VaultClient*](/classes/vaultclient.md)

Defined in: [src/http/vault.ts:28](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L28)

## Properties

### constr

• **constr**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`AccountIdJsonRpcResponse` | *Constructor*<AccountIdJsonRpcResponse\> |
`ChangeCollateralJsonRpcRequest` | *Constructor*<ChangeCollateralJsonRpcRequest\> |
`H256` | *Constructor*<H256\> |
`RegisterVaultJsonRpcRequest` | *Constructor*<RegisterVaultJsonRpcRequest\> |
`RegisterVaultJsonRpcResponse` | *Constructor*<RegisterVaultJsonRpcResponse\> |
`ReplaceRequestJsonRpcRequest` | *Constructor*<ReplaceRequestJsonRpcRequest\> |
`WithdrawReplaceJsonRpcRequest` | *Constructor*<WithdrawReplaceJsonRpcRequest\> |

Defined in: [src/http/vault.ts:20](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L20)

___

### registry

• **registry**: *TypeRegistry*

Defined in: [src/http/vault.ts:18](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L18)

___

### url

• **url**: *string*

Defined in: [src/http/client.ts:27](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/client.ts#L27)

## Methods

### getAccountId

▸ **getAccountId**(): *Promise*<string\>

**Returns:** *Promise*<string\>

Defined in: [src/http/vault.ts:55](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L55)

___

### isConnected

▸ **isConnected**(): *Promise*<boolean\>

**Returns:** *Promise*<boolean\>

Defined in: [src/http/vault.ts:46](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L46)

___

### lockAdditionalCollateral

▸ **lockAdditionalCollateral**(`amount`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`amount` | *string* |

**Returns:** *Promise*<void\>

Defined in: [src/http/vault.ts:68](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L68)

___

### post

▸ **post**(`method`: *string*, `params?`: RequestParams): *Promise*<JsonRpcResponse\>

#### Parameters:

Name | Type |
:------ | :------ |
`method` | *string* |
`params?` | RequestParams |

**Returns:** *Promise*<JsonRpcResponse\>

Defined in: [src/http/client.ts:33](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/client.ts#L33)

___

### registerVault

▸ **registerVault**(`collateral`: *string*): *Promise*<RegisterVaultJsonRpcResponse\>

#### Parameters:

Name | Type |
:------ | :------ |
`collateral` | *string* |

**Returns:** *Promise*<RegisterVaultJsonRpcResponse\>

Defined in: [src/http/vault.ts:75](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L75)

___

### requestReplace

▸ **requestReplace**(`amount`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`amount` | *string* |

**Returns:** *Promise*<void\>

Defined in: [src/http/vault.ts:61](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L61)

___

### withdrawCollateral

▸ **withdrawCollateral**(`amount`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`amount` | *string* |

**Returns:** *Promise*<void\>

Defined in: [src/http/vault.ts:84](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L84)

___

### withdrawReplace

▸ **withdrawReplace**(`replace_id`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`replace_id` | *string* |

**Returns:** *Promise*<void\>

Defined in: [src/http/vault.ts:91](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/vault.ts#L91)
