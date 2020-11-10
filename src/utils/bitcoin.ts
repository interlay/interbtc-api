import * as bitcoin from "bitcoinjs-lib";
import { H160 } from "@polkadot/types/interfaces";

export { Network } from "bitcoinjs-lib";

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
