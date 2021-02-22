[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / RedeemRequestExt

# Interface: RedeemRequestExt

## Hierarchy

* *Omit*<RedeemRequest, *btc_address*\>

  ↳ **RedeemRequestExt**

## Table of contents

### Properties

- [Type](/interfaces/redeemrequestext.md#type)
- [amount\_btc](/interfaces/redeemrequestext.md#amount_btc)
- [amount\_dot](/interfaces/redeemrequestext.md#amount_dot)
- [amount\_polka\_btc](/interfaces/redeemrequestext.md#amount_polka_btc)
- [btc\_address](/interfaces/redeemrequestext.md#btc_address)
- [cancelled](/interfaces/redeemrequestext.md#cancelled)
- [completed](/interfaces/redeemrequestext.md#completed)
- [defKeys](/interfaces/redeemrequestext.md#defkeys)
- [encodedLength](/interfaces/redeemrequestext.md#encodedlength)
- [fee](/interfaces/redeemrequestext.md#fee)
- [hash](/interfaces/redeemrequestext.md#hash)
- [isEmpty](/interfaces/redeemrequestext.md#isempty)
- [opentime](/interfaces/redeemrequestext.md#opentime)
- [premium\_dot](/interfaces/redeemrequestext.md#premium_dot)
- [redeemer](/interfaces/redeemrequestext.md#redeemer)
- [registry](/interfaces/redeemrequestext.md#registry)
- [reimburse](/interfaces/redeemrequestext.md#reimburse)
- [size](/interfaces/redeemrequestext.md#size)
- [vault](/interfaces/redeemrequestext.md#vault)

### Methods

- [clear](/interfaces/redeemrequestext.md#clear)
- [delete](/interfaces/redeemrequestext.md#delete)
- [entries](/interfaces/redeemrequestext.md#entries)
- [eq](/interfaces/redeemrequestext.md#eq)
- [forEach](/interfaces/redeemrequestext.md#foreach)
- [get](/interfaces/redeemrequestext.md#get)
- [getAtIndex](/interfaces/redeemrequestext.md#getatindex)
- [has](/interfaces/redeemrequestext.md#has)
- [keys](/interfaces/redeemrequestext.md#keys)
- [set](/interfaces/redeemrequestext.md#set)
- [toArray](/interfaces/redeemrequestext.md#toarray)
- [toHex](/interfaces/redeemrequestext.md#tohex)
- [toHuman](/interfaces/redeemrequestext.md#tohuman)
- [toJSON](/interfaces/redeemrequestext.md#tojson)
- [toRawType](/interfaces/redeemrequestext.md#torawtype)
- [toString](/interfaces/redeemrequestext.md#tostring)
- [toU8a](/interfaces/redeemrequestext.md#tou8a)
- [values](/interfaces/redeemrequestext.md#values)

## Properties

### Type

• **Type**: *object*

#### Type declaration:

___

### amount\_btc

• `Readonly` **amount\_btc**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:128

___

### amount\_dot

• `Readonly` **amount\_dot**: *DOT*

Defined in: src/interfaces/default/types.ts:129

___

### amount\_polka\_btc

• `Readonly` **amount\_polka\_btc**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:126

___

### btc\_address

• **btc\_address**: *string*

Defined in: [src/apis/redeem.ts:18](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/redeem.ts#L18)

___

### cancelled

• `Readonly` **cancelled**: *bool*

Defined in: src/interfaces/default/types.ts:134

___

### completed

• `Readonly` **completed**: *bool*

Defined in: src/interfaces/default/types.ts:133

___

### defKeys

• **defKeys**: *string*[]

___

### encodedLength

• **encodedLength**: *number*

___

### fee

• `Readonly` **fee**: *PolkaBTC*

Defined in: src/interfaces/default/types.ts:127

___

### hash

• **hash**: *H256*

___

### isEmpty

• **isEmpty**: *boolean*

___

### opentime

• `Readonly` **opentime**: *BlockNumber*

Defined in: src/interfaces/default/types.ts:125

___

### premium\_dot

• `Readonly` **premium\_dot**: *DOT*

Defined in: src/interfaces/default/types.ts:130

___

### redeemer

• `Readonly` **redeemer**: *AccountId*

Defined in: src/interfaces/default/types.ts:131

___

### registry

• `Readonly` **registry**: Registry

Defined in: node_modules/@polkadot/types/codec/Struct.d.ts:24

___

### reimburse

• `Readonly` **reimburse**: *bool*

Defined in: src/interfaces/default/types.ts:135

___

### size

• `Readonly` **size**: *number*

Defined in: node_modules/typescript/lib/lib.es2015.collection.d.ts:28

___

### vault

• `Readonly` **vault**: *AccountId*

Defined in: src/interfaces/default/types.ts:124

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

▸ **set**(`key`: *string*, `value`: Codec): *RedeemRequest*

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |
`value` | Codec |

**Returns:** *RedeemRequest*

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
