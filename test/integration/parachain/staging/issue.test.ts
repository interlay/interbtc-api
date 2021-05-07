import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { ElectrsAPI, DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI, IssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { Issuing } from "../../../../src/interfaces/default";
import { btcToSat, dotToPlanck } from "../../../../src/utils";
import { assert, expect } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import Big from "big.js";
import { issue } from "../../../../src/utils/issue";

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: IssueAPI;
    let electrsAPI: ElectrsAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    // alice is the root account
    let alice: KeyringPair;
    let charlie: KeyringPair;
    let dave: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");
        charlie = keyring.addFromUri("//Charlie");
        dave = keyring.addFromUri("//Dave");

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
            const amount = api.createType("Balance", 10);
            await assert.isRejected(tmpIssueAPI.request(amount));
        });

        it("should request issue", async () => {
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            issueAPI.setAccount(alice);
            const amount = api.createType("Balance", 100000) as Issuing;
            const requestResult = await issueAPI.request(amount);
            assert.equal(requestResult.id.length, 32);

            const issueRequest = await issueAPI.getRequestById(requestResult.id);
            assert.deepEqual(issueRequest.amount, amount, "Amount different than expected");
        });

        it("should getGriefingCollateral (rounded)", async () => {
            const amountBtc = "0.001";
            const amountAsSatoshiString = btcToSat(amountBtc) as string;
            const amountAsSat = api.createType("Balance", amountAsSatoshiString) as Issuing;
            const griefingCollateralPlanck = await issueAPI.getGriefingCollateralInPlanck(amountAsSat);
            assert.equal(griefingCollateralPlanck.toString(), "1927616");
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
                issue(api, electrsAPI, bitcoinCoreClient, alice, amount, charlie.address, true, false)
            );
        }).timeout(500000);

        // auto-execution tests may stall indefinitely, due to vault client inaction.
        // This will cause the testing pipeline to time out.
        it("should request and auto-execute issue", async () => {
            const amount = new Big("0.00121");
            const issueResult = await issue(
                api,
                electrsAPI,
                bitcoinCoreClient,
                alice,
                amount,
                charlie.address,
                true,
                false
            );
            assert.equal(
                issueResult.finalPolkaBtcBalance.sub(issueResult.initialPolkaBtcBalance).toString(),
                amount.toString(),
                "Final balance was not increased by the exact amount specified"
            );

            assert.isTrue(
                issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(new Big(dotToPlanck("1") as string)),
                "Issue-Redeem were more expensive than 1 DOT"
            );
        }).timeout(500000);

        it("should request and manually execute issue", async () => {
            const amount = new Big("0.001");
            const issueResult = await issue(
                api,
                electrsAPI,
                bitcoinCoreClient,
                alice,
                amount,
                dave.address,
                false,
                false
            );
            assert.equal(
                issueResult.finalPolkaBtcBalance.sub(issueResult.initialPolkaBtcBalance).toString(),
                amount.toString(),
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
            const amount = "2";
            const feesToPay = await issueAPI.getFeesToPay(amount);
            assert.equal(feesToPay, "0.01");
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
