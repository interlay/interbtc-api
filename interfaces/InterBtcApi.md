[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / InterBtcApi

# Interface: InterBtcApi

## Implemented by

- [`DefaultInterBtcApi`](../classes/DefaultInterBtcApi.md)

## Table of contents

### Properties

- [account](InterBtcApi.md#account)
- [amm](InterBtcApi.md#amm)
- [api](InterBtcApi.md#api)
- [assetRegistry](InterBtcApi.md#assetregistry)
- [btcRelay](InterBtcApi.md#btcrelay)
- [electrsAPI](InterBtcApi.md#electrsapi)
- [escrow](InterBtcApi.md#escrow)
- [faucet](InterBtcApi.md#faucet)
- [fee](InterBtcApi.md#fee)
- [issue](InterBtcApi.md#issue)
- [loans](InterBtcApi.md#loans)
- [nomination](InterBtcApi.md#nomination)
- [oracle](InterBtcApi.md#oracle)
- [redeem](InterBtcApi.md#redeem)
- [replace](InterBtcApi.md#replace)
- [rewards](InterBtcApi.md#rewards)
- [system](InterBtcApi.md#system)
- [tokens](InterBtcApi.md#tokens)
- [transaction](InterBtcApi.md#transaction)
- [vaults](InterBtcApi.md#vaults)

### Methods

- [disconnect](InterBtcApi.md#disconnect)
- [getGovernanceCurrency](InterBtcApi.md#getgovernancecurrency)
- [getRelayChainCurrency](InterBtcApi.md#getrelaychaincurrency)
- [getWrappedCurrency](InterBtcApi.md#getwrappedcurrency)
- [removeAccount](InterBtcApi.md#removeaccount)
- [setAccount](InterBtcApi.md#setaccount)

## Properties

### <a id="account" name="account"></a> account

• `Readonly` **account**: `undefined` \| `AddressOrPair`

#### Defined in

[src/interbtc-api.ts:65](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L65)

___

### <a id="amm" name="amm"></a> amm

• `Readonly` **amm**: [`AMMAPI`](AMMAPI.md)

#### Defined in

[src/interbtc-api.ts:61](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L61)

___

### <a id="api" name="api"></a> api

• `Readonly` **api**: `ApiPromise`

#### Defined in

[src/interbtc-api.ts:44](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L44)

___

### <a id="assetregistry" name="assetregistry"></a> assetRegistry

• `Readonly` **assetRegistry**: [`AssetRegistryAPI`](AssetRegistryAPI.md)

#### Defined in

[src/interbtc-api.ts:59](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L59)

___

### <a id="btcrelay" name="btcrelay"></a> btcRelay

• `Readonly` **btcRelay**: [`BTCRelayAPI`](BTCRelayAPI.md)

#### Defined in

[src/interbtc-api.ts:51](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L51)

___

### <a id="electrsapi" name="electrsapi"></a> electrsAPI

• `Readonly` **electrsAPI**: [`ElectrsAPI`](ElectrsAPI.md)

#### Defined in

[src/interbtc-api.ts:50](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L50)

___

### <a id="escrow" name="escrow"></a> escrow

• `Readonly` **escrow**: [`EscrowAPI`](EscrowAPI.md)

#### Defined in

[src/interbtc-api.ts:58](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L58)

___

### <a id="faucet" name="faucet"></a> faucet

• `Readonly` **faucet**: [`FaucetClient`](../classes/FaucetClient.md)

#### Defined in

[src/interbtc-api.ts:48](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L48)

___

### <a id="fee" name="fee"></a> fee

• `Readonly` **fee**: [`FeeAPI`](FeeAPI.md)

#### Defined in

[src/interbtc-api.ts:55](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L55)

___

### <a id="issue" name="issue"></a> issue

• `Readonly` **issue**: [`IssueAPI`](IssueAPI.md)

#### Defined in

[src/interbtc-api.ts:46](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L46)

___

### <a id="loans" name="loans"></a> loans

• `Readonly` **loans**: [`LoansAPI`](LoansAPI.md)

#### Defined in

[src/interbtc-api.ts:60](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L60)

___

### <a id="nomination" name="nomination"></a> nomination

• `Readonly` **nomination**: [`NominationAPI`](NominationAPI.md)

#### Defined in

[src/interbtc-api.ts:56](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L56)

___

### <a id="oracle" name="oracle"></a> oracle

• `Readonly` **oracle**: [`OracleAPI`](OracleAPI.md)

#### Defined in

[src/interbtc-api.ts:49](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L49)

___

### <a id="redeem" name="redeem"></a> redeem

• `Readonly` **redeem**: [`RedeemAPI`](RedeemAPI.md)

#### Defined in

[src/interbtc-api.ts:47](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L47)

___

### <a id="replace" name="replace"></a> replace

• `Readonly` **replace**: [`ReplaceAPI`](ReplaceAPI.md)

#### Defined in

[src/interbtc-api.ts:54](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L54)

___

### <a id="rewards" name="rewards"></a> rewards

• `Readonly` **rewards**: [`RewardsAPI`](RewardsAPI.md)

#### Defined in

[src/interbtc-api.ts:57](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L57)

___

### <a id="system" name="system"></a> system

• `Readonly` **system**: [`SystemAPI`](SystemAPI.md)

#### Defined in

[src/interbtc-api.ts:53](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L53)

___

### <a id="tokens" name="tokens"></a> tokens

• `Readonly` **tokens**: [`TokensAPI`](TokensAPI.md)

#### Defined in

[src/interbtc-api.ts:52](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L52)

___

### <a id="transaction" name="transaction"></a> transaction

• `Readonly` **transaction**: [`TransactionAPI`](TransactionAPI.md)

#### Defined in

[src/interbtc-api.ts:62](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L62)

___

### <a id="vaults" name="vaults"></a> vaults

• `Readonly` **vaults**: [`VaultsAPI`](VaultsAPI.md)

#### Defined in

[src/interbtc-api.ts:45](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L45)

## Methods

### <a id="disconnect" name="disconnect"></a> disconnect

▸ **disconnect**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/interbtc-api.ts:69](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L69)

___

### <a id="getgovernancecurrency" name="getgovernancecurrency"></a> getGovernanceCurrency

▸ **getGovernanceCurrency**(): `Currency`

#### Returns

`Currency`

#### Defined in

[src/interbtc-api.ts:66](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L66)

___

### <a id="getrelaychaincurrency" name="getrelaychaincurrency"></a> getRelayChainCurrency

▸ **getRelayChainCurrency**(): `Currency`

#### Returns

`Currency`

#### Defined in

[src/interbtc-api.ts:68](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L68)

___

### <a id="getwrappedcurrency" name="getwrappedcurrency"></a> getWrappedCurrency

▸ **getWrappedCurrency**(): `Currency`

#### Returns

`Currency`

#### Defined in

[src/interbtc-api.ts:67](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L67)

___

### <a id="removeaccount" name="removeaccount"></a> removeAccount

▸ **removeAccount**(): `void`

#### Returns

`void`

#### Defined in

[src/interbtc-api.ts:64](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L64)

___

### <a id="setaccount" name="setaccount"></a> setAccount

▸ **setAccount**(`account`, `signer?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | `AddressOrPair` |
| `signer?` | `Signer` |

#### Returns

`void`

#### Defined in

[src/interbtc-api.ts:63](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L63)
