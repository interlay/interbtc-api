import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import { DefaultOracleAPI, OracleAPI } from "../../../../src/parachain/oracle";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import Big from "big.js";
import { Bitcoin, BTCAmount, BTCUnit, ExchangeRate, Polkadot, PolkadotUnit } from "@interlay/monetary-js";
import { INDEX_LOCAL_URL } from "../../../../src";
import { WrappedIndexAPI, DefaultIndexAPI } from "../../../../src/external/interbtc-index";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let bob: KeyringPair;
    let charlie: KeyringPair;
    let indexAPI: WrappedIndexAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
        charlie = keyring.addFromUri("//Charlie");
        oracle = new DefaultOracleAPI(api);
        oracle.setAccount(bob);
        indexAPI = DefaultIndexAPI({ basePath: INDEX_LOCAL_URL }, api);
    });

    after(() => {
        return api.disconnect();
    });

    it("initial setup should have set a rate of 3855.23187", async () => {
        const exchangeRate = await oracle.getExchangeRate(Polkadot);
        assert.equal(exchangeRate.toString(undefined, 5, 0), "3855.23187");
    });

    it("should set exchange rate", async () => {
        const previousExchangeRate = await oracle.getExchangeRate(Polkadot);
        const exchangeRateValue = new Big("3913.7424920372646687827621");
        const exchangeRateToSet = new ExchangeRate<Bitcoin, BTCUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await oracle.setExchangeRate(exchangeRateToSet);
        const exchangeRate = await oracle.getExchangeRate(Polkadot);
        assert.equal(exchangeRateToSet.toBig().round(8, 0).toString(), exchangeRate.toBig().round(8, 0).toString());

        const cachedExchangeRate = await indexAPI.getLatestSubmission();
        assert.equal(cachedExchangeRate.exchangeRate.toBig().round(8, 0).toString(), exchangeRate.toBig().round(8, 0).toString());

        const cachedOracleSubmissions = await indexAPI.getLatestSubmissionForEachOracle();
        assert.equal(cachedOracleSubmissions.length, 2);
        assert.equal(cachedOracleSubmissions[0].id, bob.address);
        assert.equal(cachedOracleSubmissions[1].id, charlie.address);
        assert.equal(cachedOracleSubmissions[0].exchangeRate.toBig().round(8, 0).toString(), exchangeRate.toBig().round(8, 0).toString());

        // Revert the exchange rate to its initial value,
        // so that this test is idempotent
        await oracle.setExchangeRate(previousExchangeRate);
    });

    it("should convert satoshi to planck", async () => {
        const wrappedAmount = BTCAmount.from.BTC(100);
        const collateralAmount = await oracle.convertWrappedToCollateral(wrappedAmount, Polkadot);
        assert.equal(collateralAmount.toBig(Polkadot.units.DOT).round(0, 0).toString(), "385523");
    });

    it("should set BTC tx fees", async () => {
        const prev = await oracle.getBtcTxFeesPerByte();
        const fees = {fast: 505, half: 303, hour: 202};
        await oracle.setBtcTxFeesPerByte(fees);
        const newTxFees = await oracle.getBtcTxFeesPerByte();
        assert.deepEqual(fees, newTxFees);

        await oracle.setBtcTxFeesPerByte(prev);
    });

    it("should get names by id", async () => {
        const expectedSources = new Map<string, string>();
        expectedSources.set("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "Alice");
        expectedSources.set("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "Bob");
        expectedSources.set("5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", "Charlie");
        const sources = await oracle.getSourcesById();
        for (const entry of sources.entries()) {
            assert.equal(entry[1], expectedSources.get(entry[0]));
        }
    });

    it("should getOnlineTimeout", async () => {
        const onlineTimeout = await oracle.getOnlineTimeout();
        const expectedOnlineTimeout = 3600000;
        assert.equal(onlineTimeout, expectedOnlineTimeout);
    });

    it("should getLastExchangeRateTime", async () => {
        const lastExchangeRateTime = await oracle.getLastExchangeRateTime();
        const dateAnHourAgo = new Date();
        dateAnHourAgo.setHours(dateAnHourAgo.getHours() - 1);
        assert.isTrue(lastExchangeRateTime > dateAnHourAgo, "lastExchangeRateTime is older than one hour");
    });

    it("should be online", async () => {
        const isOnline = await oracle.isOnline();
        assert.isTrue(isOnline);
    });
});
