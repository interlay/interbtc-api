[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / [bitcoin](/modules/bitcoin.md) / payments

# Namespace: payments

[bitcoin](/modules/bitcoin.md).payments

## Table of contents

### Interfaces

- [Payment](/interfaces/bitcoin.payments.payment.md)
- [PaymentOpts](/interfaces/bitcoin.payments.paymentopts.md)

### Type aliases

- [PaymentCreator](/modules/bitcoin.payments.md#paymentcreator)
- [PaymentFunction](/modules/bitcoin.payments.md#paymentfunction)
- [Stack](/modules/bitcoin.payments.md#stack)
- [StackElement](/modules/bitcoin.payments.md#stackelement)
- [StackFunction](/modules/bitcoin.payments.md#stackfunction)

### Functions

- [embed](/modules/bitcoin.payments.md#embed)
- [p2ms](/modules/bitcoin.payments.md#p2ms)
- [p2pk](/modules/bitcoin.payments.md#p2pk)
- [p2pkh](/modules/bitcoin.payments.md#p2pkh)
- [p2sh](/modules/bitcoin.payments.md#p2sh)
- [p2wpkh](/modules/bitcoin.payments.md#p2wpkh)
- [p2wsh](/modules/bitcoin.payments.md#p2wsh)

## Type aliases

### PaymentCreator

Ƭ **PaymentCreator**: (`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)) => [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Type declaration:

▸ (`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/index.d.ts:26

___

### PaymentFunction

Ƭ **PaymentFunction**: () => [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Type declaration:

▸ (): [*Payment*](/interfaces/bitcoin.payments.payment.md)

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/index.d.ts:27

___

### Stack

Ƭ **Stack**: [*StackElement*](/modules/bitcoin.payments.md#stackelement)[]

Defined in: node_modules/bitcoinjs-lib/types/payments/index.d.ts:33

___

### StackElement

Ƭ **StackElement**: Buffer \| *number*

Defined in: node_modules/bitcoinjs-lib/types/payments/index.d.ts:32

___

### StackFunction

Ƭ **StackFunction**: () => [*Stack*](/modules/bitcoin.payments.md#stack)

#### Type declaration:

▸ (): [*Stack*](/modules/bitcoin.payments.md#stack)

**Returns:** [*Stack*](/modules/bitcoin.payments.md#stack)

Defined in: node_modules/bitcoinjs-lib/types/payments/index.d.ts:34

## Functions

### embed

▸ **embed**(`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/embed.d.ts:2

___

### p2ms

▸ **p2ms**(`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/p2ms.d.ts:2

___

### p2pk

▸ **p2pk**(`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/p2pk.d.ts:2

___

### p2pkh

▸ **p2pkh**(`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/p2pkh.d.ts:2

___

### p2sh

▸ **p2sh**(`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/p2sh.d.ts:2

___

### p2wpkh

▸ **p2wpkh**(`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/p2wpkh.d.ts:2

___

### p2wsh

▸ **p2wsh**(`a`: [*Payment*](/interfaces/bitcoin.payments.payment.md), `opts?`: [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md)): [*Payment*](/interfaces/bitcoin.payments.payment.md)

#### Parameters:

Name | Type |
:------ | :------ |
`a` | [*Payment*](/interfaces/bitcoin.payments.payment.md) |
`opts?` | [*PaymentOpts*](/interfaces/bitcoin.payments.paymentopts.md) |

**Returns:** [*Payment*](/interfaces/bitcoin.payments.payment.md)

Defined in: node_modules/bitcoinjs-lib/types/payments/p2wsh.d.ts:2
