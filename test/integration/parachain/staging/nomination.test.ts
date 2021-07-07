import { BTCAmount, Polkadot, PolkadotAmount } from "@interlay/monetary-js";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import Big from "big.js";
import * as bitcoinjs from "bitcoinjs-lib";
import BN from "bn.js";

import { BitcoinCoreClient, CurrencyIdLiteral, DefaultElectrsAPI, DefaultFeeAPI, DefaultNominationAPI, DefaultTokensAPI, DefaultVaultsAPI, ElectrsAPI, encodeUnsignedFixedPoint, FeeAPI, issueSingle, newAccountId, NominationAPI, REGTEST_ESPLORA_BASE_PATH, satToBTC, setNumericStorage, TokensAPI, VaultsAPI } from "../../../../src";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";

describe("NominationAPI", () => {
    let api: ApiPromise;
    let alice: KeyringPair;
    let bob: KeyringPair;
    let nominationAPI: NominationAPI;
    let tokensAPI: TokensAPI;
    let vaultsAPI: VaultsAPI;
    let feeAPI: FeeAPI;
    let charlie_stash: KeyringPair;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, bob);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        tokensAPI = new DefaultTokensAPI(api);
        feeAPI = new DefaultFeeAPI(api);

        // The account of a vault from docker-compose
        charlie_stash = keyring.addFromUri("//Charlie//stash");
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
        await optInAndPreserveAPIAccount(charlie_stash);
        const nominationVaults = await nominationAPI.listVaults();
        assert.equal(1, nominationVaults.length);
        assert.equal(charlie_stash.address, nominationVaults.map(v => v.toString())[0]);
        await optOutAndPreserveAPIAccount(charlie_stash);
        assert.equal(0, (await nominationAPI.listVaults()).length);
    });

    async function setIssueFee(x: BN) {
        const previousAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(alice);
        await setNumericStorage(api, "Fee", "IssueFee", x, nominationAPI, 128);
        if(previousAccount) {
            nominationAPI.setAccount(previousAccount);
        }
    }

    it("Should nominate to and withdraw from a vault", async () => {
        await optInAndPreserveAPIAccount(charlie_stash);

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
        const nominations = await nominationAPI.listNominationPairs();
        assert.equal(1, nominations.length, "There should be one nomination pair in the system");
        const nomination = nominations[0];
        // `nomination` is of type `[nominatorId, vaultId]`.
        const nominatorId = nomination[0].toString();
        const vaultId = nomination[1].toString();
        assert.equal(bob.address, nominatorId);
        assert.equal(charlie_stash.address, vaultId);

        const interBtcToIssue = BTCAmount.from.BTC(1);
        await issueSingle(api, electrsAPI, bitcoinCoreClient, bob, interBtcToIssue, charlie_stash.address);
        const wrappedRewardsBeforeWithdrawal = (await nominationAPI.getNominatorRewards(bob.address)).map(v => v[1].str.BTC());
        assert.equal(1, wrappedRewardsBeforeWithdrawal.length);
        assert.isTrue(new Big(wrappedRewardsBeforeWithdrawal[0]).gt(0.4), "Nominator should receive at least 0.4 interBTC");

        // Withdraw
        await nominationAPI.withdrawCollateral(charlie_stash.address, nominatorDeposit);
        const nominatorsAfterWithdrawal = await nominationAPI.listNominationPairs();
        assert.equal(1, nominatorsAfterWithdrawal.length);
        const nominatorCollateral = await nominationAPI.getTotalNomination(Polkadot, bob.address);
        assert.equal("0", nominatorCollateral.toString());

        const wrappedRewardsAfterWithdrawal = (await nominationAPI.getNominatorRewards(bob.address)).map(v => v[1].str.BTC());
        assert.equal(
            new Big(wrappedRewardsBeforeWithdrawal[0]).round(5, 0).toString(),
            new Big(wrappedRewardsAfterWithdrawal[0]).round(5, 0).toString(),
            "Reward amount has been affected by the withdrawal"
        );
        await setIssueFee(encodeUnsignedFixedPoint(api, issueFee));
        await optOutAndPreserveAPIAccount(charlie_stash);
    });

    async function optInAndPreserveAPIAccount(vaultAccount: KeyringPair) {
        const initialNominationAPIAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(vaultAccount);
        await nominationAPI.optIn();
        if(initialNominationAPIAccount) {
            nominationAPI.setAccount(initialNominationAPIAccount);
        }
    }

    async function optOutAndPreserveAPIAccount(vaultAccount: KeyringPair) {
        const initialNominationAPIAccount = nominationAPI.getAccount();
        nominationAPI.setAccount(vaultAccount);
        await nominationAPI.optOut();
        if(initialNominationAPIAccount) {
            nominationAPI.setAccount(initialNominationAPIAccount);
        }
    }

});
