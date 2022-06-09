import Big, { BigSource } from "big.js";
import sinon from "sinon";
import { 
    CollateralCurrency,
    CurrencyUnit,
    DefaultRewardsAPI,
    DefaultVaultsAPI,
    InterbtcPrimitivesVaultId,
    newMonetaryAmount,
    VaultExt 
} from "../../../src";
import * as allThingsCurrency from "../../../src/types/currency";
import * as allThingsEncoding from "../../../src/utils/encoding";
import { AccountId } from "@polkadot/types/interfaces";
import { BitcoinUnit, Currency } from "@interlay/monetary-js";

export type NominatorVaultAccountIds = {
    nominatorId: AccountId,
    vaultId: AccountId
}

/**
 * Helper function to mock calls outside of the function backingCollateralProportion
 * @param sinon The sinon sandbox to use for mocking
 * @param vaultsApi The vaults API used to call the method under test
 * @param stubbedRewardsApi The stubbed rewards API (called internally)
 * @param nominatorCollateralStakedAmount The mocked nominator's collateral staked amount
 * @param vaultBackingCollateralAmount The mocked vault's backing collateral amount
 * @param collateralCurrency The collateral currency for the amounts mocked
 * @returns Two fake account IDs, one for the nominator and one for the vault, to be passed to the function under test
 */
export const prepareBackingCollateralProportionMocks = (
    sinon: sinon.SinonSandbox,
    vaultsApi: DefaultVaultsAPI,
    stubbedRewardsApi: sinon.SinonStubbedInstance<DefaultRewardsAPI>,
    nominatorCollateralStakedAmount: Big,
    vaultBackingCollateralAmount: Big,
    collateralCurrency: CollateralCurrency
): NominatorVaultAccountIds => {
    const nominatorId = createFakeAccountId("fake nominator account id");
    const vaultId = createFakeAccountId("fake vault account id");

    // prepare mocks
    const fakeVault = createFakeVaultWithBacking(vaultBackingCollateralAmount, collateralCurrency);
    mockGetVaultMethod(sinon, vaultsApi, fakeVault);
    mockComputeCollateralInStakingPoolMethod(sinon, stubbedRewardsApi, nominatorCollateralStakedAmount, collateralCurrency as any);
    mockCurrencyIdLiteralToMonetaryCurrency(sinon, collateralCurrency);

    return {
        nominatorId,
        vaultId
    };
};

export const createFakeAccountId = (someIdentifier: string): AccountId => {
    return <AccountId>{
        toString: () => someIdentifier,
        toHuman: () => toString(),
        toRawType: ()=> "FakeAccountId",
        eq: (other?: AccountId) => !!other && toString() === other.toString(),
    };
};

export const mockComputeCollateralInStakingPoolMethod = <U extends CurrencyUnit>(
    sinon: sinon.SinonSandbox,
    stubbedRewardsApi: sinon.SinonStubbedInstance<DefaultRewardsAPI>,
    amount: BigSource,
    currency: Currency<U>
): void => {
    // don't care what the inner method returns as we mock the outer one
    const tempId = <InterbtcPrimitivesVaultId>{};
    sinon.stub(allThingsEncoding, "newVaultId").returns(tempId);

    // the actual mock that matters
    stubbedRewardsApi.computeCollateralInStakingPool
        .resolves(newMonetaryAmount(amount, currency) as any);

};

export const createFakeVaultWithBacking = (amount: BigSource, collateralCurrency: CollateralCurrency): VaultExt<BitcoinUnit> => {
    // VaultExt-ish; only need .backingCollateral to be available for this test
    return {
        backingCollateral: newMonetaryAmount(amount, collateralCurrency as any),
    } as any;
};

export const mockGetVaultMethod = (sinon: sinon.SinonSandbox, vaultsApi: DefaultVaultsAPI, mockVault: VaultExt<BitcoinUnit>): void => {
    // make VaultAPI.get() return a mocked vault
    sinon.stub(vaultsApi, "get").returns(Promise.resolve(mockVault));
};

export const mockCurrencyIdLiteralToMonetaryCurrency = (sinon: sinon.SinonSandbox, returnCurrency: CollateralCurrency): void => {
    sinon.stub(allThingsCurrency, "currencyIdLiteralToMonetaryCurrency").returns(returnCurrency as any);
};