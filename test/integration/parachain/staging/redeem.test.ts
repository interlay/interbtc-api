import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { DefaultRedeemAPI, RedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { Vault } from "../../../../src/interfaces/default";
import { assert } from "../../../chai";
import { 
    DEFAULT_BITCOIN_CORE_HOST,
    DEFAULT_BITCOIN_CORE_NETWORK,
    DEFAULT_BITCOIN_CORE_PASSWORD,
    DEFAULT_BITCOIN_CORE_USERNAME,
    DEFAULT_PARACHAIN_ENDPOINT,
    DEFAULT_BITCOIN_CORE_WALLET,
    DEFAULT_BITCOIN_CORE_PORT
} from "../../../config";
import { DefaultIssueAPI, IssueAPI } from "../../../../src/parachain/issue";
import { issueAndRedeem } from "../../../../src/utils";
import * as bitcoinjs from "bitcoinjs-lib";
import { DefaultTreasuryAPI, TreasuryAPI } from "../../../../src/parachain/treasury";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import Big from "big.js";
import { DefaultStakedRelayerAPI, ElectrsAPI, ExecuteRedeem, REGTEST_ESPLORA_BASE_PATH, StakedRelayerAPI, IssueStatus } from "../../../../src";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: RedeemAPI;
    let issueAPI: IssueAPI;
    let treasuryAPI: TreasuryAPI;
    let stakedRelayerAPI: StakedRelayerAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    let alice_stash: KeyringPair;
    let charlie_stash: KeyringPair;
    const randomBtcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        alice_stash = keyring.addFromUri("//Alice//stash");
        charlie_stash = keyring.addFromUri("//Charlie//stash");
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        treasuryAPI = new DefaultTreasuryAPI(api);
        stakedRelayerAPI = new DefaultStakedRelayerAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice_stash);
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

    describe("request", () => {
        it("should fail if no account is set", () => {
            const amount = new Big(10);
            assert.isRejected(redeemAPI.request(amount, randomBtcAddress));
        });

        it("should issue and request redeem", async () => {
            const issueAmount = new Big("0.001");
            const redeemAmount = new Big("0.0009");
            await issueAndRedeem(
                api,
                electrsAPI,
                bitcoinCoreClient,
                alice,
                undefined,
                issueAmount,
                redeemAmount,
                undefined,
                ExecuteRedeem.False
            );
        }).timeout(300000);

        // Skip this test. Vaults fail to auto-execute to redeem in good time.
        it.skip("should issue and auto-execute redeem", async () => {
            const initialBalance = await treasuryAPI.balance(api.createType("AccountId", alice.address));
            const issueAmount = new Big("0.001");
            const issueFeesToPay = await issueAPI.getFeesToPay(issueAmount);
            const redeemAmount = new Big("0.0009");
            await issueAndRedeem(api, electrsAPI, bitcoinCoreClient, alice, undefined, issueAmount, redeemAmount);

            // check redeeming worked
            const expectedBalanceDifferenceAfterRedeem = issueAmount.sub(issueFeesToPay).sub(redeemAmount);
            const finalBalance = await treasuryAPI.balance(api.createType("AccountId", alice.address));
            assert.equal(initialBalance.add(expectedBalanceDifferenceAfterRedeem), finalBalance);
        }).timeout(1000000);

        // Vaults fail to submit the opreturn tx in good time
        it.skip("should issue and manually execute redeem", async () => {
            const initialBalance = await treasuryAPI.balance(api.createType("AccountId", alice.address));
            const issueAmount = new Big("0.001");
            const issueFeesToPay = await issueAPI.getFeesToPay(issueAmount);
            const redeemAmount = new Big("0.0009");
            await issueAndRedeem(api, electrsAPI, bitcoinCoreClient, alice, undefined, issueAmount, redeemAmount, undefined, ExecuteRedeem.Manually);

            // check redeeming worked
            const expectedBalanceDifferenceAfterRedeem = issueAmount.sub(issueFeesToPay).sub(redeemAmount);
            const finalBalance = await treasuryAPI.balance(api.createType("AccountId", alice.address));
            assert.equal(initialBalance.add(expectedBalanceDifferenceAfterRedeem), finalBalance);
        }).timeout(1000000);
    });

    it("should load existing redeem requests", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        redeemAPI.setAccount(alice);

        const redeemRequests = await redeemAPI.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in docker-compose setup. Should have at least 1 redeem request"
        );
    });

    it("should map existing requests", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        redeemAPI.setAccount(alice);
        const aliceAccountId = api.createType("AccountId", alice.address);
        const redeemRequests = await redeemAPI.mapForUser(aliceAccountId);
        assert.isAtLeast(
            redeemRequests.size,
            1,
            "Error in docker-compose setup. Should have at least 1 issue request"
        );
    });

    it("should getFeesToPay", async () => {
        const amount = new Big("2");
        const feesToPay = await redeemAPI.getFeesToPay(amount);
        assert.equal(feesToPay.toString(), "0.01");
    });

    it("should getFeeRate", async () => {
        const feePercentage = await redeemAPI.getFeeRate();
        assert.equal(feePercentage.toString(), "0.005");
    });

    it("should getPremiumRedeemFee", async () => {
        const premiumRedeemFee = await redeemAPI.getPremiumRedeemFee();
        assert.equal(premiumRedeemFee.toString(), "0.05");
    });

    it("should getCurrentInclusionFee", async () => {
        const currentInclusionFee = await redeemAPI.getCurrentInclusionFee();
        assert.equal(currentInclusionFee.toString(), "0");
    });

    it("should getDustValue", async () => {
        const dustValue = await redeemAPI.getDustValue();
        assert.equal(dustValue.toString(), "0.00001");
    });

});
