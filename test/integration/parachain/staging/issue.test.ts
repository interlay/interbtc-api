import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import { InterBtcAmount, BitcoinUnit, Polkadot, Kusama } from "@interlay/monetary-js";
import { currencyIdToLiteral, InterbtcPrimitivesVaultId, IssueStatus, newAccountId, stripHexPrefix } from "../../../../src/index";

import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI, IssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { USER_1_URI, VAULT_1_URI, VAULT_2_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, VAULT_TO_BAN_URI, NATIVE_CURRENCY_TICKER, WRAPPED_CURRENCY_TICKER } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { CollateralCurrency, newVaultId, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";
import { runWhileMiningBTCBlocks, sudo } from "../../../utils/helpers";

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: IssueAPI;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    let userAccount: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;
    let vault_to_ban: KeyringPair;

    let collateralCurrency: CollateralCurrency;
    let wrappedCurrency: WrappedCurrency;

    before(async function () {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        collateralCurrency = tickerToMonetaryCurrency(api, NATIVE_CURRENCY_TICKER) as CollateralCurrency;
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, Polkadot, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, Kusama, wrappedCurrency);
        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);

        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency, userAccount);
    });

    after(async () => {
        api.disconnect();
    });

    it("should request one issue", async () => {
        // may fail if the relay isn't fully initialized
        const amount = InterBtcAmount.from.BTC(0.0001);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        const requestResults = await issueAPI.request(amount);
        assert.equal(
            requestResults.length,
            1,
            "Created multiple requests instead of one (ensure vault has sufficient collateral)"
        );
        const requestResult = requestResults[0];
        const issueRequest = await issueAPI.getRequestById(requestResult.id);
        assert.equal(issueRequest.wrappedAmount.str.BTC(), amount.sub(feesToPay).str.BTC(), "Amount different than expected");
    });

    it("should list existing requests", async () => {
        const issueRequests = await issueAPI.list();
        assert.isAtLeast(
            issueRequests.length,
            1,
            "Should have at least 1 issue request"
        );
    });

    it("request should fail if no account is set", async () => {
        const tmpIssueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency);
        const amount = InterBtcAmount.from.BTC(0.0000001);
        await assert.isRejected(tmpIssueAPI.request(amount));
    });

    it("should batch request across several vaults", async () => {
        const requestLimits = await issueAPI.getRequestLimits();
        const amount = requestLimits.singleVaultMaxIssuable.mul(1.1);
        const issueRequests = await issueAPI.request(amount);
        assert.equal(
            issueRequests.length,
            3,
            "Created wrong amount of requests, vaults have insufficient collateral"
        );
        const issuedAmount1 = issueRequests[0].wrappedAmount;
        const issueFee1 = issueRequests[0].bridgeFee;
        const issuedAmount2 = issueRequests[1].wrappedAmount;
        const issueFee2 = issueRequests[1].bridgeFee;
        const issuedAmount3 = issueRequests[2].wrappedAmount;
        const issueFee3 = issueRequests[2].bridgeFee;
        assert.equal(
            issuedAmount1.add(issueFee1).add(issuedAmount2).add(issueFee2).add(issuedAmount3).add(issueFee3).toBig(BitcoinUnit.BTC).round(5).toString(),
            amount.toBig(BitcoinUnit.BTC).round(5).toString(),
            "Issued amount is not equal to requested amount"
        );
    });

    it("execute should fail if no account is set", async () => {
        const tmpIssueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency);
        await assert.isRejected(tmpIssueAPI.execute("", ""));
    });

    it("should fail to request a value finer than 1 Satoshi", async () => {
        const amount = InterBtcAmount.from.BTC("0.00000121");
        await assert.isRejected(
            issueSingle(api, electrsAPI, bitcoinCoreClient, userAccount, amount, collateralCurrency, vault_1_id, true, false)
        );
    });

    // auto-execution tests may stall indefinitely, due to vault client inaction.
    // This will cause the testing pipeline to time out.
    it("should request and auto-execute issue", async () => {
        const amount = InterBtcAmount.from.BTC(0.00121);

        const feesToPay = await issueAPI.getFeesToPay(amount);
        const issueResult = await issueSingle(
            api,
            electrsAPI,
            bitcoinCoreClient,
            userAccount,
            amount,
            collateralCurrency,
            vault_1_id,
            true,
            false
        );
        assert.equal(
            issueResult.finalWrappedTokenBalance.sub(issueResult.initialWrappedTokenBalance).toString(),
            amount.sub(feesToPay).toString(),
            "Final balance was not increased by the exact amount specified"
        );
    }).timeout(500000);

    it("should request and manually execute issue", async () => {
        // Unlike the other `issue` tests that involve DOT, this one locks KSM
        // covering the multi-collateral feature
        const amount = InterBtcAmount.from.BTC(0.001);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        const oneSatoshi = InterBtcAmount.from.Satoshi(1);
        const issueResult = await issueSingle(
            api,
            electrsAPI,
            bitcoinCoreClient,
            userAccount,
            amount,
            collateralCurrency,
            vault_2_id,
            false,
            false
        );
        assert.equal(
            issueResult.finalWrappedTokenBalance.sub(issueResult.initialWrappedTokenBalance).toString(),
            amount.sub(feesToPay).sub(oneSatoshi).toString(),
            "Final balance was not increased by the exact amount specified"
        );
    }).timeout(500000);

    it("should getFeesToPay", async () => {
        const amount = InterBtcAmount.from.BTC(2);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        assert.equal(feesToPay.str.BTC(), "0.01");
    });

    it("should getFeeRate", async () => {
        const feePercentage = await issueAPI.getFeeRate();
        assert.equal(feePercentage.toString(), "0.005");
    });

    it("should getRequestLimits", async () => {
        const requestLimits = await issueAPI.getRequestLimits();
        assert.isTrue(requestLimits.singleVaultMaxIssuable.gt(InterBtcAmount.from.BTC(0.001)), "singleVaultMaxIssuable is not greater than 100");
        assert.isTrue(
            requestLimits.totalMaxIssuable.gt(requestLimits.singleVaultMaxIssuable),
            "totalMaxIssuable is not greater than singleVaultMaxIssuable"
        );
    });

    // TODO: Unskip after `subscribeToIssueExpiry` is reimplemented
    // This test should be kept at the end of the file as it will ban the vault used for issuing
    it.skip("should cancel an issue request", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const initialIssuePeriod = await issueAPI.getIssuePeriod();
            await sudo(issueAPI, (api) => api.setIssuePeriod(0));
            try {
                // request issue
                const amount = InterBtcAmount.from.BTC(0.0000121);
                const vaultCollateralIdLiteral = currencyIdToLiteral(vault_2_id.currencies.collateral);
                const requestResults = await issueAPI.request(amount, newAccountId(api, vault_2.address), vaultCollateralIdLiteral);
                assert.equal(requestResults.length, 1, "Test broken: more than one issue request created"); // sanity check
                const requestResult = requestResults[0];

                // Wait for issue expiry callback
                await new Promise<void>((resolve, _) => {
                    // issueAPI.subscribeToIssueExpiry(newAccountId(api, userAccount.address), (requestId) => {
                    //     if (stripHexPrefix(requestResult.id.toString()) === stripHexPrefix(requestId.toString())) {
                    //         resolve();
                    //     }
                    // });
                });
    
                await issueAPI.cancel(requestResult.id);
    
                const issueRequest = await issueAPI.getRequestById(requestResult.id);
                assert.isTrue(issueRequest.status === IssueStatus.Cancelled, "Failed to cancel issue request");

                // Set issue period back to its initial value to minimize side effects.
                await sudo(issueAPI, (api) => api.setIssuePeriod(initialIssuePeriod));

            } catch (e) {
                // Set issue period back to its initial value to minimize side effects.
                await sudo(issueAPI, (api) => api.setIssuePeriod(initialIssuePeriod));
                throw e;
            }
        });
    }).timeout(5 * 60000);

});
