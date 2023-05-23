export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";

export type BlockHeader = {
    merkleRoot: string,
    target: number, // U256 
    timestamp: number,
    version: number,
    hash_: string,
    hashPrevBlock: string,
    nonce: number,
}

export type MerkleProof = {
    blockHeader: BlockHeader,
    flagBits: Array<boolean>,
    transactionsCount: number,
    hashes: Array<string>
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