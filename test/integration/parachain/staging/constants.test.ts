import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { ConstantsAPI, DefaultConstantsAPI } from "../../../../src/parachain/constants";
import { createPolkadotAPI } from "../../../../src/factory";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../../src/utils/setup";

describe("Constants", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let constantAPI: ConstantsAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        constantAPI = new DefaultConstantsAPI(api);
    });

    after(async () => {
        await api.disconnect();
    });

    describe("getSystemBlockHashCount", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getSystemBlockHashCount();
            assert.isDefined(returnValue);
        }).timeout(500);
    });

    describe("getSystemDbWeight", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getSystemDbWeight();
            assert.isDefined(returnValue);
        }).timeout(500);
    });

    describe("getTimestampMinimumPeriod", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getTimestampMinimumPeriod();
            assert.isDefined(returnValue);
        }).timeout(500);
    });

    describe("getTransactionByteFee", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getTransactionByteFee();
            assert.isDefined(returnValue);
        }).timeout(500);
    });

    describe("getTransactionWeightToFee", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getTransactionWeightToFee();
            assert.isDefined(returnValue);
        }).timeout(500);
    });
});
