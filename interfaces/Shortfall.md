[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / Shortfall

# Interface: Shortfall

**`Name`**

Shortfall

## Hierarchy

- `FixedU128`

  ↳ **`Shortfall`**

## Table of contents

### Properties

- [#private](Shortfall.md##private)
- [createdAtHash](Shortfall.md#createdathash)
- [encodedLength](Shortfall.md#encodedlength)
- [initialU8aLength](Shortfall.md#initialu8alength)
- [isStorageFallback](Shortfall.md#isstoragefallback)
- [isUnsigned](Shortfall.md#isunsigned)
- [registry](Shortfall.md#registry)

### Accessors

- [hash](Shortfall.md#hash)
- [isEmpty](Shortfall.md#isempty)

### Methods

- [abs](Shortfall.md#abs)
- [add](Shortfall.md#add)
- [addn](Shortfall.md#addn)
- [and](Shortfall.md#and)
- [andln](Shortfall.md#andln)
- [bincn](Shortfall.md#bincn)
- [bitLength](Shortfall.md#bitlength)
- [byteLength](Shortfall.md#bytelength)
- [clone](Shortfall.md#clone)
- [cmp](Shortfall.md#cmp)
- [cmpn](Shortfall.md#cmpn)
- [copy](Shortfall.md#copy)
- [div](Shortfall.md#div)
- [divRound](Shortfall.md#divround)
- [divmod](Shortfall.md#divmod)
- [divn](Shortfall.md#divn)
- [egcd](Shortfall.md#egcd)
- [eq](Shortfall.md#eq)
- [eqn](Shortfall.md#eqn)
- [fromTwos](Shortfall.md#fromtwos)
- [gcd](Shortfall.md#gcd)
- [gt](Shortfall.md#gt)
- [gte](Shortfall.md#gte)
- [gten](Shortfall.md#gten)
- [gtn](Shortfall.md#gtn)
- [iabs](Shortfall.md#iabs)
- [iadd](Shortfall.md#iadd)
- [iaddn](Shortfall.md#iaddn)
- [iand](Shortfall.md#iand)
- [idivn](Shortfall.md#idivn)
- [imaskn](Shortfall.md#imaskn)
- [imul](Shortfall.md#imul)
- [imuln](Shortfall.md#imuln)
- [ineg](Shortfall.md#ineg)
- [inotn](Shortfall.md#inotn)
- [inspect](Shortfall.md#inspect)
- [invm](Shortfall.md#invm)
- [ior](Shortfall.md#ior)
- [isEven](Shortfall.md#iseven)
- [isMax](Shortfall.md#ismax)
- [isNeg](Shortfall.md#isneg)
- [isOdd](Shortfall.md#isodd)
- [isZero](Shortfall.md#iszero)
- [ishln](Shortfall.md#ishln)
- [ishrn](Shortfall.md#ishrn)
- [isqr](Shortfall.md#isqr)
- [isub](Shortfall.md#isub)
- [isubn](Shortfall.md#isubn)
- [iuand](Shortfall.md#iuand)
- [iuor](Shortfall.md#iuor)
- [iushln](Shortfall.md#iushln)
- [iushrn](Shortfall.md#iushrn)
- [iuxor](Shortfall.md#iuxor)
- [ixor](Shortfall.md#ixor)
- [lt](Shortfall.md#lt)
- [lte](Shortfall.md#lte)
- [lten](Shortfall.md#lten)
- [ltn](Shortfall.md#ltn)
- [maskn](Shortfall.md#maskn)
- [mod](Shortfall.md#mod)
- [modn](Shortfall.md#modn)
- [modrn](Shortfall.md#modrn)
- [mul](Shortfall.md#mul)
- [muln](Shortfall.md#muln)
- [neg](Shortfall.md#neg)
- [notn](Shortfall.md#notn)
- [or](Shortfall.md#or)
- [pow](Shortfall.md#pow)
- [setn](Shortfall.md#setn)
- [shln](Shortfall.md#shln)
- [shrn](Shortfall.md#shrn)
- [sqr](Shortfall.md#sqr)
- [sub](Shortfall.md#sub)
- [subn](Shortfall.md#subn)
- [testn](Shortfall.md#testn)
- [toArray](Shortfall.md#toarray)
- [toArrayLike](Shortfall.md#toarraylike)
- [toBigInt](Shortfall.md#tobigint)
- [toBn](Shortfall.md#tobn)
- [toBuffer](Shortfall.md#tobuffer)
- [toHex](Shortfall.md#tohex)
- [toHuman](Shortfall.md#tohuman)
- [toJSON](Shortfall.md#tojson)
- [toNumber](Shortfall.md#tonumber)
- [toPrimitive](Shortfall.md#toprimitive)
- [toRawType](Shortfall.md#torawtype)
- [toRed](Shortfall.md#tored)
- [toString](Shortfall.md#tostring)
- [toTwos](Shortfall.md#totwos)
- [toU8a](Shortfall.md#tou8a)
- [uand](Shortfall.md#uand)
- [ucmp](Shortfall.md#ucmp)
- [umod](Shortfall.md#umod)
- [uor](Shortfall.md#uor)
- [ushln](Shortfall.md#ushln)
- [ushrn](Shortfall.md#ushrn)
- [uxor](Shortfall.md#uxor)
- [xor](Shortfall.md#xor)
- [zeroBits](Shortfall.md#zerobits)

## Properties

### <a id="#private" name="#private"></a> #private

• `Private` **#private**: `any`

#### Inherited from

FixedU128.#private

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:12

___

### <a id="createdathash" name="createdathash"></a> createdAtHash

• `Optional` **createdAtHash**: `IU8a`

#### Inherited from

FixedU128.createdAtHash

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:16

___

### <a id="encodedlength" name="encodedlength"></a> encodedLength

• `Readonly` **encodedLength**: `number`

#### Inherited from

FixedU128.encodedLength

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:14

___

### <a id="initialu8alength" name="initialu8alength"></a> initialU8aLength

• `Optional` **initialU8aLength**: `number`

#### Inherited from

FixedU128.initialU8aLength

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:17

___

### <a id="isstoragefallback" name="isstoragefallback"></a> isStorageFallback

• `Optional` **isStorageFallback**: `boolean`

#### Inherited from

FixedU128.isStorageFallback

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:18

___

### <a id="isunsigned" name="isunsigned"></a> isUnsigned

• `Readonly` **isUnsigned**: `boolean`

#### Inherited from

FixedU128.isUnsigned

#### Defined in

node_modules/@polkadot/types-codec/abstract/Int.d.ts:15

___

### <a id="registry" name="registry"></a> registry

• `Readonly` **registry**: `Registry`

#### Inherited from

FixedU128.registry

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

FixedU128.hash

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

FixedU128.isEmpty

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

FixedU128.abs

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

FixedU128.add

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

FixedU128.addn

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

FixedU128.and

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

FixedU128.andln

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

FixedU128.bincn

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

FixedU128.bitLength

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

FixedU128.byteLength

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

FixedU128.clone

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

FixedU128.cmp

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

FixedU128.cmpn

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

FixedU128.copy

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

FixedU128.div

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

FixedU128.divRound

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

FixedU128.divmod

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

FixedU128.divn

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

FixedU128.egcd

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

FixedU128.eq

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

FixedU128.eqn

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

FixedU128.fromTwos

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

FixedU128.gcd

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

FixedU128.gt

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

FixedU128.gte

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

FixedU128.gten

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

FixedU128.gtn

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

FixedU128.iabs

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

FixedU128.iadd

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

FixedU128.iaddn

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

FixedU128.iand

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

FixedU128.idivn

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

FixedU128.imaskn

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

FixedU128.imul

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

FixedU128.imuln

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

FixedU128.ineg

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

FixedU128.inotn

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

FixedU128.inspect

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

FixedU128.invm

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

FixedU128.ior

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

FixedU128.isEven

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

FixedU128.isMax

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

FixedU128.isNeg

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

FixedU128.isOdd

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

FixedU128.isZero

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

FixedU128.ishln

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

FixedU128.ishrn

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

FixedU128.isqr

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

FixedU128.isub

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

FixedU128.isubn

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

FixedU128.iuand

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

FixedU128.iuor

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

FixedU128.iushln

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

FixedU128.iushrn

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

FixedU128.iuxor

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

FixedU128.ixor

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

FixedU128.lt

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

FixedU128.lte

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

FixedU128.lten

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

FixedU128.ltn

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

FixedU128.maskn

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

FixedU128.mod

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

FixedU128.modn

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

FixedU128.modrn

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

FixedU128.mul

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

FixedU128.muln

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

FixedU128.neg

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

FixedU128.notn

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

FixedU128.or

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

FixedU128.pow

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

FixedU128.setn

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

FixedU128.shln

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

FixedU128.shrn

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

FixedU128.sqr

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

FixedU128.sub

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

FixedU128.subn

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

FixedU128.testn

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

FixedU128.toArray

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

FixedU128.toArrayLike

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

FixedU128.toArrayLike

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

FixedU128.toBigInt

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

FixedU128.toBn

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

FixedU128.toBuffer

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

FixedU128.toHex

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

FixedU128.toHuman

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

FixedU128.toJSON

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

FixedU128.toNumber

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

FixedU128.toPrimitive

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

FixedU128.toRawType

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

FixedU128.toRed

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

FixedU128.toString

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

FixedU128.toTwos

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

FixedU128.toU8a

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

FixedU128.uand

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

FixedU128.ucmp

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

FixedU128.umod

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

FixedU128.uor

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

FixedU128.ushln

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

FixedU128.ushrn

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

FixedU128.uxor

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

FixedU128.xor

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

FixedU128.zeroBits

#### Defined in

node_modules/@types/bn.js/index.d.ts:118
