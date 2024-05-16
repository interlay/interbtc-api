[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / TokenSymbol

# Interface: TokenSymbol

**`Name`**

TokenSymbol

## Hierarchy

- `Enum`

  ↳ **`TokenSymbol`**

## Table of contents

### Properties

- [#private](TokenSymbol.md##private)
- [createdAtHash](TokenSymbol.md#createdathash)
- [initialU8aLength](TokenSymbol.md#initialu8alength)
- [isDot](TokenSymbol.md#isdot)
- [isIbtc](TokenSymbol.md#isibtc)
- [isIntr](TokenSymbol.md#isintr)
- [isKbtc](TokenSymbol.md#iskbtc)
- [isKint](TokenSymbol.md#iskint)
- [isKsm](TokenSymbol.md#isksm)
- [isStorageFallback](TokenSymbol.md#isstoragefallback)
- [registry](TokenSymbol.md#registry)
- [type](TokenSymbol.md#type)

### Accessors

- [defIndexes](TokenSymbol.md#defindexes)
- [defKeys](TokenSymbol.md#defkeys)
- [encodedLength](TokenSymbol.md#encodedlength)
- [hash](TokenSymbol.md#hash)
- [index](TokenSymbol.md#index)
- [inner](TokenSymbol.md#inner)
- [isBasic](TokenSymbol.md#isbasic)
- [isEmpty](TokenSymbol.md#isempty)
- [isNone](TokenSymbol.md#isnone)
- [value](TokenSymbol.md#value)

### Methods

- [\_toRawStruct](TokenSymbol.md#_torawstruct)
- [eq](TokenSymbol.md#eq)
- [inspect](TokenSymbol.md#inspect)
- [toHex](TokenSymbol.md#tohex)
- [toHuman](TokenSymbol.md#tohuman)
- [toJSON](TokenSymbol.md#tojson)
- [toNumber](TokenSymbol.md#tonumber)
- [toPrimitive](TokenSymbol.md#toprimitive)
- [toRawType](TokenSymbol.md#torawtype)
- [toString](TokenSymbol.md#tostring)
- [toU8a](TokenSymbol.md#tou8a)

## Properties

### <a id="#private" name="#private"></a> #private

• `Private` **#private**: `any`

#### Inherited from

Enum.#private

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:23

___

### <a id="createdathash" name="createdathash"></a> createdAtHash

• `Optional` **createdAtHash**: `IU8a`

#### Inherited from

Enum.createdAtHash

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:25

___

### <a id="initialu8alength" name="initialu8alength"></a> initialU8aLength

• `Optional` **initialU8aLength**: `number`

#### Inherited from

Enum.initialU8aLength

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:26

___

### <a id="isdot" name="isdot"></a> isDot

• `Readonly` **isDot**: `boolean`

#### Defined in

src/interfaces/default/types.ts:129

___

### <a id="isibtc" name="isibtc"></a> isIbtc

• `Readonly` **isIbtc**: `boolean`

#### Defined in

src/interfaces/default/types.ts:130

___

### <a id="isintr" name="isintr"></a> isIntr

• `Readonly` **isIntr**: `boolean`

#### Defined in

src/interfaces/default/types.ts:131

___

### <a id="iskbtc" name="iskbtc"></a> isKbtc

• `Readonly` **isKbtc**: `boolean`

#### Defined in

src/interfaces/default/types.ts:133

___

### <a id="iskint" name="iskint"></a> isKint

• `Readonly` **isKint**: `boolean`

#### Defined in

src/interfaces/default/types.ts:134

___

### <a id="isksm" name="isksm"></a> isKsm

• `Readonly` **isKsm**: `boolean`

#### Defined in

src/interfaces/default/types.ts:132

___

### <a id="isstoragefallback" name="isstoragefallback"></a> isStorageFallback

• `Optional` **isStorageFallback**: `boolean`

#### Inherited from

Enum.isStorageFallback

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:27

___

### <a id="registry" name="registry"></a> registry

• `Readonly` **registry**: `Registry`

#### Inherited from

Enum.registry

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:24

___

### <a id="type" name="type"></a> type

• `Readonly` **type**: ``"Dot"`` \| ``"Ibtc"`` \| ``"Intr"`` \| ``"Ksm"`` \| ``"Kbtc"`` \| ``"Kint"``

#### Overrides

Enum.type

#### Defined in

src/interfaces/default/types.ts:135

## Accessors

### <a id="defindexes" name="defindexes"></a> defIndexes

• `get` **defIndexes**(): `number`[]

#### Returns

`number`[]

**`Description`**

The available keys for this enum

#### Inherited from

Enum.defIndexes

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:61

___

### <a id="defkeys" name="defkeys"></a> defKeys

• `get` **defKeys**(): `string`[]

#### Returns

`string`[]

**`Description`**

The available keys for this enum

#### Inherited from

Enum.defKeys

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:65

___

### <a id="encodedlength" name="encodedlength"></a> encodedLength

• `get` **encodedLength**(): `number`

#### Returns

`number`

**`Description`**

The length of the value when encoded as a Uint8Array

#### Inherited from

Enum.encodedLength

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:33

___

### <a id="hash" name="hash"></a> hash

• `get` **hash**(): `IU8a`

#### Returns

`IU8a`

**`Description`**

returns a hash of the contents

#### Inherited from

Enum.hash

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:37

___

### <a id="index" name="index"></a> index

• `get` **index**(): `number`

#### Returns

`number`

**`Description`**

The index of the enum value

#### Inherited from

Enum.index

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:41

___

### <a id="inner" name="inner"></a> inner

• `get` **inner**(): `Codec`

#### Returns

`Codec`

**`Description`**

The value of the enum

#### Inherited from

Enum.inner

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:45

___

### <a id="isbasic" name="isbasic"></a> isBasic

• `get` **isBasic**(): `boolean`

#### Returns

`boolean`

**`Description`**

true if this is a basic enum (no values)

#### Inherited from

Enum.isBasic

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:49

___

### <a id="isempty" name="isempty"></a> isEmpty

• `get` **isEmpty**(): `boolean`

#### Returns

`boolean`

**`Description`**

Checks if the value is an empty value

#### Inherited from

Enum.isEmpty

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:53

___

### <a id="isnone" name="isnone"></a> isNone

• `get` **isNone**(): `boolean`

#### Returns

`boolean`

**`Description`**

Checks if the Enum points to a [[Null]] type

#### Inherited from

Enum.isNone

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:57

___

### <a id="value" name="value"></a> value

• `get` **value**(): `Codec`

#### Returns

`Codec`

**`Description`**

The value of the enum

#### Inherited from

Enum.value

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:73

## Methods

### <a id="_torawstruct" name="_torawstruct"></a> \_toRawStruct

▸ **_toRawStruct**(): `string`[] \| `Record`\<`string`, `string` \| `number`\>

#### Returns

`string`[] \| `Record`\<`string`, `string` \| `number`\>

**`Description`**

Returns a raw struct representation of the enum types

#### Inherited from

Enum.\_toRawStruct

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:105

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

Enum.eq

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:77

___

### <a id="inspect" name="inspect"></a> inspect

▸ **inspect**(): `Inspect`

#### Returns

`Inspect`

**`Description`**

Returns a breakdown of the hex encoding for this Codec

#### Inherited from

Enum.inspect

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:81

___

### <a id="tohex" name="tohex"></a> toHex

▸ **toHex**(): \`0x$\{string}\`

#### Returns

\`0x$\{string}\`

**`Description`**

Returns a hex string representation of the value

#### Inherited from

Enum.toHex

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:85

___

### <a id="tohuman" name="tohuman"></a> toHuman

▸ **toHuman**(`isExtended?`): `AnyJson`

#### Parameters

| Name | Type |
| :------ | :------ |
| `isExtended?` | `boolean` |

#### Returns

`AnyJson`

**`Description`**

Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information

#### Inherited from

Enum.toHuman

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:89

___

### <a id="tojson" name="tojson"></a> toJSON

▸ **toJSON**(): `AnyJson`

#### Returns

`AnyJson`

**`Description`**

Converts the Object to JSON, typically used for RPC transfers

#### Inherited from

Enum.toJSON

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:93

___

### <a id="tonumber" name="tonumber"></a> toNumber

▸ **toNumber**(): `number`

#### Returns

`number`

**`Description`**

Returns the number representation for the value

#### Inherited from

Enum.toNumber

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:97

___

### <a id="toprimitive" name="toprimitive"></a> toPrimitive

▸ **toPrimitive**(): `AnyJson`

#### Returns

`AnyJson`

**`Description`**

Converts the value in a best-fit primitive form

#### Inherited from

Enum.toPrimitive

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:101

___

### <a id="torawtype" name="torawtype"></a> toRawType

▸ **toRawType**(): `string`

#### Returns

`string`

**`Description`**

Returns the base runtime type name for this instance

#### Inherited from

Enum.toRawType

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:109

___

### <a id="tostring" name="tostring"></a> toString

▸ **toString**(): `string`

#### Returns

`string`

**`Description`**

Returns the string representation of the value

#### Inherited from

Enum.toString

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:113

___

### <a id="tou8a" name="tou8a"></a> toU8a

▸ **toU8a**(`isBare?`): `Uint8Array`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `isBare?` | `boolean` | true when the value has none of the type-specific prefixes (internal) |

#### Returns

`Uint8Array`

**`Description`**

Encodes the value as a Uint8Array as per the SCALE specifications

#### Inherited from

Enum.toU8a

#### Defined in

node_modules/@polkadot/types-codec/base/Enum.d.ts:118
