/* eslint @typescript-eslint/no-var-requires: "off" */
import { ExchangeRate, Bitcoin, BTCUnit, Polkadot, PolkadotUnit, BTCAmount, Currency } from "@interlay/monetary-js";
import { Big } from "big.js";
import BN from "bn.js";
import { createPolkadotAPI } from "../factory";
import { issueSingle, REGTEST_ESPLORA_BASE_PATH, setNumericStorage } from ".";
import { ApiPromise, Keyring } from "@polkadot/api";
import {
    DefaultNominationAPI,
    DefaultOracleAPI,
    DefaultRedeemAPI,
    NominationAPI,
    OracleAPI,
    RedeemAPI,
    TransactionAPI,
} from "../parachain";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import { DefaultElectrsAPI, ElectrsAPI } from "../external";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import {
    DEFAULT_BITCOIN_CORE_HOST,
    DEFAULT_BITCOIN_CORE_NETWORK,
    DEFAULT_BITCOIN_CORE_PASSWORD,
    DEFAULT_BITCOIN_CORE_PORT,
    DEFAULT_BITCOIN_CORE_USERNAME,
    DEFAULT_BITCOIN_CORE_WALLET,
    DEFAULT_PARACHAIN_ENDPOINT,
    DEFAULT_REDEEM_ADDRESS,
} from "../../test/config";
import { CollateralUnit } from "../types";

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
        description: "Issue 0.1 interBTC",
        default: true,
    })
    .option("redeem", {
        type: "boolean",
        description: "Redeem 0.05 interBTC",
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
    amount: BTCAmount;
    issuingAccount: KeyringPair;
    vaultAddress: string;
}

export interface InitializeRedeem {
    amount: BTCAmount;
    redeemingAccount: KeyringPair;
    redeemingBTCAddress: string;
}

export interface InitializationParams {
    initialize?: boolean;
    setStableConfirmations?: true | ChainConfirmations;
    setExchangeRate?: true | ExchangeRate<Bitcoin, BTCUnit, Polkadot, PolkadotUnit>;
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
        setExchangeRate: new ExchangeRate<Bitcoin, BTCUnit, Polkadot, PolkadotUnit>(
            Bitcoin,
            Polkadot,
            new Big("3855.23187")
        ),
        enableNomination: true,
        issue: {
            amount: BTCAmount.from.BTC(0.1),
            issuingAccount: keyring.addFromUri("//Alice"),
            vaultAddress,
        },
        redeem: {
            amount: BTCAmount.from.BTC(0.05),
            redeemingAccount: keyring.addFromUri("//Alice"),
            redeemingBTCAddress: DEFAULT_REDEEM_ADDRESS,
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
    exchangeRateToSet: ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>,
    oracleAPI: OracleAPI
): Promise<void> {
    console.log("Initializing the exchange rate...");
    await oracleAPI.setExchangeRate(exchangeRateToSet);
}

export async function initializeVaultNomination(enabled: boolean, nominationAPI: NominationAPI): Promise<void> {
    console.log("Initializing vault nomination...");
    await nominationAPI.setNominationEnabled(enabled);
}

export async function initializeIssue(
    api: ApiPromise,
    electrsAPI: ElectrsAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    issuingAccount: KeyringPair,
    amountToIssue: BTCAmount,
    vaultAddress: string
): Promise<void> {
    console.log("Initializing an interBTC issue...");
    await issueSingle(api, electrsAPI, bitcoinCoreClient, issuingAccount, amountToIssue, Polkadot, vaultAddress);
}

export async function initializeRedeem(
    redeemAPI: RedeemAPI,
    amountToRedeem: BTCAmount,
    redeemBTCAddress: string
): Promise<void> {
    console.log("Initializing an interBTC redeem...");
    await redeemAPI.request(amountToRedeem, redeemBTCAddress);
}

async function main(params: InitializationParams): Promise<void> {
    if (!params.initialize) {
        return Promise.resolve();
    }
    await cryptoWaitReady();
    console.log("Running initialization script...");
    const keyring = new Keyring({ type: "sr25519" });
    const charlieStash = keyring.addFromUri("//Charlie//stash");
    const defaultInitializationParams = getDefaultInitializationParams(keyring, charlieStash.address);

    const api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
    const alice = keyring.addFromUri("//Alice");
    const bob = keyring.addFromUri("//Bob");

    const electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
    const bitcoinCoreClient = new BitcoinCoreClient(
        DEFAULT_BITCOIN_CORE_NETWORK,
        DEFAULT_BITCOIN_CORE_HOST,
        DEFAULT_BITCOIN_CORE_USERNAME,
        DEFAULT_BITCOIN_CORE_PASSWORD,
        DEFAULT_BITCOIN_CORE_PORT,
        DEFAULT_BITCOIN_CORE_WALLET
    );
    const oracleAPI = new DefaultOracleAPI(api, bob);
    // initialize the nomination API with Alice in order to make sudo calls
    const nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);

    if (params.setStableConfirmations !== undefined) {
        const stableConfirmationsToSet =
            params.setStableConfirmations === true
                ? (defaultInitializationParams.setStableConfirmations as ChainConfirmations)
                : params.setStableConfirmations;
        await initializeStableConfirmations(api, stableConfirmationsToSet, nominationAPI, bitcoinCoreClient);
    }

    if (params.setExchangeRate !== undefined) {
        const exchangeRateToSet =
            params.setExchangeRate === true
                ? (defaultInitializationParams.setExchangeRate as ExchangeRate<
                      Bitcoin,
                      BTCUnit,
                      Polkadot,
                      PolkadotUnit
                  >)
                : params.setExchangeRate;
        await initializeExchangeRate(exchangeRateToSet, oracleAPI);
    }

    if (params.enableNomination === true) {
        initializeVaultNomination(params.enableNomination, nominationAPI);
    }

    if (params.issue !== undefined) {
        const issueParams =
            params.issue === true
                ? (defaultInitializationParams.issue as InitializeIssue)
                : (params.issue as InitializeIssue);
        await initializeIssue(
            api,
            electrsAPI,
            bitcoinCoreClient,
            issueParams.issuingAccount,
            issueParams.amount,
            issueParams.vaultAddress
        );
    }

    if (params.redeem !== undefined) {
        const redeemParams =
            params.redeem === true
                ? (defaultInitializationParams.redeem as InitializeRedeem)
                : (params.redeem as InitializeRedeem);
        const redeemAPI = new DefaultRedeemAPI(
            api,
            bitcoinjs.networks.regtest,
            electrsAPI,
            redeemParams.redeemingAccount
        );

        await initializeRedeem(redeemAPI, redeemParams.amount, redeemParams.redeemingBTCAddress);
    }
    api.disconnect();
}
