[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / DefaultInterBtcApi

# Class: DefaultInterBtcApi

## Implements

- [`InterBtcApi`](../interfaces/InterBtcApi.md)

## Table of contents

### Constructors

- [constructor](DefaultInterBtcApi.md#constructor)

### Properties

- [amm](DefaultInterBtcApi.md#amm)
- [api](DefaultInterBtcApi.md#api)
- [assetRegistry](DefaultInterBtcApi.md#assetregistry)
- [btcRelay](DefaultInterBtcApi.md#btcrelay)
- [electrsAPI](DefaultInterBtcApi.md#electrsapi)
- [escrow](DefaultInterBtcApi.md#escrow)
- [faucet](DefaultInterBtcApi.md#faucet)
- [fee](DefaultInterBtcApi.md#fee)
- [issue](DefaultInterBtcApi.md#issue)
- [loans](DefaultInterBtcApi.md#loans)
- [nomination](DefaultInterBtcApi.md#nomination)
- [oracle](DefaultInterBtcApi.md#oracle)
- [redeem](DefaultInterBtcApi.md#redeem)
- [replace](DefaultInterBtcApi.md#replace)
- [rewards](DefaultInterBtcApi.md#rewards)
- [system](DefaultInterBtcApi.md#system)
- [tokens](DefaultInterBtcApi.md#tokens)
- [transaction](DefaultInterBtcApi.md#transaction)
- [vaults](DefaultInterBtcApi.md#vaults)

### Accessors

- [account](DefaultInterBtcApi.md#account)

### Methods

- [disconnect](DefaultInterBtcApi.md#disconnect)
- [getGovernanceCurrency](DefaultInterBtcApi.md#getgovernancecurrency)
- [getRelayChainCurrency](DefaultInterBtcApi.md#getrelaychaincurrency)
- [getWrappedCurrency](DefaultInterBtcApi.md#getwrappedcurrency)
- [removeAccount](DefaultInterBtcApi.md#removeaccount)
- [setAccount](DefaultInterBtcApi.md#setaccount)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new DefaultInterBtcApi**(`api`, `bitcoinNetwork?`, `_account?`, `esploraNetwork?`): [`DefaultInterBtcApi`](DefaultInterBtcApi.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `api` | `ApiPromise` | `undefined` |
| `bitcoinNetwork` | [`BitcoinNetwork`](../modules.md#bitcoinnetwork) | `"mainnet"` |
| `_account?` | `AddressOrPair` | `undefined` |
| `esploraNetwork?` | `string` | `undefined` |

#### Returns

[`DefaultInterBtcApi`](DefaultInterBtcApi.md)

#### Defined in

[src/interbtc-api.ts:95](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L95)

## Properties

### <a id="amm" name="amm"></a> amm

• `Readonly` **amm**: [`AMMAPI`](../interfaces/AMMAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[amm](../interfaces/InterBtcApi.md#amm)

#### Defined in

[src/interbtc-api.ts:92](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L92)

___

### <a id="api" name="api"></a> api

• `Readonly` **api**: `ApiPromise`

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[api](../interfaces/InterBtcApi.md#api)

#### Defined in

[src/interbtc-api.ts:96](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L96)

___

### <a id="assetregistry" name="assetregistry"></a> assetRegistry

• `Readonly` **assetRegistry**: [`AssetRegistryAPI`](../interfaces/AssetRegistryAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[assetRegistry](../interfaces/InterBtcApi.md#assetregistry)

#### Defined in

[src/interbtc-api.ts:90](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L90)

___

### <a id="btcrelay" name="btcrelay"></a> btcRelay

• `Readonly` **btcRelay**: [`BTCRelayAPI`](../interfaces/BTCRelayAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[btcRelay](../interfaces/InterBtcApi.md#btcrelay)

#### Defined in

[src/interbtc-api.ts:82](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L82)

___

### <a id="electrsapi" name="electrsapi"></a> electrsAPI

• `Readonly` **electrsAPI**: [`ElectrsAPI`](../interfaces/ElectrsAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[electrsAPI](../interfaces/InterBtcApi.md#electrsapi)

#### Defined in

[src/interbtc-api.ts:81](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L81)

___

### <a id="escrow" name="escrow"></a> escrow

• `Readonly` **escrow**: [`EscrowAPI`](../interfaces/EscrowAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[escrow](../interfaces/InterBtcApi.md#escrow)

#### Defined in

[src/interbtc-api.ts:89](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L89)

___

### <a id="faucet" name="faucet"></a> faucet

• `Readonly` **faucet**: [`FaucetClient`](FaucetClient.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[faucet](../interfaces/InterBtcApi.md#faucet)

#### Defined in

[src/interbtc-api.ts:79](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L79)

___

### <a id="fee" name="fee"></a> fee

• `Readonly` **fee**: [`FeeAPI`](../interfaces/FeeAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[fee](../interfaces/InterBtcApi.md#fee)

#### Defined in

[src/interbtc-api.ts:86](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L86)

___

### <a id="issue" name="issue"></a> issue

• `Readonly` **issue**: [`IssueAPI`](../interfaces/IssueAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[issue](../interfaces/InterBtcApi.md#issue)

#### Defined in

[src/interbtc-api.ts:77](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L77)

___

### <a id="loans" name="loans"></a> loans

• `Readonly` **loans**: [`LoansAPI`](../interfaces/LoansAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[loans](../interfaces/InterBtcApi.md#loans)

#### Defined in

[src/interbtc-api.ts:91](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L91)

___

### <a id="nomination" name="nomination"></a> nomination

• `Readonly` **nomination**: [`NominationAPI`](../interfaces/NominationAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[nomination](../interfaces/InterBtcApi.md#nomination)

#### Defined in

[src/interbtc-api.ts:87](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L87)

___

### <a id="oracle" name="oracle"></a> oracle

• `Readonly` **oracle**: [`OracleAPI`](../interfaces/OracleAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[oracle](../interfaces/InterBtcApi.md#oracle)

#### Defined in

[src/interbtc-api.ts:80](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L80)

___

### <a id="redeem" name="redeem"></a> redeem

• `Readonly` **redeem**: [`RedeemAPI`](../interfaces/RedeemAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[redeem](../interfaces/InterBtcApi.md#redeem)

#### Defined in

[src/interbtc-api.ts:78](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L78)

___

### <a id="replace" name="replace"></a> replace

• `Readonly` **replace**: [`ReplaceAPI`](../interfaces/ReplaceAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[replace](../interfaces/InterBtcApi.md#replace)

#### Defined in

[src/interbtc-api.ts:85](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L85)

___

### <a id="rewards" name="rewards"></a> rewards

• `Readonly` **rewards**: [`RewardsAPI`](../interfaces/RewardsAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[rewards](../interfaces/InterBtcApi.md#rewards)

#### Defined in

[src/interbtc-api.ts:88](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L88)

___

### <a id="system" name="system"></a> system

• `Readonly` **system**: [`SystemAPI`](../interfaces/SystemAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[system](../interfaces/InterBtcApi.md#system)

#### Defined in

[src/interbtc-api.ts:84](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L84)

___

### <a id="tokens" name="tokens"></a> tokens

• `Readonly` **tokens**: [`TokensAPI`](../interfaces/TokensAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[tokens](../interfaces/InterBtcApi.md#tokens)

#### Defined in

[src/interbtc-api.ts:83](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L83)

___

### <a id="transaction" name="transaction"></a> transaction

• `Readonly` **transaction**: [`TransactionAPI`](../interfaces/TransactionAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[transaction](../interfaces/InterBtcApi.md#transaction)

#### Defined in

[src/interbtc-api.ts:93](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L93)

___

### <a id="vaults" name="vaults"></a> vaults

• `Readonly` **vaults**: [`VaultsAPI`](../interfaces/VaultsAPI.md)

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[vaults](../interfaces/InterBtcApi.md#vaults)

#### Defined in

[src/interbtc-api.ts:76](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L76)

## Accessors

### <a id="account" name="account"></a> account

• `get` **account**(): `undefined` \| `AddressOrPair`

#### Returns

`undefined` \| `AddressOrPair`

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[account](../interfaces/InterBtcApi.md#account)

#### Defined in

[src/interbtc-api.ts:169](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L169)

## Methods

### <a id="disconnect" name="disconnect"></a> disconnect

▸ **disconnect**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[disconnect](../interfaces/InterBtcApi.md#disconnect)

#### Defined in

[src/interbtc-api.ts:191](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L191)

___

### <a id="getgovernancecurrency" name="getgovernancecurrency"></a> getGovernanceCurrency

▸ **getGovernanceCurrency**(): `Currency`

#### Returns

`Currency`

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[getGovernanceCurrency](../interfaces/InterBtcApi.md#getgovernancecurrency)

#### Defined in

[src/interbtc-api.ts:173](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L173)

___

### <a id="getrelaychaincurrency" name="getrelaychaincurrency"></a> getRelayChainCurrency

▸ **getRelayChainCurrency**(): `Currency`

#### Returns

`Currency`

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[getRelayChainCurrency](../interfaces/InterBtcApi.md#getrelaychaincurrency)

#### Defined in

[src/interbtc-api.ts:185](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L185)

___

### <a id="getwrappedcurrency" name="getwrappedcurrency"></a> getWrappedCurrency

▸ **getWrappedCurrency**(): `Currency`

#### Returns

`Currency`

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[getWrappedCurrency](../interfaces/InterBtcApi.md#getwrappedcurrency)

#### Defined in

[src/interbtc-api.ts:179](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L179)

___

### <a id="removeaccount" name="removeaccount"></a> removeAccount

▸ **removeAccount**(): `void`

#### Returns

`void`

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[removeAccount](../interfaces/InterBtcApi.md#removeaccount)

#### Defined in

[src/interbtc-api.ts:165](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L165)

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

#### Implementation of

[InterBtcApi](../interfaces/InterBtcApi.md).[setAccount](../interfaces/InterBtcApi.md#setaccount)

#### Defined in

[src/interbtc-api.ts:155](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/interbtc-api.ts#L155)
