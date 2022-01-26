import { ApiPromise, Keyring } from "@polkadot/api";
import { Bitcoin, BitcoinUnit, ExchangeRate, InterBtcAmount, Polkadot, PolkadotUnit } from "@interlay/monetary-js";
import { assert } from "chai";
import Big from "big.js";

import { createSubstrateAPI } from "../../../../src/factory";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT, WRAPPED_CURRENCY_TICKER } from "../../../config";
import { DefaultBridgeAPI, BridgeAPI, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";
import { GriefingCollateralType } from "../../../../src/parachain/fee";
import { callWithExchangeRate } from "../../../utils/helpers";

describe("fee", () => {
    let api: ApiPromise;
    let userInterBtcAPI: BridgeAPI;

    before(async function () {
        const keyring = new Keyring({ type: "sr25519" });
        const oracleAccount = keyring.addFromUri(ORACLE_URI);
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        userInterBtcAPI = new DefaultBridgeAPI(api, "regtest", wrappedCurrency, oracleAccount, ESPLORA_BASE_PATH);
    });

    after(async () => {
        api.disconnect();
    });

    it("should check getReplaceGriefingCollateralRate", async () => {
        const replaceGriefingCollateralRate = await userInterBtcAPI.fee.getReplaceGriefingCollateralRate();
        assert.equal(replaceGriefingCollateralRate.toString(), "0.1");
    }).timeout(1000000);

    it("should getGriefingCollateral for issue", async () => {
        const exchangeRateValue = new Big("3855.23187");
        const exchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await callWithExchangeRate(userInterBtcAPI.oracle, exchangeRate, async () => {
            const amountBtc = InterBtcAmount.from.BTC(0.001);
            const griefingCollateral = await userInterBtcAPI.fee.getGriefingCollateral(amountBtc, GriefingCollateralType.Issue);
            assert.equal(griefingCollateral.toBig(griefingCollateral.currency.base).round(5, 0).toString(), "0.00019");
        });
    }).timeout(50000);

    it("should getGriefingCollateral for replace", async () => {
        const exchangeRateValue = new Big("3855.23187");
        const exchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await callWithExchangeRate(userInterBtcAPI.oracle, exchangeRate, async () => {
            const amountToReplace = InterBtcAmount.from.BTC(0.728);
            const griefingCollateral = await userInterBtcAPI.fee.getGriefingCollateral(amountToReplace, GriefingCollateralType.Replace);
            assert.equal(griefingCollateral.toString(griefingCollateral.currency.base), "280.660880136");
        });
    }).timeout(50000);
});
