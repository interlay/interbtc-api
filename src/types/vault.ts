import { BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
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

export interface VaultExt<WrappedUnit extends BitcoinUnit> {
    wallet: WalletExt;
    backingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    id: AccountId;
    status: VaultStatusExt;
    bannedUntil: number | undefined;
    toBeIssuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    issuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    toBeRedeemedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    toBeReplacedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    replaceCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    liquidatedCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    collateralCurrency: Currency<CollateralUnit>;
}

export interface SystemVaultExt<WrappedUnit extends BitcoinUnit> {
    toBeIssuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    issuedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
    toBeRedeemedTokens: MonetaryAmount<Currency<WrappedUnit>, WrappedUnit>;
}
