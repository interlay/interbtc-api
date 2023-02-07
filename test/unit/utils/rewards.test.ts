import { calculateAnnualizedRewardAmount } from "@interlay/interbtc-api/index";
import Big from "big.js";
import { expect } from "chai";

describe("Rewards", () => {
    describe("calculateAnnualizedRewardAmount", () => {
        it("should calculate annulized amount correctly", () => {
            const secsPerYear = 365 * 24 * 60 * 60;
            // this can and will fail if block times change
            // (and that's a good thing)
            const assumedBlockDurationSecs = 12;

            const amountPerBlock = Big(0.042);

            const expectedRewardAmount = amountPerBlock.mul(secsPerYear).div(assumedBlockDurationSecs);
            const actualRewardAmount = calculateAnnualizedRewardAmount(amountPerBlock, assumedBlockDurationSecs * 1000);

            expect(actualRewardAmount.eq(expectedRewardAmount)).to.eq(
                true,
                `Expected result to be equal to ${expectedRewardAmount.toString()} but was: ${actualRewardAmount.toString()}`
            );
        });

        it("should throw if blockTimeMs is zero", () => {
            expect(() => calculateAnnualizedRewardAmount(Big(1), 0)).to.throw("Division by zero");
        });

        it("should return zero if reward per block is zero", () => {
            const actualRewardAmount = calculateAnnualizedRewardAmount(Big(0), 12 * 1000);

            expect(actualRewardAmount.toNumber()).to.be.eq(0);
        });
    });
});
