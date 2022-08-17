import { AccountId, H256 } from "@polkadot/types/interfaces";
import Big, { BigSource } from "big.js";
import { ApiPromise } from "@polkadot/api";
import type { Struct } from "@polkadot/types";
import { Network } from "bitcoinjs-lib";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";
import { Codec } from "@polkadot/types/types";
import { Moment } from "@polkadot/types/interfaces";
import { Option } from "@polkadot/types/codec";
import { Bytes } from "@polkadot/types-codec";
import { u32 } from "@polkadot/types";
import {
    InterbtcPrimitivesRedeemRedeemRequest,
    InterbtcPrimitivesReplaceReplaceRequest,
    InterbtcPrimitivesRefundRefundRequest,
    InterbtcPrimitivesIssueIssueRequest,
    BitcoinAddress,
    VaultRegistrySystemVault,
    InterbtcPrimitivesVaultId,
    InterbtcPrimitivesVaultCurrencyPair,
    InterbtcPrimitivesCurrencyId,
} from "@polkadot/types/lookup";

import { currencyIdToMonetaryCurrency, encodeBtcAddress, FIXEDI128_SCALING_FACTOR, isForeignAsset } from ".";
import { SystemVaultExt } from "../types/vault";
import { Issue, IssueStatus, Redeem, RedeemStatus, RefundRequestExt, ReplaceRequestExt } from "../types/requestTypes";
import { BalanceWrapper, SignedFixedPoint, UnsignedFixedPoint, VaultId } from "../interfaces";
import { CollateralCurrencyExt, CurrencyExt, WrappedCurrency } from "../types";
import { newMonetaryAmount } from "../utils";
import { AssetRegistryAPI, VaultsAPI } from "../parachain";

/**
 * Converts endianness of a Uint8Array
 * @param bytes Uint8Array, to be converted LE<>BE
 */
export function reverseEndianness(bytes: Uint8Array): Uint8Array {
    let offset = bytes.length;
    for (let index = 0; index < bytes.length; index += bytes.length) {
        offset--;
        for (let x = 0; x < offset; x++) {
            const b = bytes[index + x];
            bytes[index + x] = bytes[index + offset];
            bytes[index + offset] = b;
            offset--;
        }
    }
    return bytes;
}

function isHexPrefixed(str: string): boolean {
    return str.slice(0, 2) === "0x";
}

/**
 * Remove the `0x` hex prefix if present
 * @param str
 */
export function stripHexPrefix(str: string): string {
    return isHexPrefixed(str) ? str.slice(2) : str;
}

/**
 * Ensure the `0x` hex prefix is present
 * @param str
 **/
export function addHexPrefix(str: string): string {
    return isHexPrefixed(str) ? str : "0x" + str;
}

/**
 * Ensure a hash value is an encoded H256
 * @param api The polkadot API promise used to encode if necessary
 * @param hash The either H256 or string encoded hash
 **/
export function ensureHashEncoded(api: ApiPromise, hash: H256 | string): H256 {
    if (typeof hash === "string") {
        return api.createType("H256", addHexPrefix(hash as string));
    } else {
        return hash as H256;
    }
}

/**
 * Reverse the endianness of the given hex string
 * @dev Will remove `0x` prefix if present
 * @param hex
 */
export function reverseEndiannessHex(hex: string): string {
    const arr = stripHexPrefix(hex).match(/.{1,2}/g) || [];
    const bytes = new Uint8Array(arr.map((byte) => parseInt(byte, 16)));
    return reverseEndianness(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

/**
 * Converts a Uint8Array to string
 * @dev Will remove `0x` prefix if present
 * @param bytes
 */
export function uint8ArrayToString(bytes: Uint8Array): string {
    return stripHexPrefix(bytes.toString()).split("").join("");
}

export function decodeFixedPointType(x: SignedFixedPoint | UnsignedFixedPoint): Big {
    const xBig = new Big(x.toString());
    const scalingFactor = new Big(Math.pow(10, FIXEDI128_SCALING_FACTOR));
    return xBig.div(scalingFactor);
}

/**
 * Convert Bytes to a string. Will remove `0x` prefix if present.
 * @param bytes Bytes to decode
 * @returns the decoded string
 */
export function decodeBytesAsString(bytes: Bytes): string {
    return Buffer.from(stripHexPrefix(bytes.toString()), "hex").toString();
}

export function encodeUnsignedFixedPoint(api: ApiPromise, x: Big): UnsignedFixedPoint {
    const scalingFactor = new Big(Math.pow(10, FIXEDI128_SCALING_FACTOR));
    // If there are any decimals left after scaling up by the scaling factor,
    // the resulting FixedU128 will be wrong. As such, trim any decimals.
    const xScaled = x.mul(scalingFactor).round(0, 0);
    return api.createType("FixedU128", xScaled.toFixed());
}

export function storageKeyToNthInner<T extends Codec>(s: StorageKey<T[]>, n = 0): T {
    return s.args[n];
}

export interface DecodedRequest extends Struct {
    readonly btc_address: BitcoinAddress;
}

export interface DecodedRequestExt extends Omit<DecodedRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export async function parseSystemVault(
    assetRegistryApi: AssetRegistryAPI,
    vault: VaultRegistrySystemVault,
    wrappedCurrency: WrappedCurrency,
    collateralCurrency: CollateralCurrencyExt
): Promise<SystemVaultExt> {
    return {
        toBeIssuedTokens: newMonetaryAmount(vault.toBeIssuedTokens.toString(), wrappedCurrency),
        issuedTokens: newMonetaryAmount(vault.issuedTokens.toString(), wrappedCurrency),
        toBeRedeemedTokens: newMonetaryAmount(vault.toBeRedeemedTokens.toString(), wrappedCurrency),
        collateral: newMonetaryAmount(vault.collateral.toString(), collateralCurrency),
        currencyPair: {
            collateralCurrency: await currencyIdToMonetaryCurrency(assetRegistryApi, vault.currencyPair.collateral),
            wrappedCurrency: await currencyIdToMonetaryCurrency(assetRegistryApi, vault.currencyPair.wrapped),
        },
    };
}

export function newAccountId(api: ApiPromise, accountId: string): AccountId {
    return api.createType("AccountId", accountId);
}

export function newVaultId(
    api: ApiPromise,
    accountId: string,
    collateralCurrency: CollateralCurrencyExt,
    wrappedCurrency: WrappedCurrency
): InterbtcPrimitivesVaultId {
    const parsedAccountId = newAccountId(api, accountId);
    const vaultCurrencyPair = newVaultCurrencyPair(api, collateralCurrency, wrappedCurrency);
    return api.createType("InterbtcPrimitivesVaultId", { account_id: parsedAccountId, currencies: vaultCurrencyPair });
}

export async function decodeRpcVaultId(
    api: ApiPromise,
    assetRegistry: AssetRegistryAPI,
    vaultId: VaultId
): Promise<InterbtcPrimitivesVaultId> {
        const [collateralCcy, wrappedCcy] = await Promise.all([
            currencyIdToMonetaryCurrency(assetRegistry, vaultId.currencies.collateral),
            currencyIdToMonetaryCurrency(assetRegistry, vaultId.currencies.wrapped),
        ]);

        return newVaultId(
            api,
            vaultId.account_id.toString(),
            collateralCcy,
            wrappedCcy
        );
}

export function newVaultCurrencyPair(
    api: ApiPromise,
    collateralCurrency: CollateralCurrencyExt,
    wrappedCurrency: WrappedCurrency
): InterbtcPrimitivesVaultCurrencyPair {
    const collateralCurrencyId = newCurrencyId(api, collateralCurrency);
    const wrappedCurrencyId = newCurrencyId(api, wrappedCurrency);
    return api.createType("InterbtcPrimitivesVaultCurrencyPair", {
        collateral: collateralCurrencyId,
        wrapped: wrappedCurrencyId,
    });
}

export function newCurrencyId(api: ApiPromise, currency: CurrencyExt): InterbtcPrimitivesCurrencyId {
    const identifier = isForeignAsset(currency) ? { foreignAsset: currency.id } : { token: currency.ticker };
    return api.createType("InterbtcPrimitivesCurrencyId", identifier);
}

export function newForeignAssetId(api: ApiPromise, id: number): u32 {
    return api.createType("u32", id);
}

export function newBalanceWrapper(api: ApiPromise, atomicAmount: BigSource): BalanceWrapper {
    return api.createType("BalanceWrapper", {
        amount: api.createType("Text", Big(atomicAmount).toString()),
    });
}

export function parseRefundRequest(
    req: InterbtcPrimitivesRefundRefundRequest,
    network: Network,
    wrappedCurrency: WrappedCurrency
): RefundRequestExt {
    return {
        vaultId: req.vault,
        amountIssuing: newMonetaryAmount(req.amountBtc.toString(), wrappedCurrency),
        fee: newMonetaryAmount(req.fee.toString(), wrappedCurrency),
        amountBtc: newMonetaryAmount(req.amountBtc.toString(), wrappedCurrency),
        issuer: req.issuer,
        btcAddress: encodeBtcAddress(req.btcAddress, network),
        issueId: stripHexPrefix(req.issueId.toString()),
        completed: req.completed.isTrue,
    };
}

export async function parseReplaceRequest(
    assetRegistry: AssetRegistryAPI,
    req: InterbtcPrimitivesReplaceReplaceRequest,
    network: Network,
    wrappedCurrency: WrappedCurrency,
    id: H256 | string
): Promise<ReplaceRequestExt> {
    const collateralCurrency = await currencyIdToMonetaryCurrency(assetRegistry, req.oldVault.currencies.collateral);
    return {
        id: stripHexPrefix(id.toString()),
        btcAddress: encodeBtcAddress(req.btcAddress, network),
        newVault: req.newVault,
        oldVault: req.oldVault,
        amount: newMonetaryAmount(req.amount.toString(), wrappedCurrency),
        griefingCollateral: newMonetaryAmount(req.griefingCollateral.toString(), collateralCurrency),
        collateral: newMonetaryAmount(req.collateral.toString(), collateralCurrency),
        acceptTime: req.acceptTime.toNumber(),
        period: req.period.toNumber(),
        btcHeight: req.btcHeight.toNumber(),
        status: req.status,
    };
}

export async function parseIssueRequest(
    vaultsAPI: VaultsAPI,
    assetRegistry: AssetRegistryAPI,
    req: InterbtcPrimitivesIssueIssueRequest,
    network: Network,
    id: H256 | string
): Promise<Issue> {
    const status = req.status.isCompleted
        ? IssueStatus.Completed
        : req.status.isCancelled
        ? IssueStatus.Cancelled
        : IssueStatus.PendingWithBtcTxNotFound;
    const collateralCurrency = await currencyIdToMonetaryCurrency(assetRegistry, req.vault.currencies.collateral);
    return {
        id: stripHexPrefix(id.toString()),
        creationBlock: req.opentime.toNumber(),
        vaultWrappedAddress: encodeBtcAddress(req.btcAddress, network),
        vaultId: req.vault,
        userParachainAddress: req.requester.toString(),
        vaultWalletPubkey: req.btcPublicKey.toString(),
        bridgeFee: newMonetaryAmount(req.fee.toString(), vaultsAPI.getWrappedCurrency()),
        wrappedAmount: newMonetaryAmount(req.amount.toString(), vaultsAPI.getWrappedCurrency()),
        griefingCollateral: newMonetaryAmount(req.griefingCollateral.toString(), collateralCurrency),
        status,
        period: req.period.toNumber(),
    };
}

export async function parseRedeemRequest(
    vaultsAPI: VaultsAPI,
    assetRegistry: AssetRegistryAPI,
    req: InterbtcPrimitivesRedeemRedeemRequest,
    network: Network,
    id: H256 | string
): Promise<Redeem> {
    const status = req.status.isCompleted
        ? RedeemStatus.Completed
        : req.status.isRetried
        ? RedeemStatus.Retried
        : req.status.isReimbursed
        ? RedeemStatus.Reimbursed
        : RedeemStatus.PendingWithBtcTxNotFound;

    const collateralCurrency = await currencyIdToMonetaryCurrency(assetRegistry, req.vault.currencies.collateral);
    return {
        id: stripHexPrefix(id.toString()),
        userParachainAddress: req.redeemer.toString(),
        amountBTC: newMonetaryAmount(req.amountBtc.toString(), vaultsAPI.getWrappedCurrency()),
        collateralPremium: newMonetaryAmount(req.premium.toString(), collateralCurrency),
        bridgeFee: newMonetaryAmount(req.fee.toString(), vaultsAPI.getWrappedCurrency()),
        btcTransferFee: newMonetaryAmount(req.transferFeeBtc.toString(), vaultsAPI.getWrappedCurrency()),
        creationBlock: req.opentime.toNumber(),
        vaultId: req.vault,
        userBTCAddress: encodeBtcAddress(req.btcAddress, network),
        status,
        period: req.period.toNumber(),
    };
}

export function convertMoment(moment: Moment): Date {
    return new Date(moment.toNumber());
}

export function unwrapRawExchangeRate(option: Option<UnsignedFixedPoint>): UnsignedFixedPoint | undefined {
    return option.isSome ? (option.value as UnsignedFixedPoint) : undefined;
}

export async function encodeVaultId(assetRegistry: AssetRegistryAPI, id: InterbtcPrimitivesVaultId): Promise<string> {
    const wrappedCurrency = await currencyIdToMonetaryCurrency(assetRegistry, id.currencies.wrapped);
    const collateralCurrency = await currencyIdToMonetaryCurrency(assetRegistry, id.currencies.collateral);
    const wrappedId = isForeignAsset(wrappedCurrency) ? wrappedCurrency.id.toString() : wrappedCurrency.ticker;
    const collateralId = isForeignAsset(collateralCurrency)
        ? collateralCurrency.id.toString()
        : collateralCurrency.ticker;
    return `${id.accountId.toString()}-${wrappedId}-${collateralId}`;
}

export async function queryNominationsMap(
    assetRegistry: AssetRegistryAPI,
    map: Map<InterbtcPrimitivesVaultId, number>,
    vaultId: InterbtcPrimitivesVaultId
): Promise<number | undefined> {
    for (const [entryVaultId, entryNonce] of map.entries()) {
        if ((await encodeVaultId(assetRegistry, entryVaultId)) === (await encodeVaultId(assetRegistry, vaultId))) {
            return entryNonce;
        }
    }
    return undefined;
}

export function getSS58Prefix(api: ApiPromise): number {
    return Number(api.registry.chainSS58?.toString());
}
