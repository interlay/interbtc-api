import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import { DefaultOracleAPI, DEFAULT_FEED_NAME, OracleAPI } from "../../../../src/parachain/oracle";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import BN from "bn.js";
import Big from "big.js";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
        oracle = new DefaultOracleAPI(api);
        oracle.setAccount(bob);
    });

    after(() => {
        return api.disconnect();
    });

    it("initial setup should have set a rate of 3855.23187", async () => {
        const exchangeRate = await oracle.getExchangeRate();
        assert.equal(exchangeRate.toString(), "3855.23187");
    });

    it("should set exchange rate", async () => {
        const previousExchangeRate = await oracle.getExchangeRate();
        const exchangeRateToSet = new Big("3913.7424920372646687827621");
        await oracle.setExchangeRate(exchangeRateToSet);
        const exchangeRate = await oracle.getExchangeRate();
        assert.equal(exchangeRateToSet.round(8, 0).toString(), exchangeRate.round(8, 0).toString());

        // Revert the exchange rate to its initial value,
        // so that this test is idempotent
        await oracle.setExchangeRate(previousExchangeRate);
    });

    it("should convert satoshi to planck", async () => {
        const planck = await oracle.convertSatoshiToPlanck(new BN(100));
        assert.equal(planck.toString(), "38552319");
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

    it("should getFeed", async () => {
        const feed = await oracle.getFeed();
        assert.equal(feed, DEFAULT_FEED_NAME);
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
