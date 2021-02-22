[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / IssueAPI

# Interface: IssueAPI

## Table of contents

### Methods

- [cancel](/interfaces/issueapi.md#cancel)
- [execute](/interfaces/issueapi.md#execute)
- [getFeesToPay](/interfaces/issueapi.md#getfeestopay)
- [getGriefingCollateralInPlanck](/interfaces/issueapi.md#getgriefingcollateralinplanck)
- [getIssuePeriod](/interfaces/issueapi.md#getissueperiod)
- [getPagedIterator](/interfaces/issueapi.md#getpagediterator)
- [getRequestById](/interfaces/issueapi.md#getrequestbyid)
- [isExecutionSuccessful](/interfaces/issueapi.md#isexecutionsuccessful)
- [isRequestSuccessful](/interfaces/issueapi.md#isrequestsuccessful)
- [list](/interfaces/issueapi.md#list)
- [mapForUser](/interfaces/issueapi.md#mapforuser)
- [request](/interfaces/issueapi.md#request)
- [setAccount](/interfaces/issueapi.md#setaccount)

## Methods

### cancel

▸ **cancel**(`issueId`: *H256*): *Promise*<void\>

Send an issue cancellation transaction. After the issue period has elapsed,
the issuance of PolkaBTC can be cancelled. As a result, the griefing collateral
of the requester will be slashed and sent to the vault that had prepared to issue.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`issueId` | *H256* | The ID returned by the issue request transaction    |

**Returns:** *Promise*<void\>

Defined in: [src/apis/issue.ts:55](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L55)

___

### execute

▸ **execute**(`issueId`: *H256*, `txId`: *H256Le*, `merkleProof`: *Bytes*, `rawTx`: *Bytes*): *Promise*<boolean\>

Send an issue execution transaction

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`issueId` | *H256* | The ID returned by the issue request transaction   |
`txId` | *H256Le* | The ID of the Bitcoin transaction that sends funds to the vault address   |
`merkleProof` | *Bytes* | The merkle inclusion proof of the Bitcoin transaction   |
`rawTx` | *Bytes* | The raw bytes of the Bitcoin transaction   |

**Returns:** *Promise*<boolean\>

A boolean value indicating whether the execution was successful. The function throws an error otherwise.

Defined in: [src/apis/issue.ts:48](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L48)

___

### getFeesToPay

▸ **getFeesToPay**(`amountBtc`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`amountBtc` | *string* | The amount, in BTC, for which to compute the issue fees   |

**Returns:** *Promise*<string\>

The fees, in BTC

Defined in: [src/apis/issue.ts:113](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L113)

___

### getGriefingCollateralInPlanck

▸ **getGriefingCollateralInPlanck**(`amountBtc`: *string*): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`amountBtc` | *string* |

**Returns:** *Promise*<string\>

The griefing collateral, in Planck

Defined in: [src/apis/issue.ts:66](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L66)

___

### getIssuePeriod

▸ **getIssuePeriod**(): *Promise*<BlockNumber\>

**Returns:** *Promise*<BlockNumber\>

The time difference in number of blocks between when an issue request is created
and required completion time by a user.

Defined in: [src/apis/issue.ts:91](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L91)

___

### getPagedIterator

▸ **getPagedIterator**(`perPage`: *number*): *AsyncGenerator*<IssueRequest[], any, unknown\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`perPage` | *number* | Number of issue requests to iterate through at a time   |

**Returns:** *AsyncGenerator*<IssueRequest[], any, unknown\>

An AsyncGenerator to be used as an iterator

Defined in: [src/apis/issue.ts:75](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L75)

___

### getRequestById

▸ **getRequestById**(`issueId`: *string* \| *H256* \| *Uint8Array*): *Promise*<[*IssueRequestExt*](/interfaces/issuerequestext.md)\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`issueId` | *string* \| *H256* \| *Uint8Array* | The ID of the issue request to fetch   |

**Returns:** *Promise*<[*IssueRequestExt*](/interfaces/issuerequestext.md)\>

An issue request object

Defined in: [src/apis/issue.ts:86](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L86)

___

### isExecutionSuccessful

▸ **isExecutionSuccessful**(`events`: *EventRecord*[]): *boolean*

A successful `execute` produces the following events:
- vaultRegistry.IssueTokens
- system.NewAccount
- polkaBtc.Endowed
- treasury.Mint
- issue.ExecuteIssue
- system.ExtrinsicSuccess

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`events` | *EventRecord*[] | The EventRecord array returned after sending an execute request transaction   |

**Returns:** *boolean*

A boolean value

Defined in: [src/apis/issue.ts:108](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L108)

___

### isRequestSuccessful

▸ **isRequestSuccessful**(`events`: *EventRecord*[]): *boolean*

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`events` | *EventRecord*[] | The EventRecord array returned after sending an request issue transaction   |

**Returns:** *boolean*

A boolean value

Defined in: [src/apis/issue.ts:96](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L96)

___

### list

▸ **list**(): *Promise*<[*IssueRequestExt*](/interfaces/issuerequestext.md)[]\>

**Returns:** *Promise*<[*IssueRequestExt*](/interfaces/issuerequestext.md)[]\>

An array containing the issue requests

Defined in: [src/apis/issue.ts:70](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L70)

___

### mapForUser

▸ **mapForUser**(`account`: *AccountId*): *Promise*<Map<H256, [*IssueRequestExt*](/interfaces/issuerequestext.md)\>\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | *AccountId* | The ID of the account whose issue requests are to be retrieved   |

**Returns:** *Promise*<Map<H256, [*IssueRequestExt*](/interfaces/issuerequestext.md)\>\>

A mapping from the issue request ID to the issue request object, corresponding to the requests of
the given account

Defined in: [src/apis/issue.ts:81](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L81)

___

### request

▸ **request**(`amountSat`: *PolkaBTC*, `vaultId?`: *AccountId*, `griefingCollateral?`: *DOT*): *Promise*<IssueRequestResult\>

Send an issue request transaction

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`amountSat` | *PolkaBTC* | PolkaBTC amount (denoted in Satoshi) to issue   |
`vaultId?` | *AccountId* | (optional) Request the issue from a specific vault. If this parameter is unspecified, a random vault will be selected   |
`griefingCollateral?` | *DOT* | - |

**Returns:** *Promise*<IssueRequestResult\>

An object of type {issueId, vault} if the request succeeded. The function throws an error otherwise.

Defined in: [src/apis/issue.ts:39](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L39)

___

### setAccount

▸ **setAccount**(`account`: AddressOrPair): *void*

Set an account to use when sending transactions from this API

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | AddressOrPair | Keyring account    |

**Returns:** *void*

Defined in: [src/apis/issue.ts:60](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L60)
