import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { 
    CollateralCurrency, 
    DefaultInterBtcApi, 
    InterBtcApi, 
    InterbtcPrimitivesVaultId, 
    VaultRegistryVault 
} from "../../../../../src/index";
import { createSubstrateAPI } from "../../../../../src/factory";
import { assert } from "../../../../chai";
import {
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_USERNAME,
    PARACHAIN_ENDPOINT,
    BITCOIN_CORE_WALLET,
    BITCOIN_CORE_PORT,
    USER_1_URI,
    VAULT_1_URI,
    VAULT_2_URI,
    ESPLORA_BASE_PATH,
} from "../../../../config";
import { getCorrespondingCollateralCurrency, issueAndRedeem, newMonetaryAmount } from "../../../../../src/utils";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { newVaultId, WrappedCurrency } from "../../../../../src";
import { ExecuteRedeem } from "../../../../../src/utils/issueRedeem";

export type RequestResult = { hash: Hash; vault: VaultRegistryVault };

describe("redeem", () => {
    let api: ApiPromise;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    const randomBtcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    let bitcoinCoreClient: BitcoinCoreClient;
    let vault_1: KeyringPair;
    let vault_1_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrency: CollateralCurrency;

    let interBtcAPI: InterBtcApi;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        collateralCurrency = getCorrespondingCollateralCurrency(interBtcAPI.getGovernanceCurrency());
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency);

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
        const amount = newMonetaryAmount(10, wrappedCurrency);
        assert.isRejected(interBtcAPI.redeem.request(amount, randomBtcAddress));
    });

    // TODO: revisit after patch to figure out how 3000 Satoshi end up eing sent as 10 Sat, making the test fail
    it.skip("should issue and request redeem", async () => {
        const issueAmount = newMonetaryAmount(0.00005, wrappedCurrency, true);
        const redeemAmount = newMonetaryAmount(0.00003, wrappedCurrency, true);
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
    }).timeout(500000);

    it("should load existing redeem requests", async () => {
        const redeemRequests = await interBtcAPI.redeem.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    // TODO: maybe add this to redeem API
    it("should get redeemBtcDustValue", async () => {
        const dust = await interBtcAPI.api.query.redeem.redeemBtcDustValue();
        assert.equal(dust.toString(), "1000");
    });

    it("should getFeesToPay", async () => {
        const amount = newMonetaryAmount(2, wrappedCurrency, true);
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
