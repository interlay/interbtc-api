/* eslint @typescript-eslint/no-var-requires: "off" */
import { ExchangeRate, Bitcoin } from "@interlay/monetary-js";
import { Big } from "big.js";
import { ApiPromise } from "@polkadot/api";
import { setNumericStorage } from "./storage";
import { NominationAPI, OracleAPI } from "../parachain";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import { CurrencyExt } from "../types";
import { AddressOrPair } from "@polkadot/api/types";

export async function initializeStableConfirmations(
    api: ApiPromise,
    stableConfirmationsToSet: {
        bitcoinConfirmations: number;
        parachainConfirmations: number;
    },
    account: AddressOrPair,
    bitcoinCoreClient: BitcoinCoreClient
): Promise<void> {
    console.log("Initializing stable block confirmations...");
    await setNumericStorage(
        api,
        api.query.btcRelay.stableBitcoinConfirmations.key(),
        api.createType("u32", stableConfirmationsToSet.bitcoinConfirmations),
        account
    );
    await setNumericStorage(
        api,
        api.query.btcRelay.stableParachainConfirmations.key(),
        api.createType("u32", stableConfirmationsToSet.parachainConfirmations),
        account
    );
    await bitcoinCoreClient.mineBlocks(3);
}

export async function initializeExchangeRate(
    exchangeRateToSet: ExchangeRate<Bitcoin, CurrencyExt>,
    oracleAPI: OracleAPI
): Promise<void> {
    console.log("Initializing the exchange rate...");
    await oracleAPI.setExchangeRate(exchangeRateToSet);
}

export async function initializeBtcTxFees(fees: Big, oracleAPI: OracleAPI): Promise<void> {
    console.log("Initializing BTC tx fees...");
    await oracleAPI.setBitcoinFees(fees);
}

export async function initializeVaultNomination(enabled: boolean, nominationAPI: NominationAPI): Promise<void> {
    console.log("Initializing vault nomination...");
    await nominationAPI.setNominationEnabled(enabled);
}
