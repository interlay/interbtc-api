[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / ReplaceRequestExt

# Interface: ReplaceRequestExt

## Hierarchy

* *Omit*<ReplaceRequest, *btc_address* \| *new_vault*\>

  ↳ **ReplaceRequestExt**

## Table of contents

### Properties

- [Type](/interfaces/replacerequestext.md#type)
- [accept\_time](/interfaces/replacerequestext.md#accept_time)
- [amount](/interfaces/replacerequestext.md#amount)
- [btc\_address](/interfaces/replacerequestext.md#btc_address)
- [cancelled](/interfaces/replacerequestext.md#cancelled)
- [collateral](/interfaces/replacerequestext.md#collateral)
- [completed](/interfaces/replacerequestext.md#completed)
- [defKeys](/interfaces/replacerequestext.md#defkeys)
- [encodedLength](/interfaces/replacerequestext.md#encodedlength)
- [griefing\_collateral](/interfaces/replacerequestext.md#griefing_collateral)
- [hash](/interfaces/replacerequestext.md#hash)
- [isEmpty](/interfaces/replacerequestext.md#isempty)
- [new\_vault](/interfaces/replacerequestext.md#new_vault)
- [old\_vault](/interfaces/replacerequestext.md#old_vault)
- [open\_time](/interfaces/replacerequestext.md#open_time)
- [registry](/interfaces/replacerequestext.md#registry)
- [size](/interfaces/replacerequestext.md#size)

### Methods

- [clear](/interfaces/replacerequestext.md#clear)
- [delete](/interfaces/replacerequestext.md#delete)
- [entries](/interfaces/replacerequestext.md#entries)
- [eq](/interfaces/replacerequestext.md#eq)
- [forEach](/interfaces/replacerequestext.md#foreach)
- [get](/interfaces/replacerequestext.md#get)
- [getAtIndex](/interfaces/replacerequestext.md#getatindex)
- [has](/interfaces/replacerequestext.md#has)
- [keys](/interfaces/replacerequestext.md#keys)
- [set](/interfaces/replacerequestext.md#set)
- [toArray](/interfaces/replacerequestext.md#toarray)
- [toHex](/interfaces/replacerequestext.md#tohex)
- [toHuman](/interfaces/replacerequestext.md#tohuman)
- [toJSON](/interfaces/replacerequestext.md#tojson)
- [toRawType](/interfaces/replacerequestext.md#torawtype)
- [toString](/interfaces/replacerequestext.md#tostring)
- [toU8a](/interfaces/replacerequestext.md#tou8a)
- [values](/interfaces/replacerequestext.md#values)

## Properties

### Type

• **Type**: *object*

#### Type declaration:

___

### accept\_time

• `Readonly` **accept\_time**: *Option*<BlockNumber\>

Defined in: src/interfaces/default/types.ts:173

___

### amount

• `Readonly` **amount**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:169

___

### btc\_address

• **btc\_address**: *string*

Defined in: [src/apis/replace.ts:10](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/replace.ts#L10)

___

### cancelled

• `Readonly` **cancelled**: *bool*

Defined in: src/interfaces/default/types.ts:176

___

### collateral

• `Readonly` **collateral**: *DOT*

Defined in: src/interfaces/default/types.ts:172

___

### completed

• `Readonly` **completed**: *bool*

Defined in: src/interfaces/default/types.ts:175

___

### defKeys

• **defKeys**: *string*[]

___

### encodedLength

• **encodedLength**: *number*

___

### griefing\_collateral

• `Readonly` **griefing\_collateral**: *DOT*

Defined in: src/interfaces/default/types.ts:170

___

### hash

• **hash**: *H256*

___

### isEmpty

• **isEmpty**: *boolean*

___

### new\_vault

• **new\_vault**: *string*

Defined in: [src/apis/replace.ts:11](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/replace.ts#L11)

___

### old\_vault

• `Readonly` **old\_vault**: *AccountId*

Defined in: src/interfaces/default/types.ts:167

___

### open\_time

• `Readonly` **open\_time**: *BlockNumber*

Defined in: src/interfaces/default/types.ts:168

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

▸ **set**(`key`: *string*, `value`: Codec): *ReplaceRequest*

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |
`value` | Codec |

**Returns:** *ReplaceRequest*

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
