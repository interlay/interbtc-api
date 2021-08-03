import { PolkadotAmount, BTCAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import * as interbtcIndex from "@interlay/interbtc-index-client";

import { VaultStatus } from "../interfaces";
import Big from "big.js";

export interface WalletExt {
    // network encoded btc addresses
    publicKey: string;
    btcAddress?: string;
    addresses: Array<string>;
}

export interface VaultExt {
    wallet: WalletExt;
    backingCollateral: PolkadotAmount;
    id: AccountId;
    status: VaultStatus;
    bannedUntil: number | undefined;
    toBeIssuedTokens: BTCAmount;
    issuedTokens: BTCAmount;
    toBeRedeemedTokens: BTCAmount;
    toBeReplacedTokens: BTCAmount;
    replaceCollateral: PolkadotAmount;
    liquidatedCollateral: PolkadotAmount;
}

export interface SystemVaultExt {
    toBeIssuedTokens: BTCAmount;
    issuedTokens: BTCAmount;
    toBeRedeemedTokens: BTCAmount;
}

// TODO: Use once explicit wrapped for interbtc-index are added
export interface ParsedVaultData {
    id: string;
    collateral: PolkadotAmount;
    lockedBTC: BTCAmount;
    pendingBTC: BTCAmount;
    collateralization: Big;
    pendingCollateralization: Big;
    capacity: BTCAmount;
    registeredAt: number;
    status: interbtcIndex.VaultDataStatus;
}
