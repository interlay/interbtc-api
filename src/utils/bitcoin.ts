import * as bitcoin from "bitcoinjs-lib";
import { H160 } from "@polkadot/types/interfaces";

export function getP2WPKHFromH160(hash: H160): string | undefined {
    let btcAddress: string | undefined;
    try {
        // TODO: specify script format in parachain
        const payment = bitcoin.payments.p2wpkh({
            hash: Buffer.from(hash.buffer),
            network: bitcoin.networks.testnet,
        });
        btcAddress = payment.address;
    } catch (error) {
        console.log("Error converting BTC address " + hash);
    }
    return btcAddress;
}
