import * as bitcoin from "bitcoinjs-lib";
import { H160 } from "@polkadot/types/interfaces";

export { bitcoin };

export function getP2WPKHFromH160(hash: H160, network: bitcoin.Network): string | undefined {
    let btcAddress: string | undefined;
    try {
        // TODO: specify script format in parachain
        const payment = bitcoin.payments.p2wpkh({
            hash: Buffer.from(hash.buffer),
            network,
        });
        btcAddress = payment.address;
    } catch (err) {
        console.log(`Error converting BTC address ${hash}: ${err}`);
    }
    return btcAddress;
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

function decodeAddress(address: string, network: bitcoin.Network) {
    return (
        decode({ address, network }, bitcoin.payments.p2sh) ||
        decode({ address, network }, bitcoin.payments.p2pkh) ||
        decode({ address, network }, bitcoin.payments.p2wpkh)
    );
}

export function getH160FromP2WPKH(address: string, network: bitcoin.Network): string | undefined {
    return decodeAddress(address, network);
}
