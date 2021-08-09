import { AccountId, H256 } from "@polkadot/types/interfaces";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import type { Struct } from "@polkadot/types";
import { Network } from "bitcoinjs-lib";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";
import { Codec } from "@polkadot/types/types";
import { BTCAmount, PolkadotAmount } from "@interlay/monetary-js";
import * as interbtcIndex from "@interlay/interbtc-index-client";

import { encodeBtcAddress, FIXEDI128_SCALING_FACTOR } from ".";
import { WalletExt, SystemVaultExt, ParsedVaultData } from "../types/vault";
import { Issue, IssueStatus, RefundRequestExt, ReplaceRequestExt } from "../types/requestTypes";
import {
    SignedFixedPoint,
    UnsignedFixedPoint,
    BtcAddress,
    SystemVault,
    Wallet,
    RefundRequest,
    ReplaceRequest,
    IssueRequest,
} from "../interfaces";

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

export function parseSystemVault(vault: SystemVault): SystemVaultExt {
    return {
        toBeIssuedTokens: BTCAmount.from.Satoshi(vault.to_be_issued_tokens.toString()),
        issuedTokens: BTCAmount.from.Satoshi(vault.issued_tokens.toString()),
        toBeRedeemedTokens: BTCAmount.from.Satoshi(vault.to_be_redeemed_tokens.toString()),
    };
}

export function newAccountId(api: ApiPromise, accountId: string): AccountId {
    return api.createType("AccountId", accountId);
}

export function parseRefundRequest(req: RefundRequest, network: Network): RefundRequestExt {
    return {
        vaultId: req.vault,
        amountIssuing: BTCAmount.from.Satoshi(req.amount_issuing.toString()),
        fee: BTCAmount.from.Satoshi(req.fee.toString()),
        amountBtc: BTCAmount.from.Satoshi(req.amount_btc.toString()),
        issuer: req.issuer,
        btcAddress: encodeBtcAddress(req.btc_address, network),
        issueId: stripHexPrefix(req.issue_id.toString()),
        completed: req.completed.isTrue,
    };
}

export function parseReplaceRequest(req: ReplaceRequest, network: Network): ReplaceRequestExt {
    return {
        btcAddress: encodeBtcAddress(req.btc_address, network),
        newVault: req.new_vault,
        oldVault: req.old_vault,
        amount: BTCAmount.from.Satoshi(req.amount.toString()),
        griefingCollateral: PolkadotAmount.from.Planck(req.griefing_collateral.toString()),
        collateral: PolkadotAmount.from.Planck(req.collateral.toString()),
        acceptTime: req.accept_time.toNumber(),
        period: req.period.toNumber(),
        btcHeight: req.btc_height.toNumber(),
        status: req.status,
    };
}
