import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { ConstantsAPI, DefaultConstantsAPI } from "../../../../src/parachain/constants";
import { createPolkadotAPI } from "../../../../src/factory";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";

describe("Constants", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let constantAPI: ConstantsAPI;

    beforeEach(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        constantAPI = new DefaultConstantsAPI(api);
    });

    afterEach(async () => {
        await api.disconnect();
    });

    describe("getDotExistentialDeposit", () => {
        it("should sucessfully return", async () => {
            this.timeout(500);
            const returnValue = await constantAPI.getDotExistentialDeposit();
            assert.isDefined(returnValue);
        });
    });

    describe("getPolkaBtcExistentialDeposit", () => {
        it("should sucessfully return", async () => {
            this.timeout(500);
            const returnValue = await constantAPI.getPolkaBtcExistentialDeposit();
            assert.isDefined(returnValue);
        });
    });

    describe("getSystemBlockHashCount", () => {
        it("should sucessfully return", async () => {
            this.timeout(500);
            const returnValue = await constantAPI.getSystemBlockHashCount();
            assert.isDefined(returnValue);
        });
    });

    describe("getSystemDbWeight", () => {
        it("should sucessfully return", async () => {
            this.timeout(500);
            const returnValue = await constantAPI.getSystemDbWeight();
            assert.isDefined(returnValue);
        });
    });

    describe("getTimestampMinimumPeriod", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getTimestampMinimumPeriod();
            assert.isDefined(returnValue);
        });
    });

    describe("getTransactionByteFee", () => {
        it("should sucessfully return", async () => {
            this.timeout(500);
            const returnValue = await constantAPI.getTransactionByteFee();
            assert.isDefined(returnValue);
        });
    });

    describe("getTransactionWeightToFee", () => {
        it("should sucessfully return", async () => {
            this.timeout(500);
            const returnValue = await constantAPI.getTransactionWeightToFee();
            assert.isDefined(returnValue);
        });
    });
});
