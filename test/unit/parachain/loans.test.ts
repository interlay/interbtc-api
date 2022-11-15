import sinon from "sinon";
import { ApiPromise } from "@polkadot/api";
import { DefaultAssetRegistryAPI, DefaultLoansAPI, DefaultTransactionAPI } from "../../../src/";
import { getAPITypes } from "../../../src/factory";
import Big from "big.js";
import { expect } from "chai";

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
        const transactionAPI = new DefaultTransactionAPI(api);
        loansApi = new DefaultLoansAPI(api, stubbedAssetRegistry, transactionAPI);
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

    describe("_calculateAnnualizedRewardAmount", () => {
        it("should calculate annulized amount correctly", () => {
            const secsPerYear = 365 * 24 * 60 * 60;
            // this can and will fail if block times change
            // (and that's a good thing)
            const assumedBlockDurationSecs = 12;

            const amountPerBlock = Big(0.042);

            const expectedRewardAmount = amountPerBlock.mul(secsPerYear).div(assumedBlockDurationSecs);
            const actualRewardAmount = loansApi._calculateAnnualizedRewardAmount(
                amountPerBlock,
                assumedBlockDurationSecs * 1000
            );

            expect(actualRewardAmount.eq(expectedRewardAmount)).to.eq(
                true,
                `Expected result to be equal to ${expectedRewardAmount.toString()} but was: ${actualRewardAmount.toString()}`
            );
        });

        it("should throw if blockTimeMs is zero", () => {
            expect(() => loansApi._calculateAnnualizedRewardAmount(Big(1), 0)).to.throw("Division by zero");
        });

        it("should return zero if reward per block is zero", () => {
            const actualRewardAmount = loansApi._calculateAnnualizedRewardAmount(Big(0), 12 * 1000);

            expect(actualRewardAmount.toNumber()).to.be.eq(0);
        });
    });
});
