[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / Ratio

# Interface: Ratio

**`Name`**

Ratio

## Hierarchy

- `Permill`

  ↳ **`Ratio`**

## Table of contents

### Properties

- [#private](Ratio.md##private)
- [createdAtHash](Ratio.md#createdathash)
- [encodedLength](Ratio.md#encodedlength)
- [initialU8aLength](Ratio.md#initialu8alength)
- [isStorageFallback](Ratio.md#isstoragefallback)
- [isUnsigned](Ratio.md#isunsigned)
- [registry](Ratio.md#registry)

### Accessors

- [hash](Ratio.md#hash)
- [isEmpty](Ratio.md#isempty)

### Methods

- [abs](Ratio.md#abs)
- [add](Ratio.md#add)
- [addn](Ratio.md#addn)
- [and](Ratio.md#and)
- [andln](Ratio.md#andln)
- [bincn](Ratio.md#bincn)
- [bitLength](Ratio.md#bitlength)
- [byteLength](Ratio.md#bytelength)
- [clone](Ratio.md#clone)
- [cmp](Ratio.md#cmp)
- [cmpn](Ratio.md#cmpn)
- [copy](Ratio.md#copy)
- [div](Ratio.md#div)
- [divRound](Ratio.md#divround)
- [divmod](Ratio.md#divmod)
- [divn](Ratio.md#divn)
- [egcd](Ratio.md#egcd)
- [eq](Ratio.md#eq)
- [eqn](Ratio.md#eqn)
- [fromTwos](Ratio.md#fromtwos)
- [gcd](Ratio.md#gcd)
- [gt](Ratio.md#gt)
- [gte](Ratio.md#gte)
- [gten](Ratio.md#gten)
- [gtn](Ratio.md#gtn)
- [iabs](Ratio.md#iabs)
- [iadd](Ratio.md#iadd)
- [iaddn](Ratio.md#iaddn)
- [iand](Ratio.md#iand)
- [idivn](Ratio.md#idivn)
- [imaskn](Ratio.md#imaskn)
- [imul](Ratio.md#imul)
- [imuln](Ratio.md#imuln)
- [ineg](Ratio.md#ineg)
- [inotn](Ratio.md#inotn)
- [inspect](Ratio.md#inspect)
- [invm](Ratio.md#invm)
- [ior](Ratio.md#ior)
- [isEven](Ratio.md#iseven)
- [isMax](Ratio.md#ismax)
- [isNeg](Ratio.md#isneg)
- [isOdd](Ratio.md#isodd)
- [isZero](Ratio.md#iszero)
- [ishln](Ratio.md#ishln)
- [ishrn](Ratio.md#ishrn)
- [isqr](Ratio.md#isqr)
- [isub](Ratio.md#isub)
- [isubn](Ratio.md#isubn)
- [iuand](Ratio.md#iuand)
- [iuor](Ratio.md#iuor)
- [iushln](Ratio.md#iushln)
- [iushrn](Ratio.md#iushrn)
- [iuxor](Ratio.md#iuxor)
- [ixor](Ratio.md#ixor)
- [lt](Ratio.md#lt)
- [lte](Ratio.md#lte)
- [lten](Ratio.md#lten)
- [ltn](Ratio.md#ltn)
- [maskn](Ratio.md#maskn)
- [mod](Ratio.md#mod)
- [modn](Ratio.md#modn)
- [modrn](Ratio.md#modrn)
- [mul](Ratio.md#mul)
- [muln](Ratio.md#muln)
- [neg](Ratio.md#neg)
- [notn](Ratio.md#notn)
- [or](Ratio.md#or)
- [pow](Ratio.md#pow)
- [setn](Ratio.md#setn)
- [shln](Ratio.md#shln)
- [shrn](Ratio.md#shrn)
- [sqr](Ratio.md#sqr)
- [sub](Ratio.md#sub)
- [subn](Ratio.md#subn)
- [testn](Ratio.md#testn)
- [toArray](Ratio.md#toarray)
- [toArrayLike](Ratio.md#toarraylike)
- [toBigInt](Ratio.md#tobigint)
- [toBn](Ratio.md#tobn)
- [toBuffer](Ratio.md#tobuffer)
- [toHex](Ratio.md#tohex)
- [toHuman](Ratio.md#tohuman)
- [toJSON](Ratio.md#tojson)
- [toNumber](Ratio.md#tonumber)
- [toPrimitive](Ratio.md#toprimitive)
- [toRawType](Ratio.md#torawtype)
- [toRed](Ratio.md#tored)
- [toString](Ratio.md#tostring)
- [toTwos](Ratio.md#totwos)
- [toU8a](Ratio.md#tou8a)
- [uand](Ratio.md#uand)
- [ucmp](Ratio.md#ucmp)
- [umod](Ratio.md#umod)
- [uor](Ratio.md#uor)
- [ushln](Ratio.md#ushln)
- [ushrn](Ratio.md#ushrn)
- [uxor](Ratio.md#uxor)
- [xor](Ratio.md#xor)
- [zeroBits](Ratio.md#zerobits)

## Properties

### <a id="#private" name="#private"></a> #private

• `Private` **#private**: `any`

#### Inherited from

Permill.#private

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:12

___

### <a id="createdathash" name="createdathash"></a> createdAtHash

• `Optional` **createdAtHash**: `IU8a`

#### Inherited from

Permill.createdAtHash

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:16

___

### <a id="encodedlength" name="encodedlength"></a> encodedLength

• `Readonly` **encodedLength**: `number`

#### Inherited from

Permill.encodedLength

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:14

___

### <a id="initialu8alength" name="initialu8alength"></a> initialU8aLength

• `Optional` **initialU8aLength**: `number`

#### Inherited from

Permill.initialU8aLength

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:17

___

### <a id="isstoragefallback" name="isstoragefallback"></a> isStorageFallback

• `Optional` **isStorageFallback**: `boolean`

#### Inherited from

Permill.isStorageFallback

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:18

___

### <a id="isunsigned" name="isunsigned"></a> isUnsigned

• `Readonly` **isUnsigned**: `boolean`

#### Inherited from

Permill.isUnsigned

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:15

___

### <a id="registry" name="registry"></a> registry

• `Readonly` **registry**: `Registry`

#### Inherited from

Permill.registry

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

Permill.hash

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

Permill.isEmpty

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

Permill.abs

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

Permill.add

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

Permill.addn

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

Permill.and

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

Permill.andln

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

Permill.bincn

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

Permill.bitLength

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

Permill.byteLength

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

Permill.clone

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

Permill.cmp

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

Permill.cmpn

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

Permill.copy

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

Permill.div

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

Permill.divRound

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

Permill.divmod

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

Permill.divn

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

Permill.egcd

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

Permill.eq

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

Permill.eqn

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

Permill.fromTwos

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

Permill.gcd

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

Permill.gt

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

Permill.gte

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

Permill.gten

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

Permill.gtn

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

Permill.iabs

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

Permill.iadd

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

Permill.iaddn

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

Permill.iand

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

Permill.idivn

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

Permill.imaskn

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

Permill.imul

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

Permill.imuln

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

Permill.ineg

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

Permill.inotn

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

Permill.inspect

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

Permill.invm

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

Permill.ior

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

Permill.isEven

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

Permill.isMax

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

Permill.isNeg

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

Permill.isOdd

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

Permill.isZero

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

Permill.ishln

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

Permill.ishrn

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

Permill.isqr

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

Permill.isub

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

Permill.isubn

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

Permill.iuand

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

Permill.iuor

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

Permill.iushln

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

Permill.iushrn

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

Permill.iuxor

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

Permill.ixor

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

Permill.lt

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

Permill.lte

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

Permill.lten

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

Permill.ltn

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

Permill.maskn

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

Permill.mod

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

Permill.modn

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

Permill.modrn

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

Permill.mul

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

Permill.muln

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

Permill.neg

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

Permill.notn

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

Permill.or

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

Permill.pow

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

Permill.setn

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

Permill.shln

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

Permill.shrn

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

Permill.sqr

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

Permill.sub

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

Permill.subn

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

Permill.testn

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

Permill.toArray

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

Permill.toArrayLike

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

Permill.toArrayLike

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

Permill.toBigInt

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

Permill.toBn

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

Permill.toBuffer

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

Permill.toHex

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

Permill.toHuman

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

Permill.toJSON

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

Permill.toNumber

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

Permill.toPrimitive

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

Permill.toRawType

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

Permill.toRed

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

Permill.toString

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

Permill.toTwos

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

Permill.toU8a

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

Permill.uand

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

Permill.ucmp

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

Permill.umod

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

Permill.uor

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

Permill.ushln

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

Permill.ushrn

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

Permill.uxor

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

Permill.xor

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

Permill.zeroBits

#### Defined in

node_modules/@types/bn.js/index.d.ts:118
