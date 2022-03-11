import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, BitcoinAmount, BitcoinUnit, Currency, ExchangeRate } from "@interlay/monetary-js";
import Big from "big.js";

import { createSubstrateAPI } from "../../../../../src/factory";
import { assert } from "../../../../chai";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT } from "../../../../config";
import { CollateralUnit, DefaultInterBtcApi, getCorrespondingCollateralCurrency, InterBtcApi, WrappedCurrency } from "../../../../../src";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let interBtcAPI: InterBtcApi;
    let wrappedCurrency: WrappedCurrency;
    let collateralCurrency: Currency<CollateralUnit>;
    let oracleAccount: KeyringPair;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
        collateralCurrency = getCorrespondingCollateralCurrency(interBtcAPI.getGovernanceCurrency()) as Currency<CollateralUnit>;
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
    });

    after(() => {
        return api.disconnect();
    });

    it("should set exchange rate", async () => {
        const exchangeRateValue = new Big("3913.7424920372646687827621");
        const newExchangeRate = new ExchangeRate<
            Bitcoin,
            BitcoinUnit,
            typeof collateralCurrency,
            typeof collateralCurrency.units
        >(Bitcoin, collateralCurrency, exchangeRateValue);
        await interBtcAPI.oracle.setExchangeRate(newExchangeRate);
        await interBtcAPI.oracle.waitForExchangeRateUpdate(newExchangeRate);
    });

    it("should convert satoshi to planck", async () => {
        const bitcoinAmount = BitcoinAmount.from.BTC(100);
        const exchangeRate = await interBtcAPI.oracle.getExchangeRate(collateralCurrency);
        const expectedCollateral = exchangeRate.toBig(undefined).mul(bitcoinAmount.toBig(BitcoinUnit.BTC)).round(0, 0);

        const collateralAmount = await interBtcAPI.oracle.convertWrappedToCurrency(bitcoinAmount, collateralCurrency);
        assert.equal(collateralAmount.toBig(collateralCurrency.base).round(0, 0).toString(), expectedCollateral.toString());
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
        const validUntil = await interBtcAPI.oracle.getValidUntil(collateralCurrency);
        const dateAnHourFromNow = new Date();
        dateAnHourFromNow.setMinutes(dateAnHourFromNow.getMinutes() + 30);
        assert.isTrue(validUntil > dateAnHourFromNow, "lastExchangeRateTime is older than one hour");
    });

    it("should be online", async () => {
        const isOnline = await interBtcAPI.oracle.isOnline();
        assert.isTrue(isOnline);
    });
});
