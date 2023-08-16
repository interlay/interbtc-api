import Big, { BigSource } from "big.js";
import {
    CollateralCurrencyExt,
    CurrencyExt,
    DefaultRewardsAPI,
    DefaultTransactionAPI,
    DefaultVaultsAPI,
    InterbtcPrimitivesVaultId,
    VaultExt,
    WrappedCurrency,
} from "../../../src";
import { newMonetaryAmount } from "../../../src/utils";
import * as allThingsEncoding from "../../../src/utils/encoding";
import { AccountId } from "@polkadot/types/interfaces";
import { SubmittableExtrinsic, AugmentedEvent, ApiTypes } from "@polkadot/api/types";
import { ISubmittableResult, AnyTuple } from "@polkadot/types/types";
import { MonetaryAmount } from "@interlay/monetary-js";

export type NominatorVaultAccountIds = {
    nominatorId: AccountId;
    vaultId: AccountId;
};

export const MOCKED_SEND_LOGGED_ERR_MSG = "mocked sendLogged rejection";

/**
 *
 * @returns Two mock account IDs, one for the nominator and one for the vault
 * @param vaultsApi The vaults API used to call the method under test
 * @param transactionApi The transaction API (mocked/called internally)
 * @param isAccountIdUndefined if true, mocks that transactionApi.getAccountId() returns an undefined account ID
 * @param doesSendLoggedReject if true, mocks that transactionApi.sendLogged() rejects
 * @returns the mocked extrinsic to return when transactionApi.sendLogged() is finally called
 */
export const prepareRegisterNewCollateralVaultMocks = (
    vaultsApi: DefaultVaultsAPI,
    transactionApi: DefaultTransactionAPI,
    isAccountIdUndefined?: boolean,
    doesSendLoggedReject?: boolean
): SubmittableExtrinsic<"promise", ISubmittableResult> | null => {
    if (isAccountIdUndefined) {
        jest.spyOn(transactionApi, "getAccount").mockClear().mockReturnValue(undefined);
        return null;
    }

    // mock getting a valid (ie. has been set) account id
    const vaultAccountId = createMockAccountId("0x0123456789012345678901234567890123456789012345678901234567890123");
    jest.spyOn(transactionApi, "getAccount").mockClear().mockReturnValue(vaultAccountId);

    // mock api returns to be able to call sendLogged
    const mockSubmittableExtrinsic = <SubmittableExtrinsic<"promise", ISubmittableResult>>{};
    jest.spyOn(vaultsApi, "buildRegisterVaultExtrinsic").mockClear().mockReturnValue(mockSubmittableExtrinsic);
    const fakeEvent = <AugmentedEvent<ApiTypes, AnyTuple>>{};
    jest.spyOn(vaultsApi, "getRegisterVaultEvent").mockClear().mockReturnValue(fakeEvent);

    if (doesSendLoggedReject) {
        jest.spyOn(transactionApi, "sendLogged").mockClear().mockReturnValue(Promise.reject(new Error(MOCKED_SEND_LOGGED_ERR_MSG)));
        return null;
    }

    jest.spyOn(transactionApi, "sendLogged").mockClear().mockResolvedValue(undefined as never);
    return mockSubmittableExtrinsic;
};

/**
 * Helper function to mock calls outside of the function backingCollateralProportion
 * @param vaultsApi The vaults API used to call the method under test
 * @param rewardsApi The rewards API (mocked/called internally)
 * @param nominatorCollateralStakedAmount The mocked nominator's collateral staked amount
 * @param vaultBackingCollateralAmount The mocked vault's backing collateral amount
 * @param collateralCurrency The collateral currency for the amounts mocked
 * @returns Two mock account IDs, one for the nominator and one for the vault
 */
export const prepareBackingCollateralProportionMocks = (
    vaultsApi: DefaultVaultsAPI,
    rewardsApi: DefaultRewardsAPI,
    nominatorCollateralStakedAmount: Big,
    vaultBackingCollateralAmount: Big,
    collateralCurrency: CollateralCurrencyExt
): NominatorVaultAccountIds => {
    const nominatorId = createMockAccountId("mock nominator account id");
    const vaultId = createMockAccountId("mock vault account id");

    // prepare mocks
    const mockVault = createMockVaultWithBacking(vaultBackingCollateralAmount, collateralCurrency);
    mockVaultsApiGetMethod(vaultsApi, mockVault);
    mockComputeCollateralInStakingPoolMethod(
        rewardsApi,
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
 * @param rewardsApi The rewards API to add the mocked bahvior to
 * @param amount The mocked return amount
 * @param currency The currency of the mocked return amount
 */
export const mockComputeCollateralInStakingPoolMethod = (
    rewardsApi: DefaultRewardsAPI,
    amount: BigSource,
    currency: CurrencyExt
): void => {
    // don't care what the inner method returns as we mock the outer one
    const tempId = <InterbtcPrimitivesVaultId>{};
    jest.spyOn(allThingsEncoding, "newVaultId").mockClear().mockReturnValue(tempId);

    jest.spyOn(rewardsApi, "computeCollateralInStakingPool")
        .mockClear()
        .mockReturnValue(Promise.resolve(newMonetaryAmount(amount, currency)));
};

/**
 * Create a mock VaultExt instance with only backing collateral amount set
 * @param amount The mocked backing collateral amount
 * @param collateralCurrency The collateral currency for the mocked backing collateral amount
 * @returns A mocked VaultExt instance with only backingCollateral property set
 */
export const createMockVaultWithBacking = (amount: BigSource, collateralCurrency: CollateralCurrencyExt): VaultExt => {
    // VaultExt-ish; only need .backingCollateral to be available for this test
    return <VaultExt>{
        backingCollateral: newMonetaryAmount(amount, collateralCurrency),
    };
};

/**
 * Mock the return value of VaultsAPI.get
 * @param vaultsApi The vaultsAPI instance for which to mock .get() methed
 * @param vault The vault to return
 */
export const mockVaultsApiGetMethod = (
    vaultsApi: DefaultVaultsAPI,
    vault: VaultExt
): void => {
    // make VaultAPI.get() return a mocked vault
    jest.spyOn(vaultsApi, "get").mockClear().mockReturnValue(Promise.resolve(vault));
};

export const prepareLiquidationRateMocks = (
    vaultsApi: DefaultVaultsAPI,
    mockIssuedTokensNumber: BigSource,
    mockCollateralTokensNumber: BigSource,
    mockLiquidationThreshold: BigSource,
    wrappedCurrency: WrappedCurrency,
    collateralCurrency: CollateralCurrencyExt
): void => {
    // mock vaultExt.getBackedTokens() return value
    const mockVault = <VaultExt>{
        getBackedTokens: () => new MonetaryAmount(wrappedCurrency, mockIssuedTokensNumber),
    };

    // mock this.get return mock vault
    mockVaultsApiGetMethod(vaultsApi, mockVault);

    // mock this.getLiquidationCollateralThreshold return value
    // if we have less than 2x collateral (in BTC) compared to BTC, we need to liquidate
    jest.spyOn(vaultsApi, "getLiquidationCollateralThreshold").mockClear().mockReturnValue(Promise.resolve(Big(mockLiquidationThreshold)));

    // mock this.getCollateral return value
    const mockCollateral = new MonetaryAmount(collateralCurrency, mockCollateralTokensNumber);
    jest.spyOn(vaultsApi, "getCollateral").mockClear().mockReturnValue(Promise.resolve(mockCollateral));
};
