[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / VaultId

# Interface: VaultId

**`Name`**

VaultId

## Hierarchy

- `Struct`

  ↳ **`VaultId`**

## Table of contents

### Properties

- [#private](VaultId.md##private)
- [[toStringTag]](VaultId.md#[tostringtag])
- [account\_id](VaultId.md#account_id)
- [createdAtHash](VaultId.md#createdathash)
- [currencies](VaultId.md#currencies)
- [initialU8aLength](VaultId.md#initialu8alength)
- [isStorageFallback](VaultId.md#isstoragefallback)
- [registry](VaultId.md#registry)
- [size](VaultId.md#size)

### Accessors

- [Type](VaultId.md#type)
- [defKeys](VaultId.md#defkeys)
- [encodedLength](VaultId.md#encodedlength)
- [hash](VaultId.md#hash)
- [isEmpty](VaultId.md#isempty)

### Methods

- [[iterator]](VaultId.md#[iterator])
- [clear](VaultId.md#clear)
- [delete](VaultId.md#delete)
- [entries](VaultId.md#entries)
- [eq](VaultId.md#eq)
- [forEach](VaultId.md#foreach)
- [get](VaultId.md#get)
- [getAtIndex](VaultId.md#getatindex)
- [getT](VaultId.md#gett)
- [has](VaultId.md#has)
- [inspect](VaultId.md#inspect)
- [keys](VaultId.md#keys)
- [set](VaultId.md#set)
- [toArray](VaultId.md#toarray)
- [toHex](VaultId.md#tohex)
- [toHuman](VaultId.md#tohuman)
- [toJSON](VaultId.md#tojson)
- [toPrimitive](VaultId.md#toprimitive)
- [toRawType](VaultId.md#torawtype)
- [toString](VaultId.md#tostring)
- [toU8a](VaultId.md#tou8a)
- [values](VaultId.md#values)

## Properties

### <a id="#private" name="#private"></a> #private

• `Private` **#private**: `any`

#### Inherited from

Struct.#private

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:24

___

### <a id="[tostringtag]" name="[tostringtag]"></a> [toStringTag]

• `Readonly` **[toStringTag]**: `string`

#### Inherited from

Struct.[toStringTag]

#### Defined in

node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:137

___

### <a id="account_id" name="account_id"></a> account\_id

• `Readonly` **account\_id**: `AccountId`

#### Defined in

src/interfaces/default/types.ts:149

___

### <a id="createdathash" name="createdathash"></a> createdAtHash

• `Optional` **createdAtHash**: `IU8a`

#### Inherited from

Struct.createdAtHash

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:26

___

### <a id="currencies" name="currencies"></a> currencies

• `Readonly` **currencies**: [`VaultCurrencyPair`](VaultCurrencyPair.md)

#### Defined in

src/interfaces/default/types.ts:150

___

### <a id="initialu8alength" name="initialu8alength"></a> initialU8aLength

• `Optional` **initialU8aLength**: `number`

#### Inherited from

Struct.initialU8aLength

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:27

___

### <a id="isstoragefallback" name="isstoragefallback"></a> isStorageFallback

• `Optional` **isStorageFallback**: `boolean`

#### Inherited from

Struct.isStorageFallback

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:28

___

### <a id="registry" name="registry"></a> registry

• `Readonly` **registry**: `Registry`

#### Inherited from

Struct.registry

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:25

___

### <a id="size" name="size"></a> size

• `Readonly` **size**: `number`

#### Inherited from

Struct.size

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:45

## Accessors

### <a id="type" name="type"></a> Type

• `get` **Type**(): `E`

#### Returns

`E`

**`Description`**

Returns the Type description of the structure

#### Inherited from

Struct.Type

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:50

___

### <a id="defkeys" name="defkeys"></a> defKeys

• `get` **defKeys**(): `string`[]

#### Returns

`string`[]

**`Description`**

The available keys for this struct

#### Inherited from

Struct.defKeys

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:34

___

### <a id="encodedlength" name="encodedlength"></a> encodedLength

• `get` **encodedLength**(): `number`

#### Returns

`number`

**`Description`**

The length of the value when encoded as a Uint8Array

#### Inherited from

Struct.encodedLength

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:42

___

### <a id="hash" name="hash"></a> hash

• `get` **hash**(): `IU8a`

#### Returns

`IU8a`

**`Description`**

returns a hash of the contents

#### Inherited from

Struct.hash

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:46

___

### <a id="isempty" name="isempty"></a> isEmpty

• `get` **isEmpty**(): `boolean`

#### Returns

`boolean`

**`Description`**

Checks if the value is an empty value

#### Inherited from

Struct.isEmpty

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:38

## Methods

### <a id="[iterator]" name="[iterator]"></a> [iterator]

▸ **[iterator]**(): `MapIterator`\<[`string`, `Codec`]\>

Returns an iterable of entries in the map.

#### Returns

`MapIterator`\<[`string`, `Codec`]\>

#### Inherited from

Struct.[iterator]

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:143

___

### <a id="clear" name="clear"></a> clear

▸ **clear**(): `void`

#### Returns

`void`

#### Inherited from

Struct.clear

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

Struct.delete

#### Defined in

node_modules/typescript/lib/lib.es2015.collection.d.ts:24

___

### <a id="entries" name="entries"></a> entries

▸ **entries**(): `MapIterator`\<[`string`, `Codec`]\>

Returns an iterable of key, value pairs for every entry in the map.

#### Returns

`MapIterator`\<[`string`, `Codec`]\>

#### Inherited from

Struct.entries

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

Struct.eq

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

Struct.forEach

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

Struct.get

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

Struct.getAtIndex

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

Struct.getT

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

Struct.has

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

Struct.inspect

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:71

___

### <a id="keys" name="keys"></a> keys

▸ **keys**(): `MapIterator`\<`string`\>

Returns an iterable of keys in the map

#### Returns

`MapIterator`\<`string`\>

#### Inherited from

Struct.keys

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

Struct.set

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

Struct.toArray

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

Struct.toHex

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

Struct.toHuman

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

Struct.toJSON

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

Struct.toPrimitive

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

Struct.toRawType

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

Struct.toString

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

Struct.toU8a

#### Defined in

node_modules/@polkadot/types-codec/native/Struct.d.ts:104

___

### <a id="values" name="values"></a> values

▸ **values**(): `MapIterator`\<`Codec`\>

Returns an iterable of values in the map

#### Returns

`MapIterator`\<`Codec`\>

#### Inherited from

Struct.values

#### Defined in

node_modules/typescript/lib/lib.es2015.iterable.d.ts:158
