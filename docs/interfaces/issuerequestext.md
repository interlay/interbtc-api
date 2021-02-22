[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / IssueRequestExt

# Interface: IssueRequestExt

## Hierarchy

* *Omit*<IssueRequest, *btc_address*\>

  ↳ **IssueRequestExt**

## Table of contents

### Properties

- [Type](/interfaces/issuerequestext.md#type)
- [amount](/interfaces/issuerequestext.md#amount)
- [btc\_address](/interfaces/issuerequestext.md#btc_address)
- [btc\_public\_key](/interfaces/issuerequestext.md#btc_public_key)
- [cancelled](/interfaces/issuerequestext.md#cancelled)
- [completed](/interfaces/issuerequestext.md#completed)
- [defKeys](/interfaces/issuerequestext.md#defkeys)
- [encodedLength](/interfaces/issuerequestext.md#encodedlength)
- [fee](/interfaces/issuerequestext.md#fee)
- [griefing\_collateral](/interfaces/issuerequestext.md#griefing_collateral)
- [hash](/interfaces/issuerequestext.md#hash)
- [isEmpty](/interfaces/issuerequestext.md#isempty)
- [opentime](/interfaces/issuerequestext.md#opentime)
- [registry](/interfaces/issuerequestext.md#registry)
- [requester](/interfaces/issuerequestext.md#requester)
- [size](/interfaces/issuerequestext.md#size)
- [vault](/interfaces/issuerequestext.md#vault)

### Methods

- [clear](/interfaces/issuerequestext.md#clear)
- [delete](/interfaces/issuerequestext.md#delete)
- [entries](/interfaces/issuerequestext.md#entries)
- [eq](/interfaces/issuerequestext.md#eq)
- [forEach](/interfaces/issuerequestext.md#foreach)
- [get](/interfaces/issuerequestext.md#get)
- [getAtIndex](/interfaces/issuerequestext.md#getatindex)
- [has](/interfaces/issuerequestext.md#has)
- [keys](/interfaces/issuerequestext.md#keys)
- [set](/interfaces/issuerequestext.md#set)
- [toArray](/interfaces/issuerequestext.md#toarray)
- [toHex](/interfaces/issuerequestext.md#tohex)
- [toHuman](/interfaces/issuerequestext.md#tohuman)
- [toJSON](/interfaces/issuerequestext.md#tojson)
- [toRawType](/interfaces/issuerequestext.md#torawtype)
- [toString](/interfaces/issuerequestext.md#tostring)
- [toU8a](/interfaces/issuerequestext.md#tou8a)
- [values](/interfaces/issuerequestext.md#values)

## Properties

### Type

• **Type**: *object*

#### Type declaration:

___

### amount

• `Readonly` **amount**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:95

___

### btc\_address

• **btc\_address**: *string*

Defined in: [src/apis/issue.ts:24](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/issue.ts#L24)

___

### btc\_public\_key

• `Readonly` **btc\_public\_key**: *BtcPublicKey*

Defined in: src/interfaces/default/types.ts:99

___

### cancelled

• `Readonly` **cancelled**: *bool*

Defined in: src/interfaces/default/types.ts:101

___

### completed

• `Readonly` **completed**: *bool*

Defined in: src/interfaces/default/types.ts:100

___

### defKeys

• **defKeys**: *string*[]

___

### encodedLength

• **encodedLength**: *number*

___

### fee

• `Readonly` **fee**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:96

___

### griefing\_collateral

• `Readonly` **griefing\_collateral**: *DOT*

Defined in: src/interfaces/default/types.ts:94

___

### hash

• **hash**: *H256*

___

### isEmpty

• **isEmpty**: *boolean*

___

### opentime

• `Readonly` **opentime**: *BlockNumber*

Defined in: src/interfaces/default/types.ts:93

___

### registry

• `Readonly` **registry**: Registry

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:24

___

### requester

• `Readonly` **requester**: *AccountId*

Defined in: src/interfaces/default/types.ts:97

___

### size

• `Readonly` **size**: *number*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:28

___

### vault

• `Readonly` **vault**: *AccountId*

Defined in: src/interfaces/default/types.ts:92

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

▸ **set**(`key`: *string*, `value`: Codec): *IssueRequest*

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |
`value` | Codec |

**Returns:** *IssueRequest*

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
