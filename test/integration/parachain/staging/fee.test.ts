import { ApiPromise, Keyring } from "@polkadot/api";

import { createPolkadotAPI } from "../../../../src/factory";
import { ORACLE_URI, PARACHAIN_ENDPOINT } from "../../../config";
import { DefaultFeeAPI, DefaultOracleAPI, FeeAPI } from "../../../../src";
import { assert } from "chai";
import { Bitcoin, BitcoinUnit, ExchangeRate, InterBtc, InterBtcAmount, Polkadot, PolkadotUnit } from "@interlay/monetary-js";
import { GriefingCollateralType } from "../../../../src/parachain/fee";
import Big from "big.js";
import { callWithExchangeRate } from "../../../utils/helpers";

describe("fee", () => {
    let api: ApiPromise;
    let feeAPI: FeeAPI;
    let oracleAPI: DefaultOracleAPI;

    before(async function () {
        const keyring = new Keyring({ type: "sr25519" });
        const oracleAccount = keyring.addFromUri(ORACLE_URI);
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        feeAPI = new DefaultFeeAPI(api, InterBtc);
        oracleAPI = new DefaultOracleAPI(api, InterBtc, oracleAccount);
    });

    after(async () => {
        api.disconnect();
    });

    it("should check getReplaceGriefingCollateralRate", async () => {
        const replaceGriefingCollateralRate = await feeAPI.getReplaceGriefingCollateralRate();
        assert.equal(replaceGriefingCollateralRate.toString(), "0.1");
    }).timeout(1000000);

    it("should getGriefingCollateral for issue", async () => {
        const exchangeRateValue = new Big("3855.23187");
        const exchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await callWithExchangeRate(oracleAPI, exchangeRate, async () => {
            const amountBtc = InterBtcAmount.from.BTC(0.001);
            const griefingCollateral = await feeAPI.getGriefingCollateral(amountBtc, GriefingCollateralType.Issue);
            assert.equal(griefingCollateral.toBig(griefingCollateral.currency.base).round(5, 0).toString(), "0.00019");
        });
    }).timeout(50000);

    it("should getGriefingCollateral for replace", async () => {
        const exchangeRateValue = new Big("3855.23187");
        const exchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await callWithExchangeRate(oracleAPI, exchangeRate, async () => {
            const amountToReplace = InterBtcAmount.from.BTC(0.728);
            const griefingCollateral = await feeAPI.getGriefingCollateral(amountToReplace, GriefingCollateralType.Replace);
            assert.equal(griefingCollateral.toString(griefingCollateral.currency.base), "280.660880136");
        });
    }).timeout(50000);
});
