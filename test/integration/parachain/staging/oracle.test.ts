import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, BitcoinAmount, BitcoinUnit, ExchangeRate, Polkadot, PolkadotUnit } from "@interlay/monetary-js";
import Big from "big.js";

import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { COLLATERAL_CURRENCY_TICKER, ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT, WRAPPED_CURRENCY_TICKER } from "../../../config";
import { CollateralCurrency, DefaultInterBTCAPI, InterBTCAPI, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let interBtcAPI: InterBTCAPI;
    let wrappedCurrency: WrappedCurrency;
    let oracleAccount: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        interBtcAPI = new DefaultInterBTCAPI(api, "regtest", wrappedCurrency, oracleAccount, ESPLORA_BASE_PATH);
    });

    after(() => {
        return api.disconnect();
    });

    it("exchange rate should be set", async () => {
        // just check that this is set, don't hardcode anything
        // as the oracle client may change the exchange rate
        const exchangeRate = await interBtcAPI.oracle.getExchangeRate(Polkadot);
        assert.isDefined(exchangeRate);
    });

    it("should set exchange rate", async () => {
        const exchangeRateValue = new Big("3913.7424920372646687827621");
        const newExchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await interBtcAPI.oracle.setExchangeRate(newExchangeRate);
        await interBtcAPI.oracle.waitForExchangeRateUpdate(newExchangeRate);
    });

    it("should convert satoshi to planck", async () => {
        const bitcoinAmount = BitcoinAmount.from.BTC(100);
        const exchangeRate = await interBtcAPI.oracle.getExchangeRate(Polkadot);
        const expectedCollateral = exchangeRate.toBig(undefined).mul(bitcoinAmount.toBig(BitcoinUnit.BTC)).round(0, 0);

        const collateralAmount = await interBtcAPI.oracle.convertWrappedToCurrency(bitcoinAmount, Polkadot);
        assert.equal(collateralAmount.toBig(Polkadot.units.DOT).round(0, 0).toString(), expectedCollateral.toString());
    });

    it("should get names by id", async () => {
        const expectedSources = new Map<string, string>();
        expectedSources.set("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "Alice");
        expectedSources.set("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "Bob");
        expectedSources.set("5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", "Charlie");
        const sources = await interBtcAPI.oracle.getSourcesById();
        for (const entry of sources.entries()) {
            assert.equal(entry[1], expectedSources.get(entry[0]));
        }
    });

    it("should getOnlineTimeout", async () => {
        const onlineTimeout = await interBtcAPI.oracle.getOnlineTimeout();
        const expectedOnlineTimeout = 3600000;
        assert.equal(onlineTimeout, expectedOnlineTimeout);
    });

    it("should getValidUntil", async () => {
        const validUntil = await interBtcAPI.oracle.getValidUntil(Polkadot);
        const dateAnHourFromNow = new Date();
        dateAnHourFromNow.setMinutes(dateAnHourFromNow.getMinutes() + 30);
        assert.isTrue(validUntil > dateAnHourFromNow, "lastExchangeRateTime is older than one hour");
    });

    it("should be online", async () => {
        const isOnline = await interBtcAPI.oracle.isOnline();
        assert.isTrue(isOnline);
    });
});
