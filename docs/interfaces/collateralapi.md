[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / CollateralAPI

# Interface: CollateralAPI

## Table of contents

### Methods

- [balanceDOT](/interfaces/collateralapi.md#balancedot)
- [balanceLockedDOT](/interfaces/collateralapi.md#balancelockeddot)
- [setAccount](/interfaces/collateralapi.md#setaccount)
- [totalLockedDOT](/interfaces/collateralapi.md#totallockeddot)
- [transferDOT](/interfaces/collateralapi.md#transferdot)

## Methods

### balanceDOT

▸ **balanceDOT**(`id`: *AccountId*): *Promise*<Balance\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`id` | *AccountId* | The ID of an account   |

**Returns:** *Promise*<Balance\>

The free DOT balance of the given account

Defined in: [src/apis/collateral.ts:25](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/collateral.ts#L25)

___

### balanceLockedDOT

▸ **balanceLockedDOT**(`id`: *AccountId*): *Promise*<Balance\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`id` | *AccountId* | The ID of an account   |

**Returns:** *Promise*<Balance\>

The reserved DOT balance of the given account

Defined in: [src/apis/collateral.ts:20](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/collateral.ts#L20)

___

### setAccount

▸ **setAccount**(`account`: AddressOrPair): *void*

Set an account to use when sending transactions from this API

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | AddressOrPair | Keyring account    |

**Returns:** *void*

Defined in: [src/apis/collateral.ts:11](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/collateral.ts#L11)

___

### totalLockedDOT

▸ **totalLockedDOT**(): *Promise*<Balance\>

**Returns:** *Promise*<Balance\>

Total locked DOT collateral

Defined in: [src/apis/collateral.ts:15](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/collateral.ts#L15)

___

### transferDOT

▸ **transferDOT**(`address`: *string*, `amount`: *string* \| *number*): *Promise*<void\>

Send a transaction that transfers DOT from the caller's address to another address

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`address` | *string* | The recipient of the DOT transfer   |
`amount` | *string* \| *number* | The DOT balance to transfer    |

**Returns:** *Promise*<void\>

Defined in: [src/apis/collateral.ts:31](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/collateral.ts#L31)
