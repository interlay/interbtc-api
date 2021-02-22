[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / StakedRelayerAPI

# Interface: StakedRelayerAPI

## Table of contents

### Methods

- [get](/interfaces/stakedrelayerapi.md#get)
- [getAPY](/interfaces/stakedrelayerapi.md#getapy)
- [getAllActiveStatusUpdates](/interfaces/stakedrelayerapi.md#getallactivestatusupdates)
- [getAllInactiveStatusUpdates](/interfaces/stakedrelayerapi.md#getallinactivestatusupdates)
- [getAllStatusUpdates](/interfaces/stakedrelayerapi.md#getallstatusupdates)
- [getCurrentStateOfBTCParachain](/interfaces/stakedrelayerapi.md#getcurrentstateofbtcparachain)
- [getFeesDOT](/interfaces/stakedrelayerapi.md#getfeesdot)
- [getFeesPolkaBTC](/interfaces/stakedrelayerapi.md#getfeespolkabtc)
- [getLastBTCDOTExchangeRateAndTime](/interfaces/stakedrelayerapi.md#getlastbtcdotexchangerateandtime)
- [getMaxSLA](/interfaces/stakedrelayerapi.md#getmaxsla)
- [getMonitoredVaultsCollateralizationRate](/interfaces/stakedrelayerapi.md#getmonitoredvaultscollateralizationrate)
- [getOngoingStatusUpdateVotes](/interfaces/stakedrelayerapi.md#getongoingstatusupdatevotes)
- [getPagedIterator](/interfaces/stakedrelayerapi.md#getpagediterator)
- [getSLA](/interfaces/stakedrelayerapi.md#getsla)
- [getStakedDOTAmount](/interfaces/stakedrelayerapi.md#getstakeddotamount)
- [getStakedRelayersMaturityPeriod](/interfaces/stakedrelayerapi.md#getstakedrelayersmaturityperiod)
- [getTotalStakedDOTAmount](/interfaces/stakedrelayerapi.md#gettotalstakeddotamount)
- [isStakedRelayerActive](/interfaces/stakedrelayerapi.md#isstakedrelayeractive)
- [isStakedRelayerInactive](/interfaces/stakedrelayerapi.md#isstakedrelayerinactive)
- [list](/interfaces/stakedrelayerapi.md#list)
- [map](/interfaces/stakedrelayerapi.md#map)

## Methods

### get

▸ **get**(`activeStakedRelayerId`: *AccountId*): *Promise*<StakedRelayer\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`activeStakedRelayerId` | *AccountId* | The ID of the staked relayer to fetch   |

**Returns:** *Promise*<StakedRelayer\>

An StakedRelayer object

Defined in: [src/apis/staked-relayer.ts:31](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L31)

___

### getAPY

▸ **getAPY**(`stakedRelayerId`: *string*): *Promise*<string\>

Get the total APY for a staked relayer based on the income in PolkaBTC and DOT
divided by the locked DOT.

**`note`** this does not account for interest compounding

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`stakedRelayerId` | *string* | the id of the relayer   |

**Returns:** *Promise*<string\>

the APY as a percentage string

Defined in: [src/apis/staked-relayer.ts:98](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L98)

___

### getAllActiveStatusUpdates

▸ **getAllActiveStatusUpdates**(): *Promise*<{ `id`: *u256* ; `statusUpdate`: *StatusUpdate*  }[]\>

**Returns:** *Promise*<{ `id`: *u256* ; `statusUpdate`: *StatusUpdate*  }[]\>

An array of { id, statusUpdate } objects

Defined in: [src/apis/staked-relayer.ts:70](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L70)

___

### getAllInactiveStatusUpdates

▸ **getAllInactiveStatusUpdates**(): *Promise*<{ `id`: *u256* ; `statusUpdate`: *StatusUpdate*  }[]\>

**Returns:** *Promise*<{ `id`: *u256* ; `statusUpdate`: *StatusUpdate*  }[]\>

An array of { id, statusUpdate } objects

Defined in: [src/apis/staked-relayer.ts:74](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L74)

___

### getAllStatusUpdates

▸ **getAllStatusUpdates**(): *Promise*<{ `id`: *u256* ; `statusUpdate`: *StatusUpdate*  }[]\>

**Returns:** *Promise*<{ `id`: *u256* ; `statusUpdate`: *StatusUpdate*  }[]\>

An array of { id, statusUpdate } objects

Defined in: [src/apis/staked-relayer.ts:78](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L78)

___

### getCurrentStateOfBTCParachain

▸ **getCurrentStateOfBTCParachain**(): *Promise*<StatusCode\>

**Returns:** *Promise*<StatusCode\>

A parachain status code object

Defined in: [src/apis/staked-relayer.ts:62](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L62)

___

### getFeesDOT

▸ **getFeesDOT**(`stakedRelayerId`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`stakedRelayerId` | *string* | The ID of a staked relayer   |

**Returns:** *Promise*<string\>

Total rewards in DOT, denoted in Planck, for the given staked relayer

Defined in: [src/apis/staked-relayer.ts:88](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L88)

___

### getFeesPolkaBTC

▸ **getFeesPolkaBTC**(`stakedRelayerId`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`stakedRelayerId` | *string* | The ID of a staked relayer   |

**Returns:** *Promise*<string\>

Total rewards in PolkaBTC, denoted in Satoshi, for the given staked relayer

Defined in: [src/apis/staked-relayer.ts:83](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L83)

___

### getLastBTCDOTExchangeRateAndTime

▸ **getLastBTCDOTExchangeRateAndTime**(): *Promise*<[*u128*, *Moment*]\>

**Returns:** *Promise*<[*u128*, *Moment*]\>

A tuple denoting [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime]

Defined in: [src/apis/staked-relayer.ts:58](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L58)

___

### getMaxSLA

▸ **getMaxSLA**(): *Promise*<string\>

**Returns:** *Promise*<string\>

The maximum SLA score, a positive integer

Defined in: [src/apis/staked-relayer.ts:107](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L107)

___

### getMonitoredVaultsCollateralizationRate

▸ **getMonitoredVaultsCollateralizationRate**(): *Promise*<Map<AccountId, Big\>\>

**Returns:** *Promise*<Map<AccountId, Big\>\>

A mapping from vault IDs to their collateralization

Defined in: [src/apis/staked-relayer.ts:54](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L54)

___

### getOngoingStatusUpdateVotes

▸ **getOngoingStatusUpdateVotes**(): *Promise*<[*string*, *BlockNumber*, *number*, *number*][]\>

**Returns:** *Promise*<[*string*, *BlockNumber*, *number*, *number*][]\>

A tuple denoting [statusUpdateStorageKey, statusUpdateEnd, statusUpdateAyes, statusUpdateNays]

Defined in: [src/apis/staked-relayer.ts:66](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L66)

___

### getPagedIterator

▸ **getPagedIterator**(`perPage`: *number*): *AsyncGenerator*<StakedRelayer[], any, unknown\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`perPage` | *number* | Number of staked relayers to iterate through at a time   |

**Returns:** *AsyncGenerator*<StakedRelayer[], any, unknown\>

An AsyncGenerator to be used as an iterator

Defined in: [src/apis/staked-relayer.ts:26](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L26)

___

### getSLA

▸ **getSLA**(`stakedRelayerId`: *string*): *Promise*<string\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`stakedRelayerId` | *string* | The ID of a staked relayer   |

**Returns:** *Promise*<string\>

The SLA score, an integer in the range [0, MaxSLA]

Defined in: [src/apis/staked-relayer.ts:103](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L103)

___

### getStakedDOTAmount

▸ **getStakedDOTAmount**(`activeStakedRelayerId`: *AccountId*): *Promise*<DOT\>

#### Parameters:

Name | Type |
:------ | :------ |
`activeStakedRelayerId` | *AccountId* |

**Returns:** *Promise*<DOT\>

The staked DOT amount, denoted in Planck

Defined in: [src/apis/staked-relayer.ts:46](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L46)

___

### getStakedRelayersMaturityPeriod

▸ **getStakedRelayersMaturityPeriod**(): *Promise*<BlockNumber\>

**Returns:** *Promise*<BlockNumber\>

The number of blocks to wait until eligible to vote

Defined in: [src/apis/staked-relayer.ts:111](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L111)

___

### getTotalStakedDOTAmount

▸ **getTotalStakedDOTAmount**(): *Promise*<DOT\>

**Returns:** *Promise*<DOT\>

The total staked DOT amount, denoted in Planck

Defined in: [src/apis/staked-relayer.ts:50](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L50)

___

### isStakedRelayerActive

▸ **isStakedRelayerActive**(`stakedRelayerId`: *AccountId*): *Promise*<boolean\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`stakedRelayerId` | *AccountId* | The ID of the relayer for which to check the status   |

**Returns:** *Promise*<boolean\>

A boolean value

Defined in: [src/apis/staked-relayer.ts:36](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L36)

___

### isStakedRelayerInactive

▸ **isStakedRelayerInactive**(`stakedRelayerId`: *AccountId*): *Promise*<boolean\>

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`stakedRelayerId` | *AccountId* | The ID of the relayer for which to check the status   |

**Returns:** *Promise*<boolean\>

A boolean value

Defined in: [src/apis/staked-relayer.ts:41](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L41)

___

### list

▸ **list**(): *Promise*<StakedRelayer[]\>

**Returns:** *Promise*<StakedRelayer[]\>

An array containing the active staked relayers

Defined in: [src/apis/staked-relayer.ts:17](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L17)

___

### map

▸ **map**(): *Promise*<Map<AccountId, StakedRelayer\>\>

**Returns:** *Promise*<Map<AccountId, StakedRelayer\>\>

A mapping from the active staked relayer AccountId to the StakedRelayer object

Defined in: [src/apis/staked-relayer.ts:21](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/apis/staked-relayer.ts#L21)
