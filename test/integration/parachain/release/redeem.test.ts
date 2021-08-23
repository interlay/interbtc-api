import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import * as bitcoinjs from "bitcoinjs-lib";

import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { Vault } from "../../../../src/interfaces/default";
import { ALICE_URI, DEFAULT_BITCOIN_CORE_HOST, DEFAULT_BITCOIN_CORE_NETWORK, DEFAULT_BITCOIN_CORE_PASSWORD, DEFAULT_BITCOIN_CORE_PORT, DEFAULT_BITCOIN_CORE_USERNAME, DEFAULT_BITCOIN_CORE_WALLET, DEFAULT_PARACHAIN_ENDPOINT, FERDIE_STASH_URI, FERDIE_URI } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { issueSingle, stripHexPrefix } from "../../../../src/utils";
import { DefaultIssueAPI, DefaultTokensAPI, DefaultTransactionAPI, ExecuteRedeem, issueAndRedeem, IssueAPI, newAccountId, RedeemStatus, REGTEST_ESPLORA_BASE_PATH, sleep, TokensAPI } from "../../../../src";
import { assert } from "../../../chai";
import { Bitcoin, BTCAmount } from "@interlay/monetary-js";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let electrsAPI: DefaultElectrsAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    let ferdie: KeyringPair;
    let aliceBitcoinCoreClient: BitcoinCoreClient;
    let tokensAPI: TokensAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let issueAPI: IssueAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri(ALICE_URI);
        ferdie = keyring.addFromUri(FERDIE_URI);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        tokensAPI = new DefaultTokensAPI(api);
        aliceBitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
    });

    after(() => {
        return api.disconnect();
    });

    it("should liquidate a vault that committed theft", async () => {
        const vaultToLiquidate = keyring.addFromUri(FERDIE_STASH_URI);
        await issueSingle(api, electrsAPI, aliceBitcoinCoreClient, alice, BTCAmount.from.BTC(0.0001), vaultToLiquidate.address, true, false);
        const vaultBitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            "ferdie_stash"
        );

        // Steal some bitcoin (spend from the vault's account)
        const foreignBitcoinAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
        const amount = BTCAmount.from.BTC(0.00001);
        await vaultBitcoinCoreClient.sendToAddress(foreignBitcoinAddress, amount);
        await vaultBitcoinCoreClient.mineBlocks(3);
        await DefaultTransactionAPI.waitForEvent(api, api.events.relay.VaultTheft, 17 * 60000);

        // Sleep for 10s because maxBurnableTokens and burnExchangeRate don't get updated immediately
        await sleep(10 * 1000);
        const maxBurnableTokens = await redeemAPI.getMaxBurnableTokens();
        assert.equal(maxBurnableTokens.toString(), "0.0001");
        const burnExchangeRate = await redeemAPI.getBurnExchangeRate();
        assert.equal(burnExchangeRate.toString(), "5782.847805");
        // Burn InterBTC for a premium, to restore peg
        await redeemAPI.burn(amount);

        // it takes about 15 mins for the theft to be reported
    }).timeout(18 * 60000);

    it("should cancel a redeem request", async () => {
        const issueAmount = BTCAmount.from.BTC(0.01);
        const redeemAmount = BTCAmount.from.BTC(0.009);
        const initialRedeemPeriod = await redeemAPI.getRedeemPeriod();
        await redeemAPI.setRedeemPeriod(1);
        let redeemRequestExpiryCallback = false;
        const [, redeemRequest] = await issueAndRedeem(api, electrsAPI, aliceBitcoinCoreClient, alice, ferdie.address, issueAmount, redeemAmount, false, ExecuteRedeem.False);

        redeemAPI.subscribeToRedeemExpiry(newAccountId(api, alice.address), (requestId) => {
            if (stripHexPrefix(redeemRequest.id.toString()) === stripHexPrefix(requestId.toString())) {
                redeemRequestExpiryCallback = true;
            }
        });

        await aliceBitcoinCoreClient.mineBlocks(2);
        await redeemAPI.cancel(redeemRequest.id.toString(), true);

        const redeemRequestAfterCancellation = await redeemAPI.getRequestById(redeemRequest.id);

        assert.isTrue(redeemRequestAfterCancellation.status === RedeemStatus.Reimbursed, "Failed to cancel issue request");
        assert.isTrue(redeemRequestExpiryCallback, "Callback was not called when the redeem request expired.");
        // Set issue period back to its initial value to minimize side effects.
        await redeemAPI.setRedeemPeriod(initialRedeemPeriod);
    }).timeout(300000);

    it("should issue and auto-execute redeem", async () => {
        const initialBalance = await tokensAPI.balance(Bitcoin, api.createType("AccountId", alice.address));
        const issueAmount = BTCAmount.from.BTC(0.001);
        const issueFeesToPay = await issueAPI.getFeesToPay(issueAmount);
        const redeemAmount = BTCAmount.from.BTC(0.0009);
        await issueAndRedeem(api, electrsAPI, bitcoinCoreClient, alice, undefined, issueAmount, redeemAmount, false);

        // check redeeming worked
        const expectedBalanceDifferenceAfterRedeem = issueAmount.sub(issueFeesToPay).sub(redeemAmount);
        const finalBalance = await tokensAPI.balance(Bitcoin, api.createType("AccountId", alice.address));
        assert.equal(initialBalance.add(expectedBalanceDifferenceAfterRedeem), finalBalance);
    }).timeout(30 * 60 * 1000);

    it("should issue and manually execute redeem", async () => {
        const initialBalance = await tokensAPI.balance(Bitcoin, api.createType("AccountId", alice.address));
        const issueAmount = BTCAmount.from.BTC(0.001);
        const issueFeesToPay = await issueAPI.getFeesToPay(issueAmount);
        const redeemAmount = BTCAmount.from.BTC(0.0009);
        await issueAndRedeem(api, electrsAPI, bitcoinCoreClient, alice, undefined, issueAmount, redeemAmount, false, ExecuteRedeem.Manually);

        // check redeeming worked
        const expectedBalanceDifferenceAfterRedeem = issueAmount.sub(issueFeesToPay).sub(redeemAmount);
        const finalBalance = await tokensAPI.balance(Bitcoin, api.createType("AccountId", alice.address));
        assert.equal(initialBalance.add(expectedBalanceDifferenceAfterRedeem), finalBalance);
    }).timeout(30 * 60 * 1000);
});
