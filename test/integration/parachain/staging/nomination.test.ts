import { Bitcoin, BTCAmount, Polkadot, PolkadotAmount } from "@interlay/monetary-js";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import BN from "bn.js";
import { BitcoinCoreClient, DefaultElectrsAPI, DefaultFeeAPI, DefaultNominationAPI, DefaultVaultsAPI, ElectrsAPI, encodeUnsignedFixedPoint, FeeAPI, newAccountId, NominationAPI, REGTEST_ESPLORA_BASE_PATH, VaultsAPI } from "../../../../src";
import { setNumericStorage, issueSingle } from "../../../../src/utils";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { ALICE_URI, BOB_URI, CHARLIE_STASH_URI, DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { callWith, sudo } from "../../../utils/helpers";

describe("NominationAPI", () => {
    let api: ApiPromise;
    let alice: KeyringPair;
    let bob: KeyringPair;
    let nominationAPI: NominationAPI;
    let vaultsAPI: VaultsAPI;
    let feeAPI: FeeAPI;
    let charlie_stash: KeyringPair;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri(ALICE_URI);
        bob = keyring.addFromUri(BOB_URI);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, bob);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        feeAPI = new DefaultFeeAPI(api);

        if (!(await nominationAPI.isNominationEnabled())) {
            console.log("Enabling nomination...")
            await sudo(nominationAPI, (api) => api.setNominationEnabled(true));
        }

        // The account of a vault from docker-compose
        charlie_stash = keyring.addFromUri(CHARLIE_STASH_URI);
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
        await optInWithAccount(charlie_stash);
        const nominationVaults = await nominationAPI.listVaults();
        assert.equal(1, nominationVaults.length);
        assert.equal(charlie_stash.address, nominationVaults.map(v => v.toString())[0]);
        await optOutWithAccount(charlie_stash);
        assert.equal(0, (await nominationAPI.listVaults()).length);
    });

    async function setIssueFee(x: BN) {
        const previousAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(alice);
        await setNumericStorage(api, "Fee", "IssueFee", x, nominationAPI, 128);
        if (previousAccount) {
            nominationAPI.setAccount(previousAccount);
        }
    }

    it("Should nominate to and withdraw from a vault", async () => {
        await optInWithAccount(charlie_stash);

        const issueFee = await feeAPI.getIssueFee();
        const nominatorDeposit = PolkadotAmount.from.DOT(100);
        // Set issue fees to 100%
        await setIssueFee(new BN("1000000000000000000"));
        const stakingCapacityBeforeNomination = await vaultsAPI.getStakingCapacity(newAccountId(api, charlie_stash.address), Polkadot);
        // Deposit
        await nominationAPI.depositCollateral(charlie_stash.address, nominatorDeposit);
        const stakingCapacityAfterNomination = await vaultsAPI.getStakingCapacity(newAccountId(api, charlie_stash.address), Polkadot);
        assert.equal(
            stakingCapacityBeforeNomination.sub(nominatorDeposit).toString(),
            stakingCapacityAfterNomination.toString(),
            "Nomination failed to decrease staking capacity"
        );
        const nominationPairs = await nominationAPI.listNominationPairs(Bitcoin);
        assert.equal(2, nominationPairs.length, "There should be one nomination pair in the system, besides the vault to itself");

        const bobAddress = bob.address;
        const charlieStashAddress = charlie_stash.address;

        const [vaultId, nominatorId] = nominationPairs.find(([_, nominatorId]) => bobAddress == nominatorId)!;

        assert.equal(bobAddress, nominatorId);
        assert.equal(charlieStashAddress, vaultId);

        const interBtcToIssue = BTCAmount.from.BTC(1);
        await issueSingle(api, electrsAPI, bitcoinCoreClient, bob, interBtcToIssue, charlie_stash.address);
        const wrappedRewardsBeforeWithdrawal = (await nominationAPI.getNominatorReward(bob.address, charlie_stash.address, Bitcoin)).toBig();
        assert.isTrue(wrappedRewardsBeforeWithdrawal.gt(0.1), "Nominator should receive at least 0.1 interBTC");

        // Withdraw
        await nominationAPI.withdrawCollateral(charlie_stash.address, nominatorDeposit);
        const nominatorsAfterWithdrawal = await nominationAPI.listNominationPairs(Polkadot);
        assert.equal(0, nominatorsAfterWithdrawal.length);
        const nominatorCollateral = await nominationAPI.getTotalNomination(Polkadot, bob.address);
        assert.equal("0", nominatorCollateral.toString());

        const wrappedRewardsAfterWithdrawal = (await nominationAPI.getNominatorReward(bob.address, charlie_stash.address, Bitcoin)).toBig();
        assert.equal(
            wrappedRewardsBeforeWithdrawal.round(5, 0).toString(),
            wrappedRewardsAfterWithdrawal.round(5, 0).toString(),
            "Reward amount has been affected by the withdrawal"
        );
        await setIssueFee(encodeUnsignedFixedPoint(api, issueFee));
        await optOutWithAccount(charlie_stash);
    });

    async function optInWithAccount(vaultAccount: KeyringPair) {
        // will fail if vault is already opted in
        await callWith(nominationAPI, vaultAccount, api => api.optIn());
    }

    async function optOutWithAccount(vaultAccount: KeyringPair) {
        await callWith(nominationAPI, vaultAccount, api => api.optOut());
    }

});
