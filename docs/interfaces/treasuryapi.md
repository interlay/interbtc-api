[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / TreasuryAPI

# Interface: TreasuryAPI

## Table of contents

### Methods

- [balancePolkaBTC](/interfaces/treasuryapi.md#balancepolkabtc)
- [setAccount](/interfaces/treasuryapi.md#setaccount)
- [totalPolkaBTC](/interfaces/treasuryapi.md#totalpolkabtc)
- [transfer](/interfaces/treasuryapi.md#transfer)

## Methods

### balancePolkaBTC

▸ **balancePolkaBTC**(`id`: *AccountId*): *Promise*<Balance\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`id` | *AccountId* | The AccountId of a user   |

**Returns:** *Promise*<Balance\>

The user's PolkaBTC balance, denoted in Satoshi

Defined in: [src/apis/treasury.ts:16](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/treasury.ts#L16)

___

### setAccount

▸ **setAccount**(`account`: AddressOrPair): *void*

Set an account to use when sending transactions from this API

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`account` | AddressOrPair | Keyring account    |

**Returns:** *void*

Defined in: [src/apis/treasury.ts:26](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/treasury.ts#L26)

___

### totalPolkaBTC

▸ **totalPolkaBTC**(): *Promise*<Balance\>

**Returns:** *Promise*<Balance\>

The total PolkaBTC issued in the system, denoted in Satoshi

Defined in: [src/apis/treasury.ts:11](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/treasury.ts#L11)

___

### transfer

▸ **transfer**(`destination`: *string*, `amountSatoshi`: *string*): *Promise*<void\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`destination` | *string* | The address of a user   |
`amountSatoshi` | *string* | The amount in satoshi to transfer    |

**Returns:** *Promise*<void\>

Defined in: [src/apis/treasury.ts:21](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/treasury.ts#L21)
