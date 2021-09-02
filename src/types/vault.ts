import { BTCAmount, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { CollateralUnit, WrappedCurrency } from "./currency";

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
    backingCollateral: Map<WrappedCurrency, MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    id: AccountId;
    status: VaultStatusExt;
    bannedUntil: number | undefined;
    toBeIssuedTokens: BTCAmount;
    issuedTokens: BTCAmount;
    toBeRedeemedTokens: BTCAmount;
    toBeReplacedTokens: BTCAmount;
    replaceCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    liquidatedCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    collateralCurrency: Currency<CollateralUnit>;
}

export interface SystemVaultExt {
    toBeIssuedTokens: BTCAmount;
    issuedTokens: BTCAmount;
    toBeRedeemedTokens: BTCAmount;
}
