import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { DefaultRedeemAPI, RedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { Vault } from "../../../../src/interfaces/default";
import { assert } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";
import { DefaultIssueAPI, IssueAPI } from "../../../../src/parachain/issue";
import { btcToSat, stripHexPrefix, satToBTC } from "../../../../src/utils";
import * as bitcoinjs from "bitcoinjs-lib";
import { DefaultTreasuryAPI, TreasuryAPI } from "../../../../src/parachain/treasury";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import Big from "big.js";
import { ElectrsAPI } from "../../../../src";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: RedeemAPI;
    let issueAPI: IssueAPI;
    let treasuryAPI: TreasuryAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    let charlie: KeyringPair;
    const randomDecodedAccountId = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
    let electrsAPI: ElectrsAPI;

    before(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        electrsAPI = new DefaultElectrsAPI("http://0.0.0.0:3002");
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        treasuryAPI = new DefaultTreasuryAPI(api);
    });

    after(() => {
        return api.disconnect();
    });

    describe("load requests", () => {
        it("should load existing redeem requests", async () => {
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            redeemAPI.setAccount(alice);

            const redeemRequests = await redeemAPI.list();
            assert.isAtLeast(
                redeemRequests.length,
                1,
                "Error in docker-compose setup. Should have at least 1 redeem request"
            );
        });
    });

    describe("request", () => {
        it("should fail if no account is set", () => {
            const amount = api.createType("Balance", 10);
            assert.isRejected(redeemAPI.request(amount, randomDecodedAccountId));
        });

        async function requestAndCallRedeem(
            blocksToMine: number,
            issueAmountAsBtcString = "0.1",
            redeemAmountAsBtcString = "0.09"
        ) {
            const bitcoinCoreClient = new BitcoinCoreClient(
                "regtest",
                "0.0.0.0",
                "rpcuser",
                "rpcpassword",
                "18443",
                "Alice"
            );
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            charlie = keyring.addFromUri("//Charlie");

            // request issue
            issueAPI.setAccount(alice);
            const requestResult = await issueAPI.request(new Big(issueAmountAsBtcString), api.createType("AccountId", charlie.address));
            const issueRequest = await issueAPI.getRequestById(requestResult.id);
            const txAmountRequired = new Big(satToBTC(issueRequest.amount.add(issueRequest.fee).toString()));

            // send btc tx
            const vaultBtcAddress = requestResult.issueRequest.btc_address;
            if (vaultBtcAddress === undefined) {
                throw new Error("Undefined vault address returned from RequestIssue");
            }

            const txData = await bitcoinCoreClient.sendBtcTxAndMine(vaultBtcAddress, txAmountRequired, blocksToMine);
            assert.equal(Buffer.from(txData.txid, "hex").length, 32, "Transaction length not 32 bytes");

            while (!(await issueAPI.getRequestById(requestResult.id)).status.isCompleted) {
                await sleep(1000);
            }

            // redeem
            redeemAPI.setAccount(alice);
            const redeemAmountAsSatoshiString = btcToSat(redeemAmountAsBtcString);
            const redeemAmountAsSatoshi = api.createType("Balance", redeemAmountAsSatoshiString);
            const btcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
            const vaultId = api.createType("AccountId", charlie.address);
            const { id, redeemRequest } = await redeemAPI.request(redeemAmountAsSatoshi, btcAddress, vaultId);
            assert.equal(
                redeemRequest.vault.toString(),
                vaultId.toString(),
                "Requested for redeem with the wrong vault"
            );
            assert.equal(Buffer.from(stripHexPrefix(id.toString()), "hex").length, 32, "Redeem ID length not 32 bytes");
        }

        function sleep(ms: number): Promise<void> {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        it("should request and execute issue, request (and wait for execute) redeem", async () => {
            const initialBalance = await treasuryAPI.balance(api.createType("AccountId", alice.address));
            const blocksToMine = 3;
            const issueAmount = new Big("0.1");
            const issueFeesToPay = await issueAPI.getFeesToPay(issueAmount);
            const redeemAmount = new Big("0.09");
            await requestAndCallRedeem(blocksToMine, issueAmount.toString(), redeemAmount.toString());

            // check redeeming worked
            const expectedBalanceDifferenceAfterRedeem = issueAmount.sub(issueFeesToPay).sub(redeemAmount);
            const finalBalance = await treasuryAPI.balance(api.createType("AccountId", alice.address));
            assert.equal(initialBalance.add(expectedBalanceDifferenceAfterRedeem).toString(), finalBalance.toString());
        }).timeout(1000000);
    });

    describe("fees", () => {
        it("should getFeesToPay", async () => {
            const amount = new Big("2");
            const feesToPay = await redeemAPI.getFeesToPay(amount);
            assert.equal(feesToPay.toString(), "0.01");
        });

        it("should getFeeRate", async () => {
            const feePercentage = await redeemAPI.getFeeRate();
            assert.equal(feePercentage.toString(), "0.005");
        });

        it("should getPremiumRedeemFee", async () => {
            const premiumRedeemFee = await redeemAPI.getPremiumRedeemFee();
            assert.equal(premiumRedeemFee, "0.05");
        });
    });

});
