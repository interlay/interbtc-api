import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { mnemonicGenerate } from '@polkadot/util-crypto';
import * as bitcoinjs from "bitcoinjs-lib";
import { TransactionAPI } from "../../src/parachain/transaction";
import { SUDO_URI } from "../config";

export const SLEEP_TIME_MS = 1000;

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function wait_success<R>(call: () => Promise<R>): Promise<R> {
    while (true) {
        try {
            let res = await call();
            return res;
        } catch (_) {
            await sleep(SLEEP_TIME_MS);
        }
    }
}

export async function callWith<T extends TransactionAPI, R>(api: T, key: KeyringPair, call: (api: T) => Promise<R>): Promise<R> {
    const prevKey = api.getAccount();
    api.setAccount(key);
    let result = await call(api);
    if (prevKey) api.setAccount(prevKey);
    return result;
}

export function sudo<T extends TransactionAPI, R>(api: T, call: (api: T) => Promise<R>): Promise<R> {
    const keyring = new Keyring({ type: "sr25519" });
    const rootKey = keyring.addFromUri(SUDO_URI);
    return callWith(api, rootKey, call)
}

export function makeRandomBitcoinAddress(): string {
    const pair = bitcoinjs.ECPair.makeRandom();
    const p2pkh = bitcoinjs.payments.p2pkh({ pubkey: pair.publicKey, network: bitcoinjs.networks.regtest });
    return p2pkh.address!;
}

export function makeRandomPolkadotKeyPair(keyring: Keyring): KeyringPair {
    const mnemonic = mnemonicGenerate(12);
    return keyring.addFromUri(mnemonic);
}