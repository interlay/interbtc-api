[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / RefundRequestExt

# Interface: RefundRequestExt

## Hierarchy

* *Omit*<RefundRequest, *btc_address*\>

  ↳ **RefundRequestExt**

## Table of contents

### Properties

- [Type](/interfaces/refundrequestext.md#type)
- [amount\_btc](/interfaces/refundrequestext.md#amount_btc)
- [amount\_polka\_btc](/interfaces/refundrequestext.md#amount_polka_btc)
- [btc\_address](/interfaces/refundrequestext.md#btc_address)
- [completed](/interfaces/refundrequestext.md#completed)
- [defKeys](/interfaces/refundrequestext.md#defkeys)
- [encodedLength](/interfaces/refundrequestext.md#encodedlength)
- [fee](/interfaces/refundrequestext.md#fee)
- [hash](/interfaces/refundrequestext.md#hash)
- [isEmpty](/interfaces/refundrequestext.md#isempty)
- [issue\_id](/interfaces/refundrequestext.md#issue_id)
- [issuer](/interfaces/refundrequestext.md#issuer)
- [registry](/interfaces/refundrequestext.md#registry)
- [size](/interfaces/refundrequestext.md#size)
- [vault](/interfaces/refundrequestext.md#vault)

### Methods

- [clear](/interfaces/refundrequestext.md#clear)
- [delete](/interfaces/refundrequestext.md#delete)
- [entries](/interfaces/refundrequestext.md#entries)
- [eq](/interfaces/refundrequestext.md#eq)
- [forEach](/interfaces/refundrequestext.md#foreach)
- [get](/interfaces/refundrequestext.md#get)
- [getAtIndex](/interfaces/refundrequestext.md#getatindex)
- [has](/interfaces/refundrequestext.md#has)
- [keys](/interfaces/refundrequestext.md#keys)
- [set](/interfaces/refundrequestext.md#set)
- [toArray](/interfaces/refundrequestext.md#toarray)
- [toHex](/interfaces/refundrequestext.md#tohex)
- [toHuman](/interfaces/refundrequestext.md#tohuman)
- [toJSON](/interfaces/refundrequestext.md#tojson)
- [toRawType](/interfaces/refundrequestext.md#torawtype)
- [toString](/interfaces/refundrequestext.md#tostring)
- [toU8a](/interfaces/refundrequestext.md#tou8a)
- [values](/interfaces/refundrequestext.md#values)

## Properties

### Type

• **Type**: *object*

#### Type declaration:

___

### amount\_btc

• `Readonly` **amount\_btc**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:143

___

### amount\_polka\_btc

• `Readonly` **amount\_polka\_btc**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:141

___

### btc\_address

• **btc\_address**: *string*

Defined in: [src/apis/refund.ts:10](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/refund.ts#L10)

___

### completed

• `Readonly` **completed**: *bool*

Defined in: src/interfaces/default/types.ts:147

___

### defKeys

• **defKeys**: *string*[]

___

### encodedLength

• **encodedLength**: *number*

___

### fee

• `Readonly` **fee**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:142

___

### hash

• **hash**: *H256*

___

### isEmpty

• **isEmpty**: *boolean*

___

### issue\_id

• `Readonly` **issue\_id**: *H256*

Defined in: src/interfaces/default/types.ts:146

___

### issuer

• `Readonly` **issuer**: *AccountId*

Defined in: src/interfaces/default/types.ts:144

___

### registry

• `Readonly` **registry**: Registry

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:24

___

### size

• `Readonly` **size**: *number*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:28

___

### vault

• `Readonly` **vault**: *AccountId*

Defined in: src/interfaces/default/types.ts:140

## Methods

### clear

▸ **clear**(): *void*

**Returns:** *void*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:22

___

### delete

▸ **delete**(`key`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |

**Returns:** *boolean*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:23

___

### entries

▸ **entries**(): *IterableIterator*<[*string*, Codec]\>

Returns an iterable of key, value pairs for every entry in the map.

**Returns:** *IterableIterator*<[*string*, Codec]\>

Defined in: node_modules/typescript/lib/lib.es2015.iterable.d.ts:126

___

### eq

▸ **eq**(`other?`: *unknown*): *boolean*

**`description`** Compares the value of the input to see if there is a match

#### Parameters:

Name | Type |
:------ | :------ |
`other?` | *unknown* |

**Returns:** *boolean*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:51

___

### forEach

▸ **forEach**(`callbackfn`: (`value`: Codec, `key`: *string*, `map`: *Map*<string, Codec\>) => *void*, `thisArg?`: *any*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`callbackfn` | (`value`: Codec, `key`: *string*, `map`: *Map*<string, Codec\>) => *void* |
`thisArg?` | *any* |

**Returns:** *void*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:24

___

### get

▸ **get**(`name`: *string*): *undefined* \| Codec

**`description`** Returns a specific names entry in the structure

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`name` | *string* | The name of the entry to retrieve    |

**Returns:** *undefined* \| Codec

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:56

___

### getAtIndex

▸ **getAtIndex**(`index`: *number*): Codec

**`description`** Returns the values of a member at a specific index (Rather use get(name) for performance)

#### Parameters:

Name | Type |
:------ | :------ |
`index` | *number* |

**Returns:** Codec

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:60

___

### has

▸ **has**(`key`: *string*): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |

**Returns:** *boolean*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:26

___

### keys

▸ **keys**(): *IterableIterator*<string\>

Returns an iterable of keys in the map

**Returns:** *IterableIterator*<string\>

Defined in: node_modules/typescript/lib/lib.es2015.iterable.d.ts:131

___

### set

▸ **set**(`key`: *string*, `value`: Codec): *RefundRequest*

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |
`value` | Codec |

**Returns:** *RefundRequest*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:27

___

### toArray

▸ **toArray**(): Codec[]

**`description`** Converts the Object to an standard JavaScript Array

**Returns:** Codec[]

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:64

___

### toHex

▸ **toHex**(): *string*

**`description`** Returns a hex string representation of the value

**Returns:** *string*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:68

___

### toHuman

▸ **toHuman**(`isExtended?`: *boolean*): *Record*<string, AnyJson\>

**`description`** Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information

#### Parameters:

Name | Type |
:------ | :------ |
`isExtended?` | *boolean* |

**Returns:** *Record*<string, AnyJson\>

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:72

___

### toJSON

▸ **toJSON**(): *Record*<string, AnyJson\>

**`description`** Converts the Object to JSON, typically used for RPC transfers

**Returns:** *Record*<string, AnyJson\>

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:76

___

### toRawType

▸ **toRawType**(): *string*

**`description`** Returns the base runtime type name for this instance

**Returns:** *string*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:80

___

### toString

▸ **toString**(): *string*

**`description`** Returns the string representation of the value

**Returns:** *string*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:84

___

### toU8a

▸ **toU8a**(`isBare?`: *boolean* \| *Record*<string, boolean\>): *Uint8Array*

**`description`** Encodes the value as a Uint8Array as per the SCALE specifications

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`isBare?` | *boolean* \| *Record*<string, boolean\> | true when the value has none of the type-specific prefixes (internal)    |

**Returns:** *Uint8Array*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:89

___

### values

▸ **values**(): *IterableIterator*<Codec\>

Returns an iterable of values in the map

**Returns:** *IterableIterator*<Codec\>

Defined in: node_modules/typescript/lib/lib.es2015.iterable.d.ts:136
