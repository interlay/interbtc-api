import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "chai";
import Big from "big.js";

import { createSubstrateAPI } from "../../../../src/factory";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT, SUDO_URI } from "../../../config";
import { DefaultInterBtcApi, InterBtcApi, WrappedCurrency } from "../../../../src";
import { newMonetaryAmount } from "../../../../src/utils";
import { GriefingCollateralType } from "../../../../src/parachain/fee";
import { callWithExchangeRate } from "../../../utils/helpers";

describe("fee", () => {
    let api: ApiPromise;
    let oracleInterBtcAPI: InterBtcApi;
    let sudoInterBtcAPI: InterBtcApi;

    let wrappedCurrency: WrappedCurrency;

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        const oracleAccount = keyring.addFromUri(ORACLE_URI);
        const sudoAccount = keyring.addFromUri(SUDO_URI);

        oracleInterBtcAPI = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
        sudoInterBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

        wrappedCurrency = oracleInterBtcAPI.getWrappedCurrency();
    });

    after(async () => {
        api.disconnect();
    });

    it("should check getReplaceGriefingCollateralRate", async () => {
        const replaceGriefingCollateralRate = await oracleInterBtcAPI.fee.getReplaceGriefingCollateralRate();
        assert.equal(replaceGriefingCollateralRate.toString(), "0.1");
    });

    it("should getGriefingCollateral for issue", async () => {
        const exchangeRateValue = new Big("280269058");
        const nativeCurrency = oracleInterBtcAPI.getGovernanceCurrency();

        await callWithExchangeRate(sudoInterBtcAPI, nativeCurrency, exchangeRateValue, async () => {
            const amountBtc = newMonetaryAmount(0.001, wrappedCurrency, true);
            const griefingCollateral = await oracleInterBtcAPI.fee.getGriefingCollateral(
                amountBtc,
                GriefingCollateralType.Issue
            );
            console.log(griefingCollateral.toString());
            assert.equal(griefingCollateral.toBig().round(5, 0).toString(), "0.0014");
        });
    });

    it("should getGriefingCollateral for replace", async () => {
        const exchangeRateValue = new Big("280269058");
        const nativeCurrency = oracleInterBtcAPI.getGovernanceCurrency();

        await callWithExchangeRate(sudoInterBtcAPI, nativeCurrency, exchangeRateValue, async () => {
            const amountToReplace = newMonetaryAmount(0.728, wrappedCurrency, true);
            const griefingCollateral = await oracleInterBtcAPI.fee.getGriefingCollateral(
                amountToReplace,
                GriefingCollateralType.Replace
            );
            assert.equal(griefingCollateral.toString(), "2040.35874224");
        });
    });
});
