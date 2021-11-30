import { MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { CollateralUnit, WrappedCurrency } from ".";
import { BitcoinUnit, Currency } from "@interlay/monetary-js";
import { InterbtcPrimitivesVaultId, InterbtcPrimitivesReplaceReplaceRequestStatus } from "@polkadot/types/lookup";

export interface Issue {
    id: string;
    wrappedAmount: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    userParachainAddress: string;
    bridgeFee: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    griefingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    vaultWalletPubkey: string;
    creationBlock: number;
    creationTimestamp?: number;
    vaultWrappedAddress: string;
    vaultId: InterbtcPrimitivesVaultId;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    btcAmountSubmittedByUser?: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    status: IssueStatus;
    refundBtcAddress?: string;
    refundAmountWrapped?: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    executedAmountWrapped?: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
}

export enum IssueStatus {
    Completed,
    Cancelled,
    RequestedRefund,
    Expired,
    PendingWithBtcTxNotFound,
    PendingWithBtcTxNotIncluded,
    PendingWithTooFewConfirmations,
    PendingWithEnoughConfirmations,
}

export enum NominationStatus {
    Staked,
    Unstaked,
    Refunded,
}

export interface Redeem {
    id: string;
    userParachainAddress: string;
    amountBTC: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    collateralPremium: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    bridgeFee: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    btcTransferFee: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    creationTimestamp?: number;
    creationBlock: number;
    vaultId: InterbtcPrimitivesVaultId;
    userBTCAddress: string;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    status: RedeemStatus;
}

export enum RedeemStatus {
    Completed,
    Expired,
    Reimbursed,
    Retried,
    PendingWithBtcTxNotFound,
    PendingWithBtcTxNotIncluded,
    PendingWithTooFewConfirmations,
    PendingWithEnoughConfirmations,
}

export interface RefundRequestExt {
    vaultId: InterbtcPrimitivesVaultId;
    amountIssuing: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    fee: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    amountBtc: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    issuer: AccountId;
    btcAddress: string;
    issueId: string;
    completed: boolean;
}

export interface ReplaceRequestExt {
    btcAddress: string;
    newVault: InterbtcPrimitivesVaultId;
    oldVault: InterbtcPrimitivesVaultId;
    amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    griefingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    collateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    acceptTime: number;
    period: number;
    btcHeight: number;
    status: InterbtcPrimitivesReplaceReplaceRequestStatus;
}
