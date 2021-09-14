import { AccountId, H256 } from "@polkadot/types/interfaces";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import type { Struct } from "@polkadot/types";
import { Network } from "bitcoinjs-lib";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";
import { Codec } from "@polkadot/types/types";
import { BitcoinUnit } from "@interlay/monetary-js";
import { Moment } from "@polkadot/types/interfaces";
import { Option } from "@polkadot/types/codec";

import { encodeBtcAddress, FIXEDI128_SCALING_FACTOR } from ".";
import { WalletExt, SystemVaultExt } from "../types/vault";
import { Issue, IssueStatus, Redeem, RedeemStatus, RefundRequestExt, ReplaceRequestExt } from "../types/requestTypes";
import {
    SignedFixedPoint,
    UnsignedFixedPoint,
    BtcAddress,
    SystemVault,
    Wallet,
    RefundRequest,
    ReplaceRequest,
    IssueRequest,
    RedeemRequest,
} from "../interfaces";
import { newMonetaryAmount, VaultsAPI, WrappedCurrency } from "..";

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
    readonly btc_address: BtcAddress;
}

export interface DecodedRequestExt extends Omit<DecodedRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function parseWallet(wallet: Wallet, network: Network): WalletExt {
    const { addresses, public_key } = wallet;

    const btcAddresses: Array<string> = [];
    for (const value of addresses.values()) {
        btcAddresses.push(encodeBtcAddress(value, network));
    }

    return {
        publicKey: public_key.toString(),
        addresses: btcAddresses,
    };
}

export function parseSystemVault(vault: SystemVault, wrappedCurrency: WrappedCurrency): SystemVaultExt<BitcoinUnit> {
    return {
        toBeIssuedTokens: newMonetaryAmount(vault.to_be_issued_tokens.toString(), wrappedCurrency),
        issuedTokens: newMonetaryAmount(vault.issued_tokens.toString(), wrappedCurrency),
        toBeRedeemedTokens: newMonetaryAmount(vault.to_be_redeemed_tokens.toString(), wrappedCurrency),
    };
}

export function newAccountId(api: ApiPromise, accountId: string): AccountId {
    return api.createType("AccountId", accountId);
}

export function parseRefundRequest(
    req: RefundRequest,
    network: Network,
    wrappedCurrency: WrappedCurrency
): RefundRequestExt {
    return {
        vaultId: req.vault,
        amountIssuing: newMonetaryAmount(req.amount_issuing.toString(), wrappedCurrency),
        fee: newMonetaryAmount(req.fee.toString(), wrappedCurrency),
        amountBtc: newMonetaryAmount(req.amount_btc.toString(), wrappedCurrency),
        issuer: req.issuer,
        btcAddress: encodeBtcAddress(req.btc_address, network),
        issueId: stripHexPrefix(req.issue_id.toString()),
        completed: req.completed.isTrue,
    };
}

export async function parseReplaceRequest(
    vaultsAPI: VaultsAPI,
    req: ReplaceRequest,
    network: Network,
    wrappedCurrency: WrappedCurrency
): Promise<ReplaceRequestExt> {
    const oldVault = await vaultsAPI.get(req.old_vault);
    return {
        btcAddress: encodeBtcAddress(req.btc_address, network),
        newVault: req.new_vault,
        oldVault: req.old_vault,
        amount: newMonetaryAmount(req.amount.toString(), wrappedCurrency),
        griefingCollateral: newMonetaryAmount(req.griefing_collateral.toString(), oldVault.collateralCurrency),
        collateral: newMonetaryAmount(req.collateral.toString(), oldVault.collateralCurrency),
        acceptTime: req.accept_time.toNumber(),
        period: req.period.toNumber(),
        btcHeight: req.btc_height.toNumber(),
        status: req.status,
    };
}

export async function parseIssueRequest(
    vaultsAPI: VaultsAPI,
    req: IssueRequest,
    network: Network,
    id: H256 | string
): Promise<Issue> {
    const status = req.status.isCompleted
        ? IssueStatus.Completed
        : req.status.isCancelled
            ? IssueStatus.Cancelled
            : IssueStatus.PendingWithBtcTxNotFound;
    const vault = await vaultsAPI.get(req.vault);
    return {
        id: stripHexPrefix(id.toString()),
        creationBlock: req.opentime.toNumber(),
        vaultBTCAddress: encodeBtcAddress(req.btc_address, network),
        vaultParachainAddress: req.vault.toString(),
        userParachainAddress: req.requester.toString(),
        vaultWalletPubkey: req.btc_public_key.toString(),
        bridgeFee: newMonetaryAmount(req.fee.toString(), vaultsAPI.getWrappedCurrency()),
        wrappedAmount: newMonetaryAmount(req.amount.toString(), vaultsAPI.getWrappedCurrency()),
        griefingCollateral: newMonetaryAmount(req.griefing_collateral.toString(), vault.collateralCurrency),
        status,
    };
}

export async function parseRedeemRequest(
    vaultsAPI: VaultsAPI,
    req: RedeemRequest,
    network: Network,
    id: H256
): Promise<Redeem> {
    const status = req.status.isCompleted
        ? RedeemStatus.Completed
        : req.status.isRetried
            ? RedeemStatus.Retried
            : req.status.isReimbursed
                ? RedeemStatus.Reimbursed
                : RedeemStatus.PendingWithBtcTxNotFound;
    const vault = await vaultsAPI.get(req.vault);
    return {
        id: stripHexPrefix(id.toString()),
        userParachainAddress: req.redeemer.toString(),
        amountBTC: newMonetaryAmount(req.amount_btc.toString(), vaultsAPI.getWrappedCurrency()),
        collateralPremium: newMonetaryAmount(req.premium.toString(), vault.collateralCurrency),
        bridgeFee: newMonetaryAmount(req.fee.toString(), vaultsAPI.getWrappedCurrency()),
        btcTransferFee: newMonetaryAmount(req.transfer_fee_btc.toString(), vaultsAPI.getWrappedCurrency()),
        creationBlock: req.opentime.toNumber(),
        vaultParachainAddress: req.vault.toString(),
        userBTCAddress: encodeBtcAddress(req.btc_address, network),
        status,
    };
}

export function convertMoment(moment: Moment): Date {
    return new Date(moment.toNumber());
}

export function unwrapRawExchangeRate(option: Option<UnsignedFixedPoint>): UnsignedFixedPoint | undefined {
    return option.isSome ? (option.value as UnsignedFixedPoint) : undefined;
}
