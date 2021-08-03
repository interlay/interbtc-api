import { BTCAmount, PolkadotAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { ReplaceRequestStatus } from "../interfaces";

export interface Issue {
    id: string;
    amountInterBTC: string;
    userDOTAddress: string;
    bridgeFee: string;
    griefingCollateral: string;
    vaultWalletPubkey: string;
    creationBlock: number;
    creationTimestamp?: number;
    vaultBTCAddress: string;
    vaultDOTAddress: string;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    btcAmountSubmittedByUser?: string;
    status: IssueStatus;
    refundBtcAddress?: string;
    refundAmountBTC?: string;
    executedAmountBTC?: string;
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
    userDOTAddress: string;
    amountBTC: string;
    dotPremium: string;
    bridgeFee: string;
    btcTransferFee: string;
    creationTimestamp?: number;
    creationBlock: number;
    vaultDOTAddress: string;
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
    amountIssuing: BTCAmount;
    fee: BTCAmount;
    amountBtc: BTCAmount;
    issuer: AccountId;
    btcAddress: string;
    issueId: string;
    completed: boolean;
}

export interface ReplaceRequestExt {
    btcAddress: string;
    newVault: AccountId;
    oldVault: AccountId;
    amount: BTCAmount;
    griefingCollateral: PolkadotAmount;
    collateral: PolkadotAmount;
    acceptTime: number;
    period: number;
    btcHeight: number;
    status: ReplaceRequestStatus;
}
