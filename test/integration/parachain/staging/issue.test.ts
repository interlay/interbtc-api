import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI, IssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { newAccountId, REGTEST_ESPLORA_BASE_PATH } from "../../../../src/utils";
import { assert } from "../../../chai";
import { ALICE_URI, CHARLIE_STASH_URI, DAVE_STASH_URI, DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { IssueStatus } from "../../../../src";
import { Bitcoin, BTCAmount, Polkadot, PolkadotAmount } from "@interlay/monetary-js";

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: IssueAPI;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    // alice is the root account
    let alice: KeyringPair;
    let charlie_stash: KeyringPair;
    let dave_stash: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri(ALICE_URI);
        charlie_stash = keyring.addFromUri(CHARLIE_STASH_URI);
        dave_stash = keyring.addFromUri(DAVE_STASH_URI);

        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
    });

    after(async () => {
        api.disconnect();
    });

    it("should request one issue", async () => {
        // may fail if the relay isn't fully initialized
        const amount = BTCAmount.from.BTC(0.0001);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        const requestResults = await issueAPI.request(amount);
        assert.equal(
            requestResults.length,
            1,
            "Created multiple requests instead of one (ensure vault has sufficient collateral)"
        );
        const requestResult = requestResults[0];
        const issueRequest = await issueAPI.getRequestById(requestResult.id);
        assert.equal(issueRequest.amountInterBTC.str.BTC(), amount.sub(feesToPay).str.BTC(), "Amount different than expected");
    });

    it("should list existing requests", async () => {
        const issueRequests = await issueAPI.list();
        assert.isAtLeast(
            issueRequests.length,
            1,
            "Should have at least 1 issue request"
        );
    });

    it("should map existing requests for account", async () => {
        const aliceAccountId = api.createType("AccountId", alice.address);
        const issueRequests = await issueAPI.mapForUser(aliceAccountId);
        assert.isAtLeast(
            issueRequests.size,
            1,
            "Should have at least 1 issue request"
        );
    });

    it("request should fail if no account is set", async () => {
        const tmpIssueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        const amount = BTCAmount.from.BTC(0.0000001);
        await assert.isRejected(tmpIssueAPI.request(amount));
    });

    it("should batch request across several vaults", async () => {
        const requestLimits = await issueAPI.getRequestLimits();

        const amount = requestLimits.singleVaultMaxIssuable.mul(1.1);
        const issueRequests = await issueAPI.request(amount);
        assert.equal(
            issueRequests.length,
            2,
            "Created wrong amount of requests, vaults have insufficient collateral"
        );
        const issuedAmount1 = issueRequests[0].amountInterBTC;
        const issueFee1 = issueRequests[0].bridgeFee;
        const issuedAmount2 = issueRequests[1].amountInterBTC;
        const issueFee2 = issueRequests[1].bridgeFee;
        assert.equal(
            issuedAmount1.add(issueFee1).add(issuedAmount2).add(issueFee2).toBig(Bitcoin.units.BTC).round(5).toString(),
            amount.toBig(Bitcoin.units.BTC).round(5).toString(),
            "Issued amount is not equal to requested amount"
        );
    });

    it("execute should fail if no account is set", async () => {
        const tmpIssueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        await assert.isRejected(tmpIssueAPI.execute("", ""));
    });

    it("should fail to request a value finer than 1 Satoshi", async () => {
        const amount = BTCAmount.from.BTC("0.00000121");
        await assert.isRejected(
            issueSingle(api, electrsAPI, bitcoinCoreClient, alice, amount, charlie_stash.address, true, false)
        );
    });

    // auto-execution tests may stall indefinitely, due to vault client inaction.
    // This will cause the testing pipeline to time out.
    it("should request and auto-execute issue", async () => {
        const amount = BTCAmount.from.BTC(0.00121);

        const feesToPay = await issueAPI.getFeesToPay(amount);
        const issueResult = await issueSingle(
            api,
            electrsAPI,
            bitcoinCoreClient,
            alice,
            amount,
            charlie_stash.address,
            true,
            false
        );
        assert.equal(
            issueResult.finalInterBtcBalance.sub(issueResult.initialInterBtcBalance).toString(),
            amount.sub(feesToPay).toString(),
            "Final balance was not increased by the exact amount specified"
        );

        assert.isTrue(
            issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(PolkadotAmount.from.DOT(1)),
            "Issue-Redeem were more expensive than 1 DOT"
        );
    }).timeout(500000);

    it("should request and manually execute issue", async () => {
        const amount = BTCAmount.from.BTC(0.001);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        const oneSatoshi = BTCAmount.from.Satoshi(1);
        const issueResult = await issueSingle(
            api,
            electrsAPI,
            bitcoinCoreClient,
            alice,
            amount,
            dave_stash.address,
            false,
            false
        );
        assert.equal(
            issueResult.finalInterBtcBalance.sub(issueResult.initialInterBtcBalance).toString(),
            amount.sub(feesToPay).sub(oneSatoshi).toString(),
            "Final balance was not increased by the exact amount specified"
        );

        assert.isTrue(
            issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(PolkadotAmount.from.DOT(1)),
            "Issue-Redeem were more expensive than 1 DOT"
        );
    }).timeout(500000);

    it("should getFeesToPay", async () => {
        const amount = BTCAmount.from.BTC(2);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        assert.equal(feesToPay.str.BTC(), "0.01");
    });

    it("should getFeeRate", async () => {
        const feePercentage = await issueAPI.getFeeRate();
        assert.equal(feePercentage.toString(), "0.005");
    });

    it("should getGriefingCollateral", async () => {
        const amountBtc = BTCAmount.from.BTC(0.001);
        const griefingCollateral = await issueAPI.getGriefingCollateral(amountBtc, Polkadot);
        assert.equal(griefingCollateral.toBig(Polkadot.units.DOT).round(5, 0).toString(), "0.00019");
    });

    it("should getRequestLimits", async () => {
        const requestLimits = await issueAPI.getRequestLimits();
        assert.isTrue(requestLimits.singleVaultMaxIssuable.gt(BTCAmount.from.BTC(10000)), "singleVaultMaxIssuable is not greater than 10000");
        assert.isTrue(
            requestLimits.totalMaxIssuable.gt(requestLimits.singleVaultMaxIssuable),
            "totalMaxIssuable is not greater than singleVaultMaxIssuable"
        );
    });

    // This test should be kept at the end of the file as it will ban the vault used for issuing
    it("should cancel a request issue", async () => {
        const initialIssuePeriod = await issueAPI.getIssuePeriod();
        await issueAPI.setIssuePeriod(1);
        try {
            // request issue
            const amount = BTCAmount.from.BTC(0.0000121);
            const requestResults = await issueAPI.request(amount, newAccountId(api, dave_stash.address));
            assert.equal(requestResults.length, 1, "Test broken: more than one issue request created"); // sanity check
            const requestResult = requestResults[0];

            await bitcoinCoreClient.mineBlocks(4);
            await issueAPI.cancel(requestResult.id);

            const issueRequest = await issueAPI.getRequestById(requestResult.id);
            assert.isTrue(issueRequest.status === IssueStatus.Cancelled, "Failed to cancel issue request");

            // Set issue period back to its initial value to minimize side effects.
            await issueAPI.setIssuePeriod(initialIssuePeriod);
        } catch (e) {
            // Set issue period back to its initial value to minimize side effects.
            await issueAPI.setIssuePeriod(initialIssuePeriod);
            throw e;
        }

    }).timeout(100000);

});
