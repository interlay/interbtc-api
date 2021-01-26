import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { H256, Hash } from "@polkadot/types/interfaces";
import { Bytes } from "@polkadot/types/primitive";
import { DefaultBTCCoreAPI } from "../../../src/apis/btc-core";
import { DefaultIssueAPI, IssueRequestResult } from "../../../src/apis/issue";
import { createPolkadotAPI } from "../../../src/factory";
import { H256Le, Vault, PolkaBTC } from "../../../src/interfaces/default";
import { btcToSat, dotToPlanck, satToBTC } from "../../../src/utils";
import { assert, expect } from "../../chai";
import { defaultParachainEndpoint } from "../../config";
import * as bitcoin from "bitcoinjs-lib";
import { DefaultTreasuryAPI } from "../../../src/apis/treasury";
import { fail } from "assert";
import { BitcoinCoreClient } from "../../utils/bitcoin-core-client";
import { Buffer } from "buffer";
import sinon from "sinon";
import { DefaultCollateralAPI } from "../../../src/apis/collateral";
import Big from "big.js";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let btcCoreAPI: DefaultBTCCoreAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let sandbox: sinon.SinonSandbox;

    // alice is the root account
    let alice: KeyringPair;
    let bob: KeyringPair;
    let dave: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");

        btcCoreAPI = new DefaultBTCCoreAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");

        issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
        sandbox = sinon.createSandbox();
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

            const issueRequest = await issueAPI.getRequestById(requestResult.id.toString());
            assert.deepEqual(issueRequest.amount, amount, "Amount different than expected");
        });

        it("should getGriefingCollateral (rounded)", async () => {
            const amountBtc = "0.001";
            const amountAsSat = btcToSat(amountBtc) as string;
            const griefingCollateralPlanck = await issueAPI.getGriefingCollateralInPlanck(amountAsSat);
            assert.equal(griefingCollateralPlanck, "1927616");
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

        it("should consider execution successful if `isExecutionSuccessful` returns true", async () => {
            const { issueId, txId, merkleProof, rawTx } = makeExecutionData();
            issueAPI.setAccount(alice);
            sandbox.stub(DefaultIssueAPI.prototype, "isExecutionSuccessful").returns(true);
            const isExecutionCorrect = await issueAPI.execute(issueId, txId, merkleProof, rawTx);
            assert.isTrue(isExecutionCorrect);
            sandbox.restore();
        });

        it("should consider execution failed if `isExecutionSuccessful` returns false", async () => {
            const { issueId, txId, merkleProof, rawTx } = makeExecutionData();
            issueAPI.setAccount(alice);
            sandbox.stub(DefaultIssueAPI.prototype, "isExecutionSuccessful").returns(false);
            const isExecutionCorrect = await issueAPI.execute(issueId, txId, merkleProof, rawTx);
            assert.isFalse(isExecutionCorrect);
            sandbox.restore();
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
        });

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
        });

        it("should fail to request a value finer than 1 Satoshi", async () => {
            const amount = "0.00000121";
            await assert.isRejected(
                issue(api, btcCoreAPI, bitcoinCoreClient, keyring, amount, "Alice", "Charlie", true, false)
            );
        });

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
        });
    });

    describe("cancel", () => {
        it("should cancel a request issue", async () => {
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            dave = keyring.addFromUri("//Dave");

            // request issue
            issueAPI.setAccount(alice);
            const amountAsBtcString = "0.0000121";
            const amountAsSatoshiString = btcToSat(amountAsBtcString);
            const amountAsSatoshi = api.createType("Balance", amountAsSatoshiString);
            const requestResult = await issueAPI.request(amountAsSatoshi);

            // The cancellation period set by docker-compose is 50 blocks, each being relayed every 6s
            await bitcoinCoreClient.mineBlocks(50);
            await issueAPI.cancel(requestResult.id);

            const issueRequestId = requestResult.id.toString();
            const issueRequest = await issueAPI.getRequestById(issueRequestId);

            assert.isTrue(issueRequest.cancelled.isTrue, "Failed to cancel issue request");
        });
    });

    describe("fees", () => {
        it("should getFeesToPay", async () => {
            const amount = "2";
            const feesToPay = await issueAPI.getFeesToPay(amount);
            assert.equal(feesToPay, "0.01");
        });

        it("should getFeePercentage", async () => {
            const feePercentage = await issueAPI.getFeePercentage();
            assert.equal(feePercentage, "0.005");
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

    type ExecutionData = {
        issueId: H256;
        txId: H256Le;
        merkleProof: Bytes;
        rawTx: Bytes;
    };

    function makeExecutionData(): ExecutionData {
        const issueId = api.createType("H256", "0x81dd458cd3bb82cf68b52dce27a5ac1f616b0278b2f36c4c05bfd528c2e1e8e9");
        const txId: H256Le = api.createType(
            "H256",
            // prettier-ignore
            [
                70, 103, 64, 2, 223, 149, 66, 146, 36, 69, 6, 199, 80, 43, 96,
                106, 174, 205, 77, 120, 69, 217, 253, 57, 140, 255, 196, 198, 144, 61, 18, 248
            ]
        ) as H256Le;
        const merkleProof: Bytes = api.createType(
            "Bytes",
            // prettier-ignore
            [
                2, 0, 0, 0, 244, 134, 26, 210, 38, 249, 3, 175, 137, 182, 208,
                251, 9, 59, 211, 77, 200, 110, 67, 171, 216, 90, 255, 111, 72,
                97, 187, 76, 166, 94, 240, 19, 213, 54, 6, 130, 156, 254, 180,
                145, 173, 84, 28, 196, 222, 78, 232, 5, 160, 160, 3, 117, 203,
                70, 200, 166, 141, 180, 204, 179, 134, 5, 232, 26, 243, 99, 179,
                94, 0, 0, 64, 32, 1, 0, 0, 0, 2, 0, 0, 0, 2, 56, 108, 49, 183, 51,
                251, 228, 176, 233, 214, 204, 196, 69, 202, 199, 158, 219, 253, 38,
                85, 184, 163, 65, 215, 198, 31, 60, 181, 117, 8, 151, 212, 70, 103,
                64, 2, 223, 149, 66, 146, 36, 69, 6, 199, 80, 43, 96, 106, 174, 205,
                77, 120, 69, 217, 253, 57, 140, 255, 196, 198, 144, 61, 18, 248, 1, 5
            ]
        );
        const rawTx: Bytes = api.createType(
            "Bytes",
            // prettier-ignore
            [
                2, 0, 0, 0, 1, 22, 59, 241, 41, 121, 78, 23, 16, 159, 81,
                145, 67, 102, 63, 131, 101, 232, 183, 64, 173, 236, 247,
                249, 134, 8, 242, 39, 166, 231, 131, 49, 251, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 2, 160, 134, 1, 0, 0, 0, 0, 0, 25, 118, 169,
                20, 191, 52, 8, 246, 192, 222, 192, 135, 159, 124, 29, 77,
                10, 94, 136, 19, 252, 13, 181, 105, 136, 172, 0, 0, 0, 0,
                0, 0, 0, 0, 34, 106, 32, 129, 221, 69, 140, 211, 187, 130,
                207, 104, 181, 45, 206, 39, 165, 172, 31, 97, 107, 2, 120,
                178, 243, 108, 76, 5, 191, 213, 40, 194, 225, 232, 233,
                0, 0, 0, 0
            ]
        );
        return { issueId, txId, merkleProof, rawTx };
    }
});

export interface IssueResult {
    request: IssueRequestResult;
    initialDotBalance: Big;
    finalDotBalance: Big;
    initialPolkaBtcBalance: Big;
    finalPolkaBtcBalance: Big;
}

export async function issue(
    api: ApiPromise,
    btcCoreAPI: DefaultBTCCoreAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    keyring: Keyring,
    amount: string,
    requesterName: string,
    vaultName: string,
    autoExecute: boolean,
    triggerRefund: boolean
): Promise<IssueResult> {
    const treasuryAPI = new DefaultTreasuryAPI(api);
    const issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
    const collateralAPI = new DefaultCollateralAPI(api);

    const requester = keyring.addFromUri("//" + requesterName);
    issueAPI.setAccount(requester);
    const requesterAccountId = api.createType("AccountId", requester.address);
    const initialBalanceDOT = await collateralAPI.balanceDOT(requesterAccountId);
    const initialBalancePolkaBTC = await treasuryAPI.balancePolkaBTC(requesterAccountId);
    const blocksToMine = 3;
    keyring = new Keyring({ type: "sr25519" });
    const vault = keyring.addFromUri("//" + vaultName);
    const vaultAccountId = api.createType("AccountId", vault.address);

    // request issue
    let amountAsBtcString = amount;
    const amountAsSatoshiString = btcToSat(amountAsBtcString);
    if (amountAsSatoshiString === undefined) {
        fail();
    }
    const amountAsSatoshi = api.createType("Balance", amountAsSatoshiString);
    const requestResult = await issueAPI.request(amountAsSatoshi, vaultAccountId);
    const issueRequestId = requestResult.id.toString();
    const issueRequest = await issueAPI.getRequestById(issueRequestId);
    amountAsBtcString = satToBTC(issueRequest.amount.add(issueRequest.fee).toString());

    if (triggerRefund) {
        // Send 1 more Btc than needed
        amountAsBtcString = new Big(amountAsBtcString).add(1).toString();
    }

    // send btc tx
    const vaultBtcAddress = requestResult.vault.wallet.btcAddress;
    if (vaultBtcAddress === undefined) {
        throw new Error("Undefined vault address returned from RequestIssue");
    }

    const txData = await bitcoinCoreClient.sendBtcTxAndMine(vaultBtcAddress, amountAsBtcString, blocksToMine);

    if (autoExecute === false) {
        // execute issue, assuming the selected vault has the `--no-issue-execution` flag enabled
        const merkleProof = await btcCoreAPI.getMerkleProof(txData.txid);
        const parsedIssuedId = api.createType("H256", requestResult.id);
        // reverse endianness (expects little-endian)
        const parsedTxId = api.createType("H256", "0x" + Buffer.from(txData.txid, "hex").reverse().toString("hex"));
        const parsedMerkleProof = api.createType("Bytes", "0x" + merkleProof);
        const parsedRawTx = api.createType("Bytes", "0x" + txData.rawTx);
        await issueAPI.execute(parsedIssuedId, parsedTxId, parsedMerkleProof, parsedRawTx);
    } else {
        // wait for vault to execute issue
        while (!(await issueAPI.getRequestById(issueRequestId)).completed.isTrue) {
            await sleep(1000);
        }
    }

    // check issuing worked
    const finalBalancePolkaBTC = await treasuryAPI.balancePolkaBTC(requesterAccountId);

    const finalBalanceDOT = await collateralAPI.balanceDOT(requesterAccountId);

    return {
        request: requestResult,
        initialDotBalance: new Big(initialBalanceDOT.toString()),
        finalDotBalance: new Big(finalBalanceDOT.toString()),
        initialPolkaBtcBalance: new Big(initialBalancePolkaBTC.toString()),
        finalPolkaBtcBalance: new Big(finalBalancePolkaBTC.toString()),
    };
}
