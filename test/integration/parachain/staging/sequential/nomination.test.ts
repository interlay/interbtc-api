import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import BN from "bn.js";
import { DefaultInterBtcApi, InterBtcApi, InterbtcPrimitivesVaultId } from "../../../../../src/index";

import {
    BitcoinCoreClient,
    CollateralCurrencyExt,
    currencyIdToMonetaryCurrency,
    encodeUnsignedFixedPoint,
    newAccountId,
    newVaultId,
    WrappedCurrency,
} from "../../../../../src";
import { setRawStorage, issueSingle, newMonetaryAmount } from "../../../../../src/utils";
import { createSubstrateAPI } from "../../../../../src/factory";
import {
    SUDO_URI,
    USER_1_URI,
    VAULT_1_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    ESPLORA_BASE_PATH,
} from "../../../../config";
import {
    callWith,
    getCorrespondingCollateralCurrenciesForTests,
    submitExtrinsic,
    sudo,
} from "../../../../utils/helpers";
import { Nomination } from "../../../../../src/parachain/nomination";

// TODO: readd this once we want to activate nomination
describe.skip("NominationAPI", () => {
    let api: ApiPromise;
    let userInterBtcAPI: InterBtcApi;
    let sudoInterBtcAPI: InterBtcApi;
    let sudoAccount: KeyringPair;
    let userAccount: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_ids: Array<InterbtcPrimitivesVaultId>;

    let bitcoinCoreClient: BitcoinCoreClient;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrencies: Array<CollateralCurrencyExt>;

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        userAccount = keyring.addFromUri(USER_1_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        sudoInterBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);
        wrappedCurrency = userInterBtcAPI.getWrappedCurrency();
        collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(userInterBtcAPI.getGovernanceCurrency());
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency)
        );

        if (!(await sudoInterBtcAPI.nomination.isNominationEnabled())) {
            console.log("Enabling nomination...");
            await sudo(sudoInterBtcAPI, async () => {
                await submitExtrinsic(sudoInterBtcAPI, sudoInterBtcAPI.nomination.setNominationEnabled(true));
            });
        }

        // The account of a vault from docker-compose
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
    });

    afterAll(() => {
        return api.disconnect();
    });

    it("Should opt a vault in and out of nomination", async () => {
        for (const vault_1_id of vault_1_ids) {
            await optInWithAccount(vault_1, await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral));
            const nominationVaults = await userInterBtcAPI.nomination.listVaults();
            expect(1).toEqual(nominationVaults.length);
            expect(vault_1.address).toEqual(nominationVaults.map((v) => v.accountId.toString())[0]);
            await optOutWithAccount(vault_1, await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral));
            expect(0).toEqual((await userInterBtcAPI.nomination.listVaults()).length);
        }
    });

    async function setIssueFee(x: BN) {
        await setRawStorage(api, api.query.fee.issueFee.key(), api.createType("UnsignedFixedPoint", x), sudoAccount);
    }

    it("Should nominate to and withdraw from a vault", async () => {
        for (const vault_1_id of vault_1_ids) {
            await optInWithAccount(vault_1, await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral));
            const issueFee = await userInterBtcAPI.fee.getIssueFee();
            const collateralCurrency = await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral);
            const nominatorDeposit = newMonetaryAmount(1, collateralCurrency, true);
            try {
                // Set issue fees to 100%
                await setIssueFee(new BN("1000000000000000000"));
                const stakingCapacityBeforeNomination = await userInterBtcAPI.vaults.getStakingCapacity(
                    vault_1_id.accountId,
                    collateralCurrency
                );
                // Deposit
                await submitExtrinsic(
                    userInterBtcAPI,
                    userInterBtcAPI.nomination.depositCollateral(vault_1_id.accountId, nominatorDeposit)
                );
                const stakingCapacityAfterNomination = await userInterBtcAPI.vaults.getStakingCapacity(
                    vault_1_id.accountId,
                    collateralCurrency
                );
                expect(stakingCapacityBeforeNomination.sub(nominatorDeposit).toString()).toEqual(stakingCapacityAfterNomination.toString());
                const nominationPairs = await userInterBtcAPI.nomination.list();
                expect(2).toEqual(nominationPairs.length);

                const userAddress = userAccount.address;
                const vault_1Address = vault_1.address;

                const nomination = nominationPairs.find(
                    (nomination) => userAddress == nomination.nominatorId.toString()
                ) as Nomination;

                expect(userAddress).toEqual(nomination.nominatorId.toString());
                expect(vault_1Address).toEqual(nomination.vaultId.accountId.toString());

                const amountToIssue = newMonetaryAmount(0.00001, wrappedCurrency, true);
                await issueSingle(userInterBtcAPI, bitcoinCoreClient, userAccount, amountToIssue, vault_1_id);
                const wrappedRewardsBeforeWithdrawal = (
                    await userInterBtcAPI.nomination.getNominatorReward(
                        vault_1_id.accountId,
                        collateralCurrency,
                        wrappedCurrency,
                        newAccountId(api, userAccount.address)
                    )
                ).toBig();
                expect(wrappedRewardsBeforeWithdrawal.gt(0)).toBe(true);

                // Withdraw Rewards
                await submitExtrinsic(userInterBtcAPI, await userInterBtcAPI.rewards.withdrawRewards(vault_1_id));
                // Withdraw Collateral
                await submitExtrinsic(
                    userInterBtcAPI,
                    await userInterBtcAPI.nomination.withdrawCollateral(vault_1_id.accountId, nominatorDeposit)
                );

                const nominatorsAfterWithdrawal = await userInterBtcAPI.nomination.list();
                // The vault always has a "nomination" to itself
                expect(1).toEqual(nominatorsAfterWithdrawal.length);
                const totalNomination = await userInterBtcAPI.nomination.getTotalNomination(
                    newAccountId(api, userAccount.address),
                    await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral)
                );
                expect(totalNomination.toString()).toEqual("0");
            } finally {
                await setIssueFee(encodeUnsignedFixedPoint(api, issueFee));
                await optOutWithAccount(
                    vault_1,
                    await currencyIdToMonetaryCurrency(api, vault_1_id.currencies.collateral)
                );
            }
        }
    });

    async function optInWithAccount(vaultAccount: KeyringPair, collateralCurrency: CollateralCurrencyExt) {
        // will fail if vault is already opted in
        await callWith(userInterBtcAPI, vaultAccount, async () => {
            await submitExtrinsic(userInterBtcAPI, userInterBtcAPI.nomination.optIn(collateralCurrency));
        });
    }

    async function optOutWithAccount(vaultAccount: KeyringPair, collateralCurrency: CollateralCurrencyExt) {
        await callWith(userInterBtcAPI, vaultAccount, async () => {
            await submitExtrinsic(userInterBtcAPI, userInterBtcAPI.nomination.optOut(collateralCurrency));
        });
    }
});
