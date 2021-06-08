export interface Issue {
    id: string;
    amountBTC: string;
    userDOTAddress: string;
    fee: string;
    griefingCollateral: string;
    vaultWalletPubkey: string;
    creationBlock: number;
    creationTimestamp: number;
    vaultBTCAddress: string;
    vaultDOTAddress: string;
    btcTxId: string;
    confirmations?: number;
    btcBlockHeight?: number;
    btcAmountSubmittedByUser?: string;
    status: IssueStatus;
    refundBtcAddress: string;
    refundAmountBTC: string;
    executedAmountBTC: string;
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
