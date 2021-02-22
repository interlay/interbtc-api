[@interlay/polkabtc](/README.md) / [Exports](/modules.md) / PolkaBTCAPI

# Interface: PolkaBTCAPI

## Implemented by

* [*DefaultPolkaBTCAPI*](/classes/defaultpolkabtcapi.md)

## Table of contents

### Properties

- [account](/interfaces/polkabtcapi.md#account)
- [api](/interfaces/polkabtcapi.md#api)
- [btcCore](/interfaces/polkabtcapi.md#btccore)
- [btcRelay](/interfaces/polkabtcapi.md#btcrelay)
- [collateral](/interfaces/polkabtcapi.md#collateral)
- [faucet](/interfaces/polkabtcapi.md#faucet)
- [issue](/interfaces/polkabtcapi.md#issue)
- [oracle](/interfaces/polkabtcapi.md#oracle)
- [redeem](/interfaces/polkabtcapi.md#redeem)
- [refund](/interfaces/polkabtcapi.md#refund)
- [relayer](/interfaces/polkabtcapi.md#relayer)
- [replace](/interfaces/polkabtcapi.md#replace)
- [stakedRelayer](/interfaces/polkabtcapi.md#stakedrelayer)
- [system](/interfaces/polkabtcapi.md#system)
- [treasury](/interfaces/polkabtcapi.md#treasury)
- [vaults](/interfaces/polkabtcapi.md#vaults)

### Methods

- [setAccount](/interfaces/polkabtcapi.md#setaccount)

## Properties

### account

• `Readonly` **account**: *undefined* \| *string* \| IKeyringPair \| *AccountId* \| *Address*

Defined in: [src/polkabtc-api.ts:50](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L50)

___

### api

• `Readonly` **api**: *ApiPromise*

Defined in: [src/polkabtc-api.ts:34](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L34)

___

### btcCore

• `Readonly` **btcCore**: [*BTCCoreAPI*](/interfaces/btccoreapi.md)

Defined in: [src/polkabtc-api.ts:43](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L43)

___

### btcRelay

• `Readonly` **btcRelay**: [*BTCRelayAPI*](/interfaces/btcrelayapi.md)

Defined in: [src/polkabtc-api.ts:44](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L44)

___

### collateral

• `Readonly` **collateral**: [*CollateralAPI*](/interfaces/collateralapi.md)

Defined in: [src/polkabtc-api.ts:45](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L45)

___

### faucet

• `Readonly` **faucet**: [*FaucetClient*](/classes/faucetclient.md)

Defined in: [src/polkabtc-api.ts:41](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L41)

___

### issue

• `Readonly` **issue**: [*IssueAPI*](/interfaces/issueapi.md)

Defined in: [src/polkabtc-api.ts:36](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L36)

___

### oracle

• `Readonly` **oracle**: [*OracleAPI*](/interfaces/oracleapi.md)

Defined in: [src/polkabtc-api.ts:42](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L42)

___

### redeem

• `Readonly` **redeem**: [*RedeemAPI*](/interfaces/redeemapi.md)

Defined in: [src/polkabtc-api.ts:37](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L37)

___

### refund

• `Readonly` **refund**: [*RefundAPI*](/interfaces/refundapi.md)

Defined in: [src/polkabtc-api.ts:38](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L38)

___

### relayer

• `Readonly` **relayer**: [*StakedRelayerClient*](/classes/stakedrelayerclient.md)

Defined in: [src/polkabtc-api.ts:40](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L40)

___

### replace

• `Readonly` **replace**: [*ReplaceAPI*](/interfaces/replaceapi.md)

Defined in: [src/polkabtc-api.ts:48](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L48)

___

### stakedRelayer

• `Readonly` **stakedRelayer**: [*StakedRelayerAPI*](/interfaces/stakedrelayerapi.md)

Defined in: [src/polkabtc-api.ts:39](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L39)

___

### system

• `Readonly` **system**: [*SystemAPI*](/interfaces/systemapi.md)

Defined in: [src/polkabtc-api.ts:47](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L47)

___

### treasury

• `Readonly` **treasury**: [*TreasuryAPI*](/interfaces/treasuryapi.md)

Defined in: [src/polkabtc-api.ts:46](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L46)

___

### vaults

• `Readonly` **vaults**: [*VaultsAPI*](/interfaces/vaultsapi.md)

Defined in: [src/polkabtc-api.ts:35](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L35)

## Methods

### setAccount

▸ **setAccount**(`account`: AddressOrPair, `signer?`: Signer): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`account` | AddressOrPair |
`signer?` | Signer |

**Returns:** *void*

Defined in: [src/polkabtc-api.ts:49](https://github.com/interlay/polkabtc-js/blob/fec6fe3/src/polkabtc-api.ts#L49)
