import { ApiPromise } from "@polkadot/api";
import { assert } from "chai";
import { ConstantsAPI, DefaultConstantsAPI } from "../../../src/apis/constants";
import { createPolkadotAPI } from "../../../src/factory";
import { defaultParachainEndpoint } from "../../config";

describe("Constants", function () {
    this.timeout(10000); // API can be slightly slow

    let api: ApiPromise;
    let constantAPI: ConstantsAPI;

    beforeEach(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        constantAPI = new DefaultConstantsAPI(api);
    });

    afterEach(async () => {
        await api.disconnect();
    });

    describe("getDotExistentialDeposit", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getDotExistentialDeposit();
            assert.isDefined(returnValue);
        });
    });

    describe("getPolkaBtcExistentialDeposit", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getPolkaBtcExistentialDeposit();
            assert.isDefined(returnValue);
        });
    });

    describe("getStakedRelayersMinimumDeposit", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getStakedRelayersMinimumDeposit();
            assert.isDefined(returnValue);
        });
    });

    describe("getStakedRelayersMinimumStake", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getStakedRelayersMinimumStake();
            assert.isDefined(returnValue);
        });
    });

    describe("getStakedRelayersVotingPeriod", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getStakedRelayersVotingPeriod();
            assert.isDefined(returnValue);
        });
    });

    describe("getSystemBlockHashCount", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getSystemBlockHashCount();
            assert.isDefined(returnValue);
        });
    });

    describe("getSystemDbWeight", () => {
        it("should sucessfully return", async () => {
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
            const returnValue = await constantAPI.getTransactionByteFee();
            assert.isDefined(returnValue);
        });
    });

    describe("getTransactionWeightToFee", () => {
        it("should sucessfully return", async () => {
            const returnValue = await constantAPI.getTransactionWeightToFee();
            assert.isDefined(returnValue);
        });
    });
});
