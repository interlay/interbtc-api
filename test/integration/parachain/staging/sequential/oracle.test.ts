import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, BitcoinAmount, ExchangeRate } from "@interlay/monetary-js";

import { createSubstrateAPI } from "../../../../../src/factory";
import { assert } from "../../../../chai";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT } from "../../../../config";
import {
    CollateralCurrency,
    DefaultInterBtcApi,
    getCorrespondingCollateralCurrencies,
    InterBtcApi,
} from "../../../../../src";
import { getExchangeRateValueToSetForTesting } from "../../../../utils/helpers";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let interBtcAPI: InterBtcApi;
    let collateralCurrencies: Array<CollateralCurrency>;
    let oracleAccount: KeyringPair;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
        collateralCurrencies = getCorrespondingCollateralCurrencies(interBtcAPI.getGovernanceCurrency());
    });

    after(() => {
        return api.disconnect();
    });

    it("should set exchange rate", async () => {
        for (const collateralCurrency of collateralCurrencies) {
            const exchangeRateValue = getExchangeRateValueToSetForTesting(collateralCurrency);
            const newExchangeRate = new ExchangeRate<Bitcoin, typeof collateralCurrency>(
                Bitcoin,
                collateralCurrency,
                exchangeRateValue
            );
            await interBtcAPI.oracle.setExchangeRate(newExchangeRate);
            await interBtcAPI.oracle.waitForExchangeRateUpdate(newExchangeRate);
        }
    });

    it("should convert satoshi to collateral currency", async () => {
        for (const collateralCurrency of collateralCurrencies) {
            const bitcoinAmount = new BitcoinAmount(100);
            const exchangeRate = await interBtcAPI.oracle.getExchangeRate(collateralCurrency);
            const expectedCollateral = exchangeRate.toBig().mul(bitcoinAmount.toBig(Bitcoin.decimals)).round(0, 0);

            const collateralAmount = await interBtcAPI.oracle.convertWrappedToCurrency(
                bitcoinAmount,
                collateralCurrency
            );
            assert.equal(
                collateralAmount.toBig(collateralCurrency.decimals).round(0, 0).toString(),
                expectedCollateral.toString(),
                `Unexpected collateral (${collateralCurrency.ticker}) amount`
            );
        }
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
        for (const collateralCurrency of collateralCurrencies) {
            const validUntil = await interBtcAPI.oracle.getValidUntil(collateralCurrency);
            const dateAnHourFromNow = new Date();
            dateAnHourFromNow.setMinutes(dateAnHourFromNow.getMinutes() + 30);
            assert.isTrue(
                validUntil > dateAnHourFromNow,
                `lastExchangeRateTime is older than one hour (${collateralCurrency.ticker})`
            );
        }
    });

    it("should be online", async () => {
        const isOnline = await interBtcAPI.oracle.isOnline();
        assert.isTrue(isOnline);
    });
});
