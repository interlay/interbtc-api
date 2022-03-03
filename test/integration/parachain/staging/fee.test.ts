import { ApiPromise, Keyring } from "@polkadot/api";
import { Bitcoin, BitcoinUnit, Currency, ExchangeRate } from "@interlay/monetary-js";
import { assert } from "chai";
import Big from "big.js";

import { createSubstrateAPI } from "../../../../src/factory";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT } from "../../../config";
import { CollateralUnit, DefaultInterBtcApi, getCorrespondingCollateralCurrency, InterBtcApi, newMonetaryAmount, WrappedCurrency } from "../../../../src";
import { GriefingCollateralType } from "../../../../src/parachain/fee";
import { callWithExchangeRate } from "../../../utils/helpers";

describe("fee", () => {
    let api: ApiPromise;
    let oracleInterBtcAPI: InterBtcApi;
    let collateralCurrency: Currency<CollateralUnit>;
    let wrappedCurrency: WrappedCurrency;

    before(async function () {
        const keyring = new Keyring({ type: "sr25519" });
        const oracleAccount = keyring.addFromUri(ORACLE_URI);
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        oracleInterBtcAPI = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
        collateralCurrency = getCorrespondingCollateralCurrency(oracleInterBtcAPI.getGovernanceCurrency()) as Currency<CollateralUnit>;
        wrappedCurrency = oracleInterBtcAPI.getWrappedCurrency();
    });

    after(async () => {
        api.disconnect();
    });

    it("should check getReplaceGriefingCollateralRate", async () => {
        const replaceGriefingCollateralRate = await oracleInterBtcAPI.fee.getReplaceGriefingCollateralRate();
        assert.equal(replaceGriefingCollateralRate.toString(), "0.1");
    }).timeout(2000000);

    it("should getGriefingCollateral for issue", async () => {
        const exchangeRateValue = new Big("3855.23187");
        const exchangeRate = new ExchangeRate<
            Bitcoin,
            BitcoinUnit,
            typeof collateralCurrency,
            typeof collateralCurrency.units
        >(Bitcoin, collateralCurrency, exchangeRateValue);
        await callWithExchangeRate(oracleInterBtcAPI.oracle, exchangeRate, async () => {
            const amountBtc = newMonetaryAmount(0.001, wrappedCurrency, true);
            const griefingCollateral = await oracleInterBtcAPI.fee.getGriefingCollateral(amountBtc, GriefingCollateralType.Issue);
            assert.equal(griefingCollateral.toBig(griefingCollateral.currency.base).round(5, 0).toString(), "0.00001");
        });
    }).timeout(200000);

    it("should getGriefingCollateral for replace", async () => {
        const exchangeRateValue = new Big("3855.23187");
        const exchangeRate = new ExchangeRate<
            Bitcoin,
            BitcoinUnit,
            typeof collateralCurrency,
            typeof collateralCurrency.units
            >(Bitcoin, collateralCurrency, exchangeRateValue);
        await callWithExchangeRate(oracleInterBtcAPI.oracle, exchangeRate, async () => {
            const amountToReplace = newMonetaryAmount(0.728, wrappedCurrency, true);
            const griefingCollateral = await oracleInterBtcAPI.fee.getGriefingCollateral(amountToReplace, GriefingCollateralType.Replace);
            assert.equal(griefingCollateral.toString(griefingCollateral.currency.base), "16.744");
        });
    }).timeout(200000);
});
