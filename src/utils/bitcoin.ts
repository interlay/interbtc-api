import { Block as BitcoinBlock, payments, Network, TxInput, TxOutput } from "bitcoinjs-lib";
import { BufferReader } from "bitcoinjs-lib/src/bufferutils";

import { H160 } from "@polkadot/types/interfaces";
import { BitcoinAddress } from "@polkadot/types/lookup";
import { TypeRegistry } from "@polkadot/types";

import { ElectrsAPI } from "../external";
import { BTCRelayAPI } from "../parachain";
import {
    sleep,
    addHexPrefix,
    reverseEndiannessHex,
    SLEEP_TIME_MS,
    BitcoinCoreClient,
    bufferToHexString,
} from "../utils";
import {
    HexString,
    MerkleProof,
    Transaction,
    TransactionInput,
    TransactionInputSource,
    TransactionLocktime,
    TransactionOutput,
} from "../types";

export function encodeBtcAddress(address: BitcoinAddress, network: Network): string {
    let btcAddress: string | undefined;
    try {
        if (address.isP2pkh) {
            const result = payments.p2pkh({
                hash: Buffer.from(address.asP2pkh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2sh) {
            const result = payments.p2sh({
                hash: Buffer.from(address.asP2sh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2wsHv0) {
            const result = payments.p2wsh({
                hash: Buffer.from(address.asP2wsHv0.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2wpkHv0) {
            const result = payments.p2wpkh({
                hash: Buffer.from(address.asP2wpkHv0.buffer),
                network,
            });
            btcAddress = result.address;
        } else {
            throw new Error("Invalid address format");
        }
    } catch (err) {
        throw new Error(`Error encoding BTC address ${address}: ${err}`);
    }

    if (btcAddress) return btcAddress;
    throw new Error("Unable to encode address");
}

interface Payable {
    hash?: Buffer;
    address?: string;
}

function decode<P extends Payable, O>(p: P, f: (payment: P, options?: O) => P): string | undefined {
    try {
        const pay = f(p);
        return pay.hash ? "0x" + pay.hash.toString("hex") : "";
    } catch (err) {
        return undefined;
    }
}

export function btcAddressFromParams(
    registry: TypeRegistry,
    params: { p2pkh: H160 | string } | { p2sh: H160 | string } | { p2wpkhv0: H160 | string }
): BitcoinAddress {
    registry.register;
    return registry.createType<BitcoinAddress>("BitcoinAddress", {
        ...params,
    });
}

export function decodeBtcAddress(
    address: string,
    network: Network
): { p2pkh: string } | { p2sh: string } | { p2wpkhv0: string } | { p2wshv0: string } {
    const p2pkh = decode({ address, network }, payments.p2pkh);
    if (p2pkh) return { p2pkh };

    const p2sh = decode({ address, network }, payments.p2sh);
    if (p2sh) return { p2sh };

    const p2wpkhv0 = decode({ address, network }, payments.p2wpkh);
    if (p2wpkhv0) return { p2wpkhv0 };

    const p2wshv0 = decode({ address, network }, payments.p2wsh);
    if (p2wshv0) return { p2wshv0 };

    throw new Error("Unable to decode address");
}

const parseTxInputSource = (txInput: TxInput, isCoinbase: boolean): TransactionInputSource => {
    if (isCoinbase) {
        return "coinbase";
    }
    return { fromOutput: [bufferToHexString(txInput.hash), txInput.index] }; // Hash is in H256Le.
};

const parseTxInput = (txInput: TxInput, isCoinbase: boolean): TransactionInput => ({
    source: parseTxInputSource(txInput, isCoinbase),
    script: bufferToHexString(txInput.script),
    sequence: txInput.sequence,
    witness: txInput.witness.map((witnessDataBuffer) => bufferToHexString(witnessDataBuffer)),
});

const parseTxOutput = (txOutput: TxOutput): TransactionOutput => ({
    value: txOutput.value,
    script: {
        bytes: bufferToHexString(txOutput.script),
    },
});

const parseLockTime = (locktime: number): TransactionLocktime => {
    // If locktime is lower than 500M, it is parsed as blockheight,
    // otherwise as unix epoch time:
    // https://developer.bitcoin.org/devguide/transactions.html#locktime-and-sequence-number
    if (locktime < 500000000) {
        return { blockHeight: locktime };
    }
    return { time: locktime };
};

export async function getTxProof(
    electrsAPI: ElectrsAPI,
    btcTxId: string
): Promise<{
    merkleProof: MerkleProof;
    transaction: Transaction;
    lengthBound: number;
}> {
    const [proof, tx] = await electrsAPI.getParsedExecutionParameters(btcTxId);
    if (proof.blockHeader.merkleRoot === undefined) {
        throw new Error("Block header data is missing merkle root");
    }
    if (proof.blockHeader.prevHash === undefined) {
        throw new Error("Block header data is missing previous block hash");
    }

    return {
        merkleProof: {
            blockHeader: {
                merkleRoot: bufferToHexString(proof.blockHeader.merkleRoot),
                target: bufferToHexString(BitcoinBlock.calculateTarget(proof.blockHeader.bits)),
                timestamp: proof.blockHeader.timestamp,
                version: proof.blockHeader.version,
                hash_: bufferToHexString(proof.blockHeader.getHash()),
                hashPrevBlock: bufferToHexString(proof.blockHeader.prevHash),
                nonce: proof.blockHeader.nonce,
            },
            flagBits: proof.flagBits,
            transactionsCount: proof.transactionsCount,
            hashes: proof.hashes,
        },
        transaction: {
            version: tx.version,
            inputs: tx.ins.map((txIn) => parseTxInput(txIn, tx.isCoinbase())),
            outputs: tx.outs.map(parseTxOutput),
            lockAt: parseLockTime(tx.locktime),
        },
        lengthBound: tx.byteLength(),
    };
}

export async function waitForBlockRelaying(
    btcRelayAPI: BTCRelayAPI,
    blockHash: string,
    sleepMs = SLEEP_TIME_MS
): Promise<void> {
    while (!(await btcRelayAPI.isBlockInRelay(blockHash))) {
        console.log(`Blockhash ${blockHash} not yet relayed...`);
        await sleep(sleepMs);
    }
}

export async function waitForBlockFinalization(
    bitcoinCoreClient: BitcoinCoreClient,
    btcRelayAPI: BTCRelayAPI
): Promise<void> {
    const bestBlockHash = addHexPrefix(reverseEndiannessHex(await bitcoinCoreClient.getBestBlockHash()));
    // wait for block to be relayed
    await waitForBlockRelaying(btcRelayAPI, bestBlockHash);
}

export class BitcoinMerkleProof {
    blockHeader: BitcoinBlock;
    transactionsCount: number;
    hashes: Array<HexString>;
    flagBits: Array<boolean>;

    constructor(buffer: Buffer) {
        const bufferReader = new BufferReader(buffer);
        const rawBlockHeader = bufferReader.readSlice(80);
        this.blockHeader = BitcoinBlock.fromBuffer(rawBlockHeader);
        this.transactionsCount = bufferReader.readUInt32();
        const hashesCount = bufferReader.readVarInt();

        const hashes: HexString[] = [];
        for (let i = 0; i < hashesCount; i++) {
            const slice = bufferReader.readSlice(32); // H256Le
            hashes.push(bufferToHexString(slice));
        }
        this.hashes = hashes;

        const flagByteCount = bufferReader.readVarInt();
        const flagBits = [];
        for (let i = 0; i < flagByteCount; i++) {
            const byte = bufferReader.readUInt8();
            for (let j = 0; j < 8; j++) {
                const mask = 1 << j;
                const bit = (byte & mask) != 0;
                flagBits.push(bit);
            }
        }
        this.flagBits = flagBits;
    }

    static fromHex(hex: string): BitcoinMerkleProof {
        return new BitcoinMerkleProof(Buffer.from(hex, "hex"));
    }
}
