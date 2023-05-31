import { HexString } from "./encoding";

export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";

export type BlockHeader = {
    merkleRoot: Uint8Array;
    target: Uint8Array; // u256
    timestamp: number;
    version: number;
    hash_: Uint8Array;
    hashPrevBlock: Uint8Array;
    nonce: number;
};

export type MerkleProof = {
    blockHeader: BlockHeader;
    flagBits: Array<boolean>;
    transactionsCount: number;
    hashes: Array<Uint8Array>;
};

export type TransactionInputSource =
    | "coinbase"
    | {
          fromOutput: [Uint8Array, number]; // [txHash, output index]
      };

export interface TransactionInput {
    source: TransactionInputSource;
    script: HexString;
    sequence: number;
    witness: Array<HexString>;
}

export interface TransactionOutput {
    value: number;
    script: { bytes: HexString };
}

export type TransactionLocktime =
    | {
          time: number;
      }
    | {
          blockHeight: number;
      };

export type Transaction = {
    version: number;
    inputs: Array<TransactionInput>;
    outputs: Array<TransactionOutput>;
    lockAt: TransactionLocktime;
};

export type TxStatus = {
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
    blockHash?: string;
};

export type TxOutput = {
    scriptpubkey: string;
    scriptpubkeyAsm: string;
    scriptpubkeyType: string;
    scriptpubkeyAddress: string;
    value: number;
};

export type TxInput = {
    txId: string;
    vout: number;
    isCoinbase: boolean;
    scriptsig: string;
    scriptsigAsm: string;
    innerRedeemscriptAsm: string;
    innerWitnessscriptAsm: string;
    sequence: number;
    witness: string[];
    prevout: TxOutput;
};
