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
  PendingWithEnoughConfirmations
}
