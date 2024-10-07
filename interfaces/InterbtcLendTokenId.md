[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / InterbtcLendTokenId

# Interface: InterbtcLendTokenId

**`Name`**

InterbtcLendTokenId

## Hierarchy

- `u32`

  ↳ **`InterbtcLendTokenId`**

## Table of contents

### Properties

- [#private](InterbtcLendTokenId.md##private)
- [\_\_UIntType](InterbtcLendTokenId.md#__uinttype)
- [createdAtHash](InterbtcLendTokenId.md#createdathash)
- [encodedLength](InterbtcLendTokenId.md#encodedlength)
- [initialU8aLength](InterbtcLendTokenId.md#initialu8alength)
- [isStorageFallback](InterbtcLendTokenId.md#isstoragefallback)
- [isUnsigned](InterbtcLendTokenId.md#isunsigned)
- [registry](InterbtcLendTokenId.md#registry)

### Accessors

- [hash](InterbtcLendTokenId.md#hash)
- [isEmpty](InterbtcLendTokenId.md#isempty)

### Methods

- [abs](InterbtcLendTokenId.md#abs)
- [add](InterbtcLendTokenId.md#add)
- [addn](InterbtcLendTokenId.md#addn)
- [and](InterbtcLendTokenId.md#and)
- [andln](InterbtcLendTokenId.md#andln)
- [bincn](InterbtcLendTokenId.md#bincn)
- [bitLength](InterbtcLendTokenId.md#bitlength)
- [byteLength](InterbtcLendTokenId.md#bytelength)
- [clone](InterbtcLendTokenId.md#clone)
- [cmp](InterbtcLendTokenId.md#cmp)
- [cmpn](InterbtcLendTokenId.md#cmpn)
- [copy](InterbtcLendTokenId.md#copy)
- [div](InterbtcLendTokenId.md#div)
- [divRound](InterbtcLendTokenId.md#divround)
- [divmod](InterbtcLendTokenId.md#divmod)
- [divn](InterbtcLendTokenId.md#divn)
- [egcd](InterbtcLendTokenId.md#egcd)
- [eq](InterbtcLendTokenId.md#eq)
- [eqn](InterbtcLendTokenId.md#eqn)
- [fromTwos](InterbtcLendTokenId.md#fromtwos)
- [gcd](InterbtcLendTokenId.md#gcd)
- [gt](InterbtcLendTokenId.md#gt)
- [gte](InterbtcLendTokenId.md#gte)
- [gten](InterbtcLendTokenId.md#gten)
- [gtn](InterbtcLendTokenId.md#gtn)
- [iabs](InterbtcLendTokenId.md#iabs)
- [iadd](InterbtcLendTokenId.md#iadd)
- [iaddn](InterbtcLendTokenId.md#iaddn)
- [iand](InterbtcLendTokenId.md#iand)
- [idivn](InterbtcLendTokenId.md#idivn)
- [imaskn](InterbtcLendTokenId.md#imaskn)
- [imul](InterbtcLendTokenId.md#imul)
- [imuln](InterbtcLendTokenId.md#imuln)
- [ineg](InterbtcLendTokenId.md#ineg)
- [inotn](InterbtcLendTokenId.md#inotn)
- [inspect](InterbtcLendTokenId.md#inspect)
- [invm](InterbtcLendTokenId.md#invm)
- [ior](InterbtcLendTokenId.md#ior)
- [isEven](InterbtcLendTokenId.md#iseven)
- [isMax](InterbtcLendTokenId.md#ismax)
- [isNeg](InterbtcLendTokenId.md#isneg)
- [isOdd](InterbtcLendTokenId.md#isodd)
- [isZero](InterbtcLendTokenId.md#iszero)
- [ishln](InterbtcLendTokenId.md#ishln)
- [ishrn](InterbtcLendTokenId.md#ishrn)
- [isqr](InterbtcLendTokenId.md#isqr)
- [isub](InterbtcLendTokenId.md#isub)
- [isubn](InterbtcLendTokenId.md#isubn)
- [iuand](InterbtcLendTokenId.md#iuand)
- [iuor](InterbtcLendTokenId.md#iuor)
- [iushln](InterbtcLendTokenId.md#iushln)
- [iushrn](InterbtcLendTokenId.md#iushrn)
- [iuxor](InterbtcLendTokenId.md#iuxor)
- [ixor](InterbtcLendTokenId.md#ixor)
- [lt](InterbtcLendTokenId.md#lt)
- [lte](InterbtcLendTokenId.md#lte)
- [lten](InterbtcLendTokenId.md#lten)
- [ltn](InterbtcLendTokenId.md#ltn)
- [maskn](InterbtcLendTokenId.md#maskn)
- [mod](InterbtcLendTokenId.md#mod)
- [modn](InterbtcLendTokenId.md#modn)
- [modrn](InterbtcLendTokenId.md#modrn)
- [mul](InterbtcLendTokenId.md#mul)
- [muln](InterbtcLendTokenId.md#muln)
- [neg](InterbtcLendTokenId.md#neg)
- [notn](InterbtcLendTokenId.md#notn)
- [or](InterbtcLendTokenId.md#or)
- [pow](InterbtcLendTokenId.md#pow)
- [setn](InterbtcLendTokenId.md#setn)
- [shln](InterbtcLendTokenId.md#shln)
- [shrn](InterbtcLendTokenId.md#shrn)
- [sqr](InterbtcLendTokenId.md#sqr)
- [sub](InterbtcLendTokenId.md#sub)
- [subn](InterbtcLendTokenId.md#subn)
- [testn](InterbtcLendTokenId.md#testn)
- [toArray](InterbtcLendTokenId.md#toarray)
- [toArrayLike](InterbtcLendTokenId.md#toarraylike)
- [toBigInt](InterbtcLendTokenId.md#tobigint)
- [toBn](InterbtcLendTokenId.md#tobn)
- [toBuffer](InterbtcLendTokenId.md#tobuffer)
- [toHex](InterbtcLendTokenId.md#tohex)
- [toHuman](InterbtcLendTokenId.md#tohuman)
- [toJSON](InterbtcLendTokenId.md#tojson)
- [toNumber](InterbtcLendTokenId.md#tonumber)
- [toPrimitive](InterbtcLendTokenId.md#toprimitive)
- [toRawType](InterbtcLendTokenId.md#torawtype)
- [toRed](InterbtcLendTokenId.md#tored)
- [toString](InterbtcLendTokenId.md#tostring)
- [toTwos](InterbtcLendTokenId.md#totwos)
- [toU8a](InterbtcLendTokenId.md#tou8a)
- [uand](InterbtcLendTokenId.md#uand)
- [ucmp](InterbtcLendTokenId.md#ucmp)
- [umod](InterbtcLendTokenId.md#umod)
- [uor](InterbtcLendTokenId.md#uor)
- [ushln](InterbtcLendTokenId.md#ushln)
- [ushrn](InterbtcLendTokenId.md#ushrn)
- [uxor](InterbtcLendTokenId.md#uxor)
- [xor](InterbtcLendTokenId.md#xor)
- [zeroBits](InterbtcLendTokenId.md#zerobits)

## Properties

### <a id="#private" name="#private"></a> #private

• `Private` **#private**: `any`

#### Inherited from

u32.#private

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:12

___

### <a id="__uinttype" name="__uinttype"></a> \_\_UIntType

• `Readonly` **\_\_UIntType**: ``"u32"``

#### Inherited from

u32.\_\_UIntType

#### Defined in

node_modules/@polkadot/types-codec/primitive/U32.d.ts:9

___

### <a id="createdathash" name="createdathash"></a> createdAtHash

• `Optional` **createdAtHash**: `IU8a`

#### Inherited from

u32.createdAtHash

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:16

___

### <a id="encodedlength" name="encodedlength"></a> encodedLength

• `Readonly` **encodedLength**: `number`

#### Inherited from

u32.encodedLength

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:14

___

### <a id="initialu8alength" name="initialu8alength"></a> initialU8aLength

• `Optional` **initialU8aLength**: `number`

#### Inherited from

u32.initialU8aLength

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:17

___

### <a id="isstoragefallback" name="isstoragefallback"></a> isStorageFallback

• `Optional` **isStorageFallback**: `boolean`

#### Inherited from

u32.isStorageFallback

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:18

___

### <a id="isunsigned" name="isunsigned"></a> isUnsigned

• `Readonly` **isUnsigned**: `boolean`

#### Inherited from

u32.isUnsigned

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:15

___

### <a id="registry" name="registry"></a> registry

• `Readonly` **registry**: `Registry`

#### Inherited from

u32.registry

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:13

## Accessors

### <a id="hash" name="hash"></a> hash

• `get` **hash**(): `IU8a`

#### Returns

`IU8a`

**`Description`**

returns a hash of the contents

#### Inherited from

u32.hash

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:23

___

### <a id="isempty" name="isempty"></a> isEmpty

• `get` **isEmpty**(): `boolean`

#### Returns

`boolean`

**`Description`**

Checks if the value is a zero value (align elsewhere)

#### Inherited from

u32.isEmpty

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:27

## Methods

### <a id="abs" name="abs"></a> abs

▸ **abs**(): `BN`

#### Returns

`BN`

**`Description`**

absolute value

#### Inherited from

u32.abs

#### Defined in

node_modules/@types/bn.js/index.d.ts:233

___

### <a id="add" name="add"></a> add

▸ **add**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

addition

#### Inherited from

u32.add

#### Defined in

node_modules/@types/bn.js/index.d.ts:243

___

### <a id="addn" name="addn"></a> addn

▸ **addn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

addition

#### Inherited from

u32.addn

#### Defined in

node_modules/@types/bn.js/index.d.ts:253

___

### <a id="and" name="and"></a> and

▸ **and**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

and

#### Inherited from

u32.and

#### Defined in

node_modules/@types/bn.js/index.d.ts:384

___

### <a id="andln" name="andln"></a> andln

▸ **andln**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

and (NOTE: `andln` is going to be replaced with `andn` in future)

#### Inherited from

u32.andln

#### Defined in

node_modules/@types/bn.js/index.d.ts:404

___

### <a id="bincn" name="bincn"></a> bincn

▸ **bincn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

add `1 << b` to the number

#### Inherited from

u32.bincn

#### Defined in

node_modules/@types/bn.js/index.d.ts:488

___

### <a id="bitlength" name="bitlength"></a> bitLength

▸ **bitLength**(): `number`

#### Returns

`number`

**`Description`**

Returns the number of bits in the value

#### Inherited from

u32.bitLength

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:31

___

### <a id="bytelength" name="bytelength"></a> byteLength

▸ **byteLength**(): `number`

#### Returns

`number`

**`Description`**

return number of bytes occupied

#### Inherited from

u32.byteLength

#### Defined in

node_modules/@types/bn.js/index.d.ts:123

___

### <a id="clone" name="clone"></a> clone

▸ **clone**(): `BN`

#### Returns

`BN`

**`Description`**

clone number

#### Inherited from

u32.clone

#### Defined in

node_modules/@types/bn.js/index.d.ts:68

___

### <a id="cmp" name="cmp"></a> cmp

▸ **cmp**(`b`): ``-1`` \| ``0`` \| ``1``

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

``-1`` \| ``0`` \| ``1``

**`Description`**

compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result

#### Inherited from

u32.cmp

#### Defined in

node_modules/@types/bn.js/index.d.ts:148

___

### <a id="cmpn" name="cmpn"></a> cmpn

▸ **cmpn**(`b`): ``-1`` \| ``0`` \| ``1``

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

``-1`` \| ``0`` \| ``1``

**`Description`**

compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result

#### Inherited from

u32.cmpn

#### Defined in

node_modules/@types/bn.js/index.d.ts:158

___

### <a id="copy" name="copy"></a> copy

▸ **copy**(`dest`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `dest` | `BN` |

#### Returns

`void`

**`Description`**

Copy to dest number

#### Inherited from

u32.copy

#### Defined in

node_modules/@types/bn.js/index.d.ts:63

___

### <a id="div" name="div"></a> div

▸ **div**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

divide

#### Inherited from

u32.div

#### Defined in

node_modules/@types/bn.js/index.d.ts:318

___

### <a id="divround" name="divround"></a> divRound

▸ **divRound**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

rounded division

#### Inherited from

u32.divRound

#### Defined in

node_modules/@types/bn.js/index.d.ts:359

___

### <a id="divmod" name="divmod"></a> divmod

▸ **divmod**(`b`, `mode?`, `positive?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |
| `mode?` | ``"div"`` \| ``"mod"`` |
| `positive?` | `boolean` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `div` | `BN` |
| `mod` | `BN` |

**`Description`**

division with remainder

#### Inherited from

u32.divmod

#### Defined in

node_modules/@types/bn.js/index.d.ts:333

___

### <a id="divn" name="divn"></a> divn

▸ **divn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

divide

#### Inherited from

u32.divn

#### Defined in

node_modules/@types/bn.js/index.d.ts:323

___

### <a id="egcd" name="egcd"></a> egcd

▸ **egcd**(`b`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `a` | `BN` |
| `b` | `BN` |
| `gcd` | `BN` |

**`Description`**

Extended GCD results `({ a: ..., b: ..., gcd: ... })`

#### Inherited from

u32.egcd

#### Defined in

node_modules/@types/bn.js/index.d.ts:508

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

u32.eq

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:35

___

### <a id="eqn" name="eqn"></a> eqn

▸ **eqn**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`boolean`

**`Description`**

a equals b

#### Inherited from

u32.eqn

#### Defined in

node_modules/@types/bn.js/index.d.ts:208

___

### <a id="fromtwos" name="fromtwos"></a> fromTwos

▸ **fromTwos**(`width`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `width` | `number` |

#### Returns

`BN`

**`Description`**

convert from two's complement representation, where width is the bit width

#### Inherited from

u32.fromTwos

#### Defined in

node_modules/@types/bn.js/index.d.ts:218

___

### <a id="gcd" name="gcd"></a> gcd

▸ **gcd**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

GCD

#### Inherited from

u32.gcd

#### Defined in

node_modules/@types/bn.js/index.d.ts:503

___

### <a id="gt" name="gt"></a> gt

▸ **gt**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`boolean`

**`Description`**

a greater than b

#### Inherited from

u32.gt

#### Defined in

node_modules/@types/bn.js/index.d.ts:183

___

### <a id="gte" name="gte"></a> gte

▸ **gte**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`boolean`

**`Description`**

a greater than or equals b

#### Inherited from

u32.gte

#### Defined in

node_modules/@types/bn.js/index.d.ts:193

___

### <a id="gten" name="gten"></a> gten

▸ **gten**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`boolean`

**`Description`**

a greater than or equals b

#### Inherited from

u32.gten

#### Defined in

node_modules/@types/bn.js/index.d.ts:198

___

### <a id="gtn" name="gtn"></a> gtn

▸ **gtn**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`boolean`

**`Description`**

a greater than b

#### Inherited from

u32.gtn

#### Defined in

node_modules/@types/bn.js/index.d.ts:188

___

### <a id="iabs" name="iabs"></a> iabs

▸ **iabs**(): `BN`

#### Returns

`BN`

**`Description`**

absolute value

#### Inherited from

u32.iabs

#### Defined in

node_modules/@types/bn.js/index.d.ts:238

___

### <a id="iadd" name="iadd"></a> iadd

▸ **iadd**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

addition

#### Inherited from

u32.iadd

#### Defined in

node_modules/@types/bn.js/index.d.ts:248

___

### <a id="iaddn" name="iaddn"></a> iaddn

▸ **iaddn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

addition

#### Inherited from

u32.iaddn

#### Defined in

node_modules/@types/bn.js/index.d.ts:258

___

### <a id="iand" name="iand"></a> iand

▸ **iand**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

and

#### Inherited from

u32.iand

#### Defined in

node_modules/@types/bn.js/index.d.ts:389

___

### <a id="idivn" name="idivn"></a> idivn

▸ **idivn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

divide

#### Inherited from

u32.idivn

#### Defined in

node_modules/@types/bn.js/index.d.ts:328

___

### <a id="imaskn" name="imaskn"></a> imaskn

▸ **imaskn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

clear bits with indexes higher or equal to `b`

#### Inherited from

u32.imaskn

#### Defined in

node_modules/@types/bn.js/index.d.ts:484

___

### <a id="imul" name="imul"></a> imul

▸ **imul**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

multiply

#### Inherited from

u32.imul

#### Defined in

node_modules/@types/bn.js/index.d.ts:288

___

### <a id="imuln" name="imuln"></a> imuln

▸ **imuln**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

multiply

#### Inherited from

u32.imuln

#### Defined in

node_modules/@types/bn.js/index.d.ts:298

___

### <a id="ineg" name="ineg"></a> ineg

▸ **ineg**(): `BN`

#### Returns

`BN`

**`Description`**

negate sign

#### Inherited from

u32.ineg

#### Defined in

node_modules/@types/bn.js/index.d.ts:228

___

### <a id="inotn" name="inotn"></a> inotn

▸ **inotn**(`w`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `w` | `number` |

#### Returns

`BN`

**`Description`**

not (for the width specified by `w`)

#### Inherited from

u32.inotn

#### Defined in

node_modules/@types/bn.js/index.d.ts:498

___

### <a id="inspect" name="inspect"></a> inspect

▸ **inspect**(): `Inspect`

#### Returns

`Inspect`

**`Description`**

Returns a breakdown of the hex encoding for this Codec

#### Inherited from

u32.inspect

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:39

___

### <a id="invm" name="invm"></a> invm

▸ **invm**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

inverse `a` modulo `b`

#### Inherited from

u32.invm

#### Defined in

node_modules/@types/bn.js/index.d.ts:513

___

### <a id="ior" name="ior"></a> ior

▸ **ior**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

or

#### Inherited from

u32.ior

#### Defined in

node_modules/@types/bn.js/index.d.ts:369

___

### <a id="iseven" name="iseven"></a> isEven

▸ **isEven**(): `boolean`

#### Returns

`boolean`

**`Description`**

check if value is even

#### Inherited from

u32.isEven

#### Defined in

node_modules/@types/bn.js/index.d.ts:133

___

### <a id="ismax" name="ismax"></a> isMax

▸ **isMax**(): `boolean`

#### Returns

`boolean`

**`Description`**

True if this value is the max of the type

#### Inherited from

u32.isMax

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:43

___

### <a id="isneg" name="isneg"></a> isNeg

▸ **isNeg**(): `boolean`

#### Returns

`boolean`

**`Description`**

true if the number is negative

#### Inherited from

u32.isNeg

#### Defined in

node_modules/@types/bn.js/index.d.ts:128

___

### <a id="isodd" name="isodd"></a> isOdd

▸ **isOdd**(): `boolean`

#### Returns

`boolean`

**`Description`**

check if value is odd

#### Inherited from

u32.isOdd

#### Defined in

node_modules/@types/bn.js/index.d.ts:138

___

### <a id="iszero" name="iszero"></a> isZero

▸ **isZero**(): `boolean`

#### Returns

`boolean`

**`Description`**

check if value is zero

#### Inherited from

u32.isZero

#### Defined in

node_modules/@types/bn.js/index.d.ts:143

___

### <a id="ishln" name="ishln"></a> ishln

▸ **ishln**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift left

#### Inherited from

u32.ishln

#### Defined in

node_modules/@types/bn.js/index.d.ts:439

___

### <a id="ishrn" name="ishrn"></a> ishrn

▸ **ishrn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift right (unimplemented https://github.com/indutny/bn.js/blob/master/lib/bn.js#L2086)

#### Inherited from

u32.ishrn

#### Defined in

node_modules/@types/bn.js/index.d.ts:459

___

### <a id="isqr" name="isqr"></a> isqr

▸ **isqr**(): `BN`

#### Returns

`BN`

**`Description`**

square

#### Inherited from

u32.isqr

#### Defined in

node_modules/@types/bn.js/index.d.ts:308

___

### <a id="isub" name="isub"></a> isub

▸ **isub**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

subtraction

#### Inherited from

u32.isub

#### Defined in

node_modules/@types/bn.js/index.d.ts:268

___

### <a id="isubn" name="isubn"></a> isubn

▸ **isubn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

subtraction

#### Inherited from

u32.isubn

#### Defined in

node_modules/@types/bn.js/index.d.ts:278

___

### <a id="iuand" name="iuand"></a> iuand

▸ **iuand**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

and

#### Inherited from

u32.iuand

#### Defined in

node_modules/@types/bn.js/index.d.ts:399

___

### <a id="iuor" name="iuor"></a> iuor

▸ **iuor**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

or

#### Inherited from

u32.iuor

#### Defined in

node_modules/@types/bn.js/index.d.ts:379

___

### <a id="iushln" name="iushln"></a> iushln

▸ **iushln**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift left

#### Inherited from

u32.iushln

#### Defined in

node_modules/@types/bn.js/index.d.ts:449

___

### <a id="iushrn" name="iushrn"></a> iushrn

▸ **iushrn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift right

#### Inherited from

u32.iushrn

#### Defined in

node_modules/@types/bn.js/index.d.ts:469

___

### <a id="iuxor" name="iuxor"></a> iuxor

▸ **iuxor**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

xor

#### Inherited from

u32.iuxor

#### Defined in

node_modules/@types/bn.js/index.d.ts:424

___

### <a id="ixor" name="ixor"></a> ixor

▸ **ixor**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

xor

#### Inherited from

u32.ixor

#### Defined in

node_modules/@types/bn.js/index.d.ts:414

___

### <a id="lt" name="lt"></a> lt

▸ **lt**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`boolean`

**`Description`**

a less than b

#### Inherited from

u32.lt

#### Defined in

node_modules/@types/bn.js/index.d.ts:163

___

### <a id="lte" name="lte"></a> lte

▸ **lte**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`boolean`

**`Description`**

a less than or equals b

#### Inherited from

u32.lte

#### Defined in

node_modules/@types/bn.js/index.d.ts:173

___

### <a id="lten" name="lten"></a> lten

▸ **lten**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`boolean`

**`Description`**

a less than or equals b

#### Inherited from

u32.lten

#### Defined in

node_modules/@types/bn.js/index.d.ts:178

___

### <a id="ltn" name="ltn"></a> ltn

▸ **ltn**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`boolean`

**`Description`**

a less than b

#### Inherited from

u32.ltn

#### Defined in

node_modules/@types/bn.js/index.d.ts:168

___

### <a id="maskn" name="maskn"></a> maskn

▸ **maskn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

clear bits with indexes higher or equal to `b`

#### Inherited from

u32.maskn

#### Defined in

node_modules/@types/bn.js/index.d.ts:479

___

### <a id="mod" name="mod"></a> mod

▸ **mod**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

reduct

#### Inherited from

u32.mod

#### Defined in

node_modules/@types/bn.js/index.d.ts:338

___

### <a id="modn" name="modn"></a> modn

▸ **modn**(`b`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`number`

**`Deprecated`**

**`Description`**

reduct

#### Inherited from

u32.modn

#### Defined in

node_modules/@types/bn.js/index.d.ts:349

___

### <a id="modrn" name="modrn"></a> modrn

▸ **modrn**(`b`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`number`

**`Description`**

reduct

#### Inherited from

u32.modrn

#### Defined in

node_modules/@types/bn.js/index.d.ts:354

___

### <a id="mul" name="mul"></a> mul

▸ **mul**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

multiply

#### Inherited from

u32.mul

#### Defined in

node_modules/@types/bn.js/index.d.ts:283

___

### <a id="muln" name="muln"></a> muln

▸ **muln**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

multiply

#### Inherited from

u32.muln

#### Defined in

node_modules/@types/bn.js/index.d.ts:293

___

### <a id="neg" name="neg"></a> neg

▸ **neg**(): `BN`

#### Returns

`BN`

**`Description`**

negate sign

#### Inherited from

u32.neg

#### Defined in

node_modules/@types/bn.js/index.d.ts:223

___

### <a id="notn" name="notn"></a> notn

▸ **notn**(`w`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `w` | `number` |

#### Returns

`BN`

**`Description`**

not (for the width specified by `w`)

#### Inherited from

u32.notn

#### Defined in

node_modules/@types/bn.js/index.d.ts:493

___

### <a id="or" name="or"></a> or

▸ **or**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

or

#### Inherited from

u32.or

#### Defined in

node_modules/@types/bn.js/index.d.ts:364

___

### <a id="pow" name="pow"></a> pow

▸ **pow**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

raise `a` to the power of `b`

#### Inherited from

u32.pow

#### Defined in

node_modules/@types/bn.js/index.d.ts:313

___

### <a id="setn" name="setn"></a> setn

▸ **setn**(`b`, `value`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |
| `value` | `boolean` \| ``0`` \| ``1`` |

#### Returns

`BN`

**`Description`**

set specified bit to value

#### Inherited from

u32.setn

#### Defined in

node_modules/@types/bn.js/index.d.ts:429

___

### <a id="shln" name="shln"></a> shln

▸ **shln**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift left

#### Inherited from

u32.shln

#### Defined in

node_modules/@types/bn.js/index.d.ts:434

___

### <a id="shrn" name="shrn"></a> shrn

▸ **shrn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift right

#### Inherited from

u32.shrn

#### Defined in

node_modules/@types/bn.js/index.d.ts:454

___

### <a id="sqr" name="sqr"></a> sqr

▸ **sqr**(): `BN`

#### Returns

`BN`

**`Description`**

square

#### Inherited from

u32.sqr

#### Defined in

node_modules/@types/bn.js/index.d.ts:303

___

### <a id="sub" name="sub"></a> sub

▸ **sub**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

subtraction

#### Inherited from

u32.sub

#### Defined in

node_modules/@types/bn.js/index.d.ts:263

___

### <a id="subn" name="subn"></a> subn

▸ **subn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

subtraction

#### Inherited from

u32.subn

#### Defined in

node_modules/@types/bn.js/index.d.ts:273

___

### <a id="testn" name="testn"></a> testn

▸ **testn**(`b`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`boolean`

**`Description`**

test if specified bit is set

#### Inherited from

u32.testn

#### Defined in

node_modules/@types/bn.js/index.d.ts:474

___

### <a id="toarray" name="toarray"></a> toArray

▸ **toArray**(`endian?`, `length?`): `number`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `endian?` | `Endianness` |
| `length?` | `number` |

#### Returns

`number`[]

**`Description`**

convert to byte Array, and optionally zero pad to length, throwing if already exceeding

#### Inherited from

u32.toArray

#### Defined in

node_modules/@types/bn.js/index.d.ts:88

___

### <a id="toarraylike" name="toarraylike"></a> toArrayLike

▸ **toArrayLike**(`ArrayType`, `endian?`, `length?`): `Buffer`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ArrayType` | `BufferConstructor` |
| `endian?` | `Endianness` |
| `length?` | `number` |

#### Returns

`Buffer`

**`Description`**

convert to an instance of `type`, which must behave like an Array

#### Inherited from

u32.toArrayLike

#### Defined in

node_modules/@types/bn.js/index.d.ts:93

▸ **toArrayLike**(`ArrayType`, `endian?`, `length?`): `any`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `ArrayType` | `any`[] |
| `endian?` | `Endianness` |
| `length?` | `number` |

#### Returns

`any`[]

#### Inherited from

u32.toArrayLike

#### Defined in

node_modules/@types/bn.js/index.d.ts:99

___

### <a id="tobigint" name="tobigint"></a> toBigInt

▸ **toBigInt**(): `bigint`

#### Returns

`bigint`

**`Description`**

Returns a BigInt representation of the number

#### Inherited from

u32.toBigInt

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:47

___

### <a id="tobn" name="tobn"></a> toBn

▸ **toBn**(): `BN`

#### Returns

`BN`

**`Description`**

Returns the BN representation of the number. (Compatibility)

#### Inherited from

u32.toBn

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:51

___

### <a id="tobuffer" name="tobuffer"></a> toBuffer

▸ **toBuffer**(`endian?`, `length?`): `Buffer`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endian?` | `Endianness` |
| `length?` | `number` |

#### Returns

`Buffer`

**`Description`**

convert to Node.js Buffer (if available). For compatibility with browserify and similar tools, use this instead: a.toArrayLike(Buffer, endian, length)

#### Inherited from

u32.toBuffer

#### Defined in

node_modules/@types/bn.js/index.d.ts:108

___

### <a id="tohex" name="tohex"></a> toHex

▸ **toHex**(`isLe?`): \`0x$\{string}\`

#### Parameters

| Name | Type |
| :------ | :------ |
| `isLe?` | `boolean` |

#### Returns

\`0x$\{string}\`

**`Description`**

Returns a hex string representation of the value

#### Inherited from

u32.toHex

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:55

___

### <a id="tohuman" name="tohuman"></a> toHuman

▸ **toHuman**(`_isExpanded?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_isExpanded?` | `boolean` |

#### Returns

`string`

**`Description`**

Converts the Object to to a human-friendly JSON, with additional fields, expansion and formatting of information

#### Inherited from

u32.toHuman

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:59

___

### <a id="tojson" name="tojson"></a> toJSON

▸ **toJSON**(`onlyHex?`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `onlyHex?` | `boolean` |

#### Returns

`any`

**`Description`**

Converts the Object to JSON, typically used for RPC transfers

#### Inherited from

u32.toJSON

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:63

___

### <a id="tonumber" name="tonumber"></a> toNumber

▸ **toNumber**(): `number`

#### Returns

`number`

**`Description`**

convert to Javascript Number (limited to 53 bits)

#### Inherited from

u32.toNumber

#### Defined in

node_modules/@types/bn.js/index.d.ts:78

___

### <a id="toprimitive" name="toprimitive"></a> toPrimitive

▸ **toPrimitive**(): `string` \| `number`

#### Returns

`string` \| `number`

**`Description`**

Returns the value in a primitive form, either number when <= 52 bits, or string otherwise

#### Inherited from

u32.toPrimitive

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:67

___

### <a id="torawtype" name="torawtype"></a> toRawType

▸ **toRawType**(): `string`

#### Returns

`string`

**`Description`**

Returns the base runtime type name for this instance

#### Inherited from

u32.toRawType

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:71

___

### <a id="tored" name="tored"></a> toRed

▸ **toRed**(`reductionContext`): `RedBN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `reductionContext` | `ReductionContext` |

#### Returns

`RedBN`

**`Description`**

Convert number to red

#### Inherited from

u32.toRed

#### Defined in

node_modules/@types/bn.js/index.d.ts:518

___

### <a id="tostring" name="tostring"></a> toString

▸ **toString**(`base?`): `string`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `base?` | `number` | The base to use for the conversion |

#### Returns

`string`

**`Description`**

Returns the string representation of the value

#### Inherited from

u32.toString

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:76

___

### <a id="totwos" name="totwos"></a> toTwos

▸ **toTwos**(`width`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `width` | `number` |

#### Returns

`BN`

**`Description`**

convert to two's complement representation, where width is bit width

#### Inherited from

u32.toTwos

#### Defined in

node_modules/@types/bn.js/index.d.ts:213

___

### <a id="tou8a" name="tou8a"></a> toU8a

▸ **toU8a**(`_isBare?`): `Uint8Array`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_isBare?` | `boolean` |

#### Returns

`Uint8Array`

**`Description`**

Encodes the value as a Uint8Array as per the SCALE specifications

#### Inherited from

u32.toU8a

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:80

___

### <a id="uand" name="uand"></a> uand

▸ **uand**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

and

#### Inherited from

u32.uand

#### Defined in

node_modules/@types/bn.js/index.d.ts:394

___

### <a id="ucmp" name="ucmp"></a> ucmp

▸ **ucmp**(`b`): ``-1`` \| ``0`` \| ``1``

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

``-1`` \| ``0`` \| ``1``

**`Description`**

compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result

#### Inherited from

u32.ucmp

#### Defined in

node_modules/@types/bn.js/index.d.ts:153

___

### <a id="umod" name="umod"></a> umod

▸ **umod**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

reduct

#### Inherited from

u32.umod

#### Defined in

node_modules/@types/bn.js/index.d.ts:343

___

### <a id="uor" name="uor"></a> uor

▸ **uor**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

or

#### Inherited from

u32.uor

#### Defined in

node_modules/@types/bn.js/index.d.ts:374

___

### <a id="ushln" name="ushln"></a> ushln

▸ **ushln**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift left

#### Inherited from

u32.ushln

#### Defined in

node_modules/@types/bn.js/index.d.ts:444

___

### <a id="ushrn" name="ushrn"></a> ushrn

▸ **ushrn**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `number` |

#### Returns

`BN`

**`Description`**

shift right

#### Inherited from

u32.ushrn

#### Defined in

node_modules/@types/bn.js/index.d.ts:464

___

### <a id="uxor" name="uxor"></a> uxor

▸ **uxor**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

xor

#### Inherited from

u32.uxor

#### Defined in

node_modules/@types/bn.js/index.d.ts:419

___

### <a id="xor" name="xor"></a> xor

▸ **xor**(`b`): `BN`

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `BN` |

#### Returns

`BN`

**`Description`**

xor

#### Inherited from

u32.xor

#### Defined in

node_modules/@types/bn.js/index.d.ts:409

___

### <a id="zerobits" name="zerobits"></a> zeroBits

▸ **zeroBits**(): `number`

#### Returns

`number`

**`Description`**

return number of less-significant consequent zero bits (example: 1010000 has 4 zero bits)

#### Inherited from

u32.zeroBits

#### Defined in

node_modules/@types/bn.js/index.d.ts:118
