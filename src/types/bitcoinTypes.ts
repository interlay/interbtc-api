export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";

export type BlockHeader = {
    merkleRoot: Uint8Array,
    target: Uint8Array, // u256
    timestamp: number,
    version: number,
    hash_: Uint8Array,
    hashPrevBlock: Uint8Array,
    nonce: number,
}

export type MerkleProof = {
    blockHeader: BlockHeader,
    flagBits: Array<boolean>,
    transactionsCount: number,
    hashes: Array<Uint8Array>
};

export type Transaction = {
    version: number,
    inputs: Array<{
        // TODO: fix
        source: 'FromOutput' | 'Coinbase';
        script: Buffer;
        sequence: number;
        witness: Array<Buffer>;
    }>,
    outputs: Array<{
        value: number;
        script: { bytes: Buffer };
    }>,
    // TODO: fix
    lockAt: 'Time' | 'BlockHeight',
};
