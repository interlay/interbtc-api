[@interlay/interbtc-api](../README.md) / [Exports](../modules.md) / Issue

# Interface: Issue

## Table of contents

### Properties

- [bridgeFee](Issue.md#bridgefee)
- [btcAmountSubmittedByUser](Issue.md#btcamountsubmittedbyuser)
- [btcBlockHeight](Issue.md#btcblockheight)
- [btcConfirmationActiveBlockHeight](Issue.md#btcconfirmationactiveblockheight)
- [btcTxId](Issue.md#btctxid)
- [confirmations](Issue.md#confirmations)
- [creationBlock](Issue.md#creationblock)
- [creationTimestamp](Issue.md#creationtimestamp)
- [executedAmountWrapped](Issue.md#executedamountwrapped)
- [griefingCollateral](Issue.md#griefingcollateral)
- [id](Issue.md#id)
- [period](Issue.md#period)
- [refundAmountWrapped](Issue.md#refundamountwrapped)
- [refundBtcAddress](Issue.md#refundbtcaddress)
- [status](Issue.md#status)
- [userParachainAddress](Issue.md#userparachainaddress)
- [vaultId](Issue.md#vaultid)
- [vaultWalletPubkey](Issue.md#vaultwalletpubkey)
- [vaultWrappedAddress](Issue.md#vaultwrappedaddress)
- [wrappedAmount](Issue.md#wrappedamount)

## Properties

### <a id="bridgefee" name="bridgefee"></a> bridgeFee

• **bridgeFee**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/requestTypes.ts:10](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L10)

___

### <a id="btcamountsubmittedbyuser" name="btcamountsubmittedbyuser"></a> btcAmountSubmittedByUser

• `Optional` **btcAmountSubmittedByUser**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/requestTypes.ts:21](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L21)

___

### <a id="btcblockheight" name="btcblockheight"></a> btcBlockHeight

• `Optional` **btcBlockHeight**: `number`

#### Defined in

[src/types/requestTypes.ts:19](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L19)

___

### <a id="btcconfirmationactiveblockheight" name="btcconfirmationactiveblockheight"></a> btcConfirmationActiveBlockHeight

• `Optional` **btcConfirmationActiveBlockHeight**: `number`

#### Defined in

[src/types/requestTypes.ts:20](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L20)

___

### <a id="btctxid" name="btctxid"></a> btcTxId

• `Optional` **btcTxId**: `string`

#### Defined in

[src/types/requestTypes.ts:17](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L17)

___

### <a id="confirmations" name="confirmations"></a> confirmations

• `Optional` **confirmations**: `number`

#### Defined in

[src/types/requestTypes.ts:18](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L18)

___

### <a id="creationblock" name="creationblock"></a> creationBlock

• **creationBlock**: `number`

#### Defined in

[src/types/requestTypes.ts:13](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L13)

___

### <a id="creationtimestamp" name="creationtimestamp"></a> creationTimestamp

• `Optional` **creationTimestamp**: `number`

#### Defined in

[src/types/requestTypes.ts:14](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L14)

___

### <a id="executedamountwrapped" name="executedamountwrapped"></a> executedAmountWrapped

• `Optional` **executedAmountWrapped**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/requestTypes.ts:25](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L25)

___

### <a id="griefingcollateral" name="griefingcollateral"></a> griefingCollateral

• **griefingCollateral**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/requestTypes.ts:11](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L11)

___

### <a id="id" name="id"></a> id

• **id**: `string`

#### Defined in

[src/types/requestTypes.ts:7](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L7)

___

### <a id="period" name="period"></a> period

• **period**: `number`

#### Defined in

[src/types/requestTypes.ts:26](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L26)

___

### <a id="refundamountwrapped" name="refundamountwrapped"></a> refundAmountWrapped

• `Optional` **refundAmountWrapped**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/requestTypes.ts:24](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L24)

___

### <a id="refundbtcaddress" name="refundbtcaddress"></a> refundBtcAddress

• `Optional` **refundBtcAddress**: `string`

#### Defined in

[src/types/requestTypes.ts:23](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L23)

___

### <a id="status" name="status"></a> status

• **status**: [`IssueStatus`](../enums/IssueStatus.md)

#### Defined in

[src/types/requestTypes.ts:22](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L22)

___

### <a id="userparachainaddress" name="userparachainaddress"></a> userParachainAddress

• **userParachainAddress**: `string`

#### Defined in

[src/types/requestTypes.ts:9](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L9)

___

### <a id="vaultid" name="vaultid"></a> vaultId

• **vaultId**: [`InterbtcPrimitivesVaultId`](InterbtcPrimitivesVaultId.md)

#### Defined in

[src/types/requestTypes.ts:16](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L16)

___

### <a id="vaultwalletpubkey" name="vaultwalletpubkey"></a> vaultWalletPubkey

• **vaultWalletPubkey**: `string`

#### Defined in

[src/types/requestTypes.ts:12](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L12)

___

### <a id="vaultwrappedaddress" name="vaultwrappedaddress"></a> vaultWrappedAddress

• **vaultWrappedAddress**: `string`

#### Defined in

[src/types/requestTypes.ts:15](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L15)

___

### <a id="wrappedamount" name="wrappedamount"></a> wrappedAmount

• **wrappedAmount**: `MonetaryAmount`\<`Currency`\>

#### Defined in

[src/types/requestTypes.ts:8](https://github.com/interlay/interbtc-api/blob/1c0379f56248ac2da57930d5704199f69f941aa8/src/types/requestTypes.ts#L8)
