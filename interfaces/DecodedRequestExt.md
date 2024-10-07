[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DecodedRequestExt

# Interface: DecodedRequestExt

## Hierarchy

- `Omit`\<[`DecodedRequest`](DecodedRequest.md), ``"btc_address"``\>

  ↳ **`DecodedRequestExt`**

## Table of contents

### Properties

- [Type](DecodedRequestExt.md#type)
- [[toStringTag]](DecodedRequestExt.md#[tostringtag])
- [btc\_address](DecodedRequestExt.md#btc_address)
- [createdAtHash](DecodedRequestExt.md#createdathash)
- [defKeys](DecodedRequestExt.md#defkeys)
- [encodedLength](DecodedRequestExt.md#encodedlength)
- [hash](DecodedRequestExt.md#hash)
- [initialU8aLength](DecodedRequestExt.md#initialu8alength)
- [isEmpty](DecodedRequestExt.md#isempty)
- [isStorageFallback](DecodedRequestExt.md#isstoragefallback)
- [registry](DecodedRequestExt.md#registry)
- [size](DecodedRequestExt.md#size)

### Methods

- [[iterator]](DecodedRequestExt.md#[iterator])
- [clear](DecodedRequestExt.md#clear)
- [delete](DecodedRequestExt.md#delete)
- [entries](DecodedRequestExt.md#entries)
- [eq](DecodedRequestExt.md#eq)
- [forEach](DecodedRequestExt.md#foreach)
- [get](DecodedRequestExt.md#get)
- [getAtIndex](DecodedRequestExt.md#getatindex)
- [getT](DecodedRequestExt.md#gett)
- [has](DecodedRequestExt.md#has)
- [inspect](DecodedRequestExt.md#inspect)
- [keys](DecodedRequestExt.md#keys)
- [set](DecodedRequestExt.md#set)
- [toArray](DecodedRequestExt.md#toarray)
- [toHex](DecodedRequestExt.md#tohex)
- [toHuman](DecodedRequestExt.md#tohuman)
- [toJSON](DecodedRequestExt.md#tojson)
- [toPrimitive](DecodedRequestExt.md#toprimitive)
- [toRawType](DecodedRequestExt.md#torawtype)
- [toString](DecodedRequestExt.md#tostring)
- [toU8a](DecodedRequestExt.md#tou8a)
- [values](DecodedRequestExt.md#values)

## Properties

### <a id="type" name="type"></a> Type

• **Type**: `Object`

#### Inherited from

Omit.Type

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:50

___

### <a id="[tostringtag]" name="[tostringtag]"></a> [toStringTag]

• `Readonly` **[toStringTag]**: `string`

#### Inherited from

Omit.[toStringTag]

#### Defined in

node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:137

___

### <a id="btc_address" name="btc_address"></a> btc\_address

• **btc\_address**: `string`

#### Defined in

[src/utils/encoding.ts:155](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/utils/encoding.ts#L155)

___

### <a id="createdathash" name="createdathash"></a> createdAtHash

• `Optional` **createdAtHash**: `IU8a`

#### Inherited from

Omit.createdAtHash

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:26

___

### <a id="defkeys" name="defkeys"></a> defKeys

• **defKeys**: `string`[]

#### Inherited from

Omit.defKeys

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:34

___

### <a id="encodedlength" name="encodedlength"></a> encodedLength

• **encodedLength**: `number`

#### Inherited from

Omit.encodedLength

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:42

___

### <a id="hash" name="hash"></a> hash

• **hash**: `IU8a`

#### Inherited from

Omit.hash

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:46

___

### <a id="initialu8alength" name="initialu8alength"></a> initialU8aLength

• `Optional` **initialU8aLength**: `number`

#### Inherited from

Omit.initialU8aLength

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:27

___

### <a id="isempty" name="isempty"></a> isEmpty

• **isEmpty**: `boolean`

#### Inherited from

Omit.isEmpty

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:38

___

### <a id="isstoragefallback" name="isstoragefallback"></a> isStorageFallback

• `Optional` **isStorageFallback**: `boolean`

#### Inherited from

Omit.isStorageFallback

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:28

___

### <a id="registry" name="registry"></a> registry

• `Readonly` **registry**: `Registry`

#### Inherited from

Omit.registry

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:25

___

### <a id="size" name="size"></a> size

• `Readonly` **size**: `number`

#### Inherited from

Omit.size

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:45

## Methods

### <a id="[iterator]" name="[iterator]"></a> [iterator]

▸ **[iterator]**(): `MapIterator`\<[`string`, `Codec`]\>

Returns an iterable of entries in the map.

#### Returns

`MapIterator`\<[`string`, `Codec`]\>

#### Inherited from

Omit.[iterator]

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:143

___

### <a id="clear" name="clear"></a> clear

▸ **clear**(): `void`

#### Returns

`void`

#### Inherited from

Omit.clear

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:20

___

### <a id="delete" name="delete"></a> delete

▸ **delete**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`boolean`

true if an element in the Map existed and has been removed, or false if the element does not exist.

#### Inherited from

Omit.delete

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:24

___

### <a id="entries" name="entries"></a> entries

▸ **entries**(): `MapIterator`\<[`string`, `Codec`]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`MapIterator`\<[`string`, `Codec`]\>

#### Inherited from

Omit.entries

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:148

___

### <a id="eq" name="eq"></a> eq

▸ **eq**(`other?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other?` | `unknown` |

#### Returns

`boolean`

**`Description`**

Compares the value of the input to see if there is a match

#### Inherited from

Omit.eq

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:54

___

### <a id="foreach" name="foreach"></a> forEach

▸ **forEach**(`callbackfn`, `thisArg?`): `void`

Executes a provided function once per each key/value pair in the Map, in insertion order.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbackfn` | (`value`: `Codec`, `key`: `string`, `map`: `Map`\<`string`, `Codec`\>) => `void` |
| `thisArg?` | `any` |

#### Returns

`void`

#### Inherited from

Omit.forEach

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:28

___

### <a id="get" name="get"></a> get

▸ **get**(`key`): `undefined` \| `Codec`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | The name of the entry to retrieve |

#### Returns

`undefined` \| `Codec`

**`Description`**

Returns a specific names entry in the structure

#### Inherited from

Omit.get

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:59

___

### <a id="getatindex" name="getatindex"></a> getAtIndex

▸ **getAtIndex**(`index`): `Codec`

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | `number` |

#### Returns

`Codec`

**`Description`**

Returns the values of a member at a specific index (Rather use get(name) for performance)

#### Inherited from

Omit.getAtIndex

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:63

___

### <a id="gett" name="gett"></a> getT

▸ **getT**\<`T`\>(`key`): `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`T`

**`Description`**

Returns the a types value by name

#### Inherited from

Omit.getT

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:67

___

### <a id="has" name="has"></a> has

▸ **has**(`key`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`boolean`

boolean indicating whether an element with the specified key exists or not.

#### Inherited from

Omit.has

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:37

___

### <a id="inspect" name="inspect"></a> inspect

▸ **inspect**(`isBare?`): `Inspect`

#### Parameters

| Name | Type |
| :------ | :------ |
| `isBare?` | `BareOpts` |

#### Returns

`Inspect`

**`Description`**

Returns a breakdown of the hex encoding for this Codec

#### Inherited from

Omit.inspect

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:71

___

### <a id="keys" name="keys"></a> keys

▸ **keys**(): `MapIterator`\<`string`\>

Returns an iterable of keys in the map

#### Returns

`MapIterator`\<`string`\>

#### Inherited from

Omit.keys

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:153

___

### <a id="set" name="set"></a> set

▸ **set**(`key`, `value`): `this`

Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `Codec` |

#### Returns

`this`

#### Inherited from

Omit.set

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:41

___

### <a id="toarray" name="toarray"></a> toArray

▸ **toArray**(): `Codec`[]

#### Returns

`Codec`[]

**`Description`**

Converts the Object to an standard JavaScript Array

#### Inherited from

Omit.toArray

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:75

___

### <a id="tohex" name="tohex"></a> toHex

▸ **toHex**(): \`0x$\{string}\`

#### Returns

\`0x$\{string}\`

**`Description`**

Returns a hex string representation of the value

#### Inherited from

Omit.toHex

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:79

___

### <a id="tohuman" name="tohuman"></a> toHuman

▸ **toHuman**(`isExtended?`): `Record`\<`string`, `AnyJson`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `isExtended?` | `boolean` |

#### Returns

`Record`\<`string`, `AnyJson`\>

**`Description`**

Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information

#### Inherited from

Omit.toHuman

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:83

___

### <a id="tojson" name="tojson"></a> toJSON

▸ **toJSON**(): `Record`\<`string`, `AnyJson`\>

#### Returns

`Record`\<`string`, `AnyJson`\>

**`Description`**

Converts the Object to JSON, typically used for RPC transfers

#### Inherited from

Omit.toJSON

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:87

___

### <a id="toprimitive" name="toprimitive"></a> toPrimitive

▸ **toPrimitive**(): `Record`\<`string`, `AnyJson`\>

#### Returns

`Record`\<`string`, `AnyJson`\>

**`Description`**

Converts the value in a best-fit primitive form

#### Inherited from

Omit.toPrimitive

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:91

___

### <a id="torawtype" name="torawtype"></a> toRawType

▸ **toRawType**(): `string`

#### Returns

`string`

**`Description`**

Returns the base runtime type name for this instance

#### Inherited from

Omit.toRawType

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:95

___

### <a id="tostring" name="tostring"></a> toString

▸ **toString**(): `string`

#### Returns

`string`

**`Description`**

Returns the string representation of the value

#### Inherited from

Omit.toString

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:99

___

### <a id="tou8a" name="tou8a"></a> toU8a

▸ **toU8a**(`isBare?`): `Uint8Array`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `isBare?` | `BareOpts` | true when the value has none of the type-specific prefixes (internal) |

#### Returns

`Uint8Array`

**`Description`**

Encodes the value as a Uint8Array as per the SCALE specifications

#### Inherited from

Omit.toU8a

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:104

___

### <a id="values" name="values"></a> values

▸ **values**(): `MapIterator`\<`Codec`\>

Returns an iterable of values in the map

#### Returns

`MapIterator`\<`Codec`\>

#### Inherited from

Omit.values

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:158
