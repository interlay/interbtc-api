import { InterBtcAmount, InterBtc, Polkadot } from "@interlay/monetary-js";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import BN from "bn.js";
import { BitcoinCoreClient, DefaultElectrsAPI, DefaultFeeAPI, DefaultNominationAPI, DefaultVaultsAPI, ElectrsAPI, encodeUnsignedFixedPoint, FeeAPI, newAccountId, NominationAPI, REGTEST_ESPLORA_BASE_PATH, VaultsAPI } from "../../../../src";
import { setNumericStorage, issueSingle, newMonetaryAmount } from "../../../../src/utils";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert, expect } from "../../../chai";
import { SUDO_URI, USER_1_URI, VAULT_1, DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { callWith, sudo } from "../../../utils/helpers";

describe("NominationAPI", () => {
    let api: ApiPromise;
    let sudoAccount: KeyringPair;
    let userAccount: KeyringPair;
    let nominationAPI: NominationAPI;
    let vaultsAPI: VaultsAPI;
    let feeAPI: FeeAPI;
    let vault_1: KeyringPair;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        userAccount = keyring.addFromUri(USER_1_URI);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, userAccount);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc);
        feeAPI = new DefaultFeeAPI(api, InterBtc);

        if (!(await nominationAPI.isNominationEnabled())) {
            console.log("Enabling nomination...");
            await sudo(nominationAPI, (api) => api.setNominationEnabled(true));
        }

        // The account of a vault from docker-compose
        vault_1 = keyring.addFromUri(VAULT_1);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
    });

    after(() => {
        return api.disconnect();
    });

    it("Should opt a vault in and out of nomination", async () => {
        await optInWithAccount(vault_1);
        const nominationVaults = await nominationAPI.listVaults();
        assert.equal(1, nominationVaults.length);
        assert.equal(vault_1.address, nominationVaults.map(v => v.toString())[0]);
        await optOutWithAccount(vault_1);
        assert.equal(0, (await nominationAPI.listVaults()).length);
    });

    async function setIssueFee(x: BN) {
        const previousAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(sudoAccount);
        await setNumericStorage(api, "Fee", "IssueFee", x, nominationAPI, 128);
        if (previousAccount) {
            nominationAPI.setAccount(previousAccount);
        }
    }

    it("Should nominate to and withdraw from a vault", async () => {
        await optInWithAccount(vault_1);
        const issueFee = await feeAPI.getIssueFee();
        const vault = await vaultsAPI.get(newAccountId(api, vault_1.address));
        const nominatorDeposit = newMonetaryAmount(100, vault.collateralCurrency, true);
        try {
            // Set issue fees to 100%
            await setIssueFee(new BN("1000000000000000000"));
            const stakingCapacityBeforeNomination = (await vaultsAPI.getStakingCapacity(newAccountId(api, vault_1.address)));
            // Deposit
            await nominationAPI.depositCollateral(vault_1.address, nominatorDeposit);
            const stakingCapacityAfterNomination = await vaultsAPI.getStakingCapacity(newAccountId(api, vault_1.address));
            assert.equal(
                stakingCapacityBeforeNomination.sub(nominatorDeposit).toString(),
                stakingCapacityAfterNomination.toString(),
                "Nomination failed to decrease staking capacity"
            );
            const nominationPairs = await nominationAPI.listNominationPairs(Polkadot);
            assert.equal(2, nominationPairs.length, "There should be one nomination pair in the system, besides the vault to itself");

            const userAddress = userAccount.address;
            const charlieStashAddress = vault_1.address;

            const [vaultId, nominatorId] = nominationPairs.find(([_, nominatorId]) => userAddress == nominatorId)!;

            assert.equal(userAddress, nominatorId);
            assert.equal(charlieStashAddress, vaultId);

            const interBtcToIssue = InterBtcAmount.from.BTC(0.1);
            await issueSingle(api, electrsAPI, bitcoinCoreClient, userAccount, interBtcToIssue, vault_1.address);
            const wrappedRewardsBeforeWithdrawal = (await nominationAPI.getNominatorReward(userAccount.address, vault_1.address, InterBtc)).toBig();
            assert.isTrue(wrappedRewardsBeforeWithdrawal.gt(0.1), "Nominator should receive at least 0.1 InterBtc");

            // Withdraw
            await nominationAPI.withdrawCollateral(vault_1.address, nominatorDeposit);
            const nominatorsAfterWithdrawal = await nominationAPI.listNominationPairs(Polkadot);
            // The vault always has a "nomination" to itself
            assert.equal(1, nominatorsAfterWithdrawal.length);
            await expect(nominationAPI.getTotalNomination(Polkadot, userAccount.address)).to.be.rejected;
            console.log("successfully rejected");
            const wrappedRewardsAfterWithdrawal = (await nominationAPI.getNominatorReward(userAccount.address, vault_1.address, InterBtc)).toBig();
            assert.equal(
                wrappedRewardsBeforeWithdrawal.round(5, 0).toString(),
                wrappedRewardsAfterWithdrawal.round(5, 0).toString(),
                "Reward amount has been affected by the withdrawal"
            );
        } catch(error) {
            throw error;
        } finally {
            await setIssueFee(encodeUnsignedFixedPoint(api, issueFee));
            await optOutWithAccount(vault_1);
        }
    });

    async function optInWithAccount(vaultAccount: KeyringPair) {
        // will fail if vault is already opted in
        await callWith(nominationAPI, vaultAccount, api => api.optIn());
    }

    async function optOutWithAccount(vaultAccount: KeyringPair) {
        await callWith(nominationAPI, vaultAccount, api => api.optOut());
    }

});
