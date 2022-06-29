import { Transaction } from "@interlay/esplora-btc-api";
import { Bitcoin, BitcoinUnit, Currency, ExchangeRate, UnitList } from "@interlay/monetary-js";
import { Keyring } from "@polkadot/api";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { AnyTuple } from "@polkadot/types/types";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import Big, { RoundingMode } from "big.js";
import * as bitcoinjs from "bitcoinjs-lib";
import { 
    BitcoinCoreClient,
    InterBtcApi,
    CollateralCurrency,
    CollateralUnit,
    OracleAPI,
    VaultStatusExt,
    DefaultTransactionAPI
} from "../../src";
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
    let result: Promise<void>;
    try {
        await fn();
        result = Promise.resolve();
    } catch (error) {
        console.log(`Error: ${(error as Error).toString()}`);
        result = Promise.reject(error);
    } finally {
        await oracleAPI.setExchangeRate(initialExchangeRate);
        await oracleAPI.waitForExchangeRateUpdate(initialExchangeRate);
    }

    return result;
}

/*
    Assumption: the `call` argument uses one of the APIs in `InterBtcApi`.
    Since `InterBtcApi` is passed by reference, modifying the account before
    the call means `call` uses that account.
*/
export async function callWith(
    InterBtcApi: InterBtcApi,
    key: KeyringPair,
    call: Function
): Promise<any> {
    const prevKey = InterBtcApi.account;
    InterBtcApi.setAccount(key);
    let result;
    try {
        result = await call();
    } catch (error) {
        throw error;
    } finally {
        if (prevKey) InterBtcApi.setAccount(prevKey);
    }
    return result;
}

export function sudo(InterBtcApi: InterBtcApi, call: Function): Promise<any> {
    const keyring = new Keyring({ type: "sr25519" });
    const rootKey = keyring.addFromUri(SUDO_URI);
    return callWith(InterBtcApi, rootKey, call);
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

export const vaultStatusToLabel = (status: VaultStatusExt): string => {
    switch(status) {
        case VaultStatusExt.Active:
            return "Active";
        case VaultStatusExt.Inactive:
            return "Inactive";
        case VaultStatusExt.CommittedTheft:
            return "Commited theft";
        case VaultStatusExt.Liquidated:
            return "Liquidated";
    }
};

// use the same exchange rate as the running oracles use 
// to avoid flaky tests due to updated prices from the oracle client(s)
// note: currently the same for all collateral currencies - might change in future
export const getExchangeRateValueToSetForTesting = <U extends UnitList>(collateralCurrency: Currency<U>): Big => new Big("230.0");


/**
 * Returns the vsize (virtual size) of the given transaction.
 * 
 * The vsize is calculated by dividing the weight by 4 and rounding up to the next integer.
 * See also https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#Transaction_size_calculations
 * @param transaction the transaction to calculate the vsize of
 * @returns the vsize of the transaction
 */
export const calculateBtcTxVsize = (transaction: Transaction): Big => {
    const txWeight = new Big(transaction.weight || 0);
    return txWeight.div(4).round(0, RoundingMode.RoundUp);
};


// types/interface for RBF bumpfee request
// see: https://developer.bitcoin.org/reference/rpc/bumpfee.html
export enum RbfEstimateMode {
    unset = "unset",
    economical = "economical",
    conservative = "conservative"
}

export interface RbfOptions {
    conf_target?: number;
    fee_rate?: string | number;
    replaceable?: boolean;
    estimate_mode?: RbfEstimateMode;
}

export interface RbfResponse {
    psbt?: string
    txid?: string
    origfee: number
    fee: number
    errors: string[]
}

/**
 * Tries to bump fees (replace by fee) on a given bitcoin transaction, using the "bumpfee" RPC call.
 * See also: https://developer.bitcoin.org/reference/rpc/bumpfee.html .
 * 
 * Default options are set to calculate a replacement fee aiming for 72 blocks (~12 hours), using and economical estimate mode.
 * 
 * @param bitcoinCoreClient the bitcoin core client to make the call with
 * @param txId the transaction id
 * @param options (optional) custom options to pass with "bumpfee" command, default: {conf_target: 72, estimate_mode: "economical"}
 */
export const bumpFeesForBtcTx = async (
    bitcoinCoreClient: BitcoinCoreClient,
    txId: string, 
    options: RbfOptions = {conf_target: 72, estimate_mode: RbfEstimateMode.economical}
): Promise<RbfResponse> => bitcoinCoreClient.client.command("bumpfee", txId, options);

/**
 * Wait for an event to show up as finalized.
 * 
 * This method will only subscribe to new blocks once called and then look for a specific event. 
 * Contrary to @see {@link DefaultTransactionAPI.waitForEvent} which looks at all past events 
 * and may return due to older events using the same name.
 * 
 * Note: This method checks the parent blocks in case the event we are looking for 
 * was finalized in a block just before this method was called.
 * 
 * @param interBtcApi the api to use for querying
 * @param event the event to wait for, eg. `api.events.assetRegistry.RegisteredAsset`
 */
export const waitForFinalizedEvent = async <T extends AnyTuple>(
    interBtcApi: InterBtcApi,
    event: AugmentedEvent<ApiTypes, T>
): Promise<void> => {
    return new Promise<void>((resolve, _) => interBtcApi.system.subscribeToFinalizedBlockHeads(
        async (header) => {
            const events = await interBtcApi.api.query.system.events.at(header.parentHash);
            if (DefaultTransactionAPI.doesArrayContainEvent(events, event)) {
                resolve();
            }
        })
    );
};