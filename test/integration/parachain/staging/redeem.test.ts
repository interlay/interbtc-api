import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { InterBtc, InterBtcAmount } from "@interlay/monetary-js";

import { DefaultRedeemAPI, RedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { Vault } from "../../../../src/interfaces/default";
import { assert } from "../../../chai";
import {
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_USERNAME,
    PARACHAIN_ENDPOINT,
    BITCOIN_CORE_WALLET,
    BITCOIN_CORE_PORT,
    USER_1_URI,
    VAULT_TO_LIQUIDATE,
    VAULT_1,
    VAULT_2
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
    let userAccount: KeyringPair;
    const randomBtcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    let electrsAPI: ElectrsAPI;
    let btcRelayAPI: BTCRelayAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let vault_to_liquidate: KeyringPair;
    let vault_1: KeyringPair;
    let vault_2: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE);
        vault_1 = keyring.addFromUri(VAULT_1);
        vault_2 = keyring.addFromUri(VAULT_2);
        userAccount = keyring.addFromUri(USER_1_URI);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc);
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

    describe("request", () => {
        it("should fail if no account is set", () => {
            const amount = InterBtcAmount.from.BTC(10);
            assert.isRejected(redeemAPI.request(amount, randomBtcAddress));
        });

        it("should issue and request redeem", async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.001);
            const redeemAmount = InterBtcAmount.from.BTC(0.0009);
            // DOT collateral
            await issueAndRedeem(
                api,
                electrsAPI,
                btcRelayAPI,
                bitcoinCoreClient,
                userAccount,
                vault_1.address,
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
                userAccount,
                vault_2.address,
                issueAmount,
                redeemAmount,
                false,
                ExecuteRedeem.False
            );
        }).timeout(300000);
    });

    it("should load existing redeem requests", async () => {
        redeemAPI.setAccount(userAccount);

        const redeemRequests = await redeemAPI.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    it("should map existing requests", async () => {
        redeemAPI.setAccount(userAccount);

        const userAccountId = api.createType("AccountId", userAccount.address);
        const redeemRequests = await redeemAPI.mapForUser(userAccountId);
        assert.isAtLeast(
            redeemRequests.size,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    it("should getFeesToPay", async () => {
        const amount = InterBtcAmount.from.BTC(2);
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
        const vaultToLiquidateAddress = vault_to_liquidate.address;
        const vaultToLiquidateId = api.createType("AccountId", vaultToLiquidateAddress);
        const redeemRequests = await redeemAPI.mapRedeemRequests(vaultToLiquidateId);
        redeemRequests.forEach((request) => {
            assert.deepEqual(request.vaultParachainAddress, vaultToLiquidateAddress);
        });
    });

});
