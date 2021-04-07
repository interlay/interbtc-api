import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { H256 } from "@polkadot/types/interfaces";
import { Bytes } from "@polkadot/types/primitive";
import { DefaultBTCCoreAPI } from "../../../../src/external/btc-core";
import { DefaultIssueAPI } from "../../../../src/parachain/issue";
import { createPolkadotAPI } from "../../../../src/factory";
import { H256Le, PolkaBTC } from "../../../../src/interfaces/default";
import { btcToSat, dotToPlanck, satToBTC } from "../../../../src/utils";
import { assert, expect } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoin from "bitcoinjs-lib";
import { BitcoinCoreClient } from "../../../utils/bitcoin-core-client";
import Big from "big.js";
import { issue } from "../../../utils/issue";

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let btcCoreAPI: DefaultBTCCoreAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    // alice is the root account
    let alice: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");

        btcCoreAPI = new DefaultBTCCoreAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");

        issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
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
            const tmpIssueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
            const amount = api.createType("Balance", 10);
            await assert.isRejected(tmpIssueAPI.request(amount));
        });

        it("should request issue", async () => {
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            issueAPI.setAccount(alice);
            const amount = api.createType("Balance", 100000) as PolkaBTC;
            const requestResult = await issueAPI.request(amount);
            assert.equal(requestResult.id.length, 32);

            const issueRequest = await issueAPI.getRequestById(requestResult.id);
            assert.deepEqual(issueRequest.amount, amount, "Amount different than expected");
        });

        it("should getGriefingCollateral (rounded)", async () => {
            const amountBtc = "0.001";
            const amountAsSatoshiString = btcToSat(amountBtc) as string;
            const amountAsSat = api.createType("Balance", amountAsSatoshiString) as PolkaBTC;
            const griefingCollateralPlanck = await issueAPI.getGriefingCollateralInPlanck(amountAsSat);
            assert.equal(griefingCollateralPlanck.toString(), "1927616");
        });
    });

    describe("execute", () => {
        it("should fail if no account is set", async () => {
            const tmpIssueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
            const issueId: H256 = <H256>{};
            const txId: H256Le = <H256Le>{};
            const merkleProof: Bytes = <Bytes>{};
            const rawTx: Bytes = <Bytes>{};
            await assert.isRejected(tmpIssueAPI.execute(issueId, txId, merkleProof, rawTx));
        });

        it("should request and auto-execute issue", async () => {
            const amount = "0.001";
            const issueResult = await issue(
                api,
                btcCoreAPI,
                bitcoinCoreClient,
                keyring,
                amount,
                "Alice",
                "Charlie",
                true,
                false
            );

            assert.equal(
                satToBTC(
                    issueResult.finalPolkaBtcBalance.sub(issueResult.initialPolkaBtcBalance.toString()).toString()
                ),
                amount,
                "Final balance was not increased by the exact amount specified"
            );

            assert.isTrue(
                issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(new Big(dotToPlanck("1") as string)),
                "Issue-Redeem were more expensive than 1 DOT"
            );
        }).timeout(500000);

        it("should fail to request a value finer than 1 Satoshi", async () => {
            const amount = "0.00000121";
            await assert.isRejected(
                issue(api, btcCoreAPI, bitcoinCoreClient, keyring, amount, "Alice", "Charlie", true, false)
            );
        }).timeout(500000);

        it("should request and auto-execute issue", async () => {
            const amount = "0.0000121";
            const issueResult = await issue(
                api,
                btcCoreAPI,
                bitcoinCoreClient,
                keyring,
                amount,
                "Alice",
                "Charlie",
                true,
                false
            );
            assert.equal(
                satToBTC(
                    issueResult.finalPolkaBtcBalance.sub(issueResult.initialPolkaBtcBalance.toString()).toString()
                ),
                amount,
                "Final balance was not increased by the exact amount specified"
            );

            assert.isTrue(
                issueResult.finalDotBalance.sub(issueResult.initialDotBalance).lt(new Big(dotToPlanck("1") as string)),
                "Issue-Redeem were more expensive than 1 DOT"
            );
        }).timeout(500000);

        it("should request and manually execute issue", async () => {
            const amount = "0.001";
            const issueResult = await issue(
                api,
                btcCoreAPI,
                bitcoinCoreClient,
                keyring,
                amount,
                "Alice",
                "Dave",
                false,
                false
            );
            assert.equal(
                satToBTC(
                    issueResult.finalPolkaBtcBalance.sub(issueResult.initialPolkaBtcBalance.toString()).toString()
                ),
                amount,
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
