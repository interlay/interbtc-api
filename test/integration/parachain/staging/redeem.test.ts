import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { interBTC, interBTCAmount } from "@interlay/monetary-js";

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
    DEFAULT_BITCOIN_CORE_PORT,
    ALICE_URI,
    FERDIE_STASH_URI,
    CHARLIE_STASH_URI,
    DAVE_STASH_URI
} from "../../../config";
import { issueAndRedeem } from "../../../../src/utils";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { BTCRelayAPI, DefaultBTCRelayAPI, ElectrsAPI, REGTEST_ESPLORA_BASE_PATH } from "../../../../src";
import { ExecuteRedeem } from "../../../../src/utils/issueRedeem";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: RedeemAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    const randomBtcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    let electrsAPI: ElectrsAPI;
    let btcRelayAPI: BTCRelayAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let ferdie_stash: KeyringPair;
    let charlie_stash: KeyringPair;
    let dave_stash: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        ferdie_stash = keyring.addFromUri(FERDIE_STASH_URI);
        charlie_stash = keyring.addFromUri(CHARLIE_STASH_URI);
        dave_stash = keyring.addFromUri(DAVE_STASH_URI);
        alice = keyring.addFromUri(ALICE_URI);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, interBTC);
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
            const amount = interBTCAmount.from.BTC(10);
            assert.isRejected(redeemAPI.request(amount, randomBtcAddress));
        });

        it("should issue and request redeem", async () => {
            const issueAmount = interBTCAmount.from.BTC(0.001);
            const redeemAmount = interBTCAmount.from.BTC(0.0009);
            // DOT collateral
            await issueAndRedeem(
                api,
                electrsAPI,
                btcRelayAPI,
                bitcoinCoreClient,
                alice,
                charlie_stash.address,
                issueAmount,
                redeemAmount,
                false,
                ExecuteRedeem.False
            );

            // KSM collateral
            await issueAndRedeem(
                api,
                electrsAPI,
                btcRelayAPI,
                bitcoinCoreClient,
                alice,
                dave_stash.address,
                issueAmount,
                redeemAmount,
                false,
                ExecuteRedeem.False
            );
        }).timeout(300000);
    });

    it("should load existing redeem requests", async () => {
        redeemAPI.setAccount(alice);

        const redeemRequests = await redeemAPI.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    it("should map existing requests", async () => {
        redeemAPI.setAccount(alice);

        const aliceAccountId = api.createType("AccountId", alice.address);
        const redeemRequests = await redeemAPI.mapForUser(aliceAccountId);
        assert.isAtLeast(
            redeemRequests.size,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    it("should getFeesToPay", async () => {
        const amount = interBTCAmount.from.BTC(2);
        const feesToPay = await redeemAPI.getFeesToPay(amount);
        assert.equal(feesToPay.str.BTC(), "0.01");
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
        assert.isTrue(!currentInclusionFee.isZero());
    });

    it("should getDustValue", async () => {
        const dustValue = await redeemAPI.getDustValue();
        assert.equal(dustValue.str.BTC(), "0.00001");
    });

    it("should list redeem request by a vault", async () => {
        const bobAddress = ferdie_stash.address;
        const bobId = api.createType("AccountId", bobAddress);
        const redeemRequests = await redeemAPI.mapRedeemRequests(bobId);
        redeemRequests.forEach((request) => {
            assert.deepEqual(request.vaultParachainAddress, bobAddress);
        });
    });

});
