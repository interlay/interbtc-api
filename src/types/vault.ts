import { BTCUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { CollateralUnit } from "./currency";

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

export interface VaultExt<U extends BTCUnit> {
    wallet: WalletExt;
    backingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    id: AccountId;
    status: VaultStatusExt;
    bannedUntil: number | undefined;
    toBeIssuedTokens: MonetaryAmount<Currency<U>, U>;
    issuedTokens: MonetaryAmount<Currency<U>, U>;
    toBeRedeemedTokens: MonetaryAmount<Currency<U>, U>;
    toBeReplacedTokens: MonetaryAmount<Currency<U>, U>;
    replaceCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    liquidatedCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    collateralCurrency: Currency<CollateralUnit>;
}

export interface SystemVaultExt<U extends BTCUnit> {
    toBeIssuedTokens: MonetaryAmount<Currency<U>, U>;
    issuedTokens: MonetaryAmount<Currency<U>, U>;
    toBeRedeemedTokens: MonetaryAmount<Currency<U>, U>;
}
