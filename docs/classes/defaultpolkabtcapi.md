[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / DefaultPolkaBTCAPI

# Class: DefaultPolkaBTCAPI

## Implements

* [*PolkaBTCAPI*](/interfaces/polkabtcapi.md)

## Table of contents

### Constructors

- [constructor](/classes/defaultpolkabtcapi.md#constructor)

### Properties

- [api](/classes/defaultpolkabtcapi.md#api)
- [btcCore](/classes/defaultpolkabtcapi.md#btccore)
- [btcRelay](/classes/defaultpolkabtcapi.md#btcrelay)
- [collateral](/classes/defaultpolkabtcapi.md#collateral)
- [faucet](/classes/defaultpolkabtcapi.md#faucet)
- [issue](/classes/defaultpolkabtcapi.md#issue)
- [oracle](/classes/defaultpolkabtcapi.md#oracle)
- [redeem](/classes/defaultpolkabtcapi.md#redeem)
- [refund](/classes/defaultpolkabtcapi.md#refund)
- [relayer](/classes/defaultpolkabtcapi.md#relayer)
- [replace](/classes/defaultpolkabtcapi.md#replace)
- [stakedRelayer](/classes/defaultpolkabtcapi.md#stakedrelayer)
- [system](/classes/defaultpolkabtcapi.md#system)
- [treasury](/classes/defaultpolkabtcapi.md#treasury)
- [vaults](/classes/defaultpolkabtcapi.md#vaults)

### Accessors

- [account](/classes/defaultpolkabtcapi.md#account)

### Methods

- [setAccount](/classes/defaultpolkabtcapi.md#setaccount)

## Constructors

### constructor

\+ **new DefaultPolkaBTCAPI**(`api`: *ApiPromise*, `network?`: *string*, `_account?`: *string* \| IKeyringPair \| *AccountId* \| *Address*): [*DefaultPolkaBTCAPI*](/classes/defaultpolkabtcapi.md)

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`api` | *ApiPromise* | - |
`network` | *string* | "mainnet" |
`_account?` | *string* \| IKeyringPair \| *AccountId* \| *Address* | - |

**Returns:** [*DefaultPolkaBTCAPI*](/classes/defaultpolkabtcapi.md)

Defined in: [src/polkabtc-api.ts:67](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L67)

## Properties

### api

• `Readonly` **api**: *ApiPromise*

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[api](/interfaces/polkabtcapi.md#api)

___

### btcCore

• `Readonly` **btcCore**: [*BTCCoreAPI*](/interfaces/btccoreapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[btcCore](/interfaces/polkabtcapi.md#btccore)

Defined in: [src/polkabtc-api.ts:62](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L62)

___

### btcRelay

• `Readonly` **btcRelay**: [*BTCRelayAPI*](/interfaces/btcrelayapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[btcRelay](/interfaces/polkabtcapi.md#btcrelay)

Defined in: [src/polkabtc-api.ts:63](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L63)

___

### collateral

• `Readonly` **collateral**: [*CollateralAPI*](/interfaces/collateralapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[collateral](/interfaces/polkabtcapi.md#collateral)

Defined in: [src/polkabtc-api.ts:64](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L64)

___

### faucet

• `Readonly` **faucet**: [*FaucetClient*](/classes/faucetclient.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[faucet](/interfaces/polkabtcapi.md#faucet)

Defined in: [src/polkabtc-api.ts:60](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L60)

___

### issue

• `Readonly` **issue**: [*IssueAPI*](/interfaces/issueapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[issue](/interfaces/polkabtcapi.md#issue)

Defined in: [src/polkabtc-api.ts:55](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L55)

___

### oracle

• `Readonly` **oracle**: [*OracleAPI*](/interfaces/oracleapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[oracle](/interfaces/polkabtcapi.md#oracle)

Defined in: [src/polkabtc-api.ts:61](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L61)

___

### redeem

• `Readonly` **redeem**: [*RedeemAPI*](/interfaces/redeemapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[redeem](/interfaces/polkabtcapi.md#redeem)

Defined in: [src/polkabtc-api.ts:56](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L56)

___

### refund

• `Readonly` **refund**: [*RefundAPI*](/interfaces/refundapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[refund](/interfaces/polkabtcapi.md#refund)

Defined in: [src/polkabtc-api.ts:57](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L57)

___

### relayer

• `Readonly` **relayer**: [*StakedRelayerClient*](/classes/stakedrelayerclient.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[relayer](/interfaces/polkabtcapi.md#relayer)

Defined in: [src/polkabtc-api.ts:59](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L59)

___

### replace

• `Readonly` **replace**: [*ReplaceAPI*](/interfaces/replaceapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[replace](/interfaces/polkabtcapi.md#replace)

Defined in: [src/polkabtc-api.ts:67](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L67)

___

### stakedRelayer

• `Readonly` **stakedRelayer**: [*StakedRelayerAPI*](/interfaces/stakedrelayerapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[stakedRelayer](/interfaces/polkabtcapi.md#stakedrelayer)

Defined in: [src/polkabtc-api.ts:58](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L58)

___

### system

• `Readonly` **system**: [*SystemAPI*](/interfaces/systemapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[system](/interfaces/polkabtcapi.md#system)

Defined in: [src/polkabtc-api.ts:66](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L66)

___

### treasury

• `Readonly` **treasury**: [*TreasuryAPI*](/interfaces/treasuryapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[treasury](/interfaces/polkabtcapi.md#treasury)

Defined in: [src/polkabtc-api.ts:65](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L65)

___

### vaults

• `Readonly` **vaults**: [*VaultsAPI*](/interfaces/vaultsapi.md)

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[vaults](/interfaces/polkabtcapi.md#vaults)

Defined in: [src/polkabtc-api.ts:54](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L54)

## Accessors

### account

• get **account**(): *undefined* \| *string* \| IKeyringPair \| *AccountId* \| *Address*

**Returns:** *undefined* \| *string* \| IKeyringPair \| *AccountId* \| *Address*

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md).[account](/interfaces/polkabtcapi.md#account)

Defined in: [src/polkabtc-api.ts:100](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L100)

## Methods

### setAccount

▸ **setAccount**(`account`: AddressOrPair, `signer?`: Signer): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`account` | AddressOrPair |
`signer?` | Signer |

**Returns:** *void*

Implementation of: [PolkaBTCAPI](/interfaces/polkabtcapi.md)

Defined in: [src/polkabtc-api.ts:87](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L87)
