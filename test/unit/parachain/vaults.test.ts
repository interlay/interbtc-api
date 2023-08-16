import Big from "big.js";
import { DefaultRewardsAPI, DefaultTransactionAPI, DefaultVaultsAPI } from "../../../src";
import { newMonetaryAmount } from "../../../src/utils";
import { KBtc, Kusama } from "@interlay/monetary-js";
import {
    prepareBackingCollateralProportionMocks,
    prepareRegisterNewCollateralVaultMocks,
    prepareLiquidationRateMocks,
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
            stubbedTransactionApi
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("backingCollateralProportion", () => {
        it(
            "should return 0 if nominator and vault have zero collateral",
            async () => {
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
                expect(proportion.toString()).toEqual(expectedProportion.toString());
            }
        );

        it(
            "should reject if nominator has collateral, but vault has zero collateral",
            async () => {
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
                await expect(proportionPromise).rejects.toThrow(Error);
            }
        );

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
            expect(proportion.toString()).toEqual(expectedProportion.toString());
        });
    });

    describe("registerNewCollateralVault", () => {
        const testCollateralAmount = newMonetaryAmount(new Big(30), testCollateralCurrency);
        it("should reject if transaction API account id is not set", async () => {
            prepareRegisterNewCollateralVaultMocks(sinon, vaultsApi, stubbedTransactionApi, true);

            const registerVaultCall = () => vaultsApi.registerNewCollateralVault(testCollateralAmount);
            // check for partial string here
            await expect(registerVaultCall).rejects.toThrow("account must be set");
        });
    });

    describe("getExchangeRateForLiquidation", () => {
        it("should calculate expected liquidation rate", async () => {
            const mockIssuedTokens = 1;
            const mockCollateralTokens = 3;
            const mockLiquidationThreshold = 2;
            // expect we need to pay 1.5 KSM per 1 BTC for the collateral (3 KSM) to issued (1 KBTC) ratio
            // to reach the liquidation threshold rate of 2
            const expectedLiquidationExchangeRate = 1.5;

            prepareLiquidationRateMocks(
                sinon,
                vaultsApi,
                mockIssuedTokens,
                mockCollateralTokens,
                mockLiquidationThreshold,
                testWrappedCurrency,
                testCollateralCurrency
            );

            // get the fictitious liquidation rate
            const actualRate = await vaultsApi.getExchangeRateForLiquidation(
                null as never, // this variable is ignored, mocked away
                testCollateralCurrency
            );

            expect(actualRate).toBeDefined();
            expect(actualRate?.toNumber()).toBe(expectedLiquidationExchangeRate);
        });

        it("should return undefined if vault has no issued tokens", async () => {
            const mockIssuedTokens = 0;
            const mockCollateralTokens = 3;
            const mockLiquidationThreshold = 2;

            prepareLiquidationRateMocks(
                sinon,
                vaultsApi,
                mockIssuedTokens,
                mockCollateralTokens,
                mockLiquidationThreshold,
                testWrappedCurrency,
                testCollateralCurrency
            );

            // get the fictitious liquidation rate
            const actualRate = await vaultsApi.getExchangeRateForLiquidation(
                null as never, // this variable is ignored, mocked away
                testCollateralCurrency
            );

            expect(actualRate).toBeUndefined();
        });

        it("should return undefined if liquidation rate is zero", async () => {
            const mockIssuedTokens = 1;
            const mockCollateralTokens = 3;
            const mockLiquidationThreshold = 0;

            prepareLiquidationRateMocks(
                sinon,
                vaultsApi,
                mockIssuedTokens,
                mockCollateralTokens,
                mockLiquidationThreshold,
                testWrappedCurrency,
                testCollateralCurrency
            );

            // get the fictitious liquidation rate
            const actualRate = await vaultsApi.getExchangeRateForLiquidation(
                null as never, // this variable is ignored, mocked away
                testCollateralCurrency
            );

            expect(actualRate).toBeUndefined();
        });
    });
});
