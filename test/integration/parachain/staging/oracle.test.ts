import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultOracleAPI, DEFAULT_INCLUSION_TIME, OracleAPI } from "../../../../src/parachain/oracle";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { BOB_URI, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import Big from "big.js";
import { Bitcoin, BTCAmount, BTCUnit, Currency, ExchangeRate, Polkadot, PolkadotUnit } from "@interlay/monetary-js";
import { CollateralUnit, createExchangeRateOracleKey, createInclusionOracleKey } from "../../../../src";
import { SLEEP_TIME_MS, sleep } from "../../../utils/helpers";
import { OracleKey } from "../../../../src/interfaces";
import { Option, Bool } from "@polkadot/types";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri(BOB_URI);
        oracle = new DefaultOracleAPI(api);
        oracle.setAccount(bob);
    });

    after(() => {
        return api.disconnect();
    });

    it("exchange rate should be set", async () => {
        // just check that this is set, don't hardcode anything
        // as the oracle client may change the exchange rate
        const exchangeRate = await oracle.getExchangeRate(Polkadot);
        assert.isDefined(exchangeRate);
    });

    async function getRawValuesUpdated(key: OracleKey): Promise<boolean> {
        const head = await api.rpc.chain.getFinalizedHead();
        const isSet = await api.query.oracle.rawValuesUpdated.at<Option<Bool>>(head, key);
        return isSet.unwrap().isTrue;
    }

    async function waitForExchangeRateUpdate<C extends CollateralUnit>(exchangeRate: ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>) {
        const key = createExchangeRateOracleKey(api, exchangeRate.counter);
        while (await getRawValuesUpdated(key)) {
            sleep(SLEEP_TIME_MS);
        }
    }

    it("should set exchange rate", async () => {
        const exchangeRateValue = new Big("3913.7424920372646687827621");
        const newExchangeRate = new ExchangeRate<Bitcoin, BTCUnit, Polkadot, PolkadotUnit>(Bitcoin, Polkadot, exchangeRateValue);
        await oracle.setExchangeRate(newExchangeRate);
        await waitForExchangeRateUpdate(newExchangeRate);
    });

    it("should convert satoshi to planck", async () => {
        const bitcoinAmount = BTCAmount.from.BTC(100);
        const exchangeRate = await oracle.getExchangeRate(Polkadot);
        const expectedCollateral = exchangeRate.toBig(undefined).mul(bitcoinAmount.toBig(BTCUnit.BTC)).round(0, 0);

        const collateralAmount = await oracle.convertWrappedToCollateral(bitcoinAmount, Polkadot);
        assert.equal(collateralAmount.toBig(Polkadot.units.DOT).round(0, 0).toString(), expectedCollateral.toString());
    });

    async function waitForFeeEstimateUpdate() {
        const key = createInclusionOracleKey(api, DEFAULT_INCLUSION_TIME);
        while (await getRawValuesUpdated(key)) {
            sleep(SLEEP_TIME_MS);
        }
    }

    it("should set BTC tx fees", async () => {
        const setFeeEstimate = new Big(1);
        await oracle.setBitcoinFees(setFeeEstimate);
        await waitForFeeEstimateUpdate();

        // just check that this is set since we medianize results
        const getFeeEstimate = await oracle.getBitcoinFees();
        assert.isDefined(getFeeEstimate);
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

    it("should getValidUntil", async () => {
        const validUntil = await oracle.getValidUntil(Polkadot);
        const dateAnHourFromNow = new Date();
        dateAnHourFromNow.setMinutes(dateAnHourFromNow.getMinutes() + 30);
        assert.isTrue(validUntil > dateAnHourFromNow, "lastExchangeRateTime is older than one hour");
    });

    it("should be online", async () => {
        const isOnline = await oracle.isOnline();
        assert.isTrue(isOnline);
    });
});
