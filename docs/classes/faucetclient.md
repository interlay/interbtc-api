[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / FaucetClient

# Class: FaucetClient

## Hierarchy

* *JsonRpcClient*

  ↳ **FaucetClient**

## Table of contents

### Constructors

- [constructor](/classes/faucetclient.md#constructor)

### Properties

- [constr](/classes/faucetclient.md#constr)
- [registry](/classes/faucetclient.md#registry)
- [url](/classes/faucetclient.md#url)

### Methods

- [fundAccount](/classes/faucetclient.md#fundaccount)
- [post](/classes/faucetclient.md#post)

## Constructors

### constructor

\+ **new FaucetClient**(`url`: *string*): [*FaucetClient*](/classes/faucetclient.md)

#### Parameters:

Name | Type |
:------ | :------ |
`url` | *string* |

**Returns:** [*FaucetClient*](/classes/faucetclient.md)

Defined in: [src/http/faucet.ts:13](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/faucet.ts#L13)

## Properties

### constr

• **constr**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`FundAccountJsonRpcRequest` | *Constructor*<FundAccountJsonRpcRequest\> |

Defined in: [src/http/faucet.ts:11](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/faucet.ts#L11)

___

### registry

• **registry**: *TypeRegistry*

Defined in: [src/http/faucet.ts:9](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/faucet.ts#L9)

___

### url

• **url**: *string*

Defined in: [src/http/client.ts:27](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/client.ts#L27)

## Methods

### fundAccount

▸ **fundAccount**(`account`: *AccountId*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`account` | *AccountId* |

**Returns:** *Promise*<void\>

Defined in: [src/http/faucet.ts:25](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/faucet.ts#L25)

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
