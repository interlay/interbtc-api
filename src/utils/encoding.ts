import { AccountId, H256 } from "@polkadot/types/interfaces";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import type { Struct } from "@polkadot/types";
import { Network } from "bitcoinjs-lib";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";
import { Codec } from "@polkadot/types/types";
import { BitcoinUnit, Currency } from "@interlay/monetary-js";
import { Moment } from "@polkadot/types/interfaces";
import { Option } from "@polkadot/types/codec";
import { Bytes } from "@polkadot/types-codec";
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

import { encodeBtcAddress, FIXEDI128_SCALING_FACTOR } from ".";
import { SystemVaultExt } from "../types/vault";
import { Issue, IssueStatus, Redeem, RedeemStatus, RefundRequestExt, ReplaceRequestExt } from "../types/requestTypes";
import { SignedFixedPoint, UnsignedFixedPoint } from "../interfaces";
import {
    CollateralCurrency,
    CollateralIdLiteral,
    CollateralUnit,
    CurrencyIdLiteral,
    currencyIdToLiteral,
    currencyIdToMonetaryCurrency,
    tickerToCurrencyIdLiteral,
    WrappedCurrency,
    WrappedIdLiteral,
} from "../types";
import { newMonetaryAmount } from "../utils";
import { VaultsAPI } from "../parachain";

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

export function parseSystemVault(
    vault: VaultRegistrySystemVault,
    wrappedCurrency: WrappedCurrency,
    collateralCurrency: CollateralCurrency
): SystemVaultExt<BitcoinUnit> {
    return {
        toBeIssuedTokens: newMonetaryAmount(vault.toBeIssuedTokens.toString(), wrappedCurrency),
        issuedTokens: newMonetaryAmount(vault.issuedTokens.toString(), wrappedCurrency),
        toBeRedeemedTokens: newMonetaryAmount(vault.toBeRedeemedTokens.toString(), wrappedCurrency),
        collateral: newMonetaryAmount(vault.collateral.toString(), collateralCurrency as Currency<CollateralUnit>),
        currencyPair: {
            collateralCurrency: currencyIdToMonetaryCurrency(vault.currencyPair.collateral),
            wrappedCurrency: currencyIdToMonetaryCurrency(vault.currencyPair.wrapped),
        },
    };
}

export function newAccountId(api: ApiPromise, accountId: string): AccountId {
    return api.createType("AccountId", accountId);
}

export function newVaultId(
    api: ApiPromise,
    accountId: string,
    collateralCurrency: CollateralCurrency,
    wrappedCurrency: WrappedCurrency
): InterbtcPrimitivesVaultId {
    const parsedAccountId = newAccountId(api, accountId);
    const vaultCurrencyPair = newVaultCurrencyPair(api, collateralCurrency, wrappedCurrency);
    return api.createType("InterbtcPrimitivesVaultId", { account_id: parsedAccountId, currencies: vaultCurrencyPair });
}

export function newVaultCurrencyPair(
    api: ApiPromise,
    collateralCurrency: CollateralCurrency,
    wrappedCurrency: WrappedCurrency
): InterbtcPrimitivesVaultCurrencyPair {
    const collateralCurrencyIdLiteral = tickerToCurrencyIdLiteral(collateralCurrency.ticker);
    const wrappedCurrencyIdLiteral = tickerToCurrencyIdLiteral(wrappedCurrency.ticker);
    const collateralCurrencyId = newCurrencyId(api, collateralCurrencyIdLiteral);
    const wrappedCurrencyId = newCurrencyId(api, wrappedCurrencyIdLiteral);
    return api.createType("InterbtcPrimitivesVaultCurrencyPair", {
        collateral: collateralCurrencyId,
        wrapped: wrappedCurrencyId,
    });
}

export function newCurrencyId(api: ApiPromise, currency: CurrencyIdLiteral): InterbtcPrimitivesCurrencyId {
    return api.createType("InterbtcPrimitivesCurrencyId", { token: currency });
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
    vaultsAPI: VaultsAPI,
    req: InterbtcPrimitivesReplaceReplaceRequest,
    network: Network,
    wrappedCurrency: WrappedCurrency,
    id: H256 | string
): Promise<ReplaceRequestExt> {
    const currencyIdLiteral = currencyIdToLiteral(req.oldVault.currencies.collateral);
    const oldVault = await vaultsAPI.get(req.oldVault.accountId, currencyIdLiteral);
    const collateralCurrency = currencyIdToMonetaryCurrency(
        oldVault.id.currencies.collateral
    ) as Currency<CollateralUnit>;
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
    req: InterbtcPrimitivesIssueIssueRequest,
    network: Network,
    id: H256 | string
): Promise<Issue> {
    const status = req.status.isCompleted
        ? IssueStatus.Completed
        : req.status.isCancelled
        ? IssueStatus.Cancelled
        : IssueStatus.PendingWithBtcTxNotFound;
    const collateralCurrency = currencyIdToMonetaryCurrency(
        req.vault.currencies.collateral
    ) as Currency<CollateralUnit>;
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

    const currencyIdLiteral = currencyIdToLiteral(req.vault.currencies.collateral);
    const vault = await vaultsAPI.get(req.vault.accountId, currencyIdLiteral);
    const collateralCurrency = currencyIdToMonetaryCurrency(vault.id.currencies.collateral) as Currency<CollateralUnit>;
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

export function encodeVaultId(id: InterbtcPrimitivesVaultId): string {
    const wrappedIdLiteral = currencyIdToLiteral(id.currencies.wrapped) as WrappedIdLiteral;
    const collateralIdLiteral = currencyIdToLiteral(id.currencies.collateral) as CollateralIdLiteral;
    return `${id.accountId.toString()}-${wrappedIdLiteral}-${collateralIdLiteral}`;
}

export function decodeVaultId(api: ApiPromise, id: string): InterbtcPrimitivesVaultId {
    const vaultIdComponents = id.split("-");
    if (vaultIdComponents.length !== 3) {
        throw new Error("The vault id must be of type {accountId}-{wrappedCurrencyTicker}-{collateralCurrencyTicker}");
    }
    const [accountId, wrappedCurrencyIdLiteral, collateralCurrencyIdLiteral] = vaultIdComponents as [
        string,
        CurrencyIdLiteral,
        CurrencyIdLiteral
    ];
    const currenciesIdObject = Object.values(CurrencyIdLiteral);
    if (
        !currenciesIdObject.includes(wrappedCurrencyIdLiteral) ||
        !currenciesIdObject.includes(collateralCurrencyIdLiteral)
    ) {
        throw new Error("Invalid ticker currency in vault id");
    }
    return newVaultId(
        api,
        accountId,
        currencyIdToMonetaryCurrency(newCurrencyId(api, collateralCurrencyIdLiteral)) as CollateralCurrency,
        currencyIdToMonetaryCurrency(newCurrencyId(api, wrappedCurrencyIdLiteral)) as WrappedCurrency
    );
}

export function queryNominationsMap(
    map: Map<InterbtcPrimitivesVaultId, number>,
    vaultId: InterbtcPrimitivesVaultId
): number | undefined {
    for (const [entryVaultId, entryNonce] of map.entries()) {
        if (encodeVaultId(entryVaultId) === encodeVaultId(vaultId)) {
            return entryNonce;
        }
    }
    return undefined;
}

export function getSS58Prefix(api: ApiPromise): number {
    return Number(api.registry.chainSS58?.toString());
}
