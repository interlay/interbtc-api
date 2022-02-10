import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { InterBtcAmount, Kusama, Polkadot } from "@interlay/monetary-js";

import { DefaultInterBtcApi, InterBtcApi, InterbtcPrimitivesVaultId, VaultRegistryVault } from "../../../../src/index";
import { createSubstrateAPI } from "../../../../src/factory";
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
    WRAPPED_CURRENCY_TICKER,
} from "../../../config";
import { issueAndRedeem } from "../../../../src/utils";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { ElectrsAPI, newVaultId, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";
import { ExecuteRedeem } from "../../../../src/utils/issueRedeem";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";

export type RequestResult = { hash: Hash; vault: VaultRegistryVault };

describe("redeem", () => {
    let api: ApiPromise;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    const randomBtcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let vault_to_liquidate: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;

    let wrappedCurrency: WrappedCurrency;

    let interBtcAPI: InterBtcApi;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        keyring = new Keyring({ type: "sr25519" });
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, Polkadot, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, Kusama, wrappedCurrency);
        userAccount = keyring.addFromUri(USER_1_URI);
        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);

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
        assert.isRejected(interBtcAPI.redeem.request(amount, randomBtcAddress));
    });

    it("should issue and request redeem", async () => {
        const issueAmount = InterBtcAmount.from.BTC(0.00005);
        const redeemAmount = InterBtcAmount.from.BTC(0.00003);
        // DOT collateral
        await issueAndRedeem(
            interBtcAPI,
            bitcoinCoreClient,
            userAccount,
            vault_1_id,
            issueAmount,
            redeemAmount,
            false,
            ExecuteRedeem.False
        );

        // KSM collateral
        await issueAndRedeem(
            interBtcAPI,
            bitcoinCoreClient,
            userAccount,
            vault_2_id,
            issueAmount,
            redeemAmount,
            false,
            ExecuteRedeem.False
        );
    }).timeout(300000);

    it("should load existing redeem requests", async () => {
        const redeemRequests = await interBtcAPI.redeem.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    it("should getFeesToPay", async () => {
        const amount = InterBtcAmount.from.BTC(2);
        const feesToPay = await interBtcAPI.redeem.getFeesToPay(amount);
        assert.equal(feesToPay.str.BTC(), "0.01");
    });

    it("should getFeeRate", async () => {
        const feePercentage = await interBtcAPI.redeem.getFeeRate();
        assert.equal(feePercentage.toString(), "0.005");
    });

    it("should getPremiumRedeemFeeRate", async () => {
        const premiumRedeemFee = await interBtcAPI.redeem.getPremiumRedeemFeeRate();
        assert.equal(premiumRedeemFee.toString(), "0.05");
    });

    it("should getCurrentInclusionFee", async () => {
        const currentInclusionFee = await interBtcAPI.redeem.getCurrentInclusionFee();
        assert.isTrue(!currentInclusionFee.isZero());
    });

    it("should getDustValue", async () => {
        const dustValue = await interBtcAPI.redeem.getDustValue();
        assert.equal(dustValue.str.BTC(), "0.00001");
    });

});
