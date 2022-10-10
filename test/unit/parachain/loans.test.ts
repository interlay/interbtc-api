import sinon from "sinon";
import { ApiPromise } from "@polkadot/api";
import { DefaultAssetRegistryAPI, DefaultLoansAPI } from "../../../src/";
import { getAPITypes } from "../../../src/factory";
import Big from "big.js";
import { expect } from "chai";
import { Kusama, Polkadot } from "@interlay/monetary-js";

describe("DefaultLoansAPI", () => {
    let api: ApiPromise;
    let stubbedAssetRegistry: sinon.SinonStubbedInstance<DefaultAssetRegistryAPI>;
    let loansApi: DefaultLoansAPI;

    before(() => {
        api = new ApiPromise();
        // disconnect immediately to avoid printing errors
        // we only need the instance to create variables
        api.disconnect();
        api.registerTypes(getAPITypes());
    });

    beforeEach(() => {
        stubbedAssetRegistry = sinon.createStubInstance(DefaultAssetRegistryAPI);
        loansApi = new DefaultLoansAPI(api, stubbedAssetRegistry);
    });

    describe("getCurrentBorrowBalance", () => {
        it("should return a mocked currency amount", async () => {
            const expectedCurrency = Kusama;
            const expectedMockAmount = Big(4.2);

            // pass in "null as never" as account as we know the mocked api doesn't use it.
            const actualAmount = await loansApi.getCurrentBorrowBalance(null as never, Kusama);
            expect(actualAmount.currency).to.eq(expectedCurrency);
            expect(
                actualAmount.toBig().eq(expectedMockAmount),
                `Expected amount to be equal to ${expectedMockAmount.toString()}, but was ${actualAmount.toString()}`
            ).to.be.true;
        });
    });

    describe("getCurrentCollateralBalance", () => {
        it("should return a mocked currency amount", async () => {
            const expectedCurrency = Polkadot;
            const expectedMockAmount = Big(12.34567);

            // pass in "null as never" as account as we know the mocked api doesn't use it.
            const actualAmount = await loansApi.getCurrentCollateralBalance(null as never, Polkadot);
            expect(actualAmount.currency).to.eq(expectedCurrency);
            expect(
                actualAmount.toBig().eq(expectedMockAmount),
                `Expected amount to be equal to ${expectedMockAmount.toString()}, but was ${actualAmount.toString()}`
            ).to.be.true;
        });
    });
    
    describe("getLendPositionsOfAccount", () => {
        // TODO: add tests
    });

    describe("getBorrowPositionsOfAccount", () => {
        // TODO: add tests
    });

    describe("getLoanAssets", () => {
        // TODO: add tests
    });
});
