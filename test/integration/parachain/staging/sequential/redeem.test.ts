import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import {
    DefaultInterBtcApi,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    VaultRegistryVault
} from "../../../../../src/index";
import { createSubstrateAPI } from "../../../../../src/factory";
import { assert, expect } from "../../../../chai";
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
import { getCorrespondingCollateralCurrencies, issueAndRedeem, newMonetaryAmount, stripHexPrefix } from "../../../../../src/utils";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { newVaultId, WrappedCurrency } from "../../../../../src";
import { ExecuteRedeem } from "../../../../../src/utils/issueRedeem";
import Big from "big.js";
import { calculateBtcTxVsize } from "../../../../utils/helpers";

export type RequestResult = { hash: Hash; vault: VaultRegistryVault };

describe("redeem", () => {
    let api: ApiPromise;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    const randomBtcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
    let bitcoinCoreClient: BitcoinCoreClient;
    let vault_1: KeyringPair;
    let vault_2: KeyringPair;
    const collateralTickerToVaultIdsMap: Map<string, InterbtcPrimitivesVaultId[]> = new Map();

    let wrappedCurrency: WrappedCurrency;

    let interBtcAPI: InterBtcApi;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);

        const collateralCurrencies = getCorrespondingCollateralCurrencies(interBtcAPI.getGovernanceCurrency());
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_2 = keyring.addFromUri(VAULT_2_URI);

        collateralCurrencies.forEach(collateralCurrency => {
            const vault_1_id = newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency);
            const vault_2_id = newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency);
            collateralTickerToVaultIdsMap.set(collateralCurrency.ticker, [vault_1_id, vault_2_id]);
        });

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

    it("should fail if no account is set", async () => {
        const amount = newMonetaryAmount(10, wrappedCurrency);
        await assert.isRejected(interBtcAPI.redeem.request(amount, randomBtcAddress));
    }).timeout(3 * 60000);

    it("should issue and request redeem", async () => {
        for (const [vault_1_id, vault_2_id] of collateralTickerToVaultIdsMap.values()) {
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
        }
    }).timeout(16 * 60000);

    it("should load existing redeem requests", async () => {
        const redeemRequests = await interBtcAPI.redeem.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    it("should have applied oracle fee rate to redeem transaction", async () => {
        const oracleBtcFeePerByte = await interBtcAPI.oracle.getBitcoinFees();

        const redeemRequests = await interBtcAPI.redeem.list();
        for (const redeemRequest of redeemRequests) {
            const opreturnData = stripHexPrefix(redeemRequest.id.toString());
            const txId = await interBtcAPI.electrsAPI.waitForOpreturn(opreturnData, 5 * 60 * 1000, 5000);
            if (txId === undefined) {
                assert.fail(`Could not fetch BTC transaction id for redeem request id ${redeemRequest.id}`);
                return;
            }

            // get the actual values on the BTC transaction
            const btcTx = await interBtcAPI.electrsAPI.getTx(txId);

            // TODO: remove at later stage. print debug info while we seem to have occasional failures
            console.log(`BTC transaction details:\n${JSON.stringify(btcTx)} `);

            const actualTxFeeSatoshi = new Big(btcTx.fee || 0);
            const actualTxVsize = calculateBtcTxVsize(btcTx);
            if (actualTxVsize.eq(0)) {
                assert.fail(`Invalid actual tx vsize of 0, cannot calculate fee rate for redeem request id ${redeemRequest.id}`);
                return;
            }
            
            const actualFeeRateSatoshiPerByte = actualTxFeeSatoshi.div(actualTxVsize);
            expect(actualFeeRateSatoshiPerByte.toNumber())
                .to.be.closeTo(
                    0.00001,
                    oracleBtcFeePerByte.toNumber(),
                    `BTC fee rate for redeem request id ${redeemRequest.id} is not close to expected value.
                    BTC tx rate is ${actualFeeRateSatoshiPerByte.toString()}, but oracle rate is ${oracleBtcFeePerByte.toString()}`
                );
        }
    }).timeout(10 * 60000);

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
