import { MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { CollateralUnit, WrappedCurrency } from ".";
import { ReplaceRequestStatus } from "../interfaces";
import { BTCUnit, Currency } from "@interlay/monetary-js";

export interface Issue {
    id: string;
    wrappedAmont: MonetaryAmount<WrappedCurrency, BTCUnit>;
    userParachainAddress: string;
    bridgeFee: MonetaryAmount<WrappedCurrency, BTCUnit>;
    griefingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    vaultWalletPubkey: string;
    creationBlock: number;
    creationTimestamp?: number;
    vaultBTCAddress: string;
    vaultParachainAddress: string;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    btcAmountSubmittedByUser?: MonetaryAmount<WrappedCurrency, BTCUnit>;
    status: IssueStatus;
    refundBtcAddress?: string;
    refundAmountBTC?: MonetaryAmount<WrappedCurrency, BTCUnit>;
    executedAmountBTC?: MonetaryAmount<WrappedCurrency, BTCUnit>;
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
    amountBTC: MonetaryAmount<WrappedCurrency, BTCUnit>;
    collateralPremium: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    bridgeFee: MonetaryAmount<WrappedCurrency, BTCUnit>;
    btcTransferFee: MonetaryAmount<WrappedCurrency, BTCUnit>;
    creationTimestamp?: number;
    creationBlock: number;
    vaultParachainAddress: string;
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
    vaultId: AccountId;
    amountIssuing: MonetaryAmount<WrappedCurrency, BTCUnit>;
    fee: MonetaryAmount<WrappedCurrency, BTCUnit>;
    amountBtc: MonetaryAmount<WrappedCurrency, BTCUnit>;
    issuer: AccountId;
    btcAddress: string;
    issueId: string;
    completed: boolean;
}

export interface ReplaceRequestExt {
    btcAddress: string;
    newVault: AccountId;
    oldVault: AccountId;
    amount: MonetaryAmount<WrappedCurrency, BTCUnit>;
    griefingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    collateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    acceptTime: number;
    period: number;
    btcHeight: number;
    status: ReplaceRequestStatus;
}
