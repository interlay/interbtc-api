/* eslint @typescript-eslint/no-var-requires: "off" */
import { ExchangeRate, Bitcoin, BitcoinUnit, Currency, MonetaryAmount } from "@interlay/monetary-js";
import { Big } from "big.js";
import BN from "bn.js";
import { ApiPromise, Keyring } from "@polkadot/api";

import { createSubstrateAPI } from "../factory";
import { issueSingle } from "./issueRedeem";
import { setNumericStorage } from "./storage";
import { NominationAPI, OracleAPI, RedeemAPI } from "../parachain";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import {
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    ESPLORA_BASE_PATH,
    ORACLE_URI,
    PARACHAIN_ENDPOINT,
    REDEEM_ADDRESS,
    SUDO_URI,
    USER_1_URI,
    VAULT_1_URI,
} from "../../test/config";
import { CollateralCurrency, CollateralUnit, CurrencyUnit, WrappedCurrency } from "../types";
import { newVaultId } from "./encoding";
import { InterBtcApi, DefaultInterBtcApi, newMonetaryAmount, getCorrespondingCollateralCurrencies } from "..";
import { AddressOrPair } from "@polkadot/api/types";

// Command line arguments of the initialization script
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv))
    .option("initialize", {
        type: "boolean",
        description: "Flag that decides whether this script should be run or not",
        default: false,
    })
    .option("set-stable-confirmations", {
        type: "boolean",
        description: "Set the required bitcoin and parachain confirmations to zero",
        default: true,
    })
    .option("set-exchange-rate", {
        type: "boolean",
        description: "Set the BTC/DOT exchange rate to 3855.23187",
        default: true,
    })
    .option("enable-nomination", {
        type: "boolean",
        description: "Enable vault nomination",
        default: true,
    })
    .option("issue", {
        type: "boolean",
        description: "Issue 0.1 InterBtc",
        default: true,
    })
    .option("redeem", {
        type: "boolean",
        description: "Redeem 0.05 InterBtc",
        default: true,
    }).argv;

main(argv as InitializationParams).catch((err) => {
    console.log("Error during setup:");
    console.log(err);
});

export interface ChainConfirmations {
    bitcoinConfirmations: number;
    parachainConfirmations: number;
}

export interface InitializeIssue {
    amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    issuingAccount: KeyringPair;
    vaultAddress: string;
}

export interface InitializeRedeem {
    amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>;
    redeemingAccount: KeyringPair;
    redeemingBTCAddress: string;
}

export interface InitializationParams {
    initialize?: boolean;
    setStableConfirmations?: true | ChainConfirmations;
    setExchangeRate?: true | ExchangeRate<Bitcoin, BitcoinUnit, Currency<CollateralUnit>, CollateralUnit>;
    btcTxFees?: true | Big;
    enableNomination?: boolean;
    issue?: true | InitializeIssue;
    redeem?: true | InitializeRedeem;
    delayMs: number;
}

function getDefaultInitializationParams<U extends CurrencyUnit>(
    keyring: Keyring,
    vaultAddress: string,
    wrappedCurrency: WrappedCurrency,
    collateralCurrency: Currency<U>
): InitializationParams {
    return {
        setStableConfirmations: {
            bitcoinConfirmations: 0,
            parachainConfirmations: 0,
        },
        setExchangeRate: new ExchangeRate<Bitcoin, BitcoinUnit, Currency<U>, U>(
            Bitcoin,
            collateralCurrency,
            new Big("3855.23187")
        ) as unknown as ExchangeRate<Bitcoin, BitcoinUnit, Currency<CollateralUnit>, CollateralUnit>,
        btcTxFees: new Big(1),
        enableNomination: true,
        issue: {
            amount: newMonetaryAmount(0.00007, wrappedCurrency),
            issuingAccount: keyring.addFromUri(USER_1_URI),
            vaultAddress,
        },
        redeem: {
            amount: newMonetaryAmount(0.00005, wrappedCurrency),
            redeemingAccount: keyring.addFromUri(USER_1_URI),
            redeemingBTCAddress: REDEEM_ADDRESS,
        },
        delayMs: 0,
    };
}

export async function initializeStableConfirmations(
    api: ApiPromise,
    stableConfirmationsToSet: ChainConfirmations,
    account: AddressOrPair,
    bitcoinCoreClient: BitcoinCoreClient
): Promise<void> {
    console.log("Initializing stable block confirmations...");
    await setNumericStorage(
        api,
        "BTCRelay",
        "StableBitcoinConfirmations",
        new BN(stableConfirmationsToSet.bitcoinConfirmations),
        account
    );
    await setNumericStorage(
        api,
        "BTCRelay",
        "StableParachainConfirmations",
        new BN(stableConfirmationsToSet.parachainConfirmations),
        account
    );
    await bitcoinCoreClient.mineBlocks(3);
}

export async function initializeExchangeRate<U extends CurrencyUnit>(
    exchangeRateToSet: ExchangeRate<Bitcoin, BitcoinUnit, Currency<U>, U>,
    oracleAPI: OracleAPI
): Promise<void> {
    console.log("Initializing the exchange rate...");
    await oracleAPI.setExchangeRate(exchangeRateToSet);
}

export async function initializeBtcTxFees(fees: Big, oracleAPI: OracleAPI): Promise<void> {
    console.log("Initializing BTC tx fees...");
    await oracleAPI.setBitcoinFees(fees);
    await oracleAPI.waitForFeeEstimateUpdate();
}

export async function initializeVaultNomination(enabled: boolean, nominationAPI: NominationAPI): Promise<void> {
    console.log("Initializing vault nomination...");
    await nominationAPI.setNominationEnabled(enabled);
}

export async function initializeIssue(
    InterBtcApi: InterBtcApi,
    bitcoinCoreClient: BitcoinCoreClient,
    issuingAccount: KeyringPair,
    amountToIssue: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
    vaultAccountId: InterbtcPrimitivesVaultId
): Promise<void> {
    console.log("Initializing an issue...");
    await issueSingle(InterBtcApi, bitcoinCoreClient, issuingAccount, amountToIssue, vaultAccountId);
}

export async function initializeRedeem(
    redeemAPI: RedeemAPI,
    amountToRedeem: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
    redeemBTCAddress: string
): Promise<void> {
    console.log("Initializing a redeem...");
    await redeemAPI.request(amountToRedeem, redeemBTCAddress);
}

async function main<U extends CurrencyUnit>(params: InitializationParams): Promise<void> {
    if (!params.initialize) {
        return Promise.resolve();
    }
    await cryptoWaitReady();
    console.log("Running initialization script...");
    const keyring = new Keyring({ type: "sr25519" });
    const vault_1 = keyring.addFromUri(VAULT_1_URI);

    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
    const sudoAccount = keyring.addFromUri(SUDO_URI);
    const oracleAccount = keyring.addFromUri(ORACLE_URI);

    const oracleAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
    const sudoAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

    const wrappedCurrency = sudoAccountInterBtcApi.getWrappedCurrency();
    const collateralCurrencies = getCorrespondingCollateralCurrencies(
        sudoAccountInterBtcApi.getGovernanceCurrency()
    ) as unknown as Array<Currency<U>>;
    // TODO: figure out if we want to initialize alternative collateral currencies (like KINT in additon to KSM), too?
    const collateralCurrency = collateralCurrencies[0];

    const defaultInitializationParams = getDefaultInitializationParams<U>(
        keyring,
        vault_1.address,
        wrappedCurrency,
        collateralCurrency
    );
    const bitcoinCoreClient = new BitcoinCoreClient(
        BITCOIN_CORE_NETWORK,
        BITCOIN_CORE_HOST,
        BITCOIN_CORE_USERNAME,
        BITCOIN_CORE_PASSWORD,
        BITCOIN_CORE_PORT,
        BITCOIN_CORE_WALLET
    );

    if (params.setStableConfirmations !== undefined) {
        const stableConfirmationsToSet =
            params.setStableConfirmations === true
                ? (defaultInitializationParams.setStableConfirmations as ChainConfirmations)
                : params.setStableConfirmations;
        await initializeStableConfirmations(api, stableConfirmationsToSet, sudoAccount, bitcoinCoreClient);
    }

    if (params.setExchangeRate !== undefined) {
        const exchangeRateToSet =
            params.setExchangeRate === true
                ? (defaultInitializationParams.setExchangeRate as unknown as ExchangeRate<
                      Bitcoin,
                      BitcoinUnit,
                      Currency<CollateralUnit>,
                      CollateralUnit
                  >)
                : params.setExchangeRate;
        await initializeExchangeRate(exchangeRateToSet, oracleAccountInterBtcApi.oracle);
    }

    if (params.btcTxFees !== undefined) {
        const btcTxFees = params.btcTxFees === true ? (defaultInitializationParams.btcTxFees as Big) : params.btcTxFees;
        await initializeBtcTxFees(btcTxFees, oracleAccountInterBtcApi.oracle);
    }

    if (params.enableNomination === true) {
        initializeVaultNomination(params.enableNomination, sudoAccountInterBtcApi.nomination);
    }

    if (params.issue !== undefined) {
        const issueParams =
            params.issue === true
                ? (defaultInitializationParams.issue as InitializeIssue)
                : (params.issue as InitializeIssue);
        const vaultId = newVaultId(
            api,
            issueParams.vaultAddress,
            collateralCurrency as unknown as CollateralCurrency,
            wrappedCurrency
        );
        await initializeIssue(
            sudoAccountInterBtcApi,
            bitcoinCoreClient,
            issueParams.issuingAccount,
            issueParams.amount,
            vaultId
        );
    }

    if (params.redeem !== undefined) {
        const redeemParams =
            params.redeem === true
                ? (defaultInitializationParams.redeem as InitializeRedeem)
                : (params.redeem as InitializeRedeem);
        const redeemingAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", sudoAccount);
        await initializeRedeem(
            redeemingAccountInterBtcApi.redeem,
            redeemParams.amount,
            redeemParams.redeemingBTCAddress
        );
    }
    api.disconnect();
}
