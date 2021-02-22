[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / RedeemAPI

# Interface: RedeemAPI

## Table of contents

### Methods

- [cancel](/interfaces/redeemapi.md#cancel)
- [execute](/interfaces/redeemapi.md#execute)
- [getDustValue](/interfaces/redeemapi.md#getdustvalue)
- [getFeePercentage](/interfaces/redeemapi.md#getfeepercentage)
- [getFeesToPay](/interfaces/redeemapi.md#getfeestopay)
- [getPagedIterator](/interfaces/redeemapi.md#getpagediterator)
- [getPremiumRedeemFee](/interfaces/redeemapi.md#getpremiumredeemfee)
- [getRedeemPeriod](/interfaces/redeemapi.md#getredeemperiod)
- [getRequestById](/interfaces/redeemapi.md#getrequestbyid)
- [list](/interfaces/redeemapi.md#list)
- [mapForUser](/interfaces/redeemapi.md#mapforuser)
- [request](/interfaces/redeemapi.md#request)
- [setAccount](/interfaces/redeemapi.md#setaccount)
- [subscribeToRedeemExpiry](/interfaces/redeemapi.md#subscribetoredeemexpiry)

## Methods

### cancel

▸ **cancel**(`redeemId`: *H256*, `reimburse?`: *boolean*): *Promise*<boolean\>

Send a redeem cancellation transaction. After the redeem period has elapsed,
the redeemal of PolkaBTC can be cancelled. As a result, the griefing collateral
of the vault will be slashed and sent to the redeemer

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`redeemId` | *H256* | The ID returned by the redeem request transaction   |
`reimburse?` | *boolean* | (Optional) In case of redeem failure:  - `false` = retry redeeming, with a different Vault  - `true` = accept reimbursement in polkaBTC   |

**Returns:** *Promise*<boolean\>

A boolean value indicating whether the cancellation was successful.
The function throws an error otherwise.

Defined in: [src/apis/redeem.ts:57](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L57)

___

### execute

▸ **execute**(`redeemId`: *H256*, `txId`: *H256Le*, `merkleProof`: *Bytes*, `rawTx`: *Bytes*): *Promise*<boolean\>

Send a redeem execution transaction

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`redeemId` | *H256* | The ID returned by the redeem request transaction   |
`txId` | *H256Le* | The ID of the Bitcoin transaction that sends funds from the vault to the redeemer's address   |
`merkleProof` | *Bytes* | The merkle inclusion proof of the Bitcoin transaction   |
`rawTx` | *Bytes* | The raw bytes of the Bitcoin transaction   |

**Returns:** *Promise*<boolean\>

A boolean value indicating whether the execution was successful. The function throws an error otherwise.

Defined in: [src/apis/redeem.ts:45](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L45)

___

### getDustValue

▸ **getDustValue**(): *Promise*<PolkaBTC\>

**Returns:** *Promise*<PolkaBTC\>

The minimum amount of btc that is accepted for redeem requests; any lower values would
risk the bitcoin client to reject the payment

Defined in: [src/apis/redeem.ts:91](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L91)

___

### getFeePercentage

▸ **getFeePercentage**(): *Promise*<string\>

**Returns:** *Promise*<string\>

The fee percentage charged for redeeming. For instance, "0.005" stands for 0.005%

Defined in: [src/apis/redeem.ts:110](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L110)

___

### getFeesToPay

▸ **getFeesToPay**(`amount`: *string*): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`amount` | *string* |

**Returns:** *Promise*<string\>

The fees, in BTC

Defined in: [src/apis/redeem.ts:96](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L96)

___

### getPagedIterator

▸ **getPagedIterator**(`perPage`: *number*): *AsyncGenerator*<RedeemRequest[], any, unknown\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`perPage` | *number* | Number of redeem requests to iterate through at a time   |

**Returns:** *AsyncGenerator*<RedeemRequest[], any, unknown\>

An AsyncGenerator to be used as an iterator

Defined in: [src/apis/redeem.ts:67](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L67)

___

### getPremiumRedeemFee

▸ **getPremiumRedeemFee**(): *Promise*<string\>

**Returns:** *Promise*<string\>

If users execute a redeem with a Vault flagged for premium redeem,
they can earn a DOT premium, slashed from the Vault's collateral.

Defined in: [src/apis/redeem.ts:101](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L101)

___

### getRedeemPeriod

▸ **getRedeemPeriod**(): *Promise*<BlockNumber\>

**Returns:** *Promise*<BlockNumber\>

The time difference in number of blocks between when a redeem request is created
and required completion time by a user.

Defined in: [src/apis/redeem.ts:106](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L106)

___

### getRequestById

▸ **getRequestById**(`redeemId`: *string* \| *H256* \| *Uint8Array*): *Promise*<[*RedeemRequestExt*](/interfaces/redeemrequestext.md)\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`redeemId` | *string* \| *H256* \| *Uint8Array* | The ID of the redeem request to fetch   |

**Returns:** *Promise*<[*RedeemRequestExt*](/interfaces/redeemrequestext.md)\>

A redeem request object

Defined in: [src/apis/redeem.ts:78](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L78)

___

### list

▸ **list**(): *Promise*<[*RedeemRequestExt*](/interfaces/redeemrequestext.md)[]\>

**Returns:** *Promise*<[*RedeemRequestExt*](/interfaces/redeemrequestext.md)[]\>

An array containing the redeem requests

Defined in: [src/apis/redeem.ts:29](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L29)

___

### mapForUser

▸ **mapForUser**(`account`: *AccountId*): *Promise*<Map<H256, [*RedeemRequestExt*](/interfaces/redeemrequestext.md)\>\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | *AccountId* | The ID of the account whose redeem requests are to be retrieved   |

**Returns:** *Promise*<Map<H256, [*RedeemRequestExt*](/interfaces/redeemrequestext.md)\>\>

A mapping from the redeem request ID to the redeem request object, corresponding to the requests of
the given account

Defined in: [src/apis/redeem.ts:73](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L73)

___

### request

▸ **request**(`amount`: *PolkaBTC*, `btcAddressEnc`: *string*, `vaultId?`: *AccountId*): *Promise*<RequestResult\>

Send a redeem request transaction

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`amount` | *PolkaBTC* | - |
`btcAddressEnc` | *string* | Bitcoin address where the redeemed BTC should be sent   |
`vaultId?` | *AccountId* | - |

**Returns:** *Promise*<RequestResult\>

An object of type {redeemId, vault} if the request succeeded. The function throws an error otherwise.

Defined in: [src/apis/redeem.ts:36](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L36)

___

### setAccount

▸ **setAccount**(`account`: AddressOrPair): *void*

Set an account to use when sending transactions from this API

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | AddressOrPair | Keyring account    |

**Returns:** *void*

Defined in: [src/apis/redeem.ts:62](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L62)

___

### subscribeToRedeemExpiry

▸ **subscribeToRedeemExpiry**(`account`: *AccountId*, `callback`: (`requestRedeemId`: *string*) => *void*): *Promise*<() => *void*\>

Whenever a redeem request associated with `account` expires, call the callback function with the
ID of the expired request. Already expired requests are stored in memory, so as not to call back
twice for the same request.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | *AccountId* | The ID of the account whose redeem requests are to be checked for expiry   |
`callback` | (`requestRedeemId`: *string*) => *void* | Function to be called whenever a redeem request expires    |

**Returns:** *Promise*<() => *void*\>

Defined in: [src/apis/redeem.ts:86](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L86)
