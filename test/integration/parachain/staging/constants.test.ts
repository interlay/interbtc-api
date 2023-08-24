import { ApiPromise } from "@polkadot/api";
import { ConstantsAPI, DefaultConstantsAPI } from "../../../../src/parachain/constants";
import { createSubstrateAPI } from "../../../../src/factory";
import { PARACHAIN_ENDPOINT } from "../../../config";

describe("Constants", () => {
    let api: ApiPromise;
    let constantAPI: ConstantsAPI;

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        constantAPI = new DefaultConstantsAPI(api);
    });

    afterAll(async () => {
        await api.disconnect();
    });

    describe("getSystemBlockHashCount", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getSystemBlockHashCount();
            expect(returnValue).toBeDefined();
        }, 500);
    });

    describe("getSystemDbWeight", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getSystemDbWeight();
            expect(returnValue).toBeDefined();
        }, 500);
    });

    describe("getTimestampMinimumPeriod", () => {
        it("should sucessfully return", async () => {
            const returnValue = constantAPI.getTimestampMinimumPeriod();
            expect(returnValue).toBeDefined();
        }, 500);
    });
});
