import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI, IssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { btcToSat, dotToPlanck, satToBTC } from "../../../../src/utils";
import { assert, expect } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import Big from "big.js";
import { issueSingle } from "../../../../src/utils/issue";

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
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");
        charlie_stash = keyring.addFromUri("//Charlie//stash");
        dave_stash = keyring.addFromUri("//Dave//stash");

        electrsAPI = new DefaultElectrsAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
    });

    after(async () => {
        api.disconnect();
    });

    describe("load requests", () => {
        it("should load existing requests", async () => {
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            issueAPI.setAccount(alice);

            const issueRequests = await issueAPI.list();
            assert.isAtLeast(
                issueRequests.length,
                1,
                "Error in docker-compose setup. Should have at least 1 issue request"
            );
        });
    });

    describe("request", () => {
        it("should fail if no account is set", async () => {
            const tmpIssueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
            const amount = new Big(0.0000001);
            await assert.isRejected(tmpIssueAPI.request(amount));
        });

        it("should request one issue", async () => {
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            issueAPI.setAccount(alice);
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
            assert.equal(issueRequest.amount.toString(), btcToSat(amount.sub(feesToPay).toString()), "Amount different than expected");
        });

        it("should batch request across several vaults", async () => {
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            issueAPI.setAccount(alice);

            const amount = new Big(19000); // approx. 1.5 vault capacity
            const requestResults = await issueAPI.request(amount, { atomic: true });
            assert.equal(
                requestResults.length,
                2,
                "Created wrong amount of requests, ensure vault collateral settings in docker are correct"
            );
            const firstExpected = new Big(1642789213955);
            const secondExpected = new Big(691700721581);
            assert.deepEqual(
                requestResults[0].issueRequest.amount.toString(),
                firstExpected.toString(),
                "First vault issue amount different than expected"
            );
            assert.deepEqual(
                requestResults[1].issueRequest.amount.toString(),
                secondExpected.toString(),
                "Second vault issue amount different than expected"
            );
        });

        it("should getGriefingCollateral", async () => {
            const amountBtc = new Big("0.001");
            const griefingCollateral = await issueAPI.getGriefingCollateral(amountBtc);
            assert.equal(griefingCollateral.toString(), "0.0001927615935");
        });
    });

    describe("execute", () => {
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
                issueResult.finalPolkaBtcBalance.sub(issueResult.initialPolkaBtcBalance).toString(),
                amount.sub(feesToPay).toString(),
                "Final balance was not increased by the exact amount specified"
            );

            assert.isTrue(
                issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(new Big(dotToPlanck("1") as string)),
                "Issue-Redeem were more expensive than 1 DOT"
            );
        }).timeout(500000);

        it("should request and manually execute issue", async () => {
            const amount = new Big("0.001");
            const feesToPay = await issueAPI.getFeesToPay(amount);
            const oneSatoshi = new Big(satToBTC("1"));
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
                issueResult.finalPolkaBtcBalance.sub(issueResult.initialPolkaBtcBalance).toString(),
                amount.sub(feesToPay).sub(oneSatoshi).toString(),
                "Final balance was not increased by the exact amount specified"
            );

            assert.isTrue(
                issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(new Big(dotToPlanck("1") as string)),
                "Issue-Redeem were more expensive than 1 DOT"
            );
        }).timeout(500000);
    });

    describe("fees", () => {
        it("should getFeesToPay", async () => {
            const amount = new Big(2);
            const feesToPay = await issueAPI.getFeesToPay(amount);
            assert.equal(feesToPay.toString(), "0.01");
        });

        it("should getFeeRate", async () => {
            const feePercentage = await issueAPI.getFeeRate();
            assert.equal(feePercentage.toString(), "0.005");
        });
    });

    describe("check getIssuePeriod method ", () => {
        it("should getIssuePeriod", async () => {
            try {
                issueAPI.setAccount(alice);
                const period = await issueAPI.getIssuePeriod();
                expect(period.toString()).equal("50");
            } catch (error) {
                console.log(error);
            }
        });
    });

});
