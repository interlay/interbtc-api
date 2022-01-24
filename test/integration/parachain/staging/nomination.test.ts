import { InterBtcAmount, InterBtc, Polkadot, Currency } from "@interlay/monetary-js";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import BN from "bn.js";
import { CollateralUnit, DefaultInterBTCAPI, InterBTCAPI, InterbtcPrimitivesVaultId } from "../../../../src/index";

import { BitcoinCoreClient, CollateralCurrency, CollateralIdLiteral, currencyIdToLiteral, currencyIdToMonetaryCurrency, encodeUnsignedFixedPoint, FeeAPI, newAccountId, newVaultId, NominationAPI, RewardsAPI, tickerToMonetaryCurrency, VaultsAPI, WrappedCurrency } from "../../../../src";
import { setNumericStorage, issueSingle, newMonetaryAmount } from "../../../../src/utils";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { SUDO_URI, USER_1_URI, VAULT_1_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, COLLATERAL_CURRENCY_TICKER, WRAPPED_CURRENCY_TICKER } from "../../../config";
import { callWith, sudo } from "../../../utils/helpers";

describe("NominationAPI", () => {
    let api: ApiPromise;
    let userInterBtcAPI: InterBTCAPI;
    let sudoInterBtcAPI: InterBTCAPI;
    let sudoAccount: KeyringPair;
    let userAccount: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_id: InterbtcPrimitivesVaultId;
    let bitcoinCoreClient: BitcoinCoreClient;

    let wrappedCurrency: WrappedCurrency;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        userAccount = keyring.addFromUri(USER_1_URI);
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        userInterBtcAPI = new DefaultInterBTCAPI(api, "regtest", wrappedCurrency, userAccount, ESPLORA_BASE_PATH);
        sudoInterBtcAPI = new DefaultInterBTCAPI(api, "regtest", wrappedCurrency, sudoAccount, ESPLORA_BASE_PATH);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, Polkadot, wrappedCurrency);

        if (!(await sudoInterBtcAPI.nomination.isNominationEnabled())) {
            console.log("Enabling nomination...");
            await sudo(sudoInterBtcAPI.nomination, (api) => api.setNominationEnabled(true));
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

    after(() => {
        return api.disconnect();
    });

    it("Should opt a vault in and out of nomination", async () => {
        await optInWithAccount(vault_1, currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency);
        const nominationVaults = await sudoInterBtcAPI.nomination.listVaults();
        assert.equal(1, nominationVaults.length);
        assert.equal(vault_1.address, nominationVaults.map(v => v.accountId.toString())[0]);
        await optOutWithAccount(vault_1, currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency);
        assert.equal(0, (await sudoInterBtcAPI.nomination.listVaults()).length);
    }).timeout(60000);

    async function setIssueFee(x: BN) {
        const previousAccount = sudoInterBtcAPI.nomination.getAccount();
        sudoInterBtcAPI.nomination.setAccount(sudoAccount);
        await setNumericStorage(api, "Fee", "IssueFee", x, sudoInterBtcAPI.nomination, 128);
        if (previousAccount) {
            sudoInterBtcAPI.nomination.setAccount(previousAccount);
        }
    }

    it("Should nominate to and withdraw from a vault", async () => {
        await optInWithAccount(vault_1, currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency);
        const issueFee = await userInterBtcAPI.fee.getIssueFee();
        const collateralCurrencyIdLiteral = currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral;
        const vault = await userInterBtcAPI.vaults.get(vault_1_id.accountId, collateralCurrencyIdLiteral);
        const collateralCurrency = currencyIdToMonetaryCurrency(vault.id.currencies.collateral) as Currency<CollateralUnit>;
        const nominatorDeposit = newMonetaryAmount(1, collateralCurrency, true);
        try {
            // Set issue fees to 100%
            await setIssueFee(new BN("1000000000000000000"));
            const stakingCapacityBeforeNomination = await userInterBtcAPI.vaults.getStakingCapacity(
                vault_1_id.accountId,
                collateralCurrencyIdLiteral
            );
            // Deposit
            await sudoInterBtcAPI.nomination.depositCollateral(vault_1_id.accountId, nominatorDeposit);
            const stakingCapacityAfterNomination = await userInterBtcAPI.vaults.getStakingCapacity(
                vault_1_id.accountId,
                collateralCurrencyIdLiteral
            );
            assert.equal(
                stakingCapacityBeforeNomination.sub(nominatorDeposit).toString(),
                stakingCapacityAfterNomination.toString(),
                "Nomination failed to decrease staking capacity"
            );
            const nominationPairs = await sudoInterBtcAPI.nomination.list();
            assert.equal(2, nominationPairs.length, "There should be one nomination pair in the system, besides the vault to itself");

            const userAddress = userAccount.address;
            const vault_1Address = vault_1.address;

            const nomination = nominationPairs.find((nominarion) => userAddress == nominarion.nominatorId.toString())!;

            assert.equal(userAddress, nomination.nominatorId.toString());
            assert.equal(vault_1Address, nomination.vaultId.accountId.toString());

            const interBtcToIssue = InterBtcAmount.from.BTC(0.00001);
            await issueSingle(api, bitcoinCoreClient, userAccount, interBtcToIssue, vault_1_id);
            const wrappedRewardsBeforeWithdrawal = (
                await sudoInterBtcAPI.nomination.getNominatorReward(
                    vault_1_id.accountId,
                    collateralCurrencyIdLiteral,
                    newAccountId(api, userAccount.address),
                )
            ).toBig();
            assert.isTrue(
                wrappedRewardsBeforeWithdrawal.gt(0),
                "Nominator should receive non-zero wrapped tokens"
            );

            // Withdraw Rewards
            await userInterBtcAPI.rewards.withdrawRewards(vault_1_id);
            // Withdraw Collateral
            await userInterBtcAPI.nomination.withdrawCollateral(vault_1_id.accountId, nominatorDeposit);

            const nominatorsAfterWithdrawal = await userInterBtcAPI.nomination.list();
            // The vault always has a "nomination" to itself
            assert.equal(1, nominatorsAfterWithdrawal.length);
            const totalNomination = await sudoInterBtcAPI.nomination.getTotalNomination(
                newAccountId(api, userAccount.address),
                currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency,
            );
            assert.equal(totalNomination.toString(), "0");
        } catch(error) {
            throw error;
        } finally {
            await setIssueFee(encodeUnsignedFixedPoint(api, issueFee));
            await optOutWithAccount(vault_1, currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency);
        }
    }).timeout(5 * 60000);

    async function optInWithAccount(vaultAccount: KeyringPair, collateralCurrency: CollateralCurrency) {
        // will fail if vault is already opted in
        await callWith(sudoInterBtcAPI.nomination, vaultAccount, api => api.optIn(collateralCurrency));
    }

    async function optOutWithAccount(vaultAccount: KeyringPair, collateralCurrency: CollateralCurrency) {
        await callWith(sudoInterBtcAPI.nomination, vaultAccount, api => api.optOut(collateralCurrency));
    }
});
