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
import { DefaultBTCRelayAPI, DefaultIssueAPI, DefaultTransactionAPI, ExecuteRedeem, issueAndRedeem, IssueAPI, newAccountId, RedeemStatus, REGTEST_ESPLORA_BASE_PATH, sleep, TokensAPI, waitForBlockFinalization } from "../../../../src";
import { assert, expect } from "../../../chai";
import { interBTCAmount, Polkadot, interBTC } from "@interlay/monetary-js";
import { runWhileMiningBTCBlocks } from "../../../utils/helpers";
import Big from "big.js";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let electrsAPI: DefaultElectrsAPI;
    let btcRelayAPI: DefaultBTCRelayAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    let ferdie: KeyringPair;
    let aliceBitcoinCoreClient: BitcoinCoreClient;
    let bitcoinCoreClient: BitcoinCoreClient;
    let issueAPI: IssueAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri(ALICE_URI);
        ferdie = keyring.addFromUri(FERDIE_URI);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, interBTC, alice);
        aliceBitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, interBTC);
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
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            // There should be no burnable tokens
            await expect(redeemAPI.getBurnExchangeRate(Polkadot)).to.be.rejected;
            const vaultToLiquidate = keyring.addFromUri(FERDIE_STASH_URI);
            await issueSingle(api, electrsAPI, aliceBitcoinCoreClient, alice, interBTCAmount.from.BTC(0.0001), vaultToLiquidate.address, true, false);
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
            const amount = interBTCAmount.from.BTC(0.00001);
            await vaultBitcoinCoreClient.sendToAddress(foreignBitcoinAddress, amount);
            // it takes about 15 mins for the theft to be reported
            await DefaultTransactionAPI.waitForEvent(api, api.events.relay.VaultTheft, 17 * 60000);

            await waitForBlockFinalization(bitcoinCoreClient, btcRelayAPI);
            const maxBurnableTokens = await redeemAPI.getMaxBurnableTokens(Polkadot);
            assert.equal(maxBurnableTokens.str.BTC(), "0.0001");
            const burnExchangeRate = await redeemAPI.getBurnExchangeRate(Polkadot);
            assert.isTrue(burnExchangeRate.toBig().gt(new Big(1)), "Burn exchange rate should be above one");
            // Burn interBTC for a premium, to restore peg
            await redeemAPI.burn(amount);
        });
    }).timeout(18 * 60000);

    it("should cancel a redeem request", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = interBTCAmount.from.BTC(0.001);
            const redeemAmount = interBTCAmount.from.BTC(0.0009);
            const initialRedeemPeriod = await redeemAPI.getRedeemPeriod();
            await redeemAPI.setRedeemPeriod(1);
            const [, redeemRequest] = await issueAndRedeem(api, electrsAPI, btcRelayAPI, aliceBitcoinCoreClient, alice, ferdie.address, issueAmount, redeemAmount, false, ExecuteRedeem.False);
    
            // Wait for redeem expiry callback
            await new Promise<void>((resolve, _) => {
                redeemAPI.subscribeToRedeemExpiry(newAccountId(api, alice.address), (requestId) => {
                    if (stripHexPrefix(redeemRequest.id.toString()) === stripHexPrefix(requestId.toString())) {
                        resolve();
                    }
                });
            });
            await redeemAPI.cancel(redeemRequest.id.toString(), true);
            const redeemRequestAfterCancellation = await redeemAPI.getRequestById(redeemRequest.id);
            assert.isTrue(redeemRequestAfterCancellation.status === RedeemStatus.Reimbursed, "Failed to cancel issue request");
            // Set issue period back to its initial value to minimize side effects.
            await redeemAPI.setRedeemPeriod(initialRedeemPeriod);
        });
    }).timeout(5 * 60 * 1000);

    it("should issue and auto-execute redeem", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = interBTCAmount.from.BTC(0.001);
            const redeemAmount = interBTCAmount.from.BTC(0.0009);
            await issueAndRedeem(api, electrsAPI, btcRelayAPI, bitcoinCoreClient, alice, undefined, issueAmount, redeemAmount, false);
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(5 * 60 * 1000);

    it("should issue and manually execute redeem", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = interBTCAmount.from.BTC(0.001);
            const redeemAmount = interBTCAmount.from.BTC(0.0009);
            await issueAndRedeem(api, electrsAPI, btcRelayAPI, bitcoinCoreClient, alice, undefined, issueAmount, redeemAmount, false, ExecuteRedeem.Manually);
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(5 * 60 * 1000);
});
