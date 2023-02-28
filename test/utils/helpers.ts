import { Transaction } from "@interlay/esplora-btc-api";
import { Bitcoin, ExchangeRate, Kintsugi, Kusama, Polkadot } from "@interlay/monetary-js";
import { Keyring } from "@polkadot/api";
import { ApiTypes, AugmentedEvent } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { FrameSystemEventRecord } from "@polkadot/types/lookup";
import { AnyTuple } from "@polkadot/types/types";
import { Vec } from "@polkadot/types-codec";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import Big, { RoundingMode } from "big.js";
import * as bitcoinjs from "bitcoinjs-lib";
import {
    BitcoinCoreClient,
    InterBtcApi,
    OracleAPI,
    VaultStatusExt,
    CurrencyExt,
    AssetRegistryAPI,
    ForeignAsset,
    GovernanceCurrency,
    CollateralCurrencyExt,
    storageKeyToNthInner,
    createExchangeRateOracleKey,
    getStorageMapItemKey,
    setStorageAtKey,
} from "../../src";
import { SUDO_URI } from "../config";
import { expect } from "chai";

export const SLEEP_TIME_MS = 1000;

// On Bitcoin mainnet, block time is ~10 mins. Speed it up to 10s during the tests.
export const BITCOIN_BLOCK_TIME_IN_MS = 10 * 1000;

// used to create, and find foreign asset aUSD for tests
export const AUSD_TICKER = "aUSD";

// approximate time per block in ms
export const APPROX_BLOCK_TIME_MS = 12 * 1000;

// oracle max delay value (set during setup and checked in test later)
export const ORACLE_MAX_DELAY = 16772736;

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function wait_success<R>(call: () => Promise<R>): Promise<R> {
    for (; ;) {
        try {
            const res = await call();
            return res;
        } catch (_) {
            await sleep(SLEEP_TIME_MS);
        }
    }
}

export async function callWithExchangeRate(
    oracleAPI: OracleAPI,
    exchangeRate: ExchangeRate<Bitcoin, CurrencyExt>,
    fn: () => Promise<void>
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

// Calls fn wrapped in custom exchange rate with oracles removed, so that
// exchange rate can not be overwritten during the test execution
export async function callWithExchangeRateOverwritten(
    sudoInterBtcAPI: InterBtcApi,
    currency: CurrencyExt,
    newExchangeRateHex: `0x${string}`,
    fn: () => Promise<void>
): Promise<void> {
    const { account: sudoAccount, api } = sudoInterBtcAPI;
    const approx10Blocks = APPROX_BLOCK_TIME_MS * 10;
    if (!sudoAccount) {
        throw new Error("callWithExchangeRate: sudo account is not set.");
    }
    // Remove authorized oracle to make sure price won't be fed.
    const authorizedOracles = await api.query.oracle.authorizedOracles.entries();
    const authorizedOraclesAccountIds = authorizedOracles.map(([key]) => storageKeyToNthInner(key));
    const removeAllOraclesExtrinsic = api.tx.utility.batchAll(
        authorizedOraclesAccountIds.map((accountId) => api.tx.oracle.removeAuthorizedOracle(accountId))
    );
    const [removeOraclesEventFound] = await Promise.all([
        waitForEvent(sudoInterBtcAPI, api.events.sudo.Sudid, false, approx10Blocks),
        api.tx.sudo.sudo(removeAllOraclesExtrinsic).signAndSend(sudoAccount),
    ]);
    expect(
        removeOraclesEventFound,
        `Sudo event to remove authorized oracles not found - timed out after ${approx10Blocks} ms`
    ).to.be.true;

    // Change Exchange rate storage for currency.
    const exchangeRateOracleKey = createExchangeRateOracleKey(api, currency);
    const initialExchangeRate = (await api.query.oracle.aggregate(exchangeRateOracleKey)).toHex();

    const exchangeRateStorageKey = getStorageMapItemKey("Oracle", "Aggregate", exchangeRateOracleKey.toHex());
    await setStorageAtKey(sudoInterBtcAPI.api, exchangeRateStorageKey, newExchangeRateHex, sudoAccount);

    let result: Promise<void>;
    try {
        await fn();
        result = Promise.resolve();
    } catch (error) {
        console.log(`Error: ${(error as Error).toString()}`);
        result = Promise.reject(error);
    } finally {
        // Restore exchange rate
        await setStorageAtKey(sudoInterBtcAPI.api, exchangeRateStorageKey, initialExchangeRate, sudoAccount);
        // Restore authorized oracles
        const restoreAllOraclesExtrinsic = api.tx.utility.batchAll(
            authorizedOracles.map(([key, value]) =>
                api.tx.oracle.insertAuthorizedOracle(storageKeyToNthInner(key), value)
            )
        );
        const [restoreOraclesEventFound] = await Promise.all([
            waitForEvent(sudoInterBtcAPI, api.events.sudo.Sudid, false, approx10Blocks),
            api.tx.sudo.sudo(restoreAllOraclesExtrinsic).signAndSend(sudoAccount),
        ]);
        expect(
            restoreOraclesEventFound,
            `Sudo event to remove authorized oracles not found - timed out after ${approx10Blocks} ms`
        ).to.be.true;
    }

    return result;
}

/*
    Assumption: the `call` argument uses one of the APIs in `InterBtcApi`.
    Since `InterBtcApi` is passed by reference, modifying the account before
    the call means `call` uses that account.
*/
export async function callWith(InterBtcApi: InterBtcApi, key: KeyringPair, call: () => Promise<void>): Promise<void> {
    const prevKey = InterBtcApi.account;
    InterBtcApi.setAccount(key);
    let result;
    try {
        result = await call();
    } finally {
        if (prevKey) InterBtcApi.setAccount(prevKey);
    }
    return result;
}

export function sudo(InterBtcApi: InterBtcApi, call: () => Promise<void>): Promise<void> {
    const keyring = new Keyring({ type: "sr25519" });
    const rootKey = keyring.addFromUri(SUDO_URI);
    return callWith(InterBtcApi, rootKey, call);
}

export function makeRandomBitcoinAddress(): string {
    const pair = bitcoinjs.ECPair.makeRandom();
    const p2pkh = bitcoinjs.payments.p2pkh({ pubkey: pair.publicKey, network: bitcoinjs.networks.regtest });
    if (!p2pkh.address) {
        throw new Error("Failed to make random bitcoin address");
    }
    return p2pkh.address;
}

export function makeRandomPolkadotKeyPair(keyring: Keyring): KeyringPair {
    const mnemonic = mnemonicGenerate(12);
    return keyring.addFromUri(mnemonic);
}

export async function runWhileMiningBTCBlocks(
    bitcoinCoreClient: BitcoinCoreClient,
    fn: () => Promise<void>
): Promise<void> {
    function generateBlocks() {
        bitcoinCoreClient.mineBlocks(1);
    }

    const intervalId = setInterval(generateBlocks, BITCOIN_BLOCK_TIME_IN_MS);
    try {
        await fn();
    } finally {
        clearInterval(intervalId);
    }
}

export const vaultStatusToLabel = (status: VaultStatusExt): string => {
    switch (status) {
        case VaultStatusExt.Active:
            return "Active";
        case VaultStatusExt.Inactive:
            return "Inactive";
        case VaultStatusExt.Liquidated:
            return "Liquidated";
    }
};

// use the same exchange rate as the running oracles use
// to avoid flaky tests due to updated prices from the oracle client(s)
// note: currently the same for all collateral currencies - might change in future
export const getExchangeRateValueToSetForTesting = (_collateralCurrency: CurrencyExt): Big => new Big("230.0");

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
    conservative = "conservative",
}

export interface RbfOptions {
    conf_target?: number;
    fee_rate?: string | number;
    replaceable?: boolean;
    estimate_mode?: RbfEstimateMode;
}

export interface RbfResponse {
    psbt?: string;
    txid?: string;
    origfee: number;
    fee: number;
    errors: string[];
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
    options: RbfOptions = { conf_target: 72, estimate_mode: RbfEstimateMode.economical }
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
    return new Promise<void>((resolve, _) =>
        interBtcApi.system.subscribeToFinalizedBlockHeads(async (header) => {
            const events = await interBtcApi.api.query.system.events.at(header.parentHash);
            if (eventRecordVectorContains(events, event)) {
                resolve();
            }
        })
    );
};

/**
 * Wait for an event to show up on chain (unfinalized).
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
export const waitForIncludedEvent = async <T extends AnyTuple>(
    interBtcApi: InterBtcApi,
    event: AugmentedEvent<ApiTypes, T>
): Promise<void> => {
    return new Promise<void>((resolve, _) =>
        interBtcApi.system.subscribeToCurrentBlockHeads(async (header) => {
            const events = await interBtcApi.api.query.system.events.at(header.parentHash);
            if (eventRecordVectorContains(events, event)) {
                resolve();
            }
        })
    );
};

const eventRecordVectorContains = <T extends AnyTuple>(
    eventRecords: Vec<FrameSystemEventRecord>,
    event: AugmentedEvent<ApiTypes, T>
): boolean => {
    return eventRecords.find((record) => event.is(record.event)) !== undefined;
};

/**
 * Wait for an event to show up on chain.
 *
 * This method will only subscribe to new blocks once called and then look for a specific event.
 *
 * Note: This method checks the parent blocks in case the event we are looking for
 * was finalized/included in a block just before this method was called.
 * @param interBtcApi the api to use for querying
 * @param event the event to wait for, eg. `api.events.assetRegistry.RegisteredAsset`
 * @param finalized [optional] true to wait for finalized event, false (default) to only wait for included event
 * @param timeoutMs [optional] a timeout in milliseconds to wait for the event. Rejects if not found before timeout. Default: no timeout
 * @returns a promise that resolves when the event is found, and if a timeout is provided, rejects if not found before timeout.
 */
export const waitForEvent = async <T extends AnyTuple>(
    interBtcApi: InterBtcApi,
    event: AugmentedEvent<ApiTypes, T>,
    finalized: boolean = false,
    timeoutMs?: number
): Promise<boolean> => {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise =
        timeoutMs !== undefined
            ? new Promise<void>((_, reject) => {
                timeoutHandle = setTimeout(() => reject(), timeoutMs);
            })
            : Promise.resolve();

    const waitForEventPromise = finalized
        ? waitForFinalizedEvent(interBtcApi, event)
        : waitForIncludedEvent(interBtcApi, event);

    await Promise.race([waitForEventPromise, timeoutPromise]).then((_) => {
        clearTimeout(timeoutHandle);
    });

    return true;
};

export const getAUSDForeignAsset = async (assetRegistryApi: AssetRegistryAPI): Promise<ForeignAsset | undefined> => {
    const foreignAssets = await assetRegistryApi.getForeignAssets();
    return foreignAssets.find((asset) => asset.ticker === AUSD_TICKER);
};

// for tests: get the collateral currencies (excluding foreign assets) associated with the governance currency
export function getCorrespondingCollateralCurrenciesForTests(
    governanceCurrency: GovernanceCurrency
): Array<CollateralCurrencyExt> {
    switch (governanceCurrency.ticker) {
        case "KINT":
            return [Kusama, Kintsugi];
        case "INTR":
            return [Polkadot];
        default:
            throw new Error("Provided currency is not a governance currency");
    }
}

type ImplementsToString = { toString: () => string };
/**
 * Alternative to `arr.includes(element)` that check stringified version of the items for equality.
 * Useful for types such as `AccountId`.
 * @param arr
 * @param element
 * @returns a boolean representing the presence of the stringified version of `elements` amongts the
 * stringified items of `arr`
 */
export function includesStringified<T extends ImplementsToString>(arr: Array<T>, element: T): boolean {
    if (arr.length == 0) {
        return false;
    }
    return arr.map((x) => x.toString() == element.toString()).reduce((acc, value) => acc || value);
}
