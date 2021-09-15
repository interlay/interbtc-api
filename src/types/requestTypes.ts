import { MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { CollateralUnit, WrappedCurrency } from ".";
import { ReplaceRequestStatus } from "../interfaces";
import { BitcoinUnit, Currency } from "@interlay/monetary-js";

export interface Issue {
    id: string;
    wrappedAmount: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    userParachainAddress: string;
    bridgeFee: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    griefingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    vaultWalletPubkey: string;
    creationBlock: number;
    creationTimestamp?: number;
    vaultBTCAddress: string;
    vaultParachainAddress: string;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    btcAmountSubmittedByUser?: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    status: IssueStatus;
    refundBtcAddress?: string;
    refundAmountBTC?: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    executedAmountBTC?: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
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
    newVault: AccountId;
    oldVault: AccountId;
    amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    griefingCollateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    collateral: MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>;
    acceptTime: number;
    period: number;
    btcHeight: number;
    status: ReplaceRequestStatus;
}
