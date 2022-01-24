import { Bitcoin, BitcoinUnit, Currency, ExchangeRate } from "@interlay/monetary-js";
import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinCoreClient, CollateralCurrency, CollateralUnit, OracleAPI } from "../../src";
import { TransactionAPI } from "../../src/parachain/transaction";
import { SUDO_URI } from "../config";

export const SLEEP_TIME_MS = 1000;

// On Bitcoin mainnet, block time is ~10 mins. Speed it up to 10s during the tests.
export const BITCOIN_BLOCK_TIME_IN_MS = 10 * 1000;

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function wait_success<R>(call: () => Promise<R>): Promise<R> {
    while (true) {
        try {
            const res = await call();
            return res;
        } catch (_) {
            await sleep(SLEEP_TIME_MS);
        }
    }
}

export async function callWithExchangeRate<C extends CollateralUnit>(
    oracleAPI: OracleAPI,
    exchangeRate: ExchangeRate<Bitcoin, BitcoinUnit, Currency<C>, C>,
    fn: () => Promise<void>,
): Promise<void> {
    const initialExchangeRate = await oracleAPI.getExchangeRate(exchangeRate.counter);
    await oracleAPI.setExchangeRate(exchangeRate);
    await oracleAPI.waitForExchangeRateUpdate(exchangeRate);
    try {
        await fn();
    } catch (error) {
        console.log(`Error: ${(error as Error).toString()}`);
    }
    await oracleAPI.setExchangeRate(initialExchangeRate);
    await oracleAPI.waitForExchangeRateUpdate(initialExchangeRate);
}

export async function callWith<T extends TransactionAPI, R>(api: T, key: KeyringPair, call: (api: T) => Promise<R>): Promise<R> {
    const prevKey = api.getAccount();
    api.setAccount(key);
    let result: R;
    try {
        result = await call(api);
    } catch (error) {
        throw error;
    } finally {
        if (prevKey) api.setAccount(prevKey);
    }
    return result;
}

export function sudo<T extends TransactionAPI, R>(api: T, call: (api: T) => Promise<R>): Promise<R> {
    const keyring = new Keyring({ type: "sr25519" });
    const rootKey = keyring.addFromUri(SUDO_URI);
    return callWith(api, rootKey, call);
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

export async function runWhileMiningBTCBlocks(bitcoinCoreClient: BitcoinCoreClient, fn: () => Promise<void>): Promise<void> {
    function generateBlocks() {
        bitcoinCoreClient.mineBlocks(1);
    }
    
    const intervalId = setInterval(generateBlocks, BITCOIN_BLOCK_TIME_IN_MS);
    try {
        await fn();
    } catch (error) {
        throw error;
    } finally {
        clearInterval(intervalId);
    }
}

// TODO: test this function
export async function runWithChangingExchangeRates(oracleAPI: OracleAPI, fn: () => Promise<void>): Promise<void> {
    const MAX_RATE_CHANGE_PERCENTAGE = 0.005;
    return new Promise(async (resolve, reject) => {
        fn().then(resolve).catch(reject);

        while (true) {
            const exchangeRates = await Promise.all(
                CollateralCurrency.map(currency => oracleAPI.getExchangeRate(currency as Currency<CollateralUnit>))
            );
            await Promise.all(
                exchangeRates.map(exchangeRate => {
                    const exchangeRateValue = exchangeRate.toBig();
                    // The exchange rate can go up or down, by at most `MAX_RATE_CHANGE_PERCENTAGE`
                    const newExchangeRateValue = exchangeRateValue.mul(1 + (Math.random() * 2 - 1) * MAX_RATE_CHANGE_PERCENTAGE);
                    const newExchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, typeof exchangeRate.counter, typeof exchangeRate.counter.units>(
                        Bitcoin, exchangeRate.counter, newExchangeRateValue
                    );
                    oracleAPI.setExchangeRate(newExchangeRate);
                })
            );
        }
    });
}
