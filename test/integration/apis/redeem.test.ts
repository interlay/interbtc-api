import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { DefaultRedeemAPI } from "../../../src/apis/redeem";
import { createPolkadotAPI } from "../../../src/factory";
import { Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";
import { DefaultIssueAPI } from "../../../src/apis/issue";
import { btcToSat, stripHexPrefix, satToBTC } from "../../../src/utils";
import * as bitcoin from "bitcoinjs-lib";
import { DefaultTreasuryAPI } from "../../../src/apis/treasury";
import { BitcoinCoreClient } from "../../utils/bitcoin-core-client";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let issueAPI: DefaultIssueAPI;
    let treasuryAPI: DefaultTreasuryAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    let charlie: KeyringPair;
    const randomDecodedAccountId = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
    });

    beforeEach(() => {
        redeemAPI = new DefaultRedeemAPI(api, bitcoin.networks.regtest);
        issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
        treasuryAPI = new DefaultTreasuryAPI(api);
    });

    after(() => {
        return api.disconnect();
    });

    describe("load requests", () => {
        it("should load existing requests", async () => {
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

        async function requestAndCallRedeem(blocksToMine: number) {
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
            const amountAsBtcString = "0.1";
            const amountAsSatoshiString = btcToSat(amountAsBtcString);
            const amountAsSatoshi = api.createType("Balance", amountAsSatoshiString);
            const requestResult = await issueAPI.request(amountAsSatoshi, api.createType("AccountId", charlie.address));
            const issueRequestId = requestResult.hash.toString();
            const issueRequest = await issueAPI.getRequestById(issueRequestId);
            const txAmountRequired = satToBTC(issueRequest.amount.add(issueRequest.fee).toString());

            // send btc tx
            const data = stripHexPrefix(requestResult.hash.toString());
            const vaultBtcAddress = requestResult.vault.wallet.address;
            if (vaultBtcAddress === undefined) {
                throw new Error("Undefined vault address returned from RequestIssue");
            }

            const txData = await bitcoinCoreClient.sendBtcTxAndMine(
                vaultBtcAddress,
                txAmountRequired,
                data,
                blocksToMine
            );
            assert.equal(Buffer.from(txData.txid, "hex").length, 32, "Transaction length not 32 bytes");

            // redeem
            redeemAPI.setAccount(alice);
            const redeemAmountAsBtcString = "0.09";
            const redeemAmountAsSatoshiString = btcToSat(redeemAmountAsBtcString);
            const redeemAmountAsSatoshi = api.createType("Balance", redeemAmountAsSatoshiString);
            const btcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
            const vaultId = api.createType("AccountId", charlie.address);
            const { id, vault } = await redeemAPI.request(redeemAmountAsSatoshi, btcAddress, vaultId);
            assert.equal(vault.id.toString(), vaultId.toString(), "Requested for redeem with the wrong vault");
            assert.equal(Buffer.from(stripHexPrefix(id.toString()), "hex").length, 32, "Redeem ID length not 32 bytes");
        }

        it("should request and execute issue, request redeem", async () => {
            const blocksToMine = 3;
            await requestAndCallRedeem(blocksToMine);
        });

        it("should request and execute issue, request (and wait for execute) redeem", async () => {
            const initialBalance = await treasuryAPI.balancePolkaBTC(api.createType("AccountId", alice.address));
            const blocksToMine = 3;
            requestAndCallRedeem(blocksToMine);

            // check redeeming worked
            const finalBalance = await treasuryAPI.balancePolkaBTC(api.createType("AccountId", alice.address));
            assert.equal(initialBalance.toString(), finalBalance.toString());
        });
    });

    describe("fees", () => {
        it("should getFeesToPay", async () => {
            const amount = "2";
            const feesToPay = await redeemAPI.getFeesToPay(amount);
            assert.equal(feesToPay, "0.01");
        });

        it("should getFeePercentage", async () => {
            const feePercentage = await redeemAPI.getFeePercentage();
            assert.equal(feePercentage, "0.005");
        });

        it("should getPremiumRedeemFee", async () => {
            const premiumRedeemFee = await redeemAPI.getPremiumRedeemFee();
            assert.equal(premiumRedeemFee, "0.05");
        });
    });
});
