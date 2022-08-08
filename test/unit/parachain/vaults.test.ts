import { assert, expect } from "../../chai";
import Big from "big.js";
import sinon from "sinon";
import { DefaultRewardsAPI, DefaultTransactionAPI, DefaultVaultsAPI, newMonetaryAmount } from "../../../src";
import { KBtc, Kusama } from "@interlay/monetary-js";
import {
    prepareBackingCollateralProportionMocks,
    prepareRegisterNewCollateralVaultMocks,
    MOCKED_SEND_LOGGED_ERR_MSG,
} from "../mocks/vaultsTestMocks";

describe("DefaultVaultsAPI", () => {
    let vaultsApi: DefaultVaultsAPI;
    const testCollateralCurrency = Kusama;
    const testWrappedCurrency = KBtc;

    let stubbedRewardsApi: sinon.SinonStubbedInstance<DefaultRewardsAPI>;
    let stubbedTransactionApi: sinon.SinonStubbedInstance<DefaultTransactionAPI>;

    beforeEach(async () => {
        stubbedRewardsApi = sinon.createStubInstance(DefaultRewardsAPI);
        stubbedTransactionApi = sinon.createStubInstance(DefaultTransactionAPI);
        vaultsApi = new DefaultVaultsAPI(
            null as any,
            null as any,
            testWrappedCurrency,
            null as any,
            null as any,
            null as any,
            null as any,
            stubbedRewardsApi,
            null as any,
            stubbedTransactionApi,
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

    describe("registerNewCollateralVault", () => {
        const testCollateralAmount = newMonetaryAmount(new Big(30), testCollateralCurrency);
        it("should reject if transaction API account id is not set", async () => {
            prepareRegisterNewCollateralVaultMocks(sinon, vaultsApi, stubbedTransactionApi, true);

            const voidPromise = vaultsApi.registerNewCollateralVault(testCollateralAmount);
            // check for partial string here
            expect(voidPromise).to.be.rejectedWith("account must be set");
        });

        it("should reject with same message if transactionApi.sendLogged rejects", async () => {
            prepareRegisterNewCollateralVaultMocks(sinon, vaultsApi, stubbedTransactionApi, false, true);

            expect(vaultsApi.registerNewCollateralVault(testCollateralAmount)).to.be.rejectedWith(
                MOCKED_SEND_LOGGED_ERR_MSG
            );
        });

        it("should submit call to register new vault with new collateral currency", async () => {
            const submittedMockExtrinsic = prepareRegisterNewCollateralVaultMocks(
                sinon,
                vaultsApi,
                stubbedTransactionApi
            );
            // check precondition
            assert.isFalse(
                submittedMockExtrinsic == null,
                "Test setup error: Expected submitted mock extrinsic to be set, but it was not."
            );

            expect(vaultsApi.registerNewCollateralVault(testCollateralAmount)).to.be.fulfilled;
            expect(stubbedTransactionApi.sendLogged.callCount).to.be.equal(
                1,
                `Expected transactionApi.sendLogged to be called exactly once, 
                but it was called ${stubbedTransactionApi.sendLogged.callCount} times`
            );

            const actualSubmittedExtrinsic = stubbedTransactionApi.sendLogged.getCall(0).args[0];
            expect(actualSubmittedExtrinsic).to.be.equal(
                submittedMockExtrinsic,
                `Expected submitted mock extrinsic have been submitted, but found this instead: ${actualSubmittedExtrinsic.toString()}`
            );
        });
    });
});
