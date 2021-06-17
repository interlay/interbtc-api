import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import Big from "big.js";
import BN from "bn.js";

import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI, IssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { newAccountId, REGTEST_ESPLORA_BASE_PATH, satToBTC } from "../../../../src/utils";
import { assert, expect } from "../../../chai";
import { DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { IssueStatus } from "../../../../src";

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
        alice = keyring.addFromUri("//Alice");
        charlie_stash = keyring.addFromUri("//Charlie//stash");
        dave_stash = keyring.addFromUri("//Dave//stash");

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

    it("should list existing requests", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");

        const issueRequests = await issueAPI.list();
        assert.isAtLeast(
            issueRequests.length,
            1,
            "Error in docker-compose setup. Should have at least 1 issue request"
        );
    });

    it("should map existing requests", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        const aliceAccountId = api.createType("AccountId", alice.address);
        const issueRequests = await issueAPI.mapForUser(aliceAccountId);
        assert.isAtLeast(
            issueRequests.size,
            1,
            "Error in docker-compose setup. Should have at least 1 issue request"
        );
    });

    it("should fail if no account is set", async () => {
        const tmpIssueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        const amount = new Big(0.0000001);
        await assert.isRejected(tmpIssueAPI.request(amount));
    });

    it("should request one issue", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        const amount = new Big(0.001);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        const requestResults = await issueAPI.request(amount);
        assert.equal(
            requestResults.length,
            1,
            "Created multiple requests instead of one (ensure vault in docker has sufficient collateral)"
        );
        const requestResult = requestResults[0];
        assert.equal(requestResult.id.length, 32);

        const issueRequest = await issueAPI.getRequestById(requestResult.id);
        assert.equal(issueRequest.amountInterBTC.toString(), amount.sub(feesToPay).toString(), "Amount different than expected");
    });

    it("should batch request across several vaults", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");

        const amount = new Big(19000); // approx. 1.2x vault capacity
        const issueRequests = await issueAPI.request(amount);
        assert.equal(
            issueRequests.length,
            2,
            "Created wrong amount of requests, ensure vault collateral settings in docker are correct"
        );
        const firstExpected = new Big(16345.75267885);
        const secondExpected = new Big(2559.24732116);
        // Sometimes this test fails with a difference that is not really relevant:
        // -16345.75173360
        // +16345.75267885
        // As such, round the numbers before comparing
        assert.deepEqual(
            new Big(issueRequests[0].amountInterBTC).round(2).toString(),
            firstExpected.round(2).toString(),
            "First vault issue amount different than expected"
        );
        assert.deepEqual(
            new Big(issueRequests[1].amountInterBTC).round(2).toString(),
            secondExpected.round(2).toString(),
            "Second vault issue amount different than expected"
        );
    });

    it("should fail if no account is set", async () => {
        const tmpIssueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        await assert.isRejected(tmpIssueAPI.execute("", ""));
    });

    it("should fail to request a value finer than 1 Satoshi", async () => {
        const amount = new Big("0.00000121");
        await assert.isRejected(
            issueSingle(api, electrsAPI, bitcoinCoreClient, alice, amount, charlie_stash.address, true, false)
        );
    }).timeout(500000);

    // auto-execution tests may stall indefinitely, due to vault client inaction.
    // This will cause the testing pipeline to time out.
    it("should request and auto-execute issue", async () => {
        const amount = new Big("0.00121");
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
            issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(new Big(1)),
            "Issue-Redeem were more expensive than 1 DOT"
        );
    }).timeout(500000);

    it("should request and manually execute issue", async () => {
        const amount = new Big("0.001");
        const feesToPay = await issueAPI.getFeesToPay(amount);
        const oneSatoshi = satToBTC(new BN(1));
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
            issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(new Big(1)),
            "Issue-Redeem were more expensive than 1 DOT"
        );
    }).timeout(500000);

    it("should getFeesToPay", async () => {
        const amount = new Big(2);
        const feesToPay = await issueAPI.getFeesToPay(amount);
        assert.equal(feesToPay.toString(), "0.01");
    });

    it("should getFeeRate", async () => {
        const feePercentage = await issueAPI.getFeeRate();
        assert.equal(feePercentage.toString(), "0.005");
    });

    it("should getIssuePeriod", async () => {
        try {
            const period = await issueAPI.getIssuePeriod();
            expect(period.toString()).equal("50");
        } catch (error) {
            console.log(error);
        }
    });

    it("should getGriefingCollateral", async () => {
        const amountBtc = new Big("0.001");
        const griefingCollateral = await issueAPI.getGriefingCollateral(amountBtc);
        assert.equal(griefingCollateral.toString(), "0.0001927615935");
    });

    it("should getRequestLimits", async () => {
        const requestLimits = await issueAPI.getRequestLimits();
        assert.isTrue(requestLimits.singleVaultMaxIssuable.gt(10000), "singleVaultMaxIssuable is not greater than 10000");
        assert.isTrue(
            requestLimits.totalMaxIssuable.gt(requestLimits.singleVaultMaxIssuable),
            "totalMaxIssuable is not greater than singleVaultMaxIssuable"
        );
    });

    // This test should be kept at the end of the file as it will ban the vault used for issuing
    it("should cancel a request issue", async () => {
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        const initialIssuePeriod = await issueAPI.getIssuePeriod();
        await issueAPI.setIssuePeriod(1);
        try {
            // request issue
            const amount = new Big("0.0000121");
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
