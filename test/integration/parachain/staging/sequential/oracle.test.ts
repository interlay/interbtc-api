import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bitcoin, BitcoinAmount, ExchangeRate } from "@interlay/monetary-js";

import { createSubstrateAPI } from "../../../../../src/factory";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT } from "../../../../config";
import {
    CollateralCurrencyExt,
    DefaultInterBtcApi,
    getSS58Prefix,
    InterBtcApi,
    tokenSymbolToCurrency,
} from "../../../../../src";
import {
    getCorrespondingCollateralCurrenciesForTests,
    getExchangeRateValueToSetForTesting,
    ORACLE_MAX_DELAY,
    submitExtrinsic,
} from "../../../../utils/helpers";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let interBtcAPI: InterBtcApi;
    let collateralCurrencies: Array<CollateralCurrencyExt>;
    let oracleAccount: KeyringPair;
    let aliceAccount: KeyringPair;
    let bobAccount: KeyringPair;
    let charlieAccount: KeyringPair;

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const ss58Prefix = getSS58Prefix(api);
        const keyring = new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
        oracleAccount = keyring.addFromUri(ORACLE_URI);

        aliceAccount = keyring.addFromUri("//Alice");
        bobAccount = keyring.addFromUri("//Bob");
        charlieAccount = keyring.addFromUri("//Charlie");
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
        collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(interBtcAPI.getGovernanceCurrency());
    });

    afterAll(() => {
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
            await submitExtrinsic(interBtcAPI, interBtcAPI.oracle.setExchangeRate(newExchangeRate));
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
            expect(collateralAmount.toBig(collateralCurrency.decimals).round(0, 0).toString()).toEqual(expectedCollateral.toString());
        }
    });

    it("should get names by id", async () => {
        const expectedSources = new Map<string, string>();
        expectedSources.set(aliceAccount.address, "Alice");
        expectedSources.set(bobAccount.address, "Bob");
        expectedSources.set(charlieAccount.address, "Charlie");
        const sources = await interBtcAPI.oracle.getSourcesById();
        for (const entry of sources.entries()) {
            expect(entry[1]).toEqual(expectedSources.get(entry[0]));
        }
    });

    it("should getOnlineTimeout", async () => {
        const onlineTimeout = await interBtcAPI.oracle.getOnlineTimeout();
        const expectedOnlineTimeout = ORACLE_MAX_DELAY;
        expect(onlineTimeout).toEqual(expectedOnlineTimeout);
    });

    it("should getValidUntil", async () => {
        for (const collateralCurrency of collateralCurrencies) {
            const validUntil = await interBtcAPI.oracle.getValidUntil(collateralCurrency);
            const dateAnHourFromNow = new Date();
            dateAnHourFromNow.setMinutes(dateAnHourFromNow.getMinutes() + 30);
            expect(validUntil > dateAnHourFromNow).toBe(true);
        }
    });

    it("should be online", async () => {
        const relayChainCurrencyId = api.consts.currency.getRelayChainCurrencyId;
        const relayChainCurrency = tokenSymbolToCurrency(relayChainCurrencyId.asToken);

        const isOnline = await interBtcAPI.oracle.isOnline(relayChainCurrency);
        expect(isOnline).toBe(true);
    });
});
