import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import {
    AssetRegistryAPI,
    currencyIdToMonetaryCurrency,
    DefaultAssetRegistryAPI,
    DefaultInterBtcApi,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    VaultRegistryVault,
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
import { issueAndRedeem, newMonetaryAmount, stripHexPrefix } from "../../../../../src/utils";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { newVaultId, WrappedCurrency } from "../../../../../src";
import { ExecuteRedeem } from "../../../../../src/utils/issueRedeem";
import Big from "big.js";
import {
    bumpFeesForBtcTx,
    calculateBtcTxVsize,
    getAUSDForeignAsset,
    getCorrespondingCollateralCurrenciesForTests,
} from "../../../../utils/helpers";

export type RequestResult = { hash: Hash; vault: VaultRegistryVault };

describe("redeem", () => {
    let api: ApiPromise;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let bitcoinCoreClient: BitcoinCoreClient;
    let vault_1: KeyringPair;
    let vault_2: KeyringPair;
    const collateralTickerToVaultIdsMap: Map<string, InterbtcPrimitivesVaultId[]> = new Map();

    let wrappedCurrency: WrappedCurrency;

    let interBtcAPI: InterBtcApi;
    let assetRegistry: AssetRegistryAPI;

    const fetchBtcTxIdFromOpReturn = async (
        redeemRequestId: string,
        timeoutMs: number = 5 * 60 * 1000
    ): Promise<string> => {
        const opreturnData = stripHexPrefix(redeemRequestId);
        return interBtcAPI.electrsAPI.waitForOpreturn(opreturnData, timeoutMs, 5000).catch((_) => {
            throw new Error(`Could not fetch BTC transaction id for redeem request id ${redeemRequestId}`);
        });
    };

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        assetRegistry = new DefaultAssetRegistryAPI(api);

        const collateralCurrencies = getCorrespondingCollateralCurrenciesForTests(interBtcAPI.getGovernanceCurrency());
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_2 = keyring.addFromUri(VAULT_2_URI);

        collateralCurrencies.forEach((collateralCurrency) => {
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

    it("should issue and request redeem", async () => {
        // "usual" scope with hard coded collateral currency (or currencies)
        const vaultsInScope = Array.from(collateralTickerToVaultIdsMap.values());

        // add a pair of aUSD vaults to the list if aUSD has been registered
        const aUSD = await getAUSDForeignAsset(interBtcAPI.assetRegistry);
        if (aUSD !== undefined) {
            const vault_1_id_ausd = newVaultId(api, vault_1.address, aUSD, wrappedCurrency);
            const vault_2_id_ausd = newVaultId(api, vault_2.address, aUSD, wrappedCurrency);
            vaultsInScope.push([vault_1_id_ausd, vault_2_id_ausd]);
        }

        for (const [vault_1_id] of vaultsInScope) {
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
        }
    }).timeout(12 * 60000);

    it("should load existing redeem requests", async () => {
        const redeemRequests = await interBtcAPI.redeem.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });

    it("should have applied oracle fee rate to redeem transaction", async () => {
        let btcTxFound = 0;
        const oracleBtcFeePerByte = await interBtcAPI.oracle.getBitcoinFees();

        const redeemRequests = await interBtcAPI.redeem.list();
        for (const redeemRequest of redeemRequests) {
            let txId: string;
            try {
                txId = await fetchBtcTxIdFromOpReturn(redeemRequest.id, 1 * 60 * 1000);
                btcTxFound++;
            } catch (e: any) {
                console.warn(e?.message || "Unknown error");
                console.log(
                    `Unable to find btc tx for redeem request with id ${redeemRequest.id}, skipping this request.`
                );
                continue;
            }

            // get the actual values on the BTC transaction
            const btcTx = await interBtcAPI.electrsAPI.getTx(txId);

            // TODO: remove at later stage. print debug info while we seem to have occasional failures
            console.log(`BTC transaction details:\n${JSON.stringify(btcTx)} `);

            const actualTxFeeSatoshi = new Big(btcTx.fee || 0);
            const actualTxVsize = calculateBtcTxVsize(btcTx);
            if (actualTxVsize.eq(0)) {
                assert.fail(
                    `Invalid actual tx vsize of 0, cannot calculate fee rate for redeem request id ${redeemRequest.id}`
                );
                return;
            }

            // allowable delta from observations: now and then, the fee is off by 1 satoshi,
            // so allow for that difference plus some epsilon (1e-5)
            const expectedFees = oracleBtcFeePerByte.mul(actualTxVsize);
            const allowedFeesMax = expectedFees.plus(1);
            const allowedFeeDelta = allowedFeesMax.div(expectedFees).plus(0.00001);

            const actualFeeRateSatoshiPerByte = actualTxFeeSatoshi.div(actualTxVsize);
            expect(actualFeeRateSatoshiPerByte.toNumber()).to.be.closeTo(
                allowedFeeDelta.toNumber(),
                oracleBtcFeePerByte.toNumber(),
                `BTC fee rate for redeem request id ${redeemRequest.id} is not close to expected value.
                    Maximum allowed delta is ${allowedFeeDelta.toNumber()}.
                    BTC tx rate is ${actualFeeRateSatoshiPerByte.toString()}, but oracle rate is ${oracleBtcFeePerByte.toString()}`
            );
        }

        expect(btcTxFound).greaterThan(0, "Failed to find any redeem request transactions to inspect.");
    }).timeout(10 * 60000);

    // The goal of this test is to check that a vault sends the redeem BTC transaction with RBF (replace by fee) enabled.
    // And while we have the data, we might as well check if the new fee is indeed elevated.
    it("should be able to perform RBF on a redeem transaction", async () => {
        // grab only first entry (collateral currency), and only vault_1_id
        const [vault_1_id] = collateralTickerToVaultIdsMap.values().next().value as [
            InterbtcPrimitivesVaultId,
            InterbtcPrimitivesVaultId
        ];
        const issueAmount = newMonetaryAmount(0.0001, wrappedCurrency, true);
        const redeemAmount = newMonetaryAmount(0.00007, wrappedCurrency, true);

        const [, redeemRequest] = await issueAndRedeem(
            interBtcAPI,
            bitcoinCoreClient,
            userAccount,
            vault_1_id,
            issueAmount,
            redeemAmount,
            false,
            ExecuteRedeem.False
        );

        // get BTC tx id
        const btcTxId = await fetchBtcTxIdFromOpReturn(redeemRequest.id);

        const collateralCurrency = await currencyIdToMonetaryCurrency(assetRegistry, vault_1_id.currencies.collateral);
        const vaultBitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            `vault_1-${collateralCurrency.ticker}-${wrappedCurrency.ticker}`
        );

        // try to bump fees
        const result = await bumpFeesForBtcTx(vaultBitcoinCoreClient, btcTxId);

        if (result.errors && result.errors.length > 0) {
            // concatenate errors for print
            const errorMessage = result.errors.join("; ");
            assert.fail(`Could not bump fees for redeem request id ${redeemRequest.id}, error(s): ${errorMessage}`);
        }

        const feesBefore = result.origfee;
        const feesAfter = result.fee;

        assert.isAbove(
            feesAfter,
            feesBefore,
            `Fees did not increase after bumpfee for redeem request id ${redeemRequest.id}`
        );
    }).timeout(10 * 60000);

    // TODO: maybe add this to redeem API
    it("should get redeemBtcDustValue", async () => {
        const dust = await interBtcAPI.api.query.redeem.redeemBtcDustValue();
        assert.equal(dust.toString(), "1000");
    });

    it("should getFeesToPay", async () => {
        const amount = newMonetaryAmount(2, wrappedCurrency, true);
        const feesToPay = await interBtcAPI.redeem.getFeesToPay(amount);
        assert.equal(feesToPay.toString(), "0.01");
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
        assert.equal(dustValue.toString(), "0.00001");
    });
});
