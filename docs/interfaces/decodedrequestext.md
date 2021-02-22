[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / DecodedRequestExt

# Interface: DecodedRequestExt

## Hierarchy

* *Omit*<[*DecodedRequest*](/interfaces/decodedrequest.md), *btc_address*\>

  ↳ **DecodedRequestExt**

## Table of contents

### Properties

- [Type](/interfaces/decodedrequestext.md#type)
- [btc\_address](/interfaces/decodedrequestext.md#btc_address)
- [defKeys](/interfaces/decodedrequestext.md#defkeys)
- [encodedLength](/interfaces/decodedrequestext.md#encodedlength)
- [hash](/interfaces/decodedrequestext.md#hash)
- [isEmpty](/interfaces/decodedrequestext.md#isempty)
- [registry](/interfaces/decodedrequestext.md#registry)
- [size](/interfaces/decodedrequestext.md#size)

### Methods

- [clear](/interfaces/decodedrequestext.md#clear)
- [delete](/interfaces/decodedrequestext.md#delete)
- [entries](/interfaces/decodedrequestext.md#entries)
- [eq](/interfaces/decodedrequestext.md#eq)
- [forEach](/interfaces/decodedrequestext.md#foreach)
- [get](/interfaces/decodedrequestext.md#get)
- [getAtIndex](/interfaces/decodedrequestext.md#getatindex)
- [has](/interfaces/decodedrequestext.md#has)
- [keys](/interfaces/decodedrequestext.md#keys)
- [set](/interfaces/decodedrequestext.md#set)
- [toArray](/interfaces/decodedrequestext.md#toarray)
- [toHex](/interfaces/decodedrequestext.md#tohex)
- [toHuman](/interfaces/decodedrequestext.md#tohuman)
- [toJSON](/interfaces/decodedrequestext.md#tojson)
- [toRawType](/interfaces/decodedrequestext.md#torawtype)
- [toString](/interfaces/decodedrequestext.md#tostring)
- [toU8a](/interfaces/decodedrequestext.md#tou8a)
- [values](/interfaces/decodedrequestext.md#values)

## Properties

### Type

• **Type**: *object*

#### Type declaration:

___

### btc\_address

• **btc\_address**: *string*

Defined in: [src/utils/encoding.ts:78](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L78)

___

### defKeys

• **defKeys**: *string*[]

___

### encodedLength

• **encodedLength**: *number*

___

### hash

• **hash**: *H256*

___

### isEmpty

• **isEmpty**: *boolean*

___

### registry

• `Readonly` **registry**: Registry

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:24

___

### size

• `Readonly` **size**: *number*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:28

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

▸ **set**(`key`: *string*, `value`: Codec): [*DecodedRequest*](/interfaces/decodedrequest.md)

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |
`value` | Codec |

**Returns:** [*DecodedRequest*](/interfaces/decodedrequest.md)

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
