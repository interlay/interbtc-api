import { HexString } from "./encoding";

export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";

export type BlockHeader = {
    merkleRoot: HexString;
    target: HexString; // u256
    timestamp: number;
    version: number;
    hash_: HexString;
    hashPrevBlock: HexString;
    nonce: number;
};

export type MerkleProof = {
    blockHeader: BlockHeader;
    flagBits: Array<boolean>;
    transactionsCount: number;
    hashes: Array<HexString>;
};

export type TransactionInputSource =
    | "coinbase"
    | {
          fromOutput: [HexString, number]; // [txHash, output index]
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
