[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / RefundAPI

# Interface: RefundAPI

## Table of contents

### Methods

- [getRequestById](/interfaces/refundapi.md#getrequestbyid)
- [getRequestByIssueId](/interfaces/refundapi.md#getrequestbyissueid)
- [list](/interfaces/refundapi.md#list)
- [mapForUser](/interfaces/refundapi.md#mapforuser)
- [setAccount](/interfaces/refundapi.md#setaccount)

## Methods

### getRequestById

▸ **getRequestById**(`refundId`: *string*): *Promise*<[*RefundRequestExt*](/interfaces/refundrequestext.md)\>

#### Parameters:

Name | Type |
:------ | :------ |
`refundId` | *string* |

**Returns:** *Promise*<[*RefundRequestExt*](/interfaces/refundrequestext.md)\>

A refund object

Defined in: [src/apis/refund.ts:36](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/refund.ts#L36)

___

### getRequestByIssueId

▸ **getRequestByIssueId**(`issueId`: *string*): *Promise*<[*RefundRequestExt*](/interfaces/refundrequestext.md)\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`issueId` | *string* | The ID of the refund request to fetch   |

**Returns:** *Promise*<[*RefundRequestExt*](/interfaces/refundrequestext.md)\>

A refund request object

Defined in: [src/apis/refund.ts:41](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/refund.ts#L41)

___

### list

▸ **list**(): *Promise*<[*RefundRequestExt*](/interfaces/refundrequestext.md)[]\>

**Returns:** *Promise*<[*RefundRequestExt*](/interfaces/refundrequestext.md)[]\>

An array containing the refund requests

Defined in: [src/apis/refund.ts:26](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/refund.ts#L26)

___

### mapForUser

▸ **mapForUser**(`account`: *AccountId*): *Promise*<Map<H256, [*RefundRequestExt*](/interfaces/refundrequestext.md)\>\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | *AccountId* | The ID of the account whose refund requests are to be retrieved   |

**Returns:** *Promise*<Map<H256, [*RefundRequestExt*](/interfaces/refundrequestext.md)\>\>

A mapping from the refund ID to the refund request, corresponding to the given account

Defined in: [src/apis/refund.ts:31](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/refund.ts#L31)

___

### setAccount

▸ **setAccount**(`account`: AddressOrPair): *void*

Set an account to use when sending transactions from this API

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | AddressOrPair | Keyring account    |

**Returns:** *void*

Defined in: [src/apis/refund.ts:22](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/refund.ts#L22)
