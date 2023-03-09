import { Transaction } from "@interlay/esplora-btc-api";
import { Kintsugi, Kusama, MonetaryAmount, Polkadot } from "@interlay/monetary-js";
import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import Big, { RoundingMode } from "big.js";
import * as bitcoinjs from "bitcoinjs-lib";
import {
    BitcoinCoreClient,
    InterBtcApi,
    VaultStatusExt,
    CurrencyExt,
    AssetRegistryAPI,
    ForeignAsset,
    GovernanceCurrency,
    CollateralCurrencyExt,
    storageKeyToNthInner,
    createExchangeRateOracleKey,
    setStorageAtKey,
    DefaultTransactionAPI,
    encodeUnsignedFixedPoint,
    setRawStorage,
} from "../../src";
import { SUDO_URI } from "../config";
import { expect } from "chai";

export const SLEEP_TIME_MS = 1000;

// On Bitcoin mainnet, block time is ~10 mins. Speed it up to 10s during the tests.
export const BITCOIN_BLOCK_TIME_IN_MS = 10 * 1000;

// used to create, and find foreign asset aUSD for tests
export const AUSD_TICKER = "aUSD";

// oracle max delay value (set during setup and checked in test later)
export const ORACLE_MAX_DELAY = 16772736;

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitSuccess<R>(call: () => Promise<R>): Promise<R> {
    for (; ;) {
        try {
            const res = await call();
            return res;
        } catch (_) {
            await sleep(SLEEP_TIME_MS);
        }
    }
}

// Calls fn wrapped in custom exchange rate with oracles removed, so that
// exchange rate can not be overwritten during the test execution
export async function callWithExchangeRate(
    sudoInterBtcAPI: InterBtcApi,
    currency: CurrencyExt,
    exchangeRate: Big,
    fn: () => Promise<void>
): Promise<void> {
    const { account: sudoAccount, api } = sudoInterBtcAPI;
    if (!sudoAccount) {
        throw new Error("callWithExchangeRate: sudo account is not set.");
    }
    // Remove authorized oracle to make sure price won't be fed.
    const authorizedOracles = await api.query.oracle.authorizedOracles.entries();
    const authorizedOraclesAccountIds = authorizedOracles.map(([key]) => storageKeyToNthInner(key));
    const removeAllOraclesExtrinsic = api.tx.utility.batchAll(
        authorizedOraclesAccountIds.map((accountId) => api.tx.oracle.removeAuthorizedOracle(accountId))
    );
    const txResult1 = await DefaultTransactionAPI.sendLogged(
        api,
        sudoAccount,
        api.tx.sudo.sudo(removeAllOraclesExtrinsic),
        api.events.sudo.Sudid,
    )
    expect(
        txResult1.isCompleted,
        `Sudo event to remove authorized oracles not found`
    ).to.be.true;

    // Change Exchange rate storage for currency.
    const exchangeRateOracleKey = createExchangeRateOracleKey(api, currency);
    const initialExchangeRate = (await api.query.oracle.aggregate(exchangeRateOracleKey)).toHex();

    const exchangeRateStorageKey = api.query.oracle.aggregate.key(exchangeRateOracleKey);
    await setRawStorage(
        sudoInterBtcAPI.api,
        exchangeRateStorageKey,
        encodeUnsignedFixedPoint(api, exchangeRate),
        sudoAccount
    );

    let result: Promise<void>;
    try {
        await fn();
        result = Promise.resolve();
    } catch (error) {
        console.log(`Error: ${(error as Error).toString()}`);
        result = Promise.reject(error);
    } finally {
        // Restore exchange rate
        await setStorageAtKey(api, exchangeRateStorageKey, initialExchangeRate, sudoAccount);
        // Restore authorized oracles
        const restoreAllOraclesExtrinsic = api.tx.utility.batchAll(
            authorizedOracles.map(([key, value]) =>
                api.tx.oracle.insertAuthorizedOracle(storageKeyToNthInner(key), value)
            )
        );
        const txResult2 = await DefaultTransactionAPI.sendLogged(
            api,
            sudoAccount,
            api.tx.sudo.sudo(restoreAllOraclesExtrinsic),
            api.events.sudo.Sudid,
        )
        expect(
            txResult2.isCompleted,
            `Sudo event to remove authorized oracles not found`
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

export async function getIssuableAmounts(interBtcApi: InterBtcApi): Promise<Array<MonetaryAmount<CurrencyExt>>> {
    const allVaults = await interBtcApi.vaults.list();
    const activeVaults = await Promise.all(allVaults.filter(vault => vault.isBanned()));
    return Promise.all(activeVaults.map(async (vault): Promise<MonetaryAmount<CurrencyExt>> => {
        const [usedCollateral, secureThreshold] = await Promise.all([
            interBtcApi.oracle.convertWrappedToCurrency(
                vault.issuedTokens.add(vault.toBeIssuedTokens),
                vault.backingCollateral.currency
            ),
            interBtcApi.vaults.getSecureCollateralThreshold(vault.backingCollateral.currency),
        ]);
        const freeCollateral = vault.backingCollateral.sub(usedCollateral.mul(secureThreshold));
        const wrappedAmount = (await interBtcApi.oracle.convertCollateralToWrapped(freeCollateral)).div(secureThreshold);
        return wrappedAmount;
    }));
}