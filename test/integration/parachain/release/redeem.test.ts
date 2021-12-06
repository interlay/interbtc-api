import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { InterBtcAmount, Polkadot } from "@interlay/monetary-js";
import * as bitcoinjs from "bitcoinjs-lib";
import { DefaultOracleAPI, InterbtcPrimitivesVaultId, VaultRegistryVault } from "../../../../src/index";

import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { createPolkadotAPI } from "../../../../src/factory";
import { USER_1_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, VAULT_TO_LIQUIDATE_URI, ESPLORA_BASE_PATH, VAULT_TO_BAN_URI, NATIVE_CURRENCY_TICKER, WRAPPED_CURRENCY_TICKER, ORACLE_URI } from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { issueSingle } from "../../../../src/utils";
import { CollateralCurrency, CollateralIdLiteral, currencyIdToLiteral, DefaultBTCRelayAPI, DefaultIssueAPI, DefaultTransactionAPI, DefaultVaultsAPI, ExecuteRedeem, issueAndRedeem, IssueAPI, newAccountId, newVaultId, RedeemStatus, tickerToMonetaryCurrency, waitForBlockFinalization, WrappedCurrency } from "../../../../src";
import { assert, expect } from "../../../chai";
import { runWhileMiningBTCBlocks, sudo } from "../../../utils/helpers";

export type RequestResult = { hash: Hash; vault: VaultRegistryVault };

describe("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let electrsAPI: DefaultElectrsAPI;
    let btcRelayAPI: DefaultBTCRelayAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vaultToLiquidate: KeyringPair;
    let vaultToLiquidateId: InterbtcPrimitivesVaultId;
    let vaultToBan: KeyringPair;
    let vaultToBanId: InterbtcPrimitivesVaultId;
    let userBitcoinCoreClient: BitcoinCoreClient;
    let bitcoinCoreClient: BitcoinCoreClient;
    let vaultsAPI: DefaultVaultsAPI;
    let issueAPI: IssueAPI;
    let oracleAccount: KeyringPair;

    let collateralCurrency: CollateralCurrency;
    let wrappedCurrency: WrappedCurrency;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        collateralCurrency = tickerToMonetaryCurrency(api, NATIVE_CURRENCY_TICKER) as CollateralCurrency;
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        vaultToLiquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        vaultToLiquidateId = newVaultId(api, vaultToLiquidate.address, Polkadot, wrappedCurrency);
        vaultToBan = keyring.addFromUri(VAULT_TO_BAN_URI);
        vaultToBanId = newVaultId(api, vaultToBan.address, Polkadot, wrappedCurrency);
        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency, userAccount);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency);
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        userBitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, wrappedCurrency, collateralCurrency);
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
            const oracleAPI = new DefaultOracleAPI(api, wrappedCurrency, oracleAccount);
            const regularExchangeRate = await oracleAPI.getExchangeRate(Polkadot);
            // There should be no burnable tokens
            await expect(redeemAPI.getBurnExchangeRate(Polkadot)).to.be.rejected;
            const issuedTokens = InterBtcAmount.from.BTC(0.0001);
            await issueSingle(api, electrsAPI, userBitcoinCoreClient, userAccount, issuedTokens, collateralCurrency, vaultToLiquidateId, true, false);
            const vaultBitcoinCoreClient = new BitcoinCoreClient(
                BITCOIN_CORE_NETWORK,
                BITCOIN_CORE_HOST,
                BITCOIN_CORE_USERNAME,
                BITCOIN_CORE_PASSWORD,
                BITCOIN_CORE_PORT,
                "vault_to_liquidate-DOT-INTERBTC"
            );
            // Steal some bitcoin (spend from the vault's account)
            const foreignBitcoinAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
            const amountToSteal = InterBtcAmount.from.BTC(0.00001);
            const btcTxId = await vaultBitcoinCoreClient.sendToAddress(foreignBitcoinAddress, amountToSteal);
            // it takes about 15 mins for the theft to be reported
            await DefaultTransactionAPI.waitForEvent(api, api.events.relay.VaultTheft, 17 * 60000);

            const flaggedForTheft = await vaultsAPI.isVaultFlaggedForTheft(
                vaultToLiquidateId.accountId,
                currencyIdToLiteral(vaultToLiquidateId.currencies.collateral) as CollateralIdLiteral,
                btcTxId
            );
            assert.isTrue(flaggedForTheft);

            await waitForBlockFinalization(bitcoinCoreClient, btcRelayAPI);
            const maxBurnableTokens = await redeemAPI.getMaxBurnableTokens(Polkadot);
            assert.equal(maxBurnableTokens.str.BTC(), issuedTokens.str.BTC());
            const burnExchangeRate = await redeemAPI.getBurnExchangeRate(Polkadot);
            assert.isTrue(
                regularExchangeRate.toBig().lt(burnExchangeRate.toBig()),
                `Burn exchange rate (${burnExchangeRate.toHuman()}) is not better than the regular one (${regularExchangeRate.toHuman()})`
            );
            // Burn InterBtc for a premium, to restore peg
            await redeemAPI.burn(amountToSteal, Polkadot);
        });
    }).timeout(18 * 60000);

    // TODO: Unskip after `subscribeToRedeemExpiry` is reimplemented
    it.skip("should cancel a redeem request", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.00005);
            const redeemAmount = InterBtcAmount.from.BTC(0.00003);
            const initialRedeemPeriod = await redeemAPI.getRedeemPeriod();
            await sudo(redeemAPI, (api) => api.setRedeemPeriod(1));
            const [, redeemRequest] = await issueAndRedeem(api, electrsAPI, btcRelayAPI, userBitcoinCoreClient, userAccount, collateralCurrency, vaultToBanId, issueAmount, redeemAmount, false, ExecuteRedeem.False);
            // Wait for redeem expiry callback
            await new Promise<void>((resolve, _) => {
                // redeemAPI.subscribeToRedeemExpiry(newAccountId(api, userAccount.address), (requestId) => {
                //     if (stripHexPrefix(redeemRequest.id.toString()) === stripHexPrefix(requestId.toString())) {
                //         resolve();
                //     }
                // });
            });
            await redeemAPI.cancel(redeemRequest.id.toString(), true);
            const redeemRequestAfterCancellation = await redeemAPI.getRequestById(redeemRequest.id);
            assert.isTrue(redeemRequestAfterCancellation.status === RedeemStatus.Reimbursed, "Failed to cancel issue request");
            // Set issue period back to its initial value to minimize side effects.
            await sudo(redeemAPI, (api) => api.setRedeemPeriod(initialRedeemPeriod));
        });
    }).timeout(5 * 60 * 1000);

    it("should issue and auto-execute redeem", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.001);
            const redeemAmount = InterBtcAmount.from.BTC(0.0009);
            await issueAndRedeem(api, electrsAPI, btcRelayAPI, bitcoinCoreClient, userAccount, collateralCurrency, undefined, issueAmount, redeemAmount, false);
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(10 * 60 * 1000);

    it("should issue and manually execute redeem", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = InterBtcAmount.from.BTC(0.001);
            const redeemAmount = InterBtcAmount.from.BTC(0.0009);
            await issueAndRedeem(api, electrsAPI, btcRelayAPI, bitcoinCoreClient, userAccount, collateralCurrency, undefined, issueAmount, redeemAmount, false, ExecuteRedeem.Manually);
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(10 * 60 * 1000);
});
