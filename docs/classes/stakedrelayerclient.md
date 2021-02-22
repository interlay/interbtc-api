[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / StakedRelayerClient

# Class: StakedRelayerClient

## Hierarchy

* *JsonRpcClient*

  ↳ **StakedRelayerClient**

## Table of contents

### Constructors

- [constructor](/classes/stakedrelayerclient.md#constructor)

### Properties

- [constr](/classes/stakedrelayerclient.md#constr)
- [registry](/classes/stakedrelayerclient.md#registry)
- [url](/classes/stakedrelayerclient.md#url)

### Methods

- [deregisterStakedRelayer](/classes/stakedrelayerclient.md#deregisterstakedrelayer)
- [getAccountId](/classes/stakedrelayerclient.md#getaccountid)
- [isConnected](/classes/stakedrelayerclient.md#isconnected)
- [post](/classes/stakedrelayerclient.md#post)
- [registerStakedRelayer](/classes/stakedrelayerclient.md#registerstakedrelayer)
- [suggestInvalidBlock](/classes/stakedrelayerclient.md#suggestinvalidblock)
- [suggestStatusUpdate](/classes/stakedrelayerclient.md#suggeststatusupdate)
- [voteOnStatusUpdate](/classes/stakedrelayerclient.md#voteonstatusupdate)

## Constructors

### constructor

\+ **new StakedRelayerClient**(`url`: *string*): [*StakedRelayerClient*](/classes/stakedrelayerclient.md)

#### Parameters:

Name | Type |
:------ | :------ |
`url` | *string* |

**Returns:** [*StakedRelayerClient*](/classes/stakedrelayerclient.md)

Defined in: [src/http/relayer.ts:28](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L28)

## Properties

### constr

• **constr**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`AccountIdJsonRpcResponse` | *Constructor*<AccountIdJsonRpcResponse\> |
`ErrorCode` | *Constructor*<ErrorCode\> |
`H256Le` | *Constructor*<H256Le\> |
`RegisterStakedRelayerJsonRpcRequest` | *Constructor*<RegisterStakedRelayerJsonRpcRequest\> |
`StatusCode` | *Constructor*<StatusCode\> |
`SuggestStatusUpdateJsonRpcRequest` | *Constructor*<SuggestStatusUpdateJsonRpcRequest\> |
`VoteOnStatusUpdateJsonRpcRequest` | *Constructor*<VoteOnStatusUpdateJsonRpcRequest\> |

Defined in: [src/http/relayer.ts:20](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L20)

___

### registry

• **registry**: *TypeRegistry*

Defined in: [src/http/relayer.ts:18](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L18)

___

### url

• **url**: *string*

Defined in: [src/http/client.ts:27](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/client.ts#L27)

## Methods

### deregisterStakedRelayer

▸ **deregisterStakedRelayer**(): *Promise*<void\>

**Returns:** *Promise*<void\>

Defined in: [src/http/relayer.ts:66](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L66)

___

### getAccountId

▸ **getAccountId**(): *Promise*<string\>

**Returns:** *Promise*<string\>

Defined in: [src/http/relayer.ts:55](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L55)

___

### isConnected

▸ **isConnected**(): *Promise*<boolean\>

**Returns:** *Promise*<boolean\>

Defined in: [src/http/relayer.ts:46](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L46)

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

### registerStakedRelayer

▸ **registerStakedRelayer**(`stake`: *number*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`stake` | *number* |

**Returns:** *Promise*<void\>

Defined in: [src/http/relayer.ts:61](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L61)

___

### suggestInvalidBlock

▸ **suggestInvalidBlock**(`deposit`: *number*, `hash`: *string*, `message`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`deposit` | *number* |
`hash` | *string* |
`message` | *string* |

**Returns:** *Promise*<void\>

Defined in: [src/http/relayer.ts:89](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L89)

___

### suggestStatusUpdate

▸ **suggestStatusUpdate**(`deposit`: *number*, `statusCode`: *StatusCode*, `message`: *string*, `addError?`: *ErrorCode*, `removeError?`: *ErrorCode*, `block_hash?`: *H256Le*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`deposit` | *number* |
`statusCode` | *StatusCode* |
`message` | *string* |
`addError?` | *ErrorCode* |
`removeError?` | *ErrorCode* |
`block_hash?` | *H256Le* |

**Returns:** *Promise*<void\>

Defined in: [src/http/relayer.ts:70](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L70)

___

### voteOnStatusUpdate

▸ **voteOnStatusUpdate**(`status_update_id`: *u256*, `approve`: *boolean*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`status_update_id` | *u256* |
`approve` | *boolean* |

**Returns:** *Promise*<void\>

Defined in: [src/http/relayer.ts:96](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/http/relayer.ts#L96)
