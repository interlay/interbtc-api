[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / DecodedRequest

# Interface: DecodedRequest

## Hierarchy

* *Struct*

  ↳ **DecodedRequest**

## Table of contents

### Properties

- [#private](/interfaces/decodedrequest.md##private)
- [[Symbol.toStringTag]](/interfaces/decodedrequest.md#[symbol.tostringtag])
- [btc\_address](/interfaces/decodedrequest.md#btc_address)
- [registry](/interfaces/decodedrequest.md#registry)
- [size](/interfaces/decodedrequest.md#size)

### Accessors

- [Type](/interfaces/decodedrequest.md#type)
- [defKeys](/interfaces/decodedrequest.md#defkeys)
- [encodedLength](/interfaces/decodedrequest.md#encodedlength)
- [hash](/interfaces/decodedrequest.md#hash)
- [isEmpty](/interfaces/decodedrequest.md#isempty)

### Methods

- [[Symbol.iterator]](/interfaces/decodedrequest.md#[symbol.iterator])
- [clear](/interfaces/decodedrequest.md#clear)
- [delete](/interfaces/decodedrequest.md#delete)
- [entries](/interfaces/decodedrequest.md#entries)
- [eq](/interfaces/decodedrequest.md#eq)
- [forEach](/interfaces/decodedrequest.md#foreach)
- [get](/interfaces/decodedrequest.md#get)
- [getAtIndex](/interfaces/decodedrequest.md#getatindex)
- [has](/interfaces/decodedrequest.md#has)
- [keys](/interfaces/decodedrequest.md#keys)
- [set](/interfaces/decodedrequest.md#set)
- [toArray](/interfaces/decodedrequest.md#toarray)
- [toHex](/interfaces/decodedrequest.md#tohex)
- [toHuman](/interfaces/decodedrequest.md#tohuman)
- [toJSON](/interfaces/decodedrequest.md#tojson)
- [toRawType](/interfaces/decodedrequest.md#torawtype)
- [toString](/interfaces/decodedrequest.md#tostring)
- [toU8a](/interfaces/decodedrequest.md#tou8a)
- [values](/interfaces/decodedrequest.md#values)

## Properties

### #private

• `Private` **#private**: *any*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:23

___

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Defined in: node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:135

___

### btc\_address

• `Readonly` **btc\_address**: *BtcAddress*

Defined in: [src/utils/encoding.ts:73](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L73)

___

### registry

• `Readonly` **registry**: Registry

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:24

___

### size

• `Readonly` **size**: *number*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:28

## Accessors

### Type

• get **Type**(): E

**`description`** Returns the Type description to sthe structure

**Returns:** E

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:39

___

### defKeys

• get **defKeys**(): *string*[]

**`description`** The available keys for this enum

**Returns:** *string*[]

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:31

___

### encodedLength

• get **encodedLength**(): *number*

**`description`** The length of the value when encoded as a Uint8Array

**Returns:** *number*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:43

___

### hash

• get **hash**(): *H256*

**`description`** returns a hash of the contents

**Returns:** *H256*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:47

___

### isEmpty

• get **isEmpty**(): *boolean*

**`description`** Checks if the value is an empty value

**Returns:** *boolean*

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:35

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): *IterableIterator*<[*string*, Codec]\>

Returns an iterable of entries in the map.

**Returns:** *IterableIterator*<[*string*, Codec]\>

Defined in: node_modules/typescript/lib/lib.es2015.iterable.d.ts:121

___

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
