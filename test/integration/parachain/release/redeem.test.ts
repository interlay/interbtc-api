import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import * as bitcoinjs from "bitcoinjs-lib";

import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { Vault } from "../../../../src/interfaces/default";
import { USER_1_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, VAULT_TO_LIQUIDATE, VAULT_TO_BAN } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { issueSingle, stripHexPrefix } from "../../../../src/utils";
import { DefaultBTCRelayAPI, DefaultIssueAPI, DefaultTransactionAPI, ExecuteRedeem, issueAndRedeem, IssueAPI, newAccountId, RedeemStatus, REGTEST_ESPLORA_BASE_PATH, waitForBlockFinalization } from "../../../../src";
import { assert, expect } from "../../../chai";
import { InterBtcAmount, Polkadot, InterBtc } from "@interlay/monetary-js";
import { runWhileMiningBTCBlocks } from "../../../utils/helpers";
import Big from "big.js";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let electrsAPI: DefaultElectrsAPI;
    let btcRelayAPI: DefaultBTCRelayAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_to_liquidate: KeyringPair;
    let userBitcoinCoreClient: BitcoinCoreClient;
    let bitcoinCoreClient: BitcoinCoreClient;
    let issueAPI: IssueAPI;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_BAN);
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, userAccount);
        userBitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc);
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
    });

    after(() => {
        return api.disconnect();
    });

    it("should liquidate a vault that committed theft", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            // There should be no burnable tokens
            await expect(redeemAPI.getBurnExchangeRate(Polkadot)).to.be.rejected;
            const vaultToLiquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE);
            const issuedTokens = InterBtcAmount.from.BTC(0.0001);
            await issueSingle(api, electrsAPI, userBitcoinCoreClient, userAccount, issuedTokens, vaultToLiquidate.address, true, false);
            const vaultBitcoinCoreClient = new BitcoinCoreClient(
                BITCOIN_CORE_NETWORK,
                BITCOIN_CORE_HOST,
                BITCOIN_CORE_USERNAME,
                BITCOIN_CORE_PASSWORD,
                BITCOIN_CORE_PORT,
                "vault_to_ban"
            );
            // Steal some bitcoin (spend from the vault's account)
            const foreignBitcoinAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
            const amountToSteal = InterBtcAmount.from.BTC(0.00001);
            await vaultBitcoinCoreClient.sendToAddress(foreignBitcoinAddress, amountToSteal);
            // it takes about 15 mins for the theft to be reported
            await DefaultTransactionAPI.waitForEvent(api, api.events.relay.VaultTheft, 17 * 60000);

            await waitForBlockFinalization(bitcoinCoreClient, btcRelayAPI);
            const maxBurnableTokens = await redeemAPI.getMaxBurnableTokens(Polkadot);
            assert.equal(maxBurnableTokens.str.BTC(), issuedTokens.str.BTC());
            const burnExchangeRate = await redeemAPI.getBurnExchangeRate(Polkadot);
            assert.isTrue(burnExchangeRate.toBig().gt(new Big(1)), "Burn exchange rate should be above one");
            // Burn InterBtc for a premium, to restore peg
            await redeemAPI.burn(amountToSteal, Polkadot);
        });
    }).timeout(18 * 60000);

    it("should cancel a redeem request", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.001);
            const redeemAmount = InterBtcAmount.from.BTC(0.0009);
            const initialRedeemPeriod = await redeemAPI.getRedeemPeriod();
            await redeemAPI.setRedeemPeriod(0);
            const [, redeemRequest] = await issueAndRedeem(api, electrsAPI, btcRelayAPI, userBitcoinCoreClient, userAccount, vault_to_liquidate.address, issueAmount, redeemAmount, false, ExecuteRedeem.False);
    
            // Wait for redeem expiry callback
            await new Promise<void>((resolve, _) => {
                redeemAPI.subscribeToRedeemExpiry(newAccountId(api, userAccount.address), (requestId) => {
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
            const issueAmount = InterBtcAmount.from.BTC(0.001);
            const redeemAmount = InterBtcAmount.from.BTC(0.0009);
            await issueAndRedeem(api, electrsAPI, btcRelayAPI, bitcoinCoreClient, userAccount, undefined, issueAmount, redeemAmount, false);
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(5 * 60 * 1000);

    it("should issue and manually execute redeem", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.001);
            const redeemAmount = InterBtcAmount.from.BTC(0.0009);
            await issueAndRedeem(api, electrsAPI, btcRelayAPI, bitcoinCoreClient, userAccount, undefined, issueAmount, redeemAmount, false, ExecuteRedeem.Manually);
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(5 * 60 * 1000);
});
