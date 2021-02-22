[@interlay/polkabtc](/README.md) / Exports

# @interlay/polkabtc

## Table of contents

### Namespaces

- [bitcoin](/modules/bitcoin.md)

### Classes

- [DefaultPolkaBTCAPI](/classes/defaultpolkabtcapi.md)
- [FaucetClient](/classes/faucetclient.md)
- [StakedRelayerClient](/classes/stakedrelayerclient.md)
- [VaultClient](/classes/vaultclient.md)

### Bitcoin Core Interfaces

- [BTCCoreAPI](/interfaces/btccoreapi.md)

### Other Interfaces

- [BTCRelayAPI](/interfaces/btcrelayapi.md)
- [CollateralAPI](/interfaces/collateralapi.md)
- [ConstantsAPI](/interfaces/constantsapi.md)
- [DecodedRequest](/interfaces/decodedrequest.md)
- [DecodedRequestExt](/interfaces/decodedrequestext.md)
- [IssueAPI](/interfaces/issueapi.md)
- [IssueRequestExt](/interfaces/issuerequestext.md)
- [OracleAPI](/interfaces/oracleapi.md)
- [PolkaBTCAPI](/interfaces/polkabtcapi.md)
- [RedeemAPI](/interfaces/redeemapi.md)
- [RedeemRequestExt](/interfaces/redeemrequestext.md)
- [RefundAPI](/interfaces/refundapi.md)
- [RefundRequestExt](/interfaces/refundrequestext.md)
- [ReplaceAPI](/interfaces/replaceapi.md)
- [ReplaceRequestExt](/interfaces/replacerequestext.md)
- [StakedRelayerAPI](/interfaces/stakedrelayerapi.md)
- [SystemAPI](/interfaces/systemapi.md)
- [TreasuryAPI](/interfaces/treasuryapi.md)
- [VaultsAPI](/interfaces/vaultsapi.md)

### Type aliases

- [PolkadotCodecType](/modules.md#polkadotcodectype)

### Variables

- [BTC\_IN\_SAT](/modules.md#btc_in_sat)
- [DOT\_IN\_PLANCK](/modules.md#dot_in_planck)
- [FIXEDI128\_SCALING\_FACTOR](/modules.md#fixedi128_scaling_factor)
- [MBTC\_IN\_SAT](/modules.md#mbtc_in_sat)
- [PERCENTAGE\_GRANULARITY](/modules.md#percentage_granularity)

### Functions

- [btcAddressFromParams](/modules.md#btcaddressfromparams)
- [btcToSat](/modules.md#btctosat)
- [calculateAPY](/modules.md#calculateapy)
- [createAPIRegistry](/modules.md#createapiregistry)
- [createPolkabtcAPI](/modules.md#createpolkabtcapi)
- [createPolkadotAPI](/modules.md#createpolkadotapi)
- [createProvider](/modules.md#createprovider)
- [decodeBtcAddress](/modules.md#decodebtcaddress)
- [decodeFixedPointType](/modules.md#decodefixedpointtype)
- [dotToPlanck](/modules.md#dottoplanck)
- [encodeBtcAddress](/modules.md#encodebtcaddress)
- [encodeParachainRequest](/modules.md#encodeparachainrequest)
- [encodeUnsignedFixedPoint](/modules.md#encodeunsignedfixedpoint)
- [getAPITypes](/modules.md#getapitypes)
- [getRPCTypes](/modules.md#getrpctypes)
- [pagedIterator](/modules.md#pagediterator)
- [planckToDOT](/modules.md#plancktodot)
- [reverseEndianness](/modules.md#reverseendianness)
- [reverseEndiannessHex](/modules.md#reverseendiannesshex)
- [roundTwoDecimals](/modules.md#roundtwodecimals)
- [roundUpBigToNearestInteger](/modules.md#roundupbigtonearestinteger)
- [roundUpBtcToNearestSatoshi](/modules.md#roundupbtctonearestsatoshi)
- [satToBTC](/modules.md#sattobtc)
- [satToMBTC](/modules.md#sattombtc)
- [sendLoggedTx](/modules.md#sendloggedtx)
- [stripHexPrefix](/modules.md#striphexprefix)
- [uint8ArrayToString](/modules.md#uint8arraytostring)

## Type aliases

### PolkadotCodecType

Ƭ **PolkadotCodecType**: IssueRequest \| RedeemRequest \| Vault \| StakedRelayer

Defined in: [src/utils/pagedIterator.ts:7](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/pagedIterator.ts#L7)

## Variables

### BTC\_IN\_SAT

• `Const` **BTC\_IN\_SAT**: *100000000*= 100\_000\_000

Defined in: [src/utils/currency.ts:7](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L7)

___

### DOT\_IN\_PLANCK

• `Const` **DOT\_IN\_PLANCK**: *10000000000*= 10\_000\_000\_000

Defined in: [src/utils/currency.ts:9](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L9)

___

### FIXEDI128\_SCALING\_FACTOR

• `Const` **FIXEDI128\_SCALING\_FACTOR**: *18*= 18

Defined in: [src/utils/constants.ts:2](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/constants.ts#L2)

___

### MBTC\_IN\_SAT

• `Const` **MBTC\_IN\_SAT**: *100000*= 100\_000

Defined in: [src/utils/currency.ts:8](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L8)

___

### PERCENTAGE\_GRANULARITY

• `Const` **PERCENTAGE\_GRANULARITY**: *3*= 3

Defined in: [src/utils/constants.ts:1](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/constants.ts#L1)

## Functions

### btcAddressFromParams

▸ **btcAddressFromParams**(`registry`: TypeRegistry, `params`: { `p2pkh`: H160 \| *string*  } \| { `p2sh`: H160 \| *string*  } \| { `p2wpkhv0`: H160 \| *string*  }): BtcAddress

#### Parameters:

Name | Type |
:------ | :------ |
`registry` | TypeRegistry |
`params` | { `p2pkh`: H160 \| *string*  } \| { `p2sh`: H160 \| *string*  } \| { `p2wpkhv0`: H160 \| *string*  } |

**Returns:** BtcAddress

Defined in: [src/utils/bitcoin.ts:70](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/bitcoin.ts#L70)

___

### btcToSat

▸ **btcToSat**(`btc`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`btc` | *string* |

**Returns:** *string*

Defined in: [src/utils/currency.ts:46](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L46)

___

### calculateAPY

▸ **calculateAPY**(`feesPolkaBTC`: *string*, `feesDOT`: *string*, `lockedDOT`: *string*, `dotToBtcRate`: Big): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`feesPolkaBTC` | *string* |
`feesDOT` | *string* |
`lockedDOT` | *string* |
`dotToBtcRate` | Big |

**Returns:** *string*

Defined in: [src/utils/fee.ts:3](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/fee.ts#L3)

___

### createAPIRegistry

▸ **createAPIRegistry**(): TypeRegistry

**Returns:** TypeRegistry

Defined in: [src/factory.ts:52](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/factory.ts#L52)

___

### createPolkabtcAPI

▸ **createPolkabtcAPI**(`endpoint`: *string*, `network?`: *string*, `autoConnect?`: *number* \| *false*): *Promise*<[*PolkaBTCAPI*](/interfaces/polkabtcapi.md)\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`endpoint` | *string* | - |
`network` | *string* | "mainnet" |
`autoConnect?` | *number* \| *false* | - |

**Returns:** *Promise*<[*PolkaBTCAPI*](/interfaces/polkabtcapi.md)\>

Defined in: [src/factory.ts:32](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/factory.ts#L32)

___

### createPolkadotAPI

▸ **createPolkadotAPI**(`endpoint`: *string*, `autoConnect?`: *number* \| *false*): *Promise*<ApiPromise\>

#### Parameters:

Name | Type |
:------ | :------ |
`endpoint` | *string* |
`autoConnect?` | *number* \| *false* |

**Returns:** *Promise*<ApiPromise\>

Defined in: [src/factory.ts:25](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/factory.ts#L25)

___

### createProvider

▸ **createProvider**(`endpoint`: *string*, `autoConnect?`: *number* \| *false*): ProviderInterface

#### Parameters:

Name | Type |
:------ | :------ |
`endpoint` | *string* |
`autoConnect?` | *number* \| *false* |

**Returns:** ProviderInterface

Defined in: [src/factory.ts:11](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/factory.ts#L11)

___

### decodeBtcAddress

▸ **decodeBtcAddress**(`address`: *string*, `network`: [*Network*](/interfaces/bitcoin.networks.network.md)): { `p2pkh`: *string*  } \| { `p2sh`: *string*  } \| { `p2wpkhv0`: *string*  }

#### Parameters:

Name | Type |
:------ | :------ |
`address` | *string* |
`network` | [*Network*](/interfaces/bitcoin.networks.network.md) |

**Returns:** { `p2pkh`: *string*  } \| { `p2sh`: *string*  } \| { `p2wpkhv0`: *string*  }

Defined in: [src/utils/bitcoin.ts:54](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/bitcoin.ts#L54)

___

### decodeFixedPointType

▸ **decodeFixedPointType**(`x`: SignedFixedPoint \| UnsignedFixedPoint): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`x` | SignedFixedPoint \| UnsignedFixedPoint |

**Returns:** *string*

Defined in: [src/utils/encoding.ts:58](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L58)

___

### dotToPlanck

▸ **dotToPlanck**(`dot`: *string*): *string* \| *undefined*

#### Parameters:

Name | Type |
:------ | :------ |
`dot` | *string* |

**Returns:** *string* \| *undefined*

Defined in: [src/utils/currency.ts:59](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L59)

___

### encodeBtcAddress

▸ **encodeBtcAddress**(`address`: BtcAddress, `network`: [*Network*](/interfaces/bitcoin.networks.network.md)): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`address` | BtcAddress |
`network` | [*Network*](/interfaces/bitcoin.networks.network.md) |

**Returns:** *string*

Defined in: [src/utils/bitcoin.ts:8](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/bitcoin.ts#L8)

___

### encodeParachainRequest

▸ **encodeParachainRequest**<T, K\>(`req`: T, `network`: [*Network*](/interfaces/bitcoin.networks.network.md)): K

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*DecodedRequest*](/interfaces/decodedrequest.md)<T\> |
`K` | [*DecodedRequestExt*](/interfaces/decodedrequestext.md)<K\> |

#### Parameters:

Name | Type |
:------ | :------ |
`req` | T |
`network` | [*Network*](/interfaces/bitcoin.networks.network.md) |

**Returns:** K

Defined in: [src/utils/encoding.ts:81](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L81)

___

### encodeUnsignedFixedPoint

▸ **encodeUnsignedFixedPoint**(`api`: ApiPromise, `x`: *string*): UnsignedFixedPoint

#### Parameters:

Name | Type |
:------ | :------ |
`api` | ApiPromise |
`x` | *string* |

**Returns:** UnsignedFixedPoint

Defined in: [src/utils/encoding.ts:65](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L65)

___

### getAPITypes

▸ **getAPITypes**(): RegistryTypes

**Returns:** RegistryTypes

Defined in: [src/factory.ts:44](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/factory.ts#L44)

___

### getRPCTypes

▸ **getRPCTypes**(): *Record*<string, Record<string, DefinitionRpc \| DefinitionRpcSub\>\>

**Returns:** *Record*<string, Record<string, DefinitionRpc \| DefinitionRpcSub\>\>

Defined in: [src/factory.ts:48](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/factory.ts#L48)

___

### pagedIterator

▸ **pagedIterator**<T\>(`polkadotListings`: *AugmentedQuery*<ApiTypes, (`arg`: CodecArg) => *Observable*<T\>\> & *QueryableStorageEntry*<ApiTypes\>, `perPage`: *number*): *AsyncGenerator*<T[]\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*PolkadotCodecType*](/modules.md#polkadotcodectype) |

#### Parameters:

Name | Type |
:------ | :------ |
`polkadotListings` | *AugmentedQuery*<ApiTypes, (`arg`: CodecArg) => *Observable*<T\>\> & *QueryableStorageEntry*<ApiTypes\> |
`perPage` | *number* |

**Returns:** *AsyncGenerator*<T[]\>

Defined in: [src/utils/pagedIterator.ts:9](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/pagedIterator.ts#L9)

___

### planckToDOT

▸ **planckToDOT**(`planck`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`planck` | *string* |

**Returns:** *string*

Defined in: [src/utils/currency.ts:54](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L54)

___

### reverseEndianness

▸ **reverseEndianness**(`bytes`: Uint8Array): Uint8Array

Converts endianness of a Uint8Array

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`bytes` | Uint8Array | Uint8Array, to be converted LE<>BE    |

**Returns:** Uint8Array

Defined in: [src/utils/encoding.ts:12](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L12)

___

### reverseEndiannessHex

▸ **reverseEndiannessHex**(`hex`: *string*): *string*

Reverse the endianness of the given hex string

**`dev`** Will remove `0x` prefix if present

#### Parameters:

Name | Type |
:------ | :------ |
`hex` | *string* |

**Returns:** *string*

Defined in: [src/utils/encoding.ts:43](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L43)

___

### roundTwoDecimals

▸ **roundTwoDecimals**(`input`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`input` | *string* |

**Returns:** *string*

Defined in: [src/utils/currency.ts:11](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L11)

___

### roundUpBigToNearestInteger

▸ **roundUpBigToNearestInteger**(`x`: Big): Big

#### Parameters:

Name | Type |
:------ | :------ |
`x` | Big |

**Returns:** Big

Defined in: [src/utils/currency.ts:16](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L16)

___

### roundUpBtcToNearestSatoshi

▸ **roundUpBtcToNearestSatoshi**(`amountBtc`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`amountBtc` | *string* |

**Returns:** *string*

Defined in: [src/utils/currency.ts:30](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L30)

___

### satToBTC

▸ **satToBTC**(`sat`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`sat` | *string* |

**Returns:** *string*

Defined in: [src/utils/currency.ts:36](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L36)

___

### satToMBTC

▸ **satToMBTC**(`sat`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`sat` | *string* |

**Returns:** *string*

Defined in: [src/utils/currency.ts:41](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/currency.ts#L41)

___

### sendLoggedTx

▸ **sendLoggedTx**(`transaction`: *SubmittableExtrinsic*<*promise*\>, `signer`: AddressOrPair, `api`: ApiPromise): *Promise*<ISubmittableResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`transaction` | *SubmittableExtrinsic*<*promise*\> |
`signer` | AddressOrPair |
`api` | ApiPromise |

**Returns:** *Promise*<ISubmittableResult\>

Defined in: [src/utils/logger.ts:7](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/logger.ts#L7)

___

### stripHexPrefix

▸ **stripHexPrefix**(`str`: *string*): *string*

Remove the `0x` hex prefix if present

#### Parameters:

Name | Type |
:------ | :------ |
`str` | *string* |

**Returns:** *string*

Defined in: [src/utils/encoding.ts:34](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L34)

___

### uint8ArrayToString

▸ **uint8ArrayToString**(`bytes`: Uint8Array): *string*

Converts a Uint8Array to string

**`dev`** Will remove `0x` prefix if present

#### Parameters:

Name | Type |
:------ | :------ |
`bytes` | Uint8Array |

**Returns:** *string*

Defined in: [src/utils/encoding.ts:54](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/utils/encoding.ts#L54)
