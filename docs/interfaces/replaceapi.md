[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / ReplaceAPI

# Interface: ReplaceAPI

## Table of contents

### Methods

- [getBtcDustValue](/interfaces/replaceapi.md#getbtcdustvalue)
- [getGriefingCollateral](/interfaces/replaceapi.md#getgriefingcollateral)
- [getReplacePeriod](/interfaces/replaceapi.md#getreplaceperiod)
- [list](/interfaces/replaceapi.md#list)
- [map](/interfaces/replaceapi.md#map)

## Methods

### getBtcDustValue

▸ **getBtcDustValue**(): *Promise*<PolkaBTC\>

**Returns:** *Promise*<PolkaBTC\>

The minimum amount of btc that is accepted for replace requests; any lower values would
risk the bitcoin client to reject the payment

Defined in: [src/apis/replace.ts:35](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/replace.ts#L35)

___

### getGriefingCollateral

▸ **getGriefingCollateral**(): *Promise*<DOT\>

**Returns:** *Promise*<DOT\>

Default griefing collateral (in DOT) as a percentage of the to-be-locked DOT collateral
of the new Vault. This collateral will be slashed and allocated to the replacing Vault
if the to-be-replaced Vault does not transfer BTC on time.

Defined in: [src/apis/replace.ts:41](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/replace.ts#L41)

___

### getReplacePeriod

▸ **getReplacePeriod**(): *Promise*<BlockNumber\>

**Returns:** *Promise*<BlockNumber\>

The time difference in number of blocks between when a replace request is created
and required completion time by a vault. The replace period has an upper limit
to prevent griefing of vault collateral.

Defined in: [src/apis/replace.ts:47](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/replace.ts#L47)

___

### list

▸ **list**(): *Promise*<[*ReplaceRequestExt*](/interfaces/replacerequestext.md)[]\>

**Returns:** *Promise*<[*ReplaceRequestExt*](/interfaces/replacerequestext.md)[]\>

An array containing the replace requests

Defined in: [src/apis/replace.ts:51](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/replace.ts#L51)

___

### map

▸ **map**(): *Promise*<Map<string, [*ReplaceRequestExt*](/interfaces/replacerequestext.md)\>\>

**Returns:** *Promise*<Map<string, [*ReplaceRequestExt*](/interfaces/replacerequestext.md)\>\>

A mapping from the replace request ID to the replace request object

Defined in: [src/apis/replace.ts:55](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/replace.ts#L55)
