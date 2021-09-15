import * as bitcoinjs from "bitcoinjs-lib";
export { bitcoinjs as bitcoin };

import { H160 } from "@polkadot/types/interfaces";
import { Bytes } from "@polkadot/types";
import { TypeRegistry } from "@polkadot/types";

import { BtcAddress } from "../interfaces/default";
import { ElectrsAPI } from "../external";
import { BTCRelayAPI } from "../parachain";
import { sleep, addHexPrefix, reverseEndiannessHex, SLEEP_TIME_MS, BitcoinCoreClient } from "..";

export function encodeBtcAddress(address: BtcAddress, network: bitcoinjs.Network): string {
    let btcAddress: string | undefined;
    try {
        if (address.isP2Pkh) {
            const result = bitcoinjs.payments.p2pkh({
                hash: Buffer.from(address.asP2Pkh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2Sh) {
            const result = bitcoinjs.payments.p2sh({
                hash: Buffer.from(address.asP2Sh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2WpkHv0) {
            const result = bitcoinjs.payments.p2wpkh({
                hash: Buffer.from(address.asP2WpkHv0.buffer),
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

export function decodeBtcAddress(
    address: string,
    network: bitcoinjs.Network
): { p2pkh: string } | { p2sh: string } | { p2wpkhv0: string } {
    const p2pkh = decode({ address, network }, bitcoinjs.payments.p2pkh);
    if (p2pkh) return { p2pkh };

    const p2sh = decode({ address, network }, bitcoinjs.payments.p2sh);
    if (p2sh) return { p2sh };

    const p2wpkhv0 = decode({ address, network }, bitcoinjs.payments.p2wpkh);
    if (p2wpkhv0) return { p2wpkhv0 };

    throw new Error("Unable to decode address");
}

export function btcAddressFromParams(
    registry: TypeRegistry,
    params: { p2pkh: H160 | string } | { p2sh: H160 | string } | { p2wpkhv0: H160 | string }
): BtcAddress {
    return registry.createType("BtcAddress", {
        ...params,
    });
}

export async function getTxProof(
    electrsAPI: ElectrsAPI,
    btcTxId?: string,
    merkleProof?: Bytes,
    rawTx?: Bytes
): Promise<[Bytes, Bytes]> {
    if (!merkleProof || !rawTx) {
        if (!btcTxId) {
            throw new Error("Either the `btcTxId` or both `merkleProof` and `rawTx` must be defined to execute.");
        }
        [merkleProof, rawTx] = await electrsAPI.getParsedExecutionParameters(btcTxId);
    }
    return [merkleProof, rawTx];
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
