import { BTCAmount, PolkadotAmount } from "@interlay/monetary-js";
import { AccountId } from "@polkadot/types/interfaces";
import { ReplaceRequestStatus } from "../interfaces";

export interface Issue {
    id: string;
    amountInterBTC: BTCAmount;
    userDOTAddress: string;
    bridgeFee: BTCAmount;
    griefingCollateral: PolkadotAmount;
    vaultWalletPubkey: string;
    creationBlock: number;
    creationTimestamp?: number;
    vaultBTCAddress: string;
    vaultDOTAddress: string;
    btcTxId?: string;
    confirmations?: number;
    btcBlockHeight?: number;
    btcAmountSubmittedByUser?: BTCAmount;
    status: IssueStatus;
    refundBtcAddress?: string;
    refundAmountBTC?: BTCAmount;
    executedAmountBTC?: BTCAmount;
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
    amountBTC: BTCAmount;
    dotPremium: PolkadotAmount;
    bridgeFee: BTCAmount;
    btcTransferFee: BTCAmount;
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
