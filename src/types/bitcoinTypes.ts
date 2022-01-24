import { Bytes } from "@polkadot/types";

export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";
export type TxInclusionDetails = {
    merkleProof: Bytes;
    rawTx: Bytes;
}
export type TxFetchingDetails = TxInclusionDetails | { btcTxId: string };

export function isTxInclusionDetails(args: TxFetchingDetails): args is TxInclusionDetails {
    return (
        (args as TxInclusionDetails).merkleProof !== undefined &&
        (args as TxInclusionDetails).rawTx !== undefined
    );
}

export function isTxInclusionDeterminants(args: TxFetchingDetails): args is { btcTxId: string } {
    return (args as { btcTxId: string }).btcTxId !== undefined;
}
