import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { InterBtcAmount, Kusama, Polkadot } from "@interlay/monetary-js";
import { InterbtcPrimitivesVaultId, VaultRegistryVault } from "../../../../src/index";

import { DefaultRedeemAPI, RedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
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
    VAULT_TO_LIQUIDATE_URI,
    VAULT_1_URI,
    VAULT_2_URI,
    ESPLORA_BASE_PATH,
    NATIVE_CURRENCY_TICKER,
    WRAPPED_CURRENCY_TICKER
} from "../../../config";
import { issueAndRedeem } from "../../../../src/utils";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { BTCRelayAPI, CollateralCurrency, DefaultBTCRelayAPI, ElectrsAPI, newVaultId, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";
import { ExecuteRedeem } from "../../../../src/utils/issueRedeem";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";

export type RequestResult = { hash: Hash; vault: VaultRegistryVault };

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
    let vault_1_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;

    let collateralCurrency: CollateralCurrency;
    let wrappedCurrency: WrappedCurrency;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        collateralCurrency = tickerToMonetaryCurrency(api, NATIVE_CURRENCY_TICKER) as CollateralCurrency;
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        keyring = new Keyring({ type: "sr25519" });
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, Polkadot, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, Kusama, wrappedCurrency);
        userAccount = keyring.addFromUri(USER_1_URI);
        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency, userAccount);
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

    it("should fail if no account is set", () => {
        const amount = InterBtcAmount.from.BTC(10);
        assert.isRejected(redeemAPI.request(amount, randomBtcAddress));
    });

    it("should issue and request redeem", async () => {
        const issueAmount = InterBtcAmount.from.BTC(0.00005);
        const redeemAmount = InterBtcAmount.from.BTC(0.00003);
        // DOT collateral
        await issueAndRedeem(
            api,
            electrsAPI,
            btcRelayAPI,
            bitcoinCoreClient,
            userAccount,
            collateralCurrency,
            vault_1_id,
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
            collateralCurrency,
            vault_2_id,
            issueAmount,
            redeemAmount,
            false,
            ExecuteRedeem.False
        );
    }).timeout(300000);

    it("should load existing redeem requests", async () => {
        const redeemRequests = await redeemAPI.list();
        assert.isAtLeast(
            redeemRequests.length,
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

    it("should getPremiumRedeemFeeRate", async () => {
        const premiumRedeemFee = await redeemAPI.getPremiumRedeemFeeRate();
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

});
