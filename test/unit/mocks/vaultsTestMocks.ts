import Big, { BigSource } from "big.js";
import sinon from "sinon";
import {
    CollateralCurrencyExt,
    CurrencyExt,
    DefaultRewardsAPI,
    DefaultVaultsAPI,
    InterbtcPrimitivesVaultId,
    newMonetaryAmount,
    VaultExt,
} from "../../../src";
import * as allThingsEncoding from "../../../src/utils/encoding";
import { AccountId } from "@polkadot/types/interfaces";

export type NominatorVaultAccountIds = {
    nominatorId: AccountId;
    vaultId: AccountId;
};

/**
 * Helper function to mock calls outside of the function backingCollateralProportion
 * @param sinon The sinon sandbox to use for mocking
 * @param vaultsApi The vaults API used to call the method under test
 * @param stubbedRewardsApi The stubbed rewards API (called internally)
 * @param nominatorCollateralStakedAmount The mocked nominator's collateral staked amount
 * @param vaultBackingCollateralAmount The mocked vault's backing collateral amount
 * @param collateralCurrency The collateral currency for the amounts mocked
 * @returns Two mock account IDs, one for the nominator and one for the vault
 */
export const prepareBackingCollateralProportionMocks = (
    sinon: sinon.SinonSandbox,
    vaultsApi: DefaultVaultsAPI,
    stubbedRewardsApi: sinon.SinonStubbedInstance<DefaultRewardsAPI>,
    nominatorCollateralStakedAmount: Big,
    vaultBackingCollateralAmount: Big,
    collateralCurrency: CollateralCurrencyExt
): NominatorVaultAccountIds => {
    const nominatorId = createMockAccountId("mock nominator account id");
    const vaultId = createMockAccountId("mock vault account id");

    // prepare mocks
    const mockVault = createMockVaultWithBacking(vaultBackingCollateralAmount, collateralCurrency);
    mockVaultsApiGetMethod(sinon, vaultsApi, mockVault);
    mockComputeCollateralInStakingPoolMethod(
        sinon,
        stubbedRewardsApi,
        nominatorCollateralStakedAmount,
        collateralCurrency
    );

    return {
        nominatorId,
        vaultId,
    };
};

/**
 * Construct a mocked AccountId
 * @param someString An identifier to use for the mock account
 * @returns A simplified variation of an AccountId
 */
export const createMockAccountId = (someString: string): AccountId => {
    return <AccountId>{
        toString: () => someString,
        toHuman: () => toString(),
        toRawType: () => "MockAccountId",
        eq: (other?: AccountId) => !!other && toString() === other.toString(),
    };
};

/**
 * Mock RewardsAPI.computeCollateralInStakingPool to return a specific collateral amount
 * @param sinon The sinon sandbox to use for mocking
 * @param stubbedRewardsApi A stubbed rewards API to add the mocked bahvior to
 * @param amount The mocked return amount
 * @param currency The currency of the mocked return amount
 */
export const mockComputeCollateralInStakingPoolMethod = (
    sinon: sinon.SinonSandbox,
    stubbedRewardsApi: sinon.SinonStubbedInstance<DefaultRewardsAPI>,
    amount: BigSource,
    currency: CurrencyExt
): void => {
    // don't care what the inner method returns as we mock the outer one
    const tempId = <InterbtcPrimitivesVaultId>{};
    sinon.stub(allThingsEncoding, "newVaultId").returns(tempId);

    // the actual mock that matters
    stubbedRewardsApi.computeCollateralInStakingPool.resolves(newMonetaryAmount(amount, currency) as never);
};

/**
 * Create a mock VaultExt instance with only backing collateral amount set
 * @param amount The mocked backing collateral amount
 * @param collateralCurrency The collateral currency for the mocked backing collateral amount
 * @returns A mocked VaultExt instance with only backingCollateral property set
 */
export const createMockVaultWithBacking = (amount: BigSource, collateralCurrency: CollateralCurrencyExt): VaultExt => {
    // VaultExt-ish; only need .backingCollateral to be available for this test
    return {
        backingCollateral: newMonetaryAmount(amount, collateralCurrency as any),
    } as any;
};

/**
 * Mock the return value of VaultsAPI.get
 * @param sinon The sinon sandbox to use for mocking
 * @param vaultsApi The vaultsAPI instance for which to mock .get() methed
 * @param vault The vault to return
 */
export const mockVaultsApiGetMethod = (
    sinon: sinon.SinonSandbox,
    vaultsApi: DefaultVaultsAPI,
    vault: VaultExt
): void => {
    // make VaultAPI.get() return a mocked vault
    sinon.stub(vaultsApi, "get").returns(Promise.resolve(vault));
};
