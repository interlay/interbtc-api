/* eslint @typescript-eslint/no-var-requires: "off" */
import {
    ExchangeRate,
    Bitcoin,
    BitcoinUnit,
    Polkadot,
    PolkadotUnit,
    Currency,
    MonetaryAmount,
    InterBtcAmount,
    InterBtc,
} from "@interlay/monetary-js";
import { Big } from "big.js";
import BN from "bn.js";
import { createPolkadotAPI } from "../factory";
import { issueSingle, setNumericStorage } from ".";
import { ApiPromise, Keyring } from "@polkadot/api";
import {
    NominationAPI,
    OracleAPI,
    RedeemAPI,
    TransactionAPI,
} from "../parachain";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import { DefaultElectrsAPI, ElectrsAPI } from "../external";
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
import { CollateralCurrency, CollateralUnit, WrappedCurrency } from "../types";
import { newVaultId } from "./encoding";
import { DefaultInterBTCAPI } from "../interbtc-api";

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
    console.log("Error during initialization:");
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
    setExchangeRate?: true | ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>;
    btcTxFees?: true | Big;
    enableNomination?: boolean;
    issue?: true | InitializeIssue;
    redeem?: true | InitializeRedeem;
    delayMs: number;
}

function getDefaultInitializationParams(keyring: Keyring, vaultAddress: string): InitializationParams {
    return {
        setStableConfirmations: {
            bitcoinConfirmations: 0,
            parachainConfirmations: 0,
        },
        setExchangeRate: new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(
            Bitcoin,
            Polkadot,
            new Big("3855.23187")
        ),
        btcTxFees: new Big(1),
        enableNomination: true,
        issue: {
            amount: InterBtcAmount.from.BTC(0.00007),
            issuingAccount: keyring.addFromUri(USER_1_URI),
            vaultAddress,
        },
        redeem: {
            amount: InterBtcAmount.from.BTC(0.00005),
            redeemingAccount: keyring.addFromUri(USER_1_URI),
            redeemingBTCAddress: REDEEM_ADDRESS,
        },
        delayMs: 0,
    };
}

export async function initializeStableConfirmations(
    api: ApiPromise,
    stableConfirmationsToSet: ChainConfirmations,
    transactionAPI: TransactionAPI,
    bitcoinCoreClient: BitcoinCoreClient
): Promise<void> {
    console.log("Initializing stable block confirmations...");
    await setNumericStorage(
        api,
        "BTCRelay",
        "StableBitcoinConfirmations",
        new BN(stableConfirmationsToSet.bitcoinConfirmations),
        transactionAPI
    );
    await setNumericStorage(
        api,
        "BTCRelay",
        "StableParachainConfirmations",
        new BN(stableConfirmationsToSet.parachainConfirmations),
        transactionAPI
    );
    await bitcoinCoreClient.mineBlocks(3);
}

export async function initializeExchangeRate<C extends CollateralUnit>(
    exchangeRateToSet: ExchangeRate<Bitcoin, BitcoinUnit, Currency<C>, C>,
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
    api: ApiPromise,
    bitcoinCoreClient: BitcoinCoreClient,
    issuingAccount: KeyringPair,
    amountToIssue: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
    vaultAccountId: InterbtcPrimitivesVaultId
): Promise<void> {
    console.log("Initializing an issue...");
    await issueSingle(
        api,
        bitcoinCoreClient,
        issuingAccount,
        amountToIssue,
        vaultAccountId
    );
}

export async function initializeRedeem(
    redeemAPI: RedeemAPI,
    amountToRedeem: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
    redeemBTCAddress: string
): Promise<void> {
    console.log("Initializing a redeem...");
    await redeemAPI.request(amountToRedeem, redeemBTCAddress);
}

async function main(params: InitializationParams): Promise<void> {
    if (!params.initialize) {
        return Promise.resolve();
    }
    await cryptoWaitReady();
    console.log("Running initialization script...");
    const keyring = new Keyring({ type: "sr25519" });
    const vault_1 = keyring.addFromUri(VAULT_1_URI);
    const defaultInitializationParams = getDefaultInitializationParams(keyring, vault_1.address);

    const api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
    const sudoAccount = keyring.addFromUri(SUDO_URI);
    const oracleAccount = keyring.addFromUri(ORACLE_URI);

    const bitcoinCoreClient = new BitcoinCoreClient(
        BITCOIN_CORE_NETWORK,
        BITCOIN_CORE_HOST,
        BITCOIN_CORE_USERNAME,
        BITCOIN_CORE_PASSWORD,
        BITCOIN_CORE_PORT,
        BITCOIN_CORE_WALLET
    );
    const oracleAccountInterBtcApi = new DefaultInterBTCAPI(api, "regtest", InterBtc, oracleAccount, ESPLORA_BASE_PATH);
    const sudoAccountInterBtcApi = new DefaultInterBTCAPI(api, "regtest", InterBtc, sudoAccount, ESPLORA_BASE_PATH);

    if (params.setStableConfirmations !== undefined) {
        const stableConfirmationsToSet =
            params.setStableConfirmations === true
                ? (defaultInitializationParams.setStableConfirmations as ChainConfirmations)
                : params.setStableConfirmations;
        await initializeStableConfirmations(api, stableConfirmationsToSet, sudoAccountInterBtcApi.nomination, bitcoinCoreClient);
    }

    if (params.setExchangeRate !== undefined) {
        const exchangeRateToSet =
            params.setExchangeRate === true
                ? (defaultInitializationParams.setExchangeRate as ExchangeRate<
                      Bitcoin,
                      BitcoinUnit,
                      Polkadot,
                      PolkadotUnit
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
        const vaultId = newVaultId(api, issueParams.vaultAddress, Polkadot, InterBtc);
        await initializeIssue(
            api,
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
        const redeemingAccountInterBtcApi = new DefaultInterBTCAPI(api, "regtest", InterBtc, sudoAccount);
        await initializeRedeem(redeemingAccountInterBtcApi.redeem, redeemParams.amount, redeemParams.redeemingBTCAddress);
    }
    api.disconnect();
}
