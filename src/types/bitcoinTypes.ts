import { Bytes } from "@polkadot/types";

export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";
export type TxInclusionDetails = {
    merkleProof: Bytes;
    rawTx: Bytes;
}
export type TxInclusionDeterminants = {
    btcTxId: string,
}
export type TxFetchingDetails = TxInclusionDetails | TxInclusionDeterminants;

export function isTxInclusionDetails(args: TxFetchingDetails): args is TxInclusionDetails {
    return (
        (args as TxInclusionDetails).merkleProof !== undefined &&
        (args as TxInclusionDetails).rawTx !== undefined
    );
}

export function isTxInclusionDeterminants(args: TxFetchingDetails): args is TxInclusionDeterminants {
    return (args as TxInclusionDeterminants).btcTxId !== undefined;
}