import { assert, expect } from "../chai";
import Big, { BigSource } from "big.js";
import sinon from "sinon";
import { 
    CollateralCurrency,
    CurrencyIdLiteral,
    CurrencyUnit,
    DefaultRewardsAPI,
    DefaultVaultsAPI,
    InterbtcPrimitivesVaultId,
    newMonetaryAmount,
    VaultExt 
} from "../../src";
import * as allThingsCurrency from "../../src/types/currency";
import * as allThingsEncoding from "../../src/utils/encoding";
import { AccountId } from "@polkadot/types/interfaces";
import { BitcoinUnit, Currency, Kusama } from "@interlay/monetary-js";

describe("DefaultVaultsAPI", () => {
    let vaultsApi: DefaultVaultsAPI;
    const testCollCcyId: CurrencyIdLiteral = CurrencyIdLiteral.KSM;
    const testCollateralCurrency: CollateralCurrency = Kusama;

    let fakeRewardsApi: sinon.SinonStubbedInstance<DefaultRewardsAPI>;

    beforeEach(() => {
        // only mock/stub what we really need
        fakeRewardsApi = sinon.createStubInstance(DefaultRewardsAPI);
        vaultsApi = new DefaultVaultsAPI(
            undefined as any,
            undefined as any,
            undefined as any,
            undefined as any,
            undefined as any,
            undefined as any,
            undefined as any,
            undefined as any,
            fakeRewardsApi,
            undefined as any,
            undefined as any
        );
    });

    afterEach(() => {
        sinon.restore();
        sinon.reset();
    });

    describe("backingCollateralProportion", () => {
        /* ===== Helper methods for mocking methods used in this particular method ===== */
        const prepareAllMocks = (
            nominatorAccountName: string,
            vaultAccountName: string,
            nominatorCollateralStakedAmount: Big,
            vaultBackingCollateralAmount: Big,
            collateralCurrency: CollateralCurrency
        ) => {
            const nominatorId = createFakeAccountId(nominatorAccountName);
            const vaultId = createFakeAccountId(vaultAccountName);

            // prepare mocks
            const fakeVault = createFakeVaultWithBacking(vaultBackingCollateralAmount, collateralCurrency);
            mockGetVaultMethod(fakeVault);
            mockComputeCollateralInStakingPoolMethod(nominatorCollateralStakedAmount, collateralCurrency as any);
            mockCurrencyIdLiteralToMonetaryCurrency(collateralCurrency);

            return {
                nominatorId,
                vaultId
            };
        };

        const createFakeAccountId = (someIdentifier: string): AccountId => {
            return <AccountId>{
                toString: () => someIdentifier,
                toHuman: () => toString(),
                toRawType: ()=> "FakeAccountId",
                eq: (other?: AccountId) => !!other && toString() === other.toString(),
            };
        };

        const mockComputeCollateralInStakingPoolMethod = <U extends CurrencyUnit>(
            amount: BigSource,
            currency: Currency<U>
        ): void => {
            const tempId = <InterbtcPrimitivesVaultId>{};
            sinon.stub(allThingsEncoding, "newVaultId").returns(tempId);
            fakeRewardsApi.computeCollateralInStakingPool
                .resolves(newMonetaryAmount(amount, currency) as any);

        };

        const createFakeVaultWithBacking = (amount: BigSource, collateralCurrency: CollateralCurrency): VaultExt<BitcoinUnit> => {
            // VaultExt-ish; only need .backingCollateral to be available for this test
            return {
                backingCollateral: newMonetaryAmount(amount, collateralCurrency as any),
            } as any;
        };

        const mockGetVaultMethod = (mockVault: VaultExt<BitcoinUnit>): void => {
            // make VaultAPI.get() return a mocked vault
            sinon.stub(vaultsApi, "get").returns(Promise.resolve(mockVault));
        };

        const mockCurrencyIdLiteralToMonetaryCurrency = (returnCurrency: CollateralCurrency) => {
            sinon.stub(allThingsCurrency, "currencyIdLiteralToMonetaryCurrency").returns(returnCurrency as any);
        };
        /* ===== End: Helper methods for mocking ===== */

        it("should return 0 if nominator and vault have zero collateral", async () => {
            // prepare mocks
            const {
                nominatorId,
                vaultId
            } = prepareAllMocks("nominator", "vault", new Big(0), new Big(0), testCollateralCurrency);

            // do the thing
            const proportion = await vaultsApi.backingCollateralProportion(vaultId, nominatorId, testCollCcyId);

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
            const {
                nominatorId,
                vaultId
            } = prepareAllMocks("nominator", "vault", nominatorAmount, vaultAmount, testCollateralCurrency);
            
            // do & check
            const proportionPromise = vaultsApi.backingCollateralProportion(vaultId, nominatorId, testCollCcyId);
            expect(proportionPromise).to.be.rejectedWith(Error);
        });

        it("should calculate expected proportion", async () => {
            // prepare mocks
            const nominatorAmount = new Big(1);
            const vaultAmount = new Big(2);
            const {
                nominatorId,
                vaultId
            } = prepareAllMocks("nominator", "vault", nominatorAmount, vaultAmount, testCollateralCurrency);
            
            // do the thing
            const proportion = await vaultsApi.backingCollateralProportion(vaultId, nominatorId, testCollCcyId);
            
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