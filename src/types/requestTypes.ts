import { Bitcoin, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { CollateralCurrencyExt, WrappedCurrency } from "../types";
import { InterbtcPrimitivesVaultId, InterbtcPrimitivesReplaceReplaceRequestStatus } from "@polkadot/types/lookup";

export interface Issue {
    id: string;
    wrappedAmount: MonetaryAmount<WrappedCurrency>;
    userParachainAddress: string;
    bridgeFee: MonetaryAmount<WrappedCurrency>;
    griefingCollateral: MonetaryAmount<Currency>;
    vaultWalletPubkey: string;
    creationBlock: number;
    creationTimestamp?: number;
    vaultWrappedAddress: string;
    vaultId: InterbtcPrimitivesVaultId;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    btcConfirmationActiveBlockHeight?: number;
    btcAmountSubmittedByUser?: MonetaryAmount<WrappedCurrency>;
    status: IssueStatus;
    refundBtcAddress?: string;
    refundAmountWrapped?: MonetaryAmount<WrappedCurrency>;
    executedAmountWrapped?: MonetaryAmount<WrappedCurrency>;
    period: number;
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
    amountBTC: MonetaryAmount<WrappedCurrency>;
    collateralPremium: MonetaryAmount<CollateralCurrencyExt>;
    bridgeFee: MonetaryAmount<WrappedCurrency>;
    btcTransferFee: MonetaryAmount<Bitcoin>;
    creationTimestamp?: number;
    creationBlock: number;
    vaultId: InterbtcPrimitivesVaultId;
    userBTCAddress: string;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    status: RedeemStatus;
    period: number;
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
    amountIssuing: MonetaryAmount<WrappedCurrency>;
    fee: MonetaryAmount<WrappedCurrency>;
    amountBtc: MonetaryAmount<Bitcoin>;
    issuer: AccountId;
    btcAddress: string;
    issueId: string;
    completed: boolean;
}

export interface ReplaceRequestExt {
    id: string;
    btcAddress: string;
    newVault: InterbtcPrimitivesVaultId;
    oldVault: InterbtcPrimitivesVaultId;
    amount: MonetaryAmount<WrappedCurrency>;
    griefingCollateral: MonetaryAmount<Currency>;
    collateral: MonetaryAmount<CollateralCurrencyExt>;
    acceptTime: number;
    period: number;
    btcHeight: number;
    status: InterbtcPrimitivesReplaceReplaceRequestStatus;
}
