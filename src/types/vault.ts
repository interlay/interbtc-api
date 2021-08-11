import { PolkadotAmount, BTCAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";

export interface WalletExt {
    // network encoded btc addresses
    publicKey: string;
    addresses: Array<string>;
}

export enum VaultStatusExt {
    Active,
    Inactive,
    Liquidated,
    CommittedTheft,
}

export interface VaultExt {
    wallet: WalletExt;
    backingCollateral: PolkadotAmount;
    id: AccountId;
    status: VaultStatusExt;
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
