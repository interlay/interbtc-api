[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / ConstantsAPI

# Interface: ConstantsAPI

## Table of contents

### Methods

- [getDotExistentialDeposit](/interfaces/constantsapi.md#getdotexistentialdeposit)
- [getPolkaBtcExistentialDeposit](/interfaces/constantsapi.md#getpolkabtcexistentialdeposit)
- [getStakedRelayersMinimumDeposit](/interfaces/constantsapi.md#getstakedrelayersminimumdeposit)
- [getStakedRelayersMinimumStake](/interfaces/constantsapi.md#getstakedrelayersminimumstake)
- [getStakedRelayersVotingPeriod](/interfaces/constantsapi.md#getstakedrelayersvotingperiod)
- [getSystemBlockHashCount](/interfaces/constantsapi.md#getsystemblockhashcount)
- [getSystemDbWeight](/interfaces/constantsapi.md#getsystemdbweight)
- [getTimestampMinimumPeriod](/interfaces/constantsapi.md#gettimestampminimumperiod)
- [getTransactionByteFee](/interfaces/constantsapi.md#gettransactionbytefee)
- [getTransactionWeightToFee](/interfaces/constantsapi.md#gettransactionweighttofee)

## Methods

### getDotExistentialDeposit

▸ **getDotExistentialDeposit**(): *Balance*

**Returns:** *Balance*

The minimum amount of DOT required to keep an account open.

Defined in: [src/apis/constants.ts:12](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L12)

___

### getPolkaBtcExistentialDeposit

▸ **getPolkaBtcExistentialDeposit**(): *Balance*

**Returns:** *Balance*

The minimum amount of PolkaBTC required to keep an account open.

Defined in: [src/apis/constants.ts:16](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L16)

___

### getStakedRelayersMinimumDeposit

▸ **getStakedRelayersMinimumDeposit**(): *DOT*

**Returns:** *DOT*

The minimum amount of deposit required to propose an update

Defined in: [src/apis/constants.ts:20](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L20)

___

### getStakedRelayersMinimumStake

▸ **getStakedRelayersMinimumStake**(): *DOT*

**Returns:** *DOT*

The minimum amount of stake required to participate

Defined in: [src/apis/constants.ts:24](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L24)

___

### getStakedRelayersVotingPeriod

▸ **getStakedRelayersVotingPeriod**(): *BlockNumber*

**Returns:** *BlockNumber*

How often (in blocks) to check for new votes

Defined in: [src/apis/constants.ts:28](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L28)

___

### getSystemBlockHashCount

▸ **getSystemBlockHashCount**(): *BlockNumber*

**Returns:** *BlockNumber*

Maximum number of block number to block hash mappings to keep (oldest pruned first).

Defined in: [src/apis/constants.ts:32](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L32)

___

### getSystemDbWeight

▸ **getSystemDbWeight**(): *RuntimeDbWeight*

**Returns:** *RuntimeDbWeight*

The weight of database operations that the runtime can invoke.

Defined in: [src/apis/constants.ts:36](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L36)

___

### getTimestampMinimumPeriod

▸ **getTimestampMinimumPeriod**(): *Moment*

**Returns:** *Moment*

The minimum period between blocks. Beware that this is different to the *expected* period
that the block production apparatus provides. Your chosen consensus system will generally
work with this to determine a sensible block time. e.g. For Aura, it will be double this
period on default settings.

Defined in: [src/apis/constants.ts:43](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L43)

___

### getTransactionByteFee

▸ **getTransactionByteFee**(): *BalanceOf*

**Returns:** *BalanceOf*

The fee to be paid for making a transaction; the per-byte portion.

Defined in: [src/apis/constants.ts:47](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L47)

___

### getTransactionWeightToFee

▸ **getTransactionWeightToFee**(): *Vec*<WeightToFeeCoefficient\>

**Returns:** *Vec*<WeightToFeeCoefficient\>

The polynomial that is applied in order to derive fee from weight.

Defined in: [src/apis/constants.ts:51](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/constants.ts#L51)
