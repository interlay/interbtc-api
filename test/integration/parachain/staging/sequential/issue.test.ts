import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinUnit } from "@interlay/monetary-js";
import { CollateralCurrency, currencyIdToLiteral, DefaultElectrsAPI, DefaultInterBtcApi, ElectrsAPI, getCorrespondingCollateralCurrency, InterBtcApi, InterbtcPrimitivesVaultId, IssueStatus, newAccountId, newMonetaryAmount } from "../../../../../src/index";

import { createSubstrateAPI } from "../../../../../src/factory";
import { assert } from "../../../../chai";
import { USER_1_URI, VAULT_1_URI, VAULT_2_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, VAULT_TO_BAN_URI } from "../../../../config";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { issueSingle } from "../../../../../src/utils/issueRedeem";
import { newVaultId, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../../src";
import { runWhileMiningBTCBlocks, sudo } from "../../../../utils/helpers";

describe.only("issue", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userInterBtcAPI: InterBtcApi;
    let electrsAPI: ElectrsAPI;

    let userAccount: KeyringPair;
    let vault_1: KeyringPair;
    let vault_1_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;
    let vault_to_ban: KeyringPair;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrency: CollateralCurrency;

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        collateralCurrency = getCorrespondingCollateralCurrency(userInterBtcAPI.getGovernanceCurrency());
        wrappedCurrency = userInterBtcAPI.getWrappedCurrency();
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_1_id = newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency);
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
    });

    after(async () => {
        api.disconnect();
    });

    it("should request one issue", async () => {
        // may fail if the relay isn't fully initialized
        const amount = newMonetaryAmount(0.0001, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        const requestResults = await userInterBtcAPI.issue.request(amount);
        assert.equal(
            requestResults.length,
            1,
            "Created multiple requests instead of one (ensure vault has sufficient collateral)"
        );
        const requestResult = requestResults[0];
        const issueRequest = await userInterBtcAPI.issue.getRequestById(requestResult.id);
        assert.equal(issueRequest.wrappedAmount.str.BTC(), amount.sub(feesToPay).str.BTC(), "Amount different than expected");
    });

    it("should list existing requests", async () => {
        const issueRequests = await userInterBtcAPI.issue.list();
        assert.isAtLeast(
            issueRequests.length,
            1,
            "Should have at least 1 issue request"
        );
    });

    // FIXME: not used at the moment. Fix in a more elegant way, i.e., check what is issuable
    // by two vaults can request exactly that amount instead of multiplying by 1.1
    it.skip("should batch request across several vaults", async () => {
        const requestLimits = await userInterBtcAPI.issue.getRequestLimits();
        const amount = requestLimits.singleVaultMaxIssuable.mul(1.1);
        const issueRequests = await userInterBtcAPI.issue.request(amount);
        assert.equal(
            issueRequests.length,
            2,
            "Created wrong amount of requests, vaults have insufficient collateral"
        );
        const issuedAmount1 = issueRequests[0].wrappedAmount;
        const issueFee1 = issueRequests[0].bridgeFee;
        const issuedAmount2 = issueRequests[1].wrappedAmount;
        const issueFee2 = issueRequests[1].bridgeFee;
        assert.equal(
            issuedAmount1.add(issueFee1).add(issuedAmount2).add(issueFee2).toBig(BitcoinUnit.BTC).round(5).toString(),
            amount.toBig(BitcoinUnit.BTC).round(5).toString(),
            "Issued amount is not equal to requested amount"
        );
    });

    it("should fail to request a value finer than 1 Satoshi", async () => {
        const amount = newMonetaryAmount(0.00000121, wrappedCurrency, true);
        await assert.isRejected(
            issueSingle(userInterBtcAPI, bitcoinCoreClient, userAccount, amount, vault_1_id, true, false)
        );
    });

    // auto-execution tests may stall indefinitely, due to vault client inaction.
    // This will cause the testing pipeline to time out.
    // TODO: Discuss if we want to test this in the lib. Should rather be tested in the clients
    it.skip("should request and auto-execute issue", async () => {
        const amount = newMonetaryAmount(0.00121, wrappedCurrency, true);

        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        const issueResult = await issueSingle(
            userInterBtcAPI,
            bitcoinCoreClient,
            userAccount,
            amount,
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

    it.only("should request and manually execute issue", async () => {
        // Unlike the other `issue` tests that involve DOT, this one locks KSM
        // covering the multi-collateral feature
        const amount = newMonetaryAmount(0.0001, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        const oneSatoshi = newMonetaryAmount(1, wrappedCurrency, false);
        const issueResult = await issueSingle(
            userInterBtcAPI,
            bitcoinCoreClient,
            userAccount,
            amount,
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

    // TODO: maybe add this to issue API
    it("should get issueBtcDustValue", async () => {
        const dust = await userInterBtcAPI.api.query.issue.issueBtcDustValue();
        assert.equal(dust.toString(), "1000");
    });

    it("should getFeesToPay", async () => {
        const amount = newMonetaryAmount(2, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(amount);
        assert.equal(feesToPay.str.BTC(), "0.01");
    });

    it("should getFeeRate", async () => {
        const feePercentage = await userInterBtcAPI.issue.getFeeRate();
        assert.equal(feePercentage.toString(), "0.005");
    });

    // FIXME: don't use magic numbers for these tests
    it("should getRequestLimits", async () => {
        const requestLimits = await userInterBtcAPI.issue.getRequestLimits();
        const singleMaxIssuable = requestLimits.singleVaultMaxIssuable;
        const totalMaxIssuable = requestLimits.singleVaultMaxIssuable;
        const expected = newMonetaryAmount(0.0005, wrappedCurrency, true);
        assert.isTrue(
            singleMaxIssuable.gt(expected),
            `singleVaultMaxIssuable is ${singleMaxIssuable.toHuman()}, expected greater than ${expected.toHuman()}`
        );
        assert.isTrue(
            totalMaxIssuable.gte(singleMaxIssuable),
            `totalMaxIssuable is ${totalMaxIssuable.toHuman()}, expected greater than or equal to ${singleMaxIssuable.toHuman()}`
        );
    });

    // TODO: Unskip after `subscribeToIssueExpiry` is reimplemented
    // This test should be kept at the end of the file as it will ban the vault used for issuing
    it.skip("should cancel an issue request", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const initialIssuePeriod = await userInterBtcAPI.issue.getIssuePeriod();
            await sudo(userInterBtcAPI, () => userInterBtcAPI.issue.setIssuePeriod(0));
            try {
                // request issue
                const amount = newMonetaryAmount(0.0000121, wrappedCurrency, true);
                const vaultCollateralIdLiteral = currencyIdToLiteral(vault_2_id.currencies.collateral);
                const requestResults = await userInterBtcAPI.issue.request(amount, newAccountId(api, vault_2.address), vaultCollateralIdLiteral);
                assert.equal(requestResults.length, 1, "Test broken: more than one issue request created"); // sanity check
                const requestResult = requestResults[0];

                // Wait for issue expiry callback
                await new Promise<void>((resolve, _) => {
                    // userInterBtcAPI.issue.subscribeToIssueExpiry(newAccountId(api, userAccount.address), (requestId) => {
                    //     if (stripHexPrefix(requestResult.id.toString()) === stripHexPrefix(requestId.toString())) {
                    //         resolve();
                    //     }
                    // });
                });

                await userInterBtcAPI.issue.cancel(requestResult.id);

                const issueRequest = await userInterBtcAPI.issue.getRequestById(requestResult.id);
                assert.isTrue(issueRequest.status === IssueStatus.Cancelled, "Failed to cancel issue request");

                // Set issue period back to its initial value to minimize side effects.
                await sudo(userInterBtcAPI, () => userInterBtcAPI.issue.setIssuePeriod(initialIssuePeriod));

            } catch (e) {
                // Set issue period back to its initial value to minimize side effects.
                await sudo(userInterBtcAPI, () => userInterBtcAPI.issue.setIssuePeriod(initialIssuePeriod));
                throw e;
            }
        });
    }).timeout(5 * 60000);

});
