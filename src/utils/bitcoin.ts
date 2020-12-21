import * as bitcoin from "bitcoinjs-lib";
import { H160 } from "@polkadot/types/interfaces";
import { BtcAddress } from "../interfaces/default";
import { TypeRegistry } from "@polkadot/types";

export { bitcoin };

export function encodeBtcAddress(address: BtcAddress, network: bitcoin.Network): string {
    let btcAddress: string | undefined;
    try {
        if (address.isP2Pkh) {
            const result = bitcoin.payments.p2pkh({
                hash: Buffer.from(address.asP2Pkh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2Sh) {
            const result = bitcoin.payments.p2sh({
                hash: Buffer.from(address.asP2Sh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2WpkHv0) {
            const result = bitcoin.payments.p2wpkh({
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
    network: bitcoin.Network
): { p2pkh: string } | { p2sh: string } | { p2wpkhv0: string } {
    const p2pkh = decode({ address, network }, bitcoin.payments.p2pkh);
    if (p2pkh) return { p2pkh };

    const p2sh = decode({ address, network }, bitcoin.payments.p2sh);
    if (p2sh) return { p2sh };

    const p2wpkhv0 = decode({ address, network }, bitcoin.payments.p2wpkh);
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
