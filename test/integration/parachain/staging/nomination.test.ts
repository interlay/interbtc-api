import { InterBtcAmount, InterBtc, Polkadot } from "@interlay/monetary-js";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import BN from "bn.js";
import { InterbtcPrimitivesVaultId } from "../../../../src/index";

import { BitcoinCoreClient, CollateralCurrency, CollateralIdLiteral, CurrencyIdLiteral, currencyIdToLiteral, currencyIdToMonetaryCurrency, DefaultElectrsAPI, DefaultFeeAPI, DefaultNominationAPI, DefaultRewardsAPI, DefaultVaultsAPI, ElectrsAPI, encodeUnsignedFixedPoint, FeeAPI, newAccountId, newVaultId, NominationAPI, RewardsAPI, tickerToMonetaryCurrency, VaultsAPI, WrappedCurrency } from "../../../../src";
import { setNumericStorage, issueSingle, newMonetaryAmount } from "../../../../src/utils";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { SUDO_URI, USER_1_URI, VAULT_1_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, NATIVE_CURRENCY_TICKER, WRAPPED_CURRENCY_TICKER } from "../../../config";
import { callWith, sudo } from "../../../utils/helpers";

describe("NominationAPI", () => {
    let api: ApiPromise;
    let sudoAccount: KeyringPair;
    let userAccount: KeyringPair;
    let nominationAPI: NominationAPI;
    let rewardsAPI: RewardsAPI;
    let vaultsAPI: VaultsAPI;
    let feeAPI: FeeAPI;
    let vault_1: KeyringPair;
    let vault_1_id: InterbtcPrimitivesVaultId;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    let nativeCurrency: CollateralCurrency;
    let wrappedCurrency: WrappedCurrency;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        userAccount = keyring.addFromUri(USER_1_URI);
        nativeCurrency = tickerToMonetaryCurrency(api, NATIVE_CURRENCY_TICKER) as CollateralCurrency;
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        
        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, nativeCurrency, userAccount);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, nativeCurrency);
        feeAPI = new DefaultFeeAPI(api, InterBtc);
        rewardsAPI = new DefaultRewardsAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, nativeCurrency);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, Polkadot, wrappedCurrency);

        if (!(await nominationAPI.isNominationEnabled())) {
            console.log("Enabling nomination...");
            await sudo(nominationAPI, (api) => api.setNominationEnabled(true));
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
        const nominationVaults = await nominationAPI.listVaults();
        assert.equal(1, nominationVaults.length);
        assert.equal(vault_1.address, nominationVaults.map(v => v.accountId.toString())[0]);
        await optOutWithAccount(vault_1, currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency);
        assert.equal(0, (await nominationAPI.listVaults()).length);
    }).timeout(60000);

    async function setIssueFee(x: BN) {
        const previousAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(sudoAccount);
        await setNumericStorage(api, "Fee", "IssueFee", x, nominationAPI, 128);
        if (previousAccount) {
            nominationAPI.setAccount(previousAccount);
        }
    }

    it("Should nominate to and withdraw from a vault", async () => {
        await optInWithAccount(vault_1, currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency);
        const issueFee = await feeAPI.getIssueFee();
        const collateralCurrencyIdLiteral = currencyIdToLiteral(vault_1_id.currencies.collateral) as CollateralIdLiteral;
        const vault = await vaultsAPI.get(vault_1_id.accountId, collateralCurrencyIdLiteral);
        const nominatorDeposit = newMonetaryAmount(1, vault.collateralCurrency, true);
        try {
            // Set issue fees to 100%
            await setIssueFee(new BN("1000000000000000000"));
            const stakingCapacityBeforeNomination = await vaultsAPI.getStakingCapacity(
                vault_1_id.accountId,
                collateralCurrencyIdLiteral
            );
            // Deposit
            await nominationAPI.depositCollateral(vault_1_id.accountId, nominatorDeposit);
            const stakingCapacityAfterNomination = await vaultsAPI.getStakingCapacity(
                vault_1_id.accountId,
                collateralCurrencyIdLiteral
            );
            assert.equal(
                stakingCapacityBeforeNomination.sub(nominatorDeposit).toString(),
                stakingCapacityAfterNomination.toString(),
                "Nomination failed to decrease staking capacity"
            );
            const nominationPairs = await nominationAPI.listNominationPairs();
            assert.equal(2, nominationPairs.length, "There should be one nomination pair in the system, besides the vault to itself");

            const userAddress = userAccount.address;
            const vault_1Address = vault_1.address;

            const [vaultId, nominatorId] = nominationPairs.find(([_, nominatorId]) => userAddress == nominatorId.toString())!;

            assert.equal(userAddress, nominatorId.toString());
            assert.equal(vault_1Address, vaultId.accountId.toString());

            const interBtcToIssue = InterBtcAmount.from.BTC(0.00001);
            await issueSingle(api, electrsAPI, bitcoinCoreClient, userAccount, interBtcToIssue, nativeCurrency, vault_1_id);
            const wrappedRewardsBeforeWithdrawal = (
                await nominationAPI.getNominatorReward(
                    newAccountId(api, userAccount.address),
                    vault_1_id.accountId,
                    collateralCurrencyIdLiteral
                )
            ).toBig();
            assert.isTrue(
                wrappedRewardsBeforeWithdrawal.gt(0),
                "Nominator should receive non-zero wrapped tokens"
            );

            // Withdraw
            await nominationAPI.withdrawCollateral(vault_1_id.accountId, nominatorDeposit);
            const nominatorsAfterWithdrawal = await nominationAPI.listNominationPairs();
            // The vault always has a "nomination" to itself
            assert.equal(1, nominatorsAfterWithdrawal.length);
            const totalNomination = await nominationAPI.getTotalNomination(
                currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency,
                newAccountId(api, userAccount.address)
            );
            assert.equal(totalNomination.toString(), "0");

            const wrappedRewardsAfterWithdrawal = (
                await nominationAPI.getNominatorReward(
                    newAccountId(api, userAccount.address),
                    vault_1_id.accountId,
                    collateralCurrencyIdLiteral
                )
            ).toBig();
            assert.equal(
                wrappedRewardsBeforeWithdrawal.round(5, 0).toString(),
                wrappedRewardsAfterWithdrawal.round(5, 0).toString(),
                "Reward amount has been affected by the withdrawal"
            );
        } catch(error) {
            throw error;
        } finally {
            await setIssueFee(encodeUnsignedFixedPoint(api, issueFee));
            await optOutWithAccount(vault_1, currencyIdToMonetaryCurrency(vault_1_id.currencies.collateral) as CollateralCurrency);
        }
    }).timeout(5 * 60000);

    async function optInWithAccount(vaultAccount: KeyringPair, collateralCurrency: CollateralCurrency) {
        // will fail if vault is already opted in
        await callWith(nominationAPI, vaultAccount, api => api.optIn(collateralCurrency));
    }

    async function optOutWithAccount(vaultAccount: KeyringPair, collateralCurrency: CollateralCurrency) {
        await callWith(nominationAPI, vaultAccount, api => api.optOut(collateralCurrency));
    }

});
