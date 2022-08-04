import { assert, expect } from "../../chai";
import Big from "big.js";
import sinon from "sinon";
import { DefaultRewardsAPI, DefaultVaultsAPI } from "../../../src";
import { Kusama } from "@interlay/monetary-js";
import { prepareBackingCollateralProportionMocks } from "../mocks/vaultsTestMocks";

describe("DefaultVaultsAPI", () => {
    let vaultsApi: DefaultVaultsAPI;
    const testCollateralCurrency = Kusama;

    let stubbedRewardsApi: sinon.SinonStubbedInstance<DefaultRewardsAPI>;

    beforeEach(() => {
        // only mock/stub what we really need
        // add more if/when needed
        stubbedRewardsApi = sinon.createStubInstance(DefaultRewardsAPI);
        vaultsApi = new DefaultVaultsAPI(
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            null as any,
            stubbedRewardsApi,
            null as any,
            null as any,
            null as any
        );
    });

    afterEach(() => {
        sinon.restore();
        sinon.reset();
    });

    describe("backingCollateralProportion", () => {
        it("should return 0 if nominator and vault have zero collateral", async () => {
            // prepare mocks
            const { nominatorId, vaultId } = prepareBackingCollateralProportionMocks(
                sinon,
                vaultsApi,
                stubbedRewardsApi,
                new Big(0),
                new Big(0),
                testCollateralCurrency
            );

            // do the thing
            const proportion = await vaultsApi.backingCollateralProportion(
                vaultId,
                nominatorId,
                testCollateralCurrency
            );

            // check result
            const expectedProportion = new Big(0);
            assert.equal(
                proportion.toString(),
                expectedProportion.toString(),
                `Expected actual proportion to be ${expectedProportion.toString()} but it was ${proportion.toString()}`
            );
        });

        it("should reject if nominator has collateral, but vault has zero collateral", async () => {
            // prepare mocks
            const nominatorAmount = new Big(1);
            const vaultAmount = new Big(0);
            const { nominatorId, vaultId } = prepareBackingCollateralProportionMocks(
                sinon,
                vaultsApi,
                stubbedRewardsApi,
                nominatorAmount,
                vaultAmount,
                testCollateralCurrency
            );

            // do & check
            const proportionPromise = vaultsApi.backingCollateralProportion(
                vaultId,
                nominatorId,
                testCollateralCurrency
            );
            expect(proportionPromise).to.be.rejectedWith(Error);
        });

        it("should calculate expected proportion", async () => {
            // prepare mocks
            const nominatorAmount = new Big(1);
            const vaultAmount = new Big(2);
            const { nominatorId, vaultId } = prepareBackingCollateralProportionMocks(
                sinon,
                vaultsApi,
                stubbedRewardsApi,
                nominatorAmount,
                vaultAmount,
                testCollateralCurrency
            );

            // do the thing
            const proportion = await vaultsApi.backingCollateralProportion(
                vaultId,
                nominatorId,
                testCollateralCurrency
            );

            // check result
            const expectedProportion = nominatorAmount.div(vaultAmount);
            assert.equal(
                proportion.toString(),
                expectedProportion.toString(),
                `Expected actual proportion to be ${expectedProportion.toString()} but it was ${proportion.toString()}`
            );
        });
    });
});
