import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Hash } from "@polkadot/types/interfaces";
import { Currency } from "@interlay/monetary-js";
import { 
    CollateralUnit,
    currencyIdToMonetaryCurrency,
    DefaultInterBtcApi, 
    InterBtcApi, 
    InterbtcPrimitivesVaultId, 
    VaultRegistryVault 
} from "../../../../src/index";

import { createSubstrateAPI } from "../../../../src/factory";
import { 
    USER_1_URI, 
    BITCOIN_CORE_HOST, 
    BITCOIN_CORE_NETWORK, 
    BITCOIN_CORE_PASSWORD, 
    BITCOIN_CORE_PORT, 
    BITCOIN_CORE_USERNAME, 
    BITCOIN_CORE_WALLET, 
    PARACHAIN_ENDPOINT, 
    VAULT_TO_LIQUIDATE_URI, 
    ESPLORA_BASE_PATH, 
    VAULT_TO_BAN_URI, 
    ORACLE_URI 
} from "../../../config";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { getCorrespondingCollateralCurrencies, issueSingle, newMonetaryAmount } from "../../../../src/utils";
import { 
    CollateralCurrency, 
    CollateralIdLiteral, 
    currencyIdToLiteral, 
    DefaultTransactionAPI, 
    ExecuteRedeem, 
    issueAndRedeem, 
    newVaultId, 
    RedeemStatus, 
    waitForBlockFinalization, 
    WrappedCurrency 
} from "../../../../src";
import { assert, expect } from "../../../chai";
import { runWhileMiningBTCBlocks, sudo } from "../../../utils/helpers";

export type RequestResult = { hash: Hash; vault: VaultRegistryVault };

describe("redeem", () => {
    let api: ApiPromise;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vaultToLiquidate: KeyringPair;
    let vaultToLiquidateIds: Array<InterbtcPrimitivesVaultId>;
    let vaultToBan: KeyringPair;
    let vaultToBanIds: Array<InterbtcPrimitivesVaultId>;
    let userBitcoinCoreClient: BitcoinCoreClient;
    let bitcoinCoreClient: BitcoinCoreClient;
    let userInterBtcAPI: InterBtcApi;
    let oracleInterBtcAPI: InterBtcApi;

    let collateralCurrencies: Array<CollateralCurrency>;
    let wrappedCurrency: WrappedCurrency;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        userAccount = keyring.addFromUri(USER_1_URI);
        const oracleAccount = keyring.addFromUri(ORACLE_URI);
        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        oracleInterBtcAPI = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
        collateralCurrencies = getCorrespondingCollateralCurrencies(userInterBtcAPI.getGovernanceCurrency());
        wrappedCurrency = userInterBtcAPI.getWrappedCurrency();
        vaultToLiquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        vaultToLiquidateIds = collateralCurrencies
            .map(collateralCurrency => newVaultId(api, vaultToLiquidate.address, collateralCurrency, wrappedCurrency));
        vaultToBan = keyring.addFromUri(VAULT_TO_BAN_URI);
        vaultToBanIds = collateralCurrencies
            .map(collateralCurrency => newVaultId(api, vaultToBan.address, collateralCurrency, wrappedCurrency));


        userBitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
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

    // TODO: discuss where to test this. Should be tested in the vault client rather than on the lib
    // TODO: (option 1) check with greg how to use instant seal for this test
    it.skip("should liquidate a vault that committed theft", async () => {
        for (const vaultToLiquidateId of vaultToLiquidateIds) {
            const collateralCurrency = currencyIdToMonetaryCurrency(vaultToLiquidateId.currencies.collateral) as CollateralCurrency;
            await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
                const regularExchangeRate = await oracleInterBtcAPI.oracle.getExchangeRate(collateralCurrency as Currency<CollateralUnit>);
                // There should be no burnable tokens
                await expect(userInterBtcAPI.redeem.getBurnExchangeRate(collateralCurrency as Currency<CollateralUnit>)).to.be.rejected;
                const issuedTokens = newMonetaryAmount(0.0001, wrappedCurrency, true);
                await issueSingle(userInterBtcAPI, userBitcoinCoreClient, userAccount, issuedTokens, vaultToLiquidateId, true, false);
                const vaultBitcoinCoreClient = new BitcoinCoreClient(
                    BITCOIN_CORE_NETWORK,
                    BITCOIN_CORE_HOST,
                    BITCOIN_CORE_USERNAME,
                    BITCOIN_CORE_PASSWORD,
                    BITCOIN_CORE_PORT,
                    `vault_to_liquidate-${collateralCurrency.ticker}-${wrappedCurrency.ticker}`
                );
                // Steal some bitcoin (spend from the vault's account)
                const foreignBitcoinAddress = "bcrt1qefxeckts7tkgz7uach9dnwer4qz5nyehl4sjcc";
                const amountToSteal = newMonetaryAmount(0.00001, wrappedCurrency, true);
                const btcTxId = await vaultBitcoinCoreClient.sendToAddress(foreignBitcoinAddress, amountToSteal);
                // TODO: (option 2) send an extrinsic (use VaultsAPI.reportVaultTheft) to report vault theft manually here.
                // it takes about 15 mins for the theft to be reported
                await DefaultTransactionAPI.waitForEvent(api, api.events.relay.VaultTheft, 17 * 60000);
    
                const flaggedForTheft = await userInterBtcAPI.vaults.isVaultFlaggedForTheft(
                    vaultToLiquidateId.accountId,
                    currencyIdToLiteral(vaultToLiquidateId.currencies.collateral) as CollateralIdLiteral,
                    btcTxId
                );
                assert.isTrue(flaggedForTheft);
    
                await waitForBlockFinalization(bitcoinCoreClient, userInterBtcAPI.btcRelay);
                const maxBurnableTokens = await userInterBtcAPI.redeem.getMaxBurnableTokens(collateralCurrency);
                assert.equal(maxBurnableTokens.str.BTC(), issuedTokens.str.BTC());
                const burnExchangeRate = await userInterBtcAPI.redeem.getBurnExchangeRate(collateralCurrency as Currency<CollateralUnit>);
                assert.isTrue(
                    regularExchangeRate.toBig().lt(burnExchangeRate.toBig()),
                    `Burn exchange rate (${burnExchangeRate.toHuman()}) is not better than 
                    the regular one (${regularExchangeRate.toHuman()})`
                );
                // Burn InterBtc for a premium, to restore peg
                await userInterBtcAPI.redeem.burn(amountToSteal, collateralCurrency);
            });
        }
    }).timeout(36 * 60000);

    // TODO: Unskip after `subscribeToRedeemExpiry` is reimplemented
    it.skip("should cancel a redeem request", async () => {
        for (const vaultToBanId of vaultToBanIds) {
            await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
                const issueAmount = newMonetaryAmount(0.00005, wrappedCurrency, true);
                const redeemAmount = newMonetaryAmount(0.00003, wrappedCurrency, true);
                const initialRedeemPeriod = await userInterBtcAPI.redeem.getRedeemPeriod();
                await sudo(userInterBtcAPI, () => userInterBtcAPI.redeem.setRedeemPeriod(1));
                const [, redeemRequest] = 
                    await issueAndRedeem(
                        userInterBtcAPI, 
                        userBitcoinCoreClient, 
                        userAccount, 
                        vaultToBanId, 
                        issueAmount, 
                        redeemAmount, 
                        false, 
                        ExecuteRedeem.False
                    );
                // TODO: in the promise: 
                // grab head
                //  wait for head + redeem period + 1
                // then resolve
                // Wait for redeem expiry callback
                await new Promise<void>((resolve, _) => {
                    // redeemAPI.subscribeToRedeemExpiry(newAccountId(api, userAccount.address), (requestId) => {
                    //     if (stripHexPrefix(redeemRequest.id.toString()) === stripHexPrefix(requestId.toString())) {
                    //         resolve();
                    //     }
                    // });
                });
                await userInterBtcAPI.redeem.cancel(redeemRequest.id.toString(), true);
                const redeemRequestAfterCancellation = await userInterBtcAPI.redeem.getRequestById(redeemRequest.id);
                assert.isTrue(redeemRequestAfterCancellation.status === RedeemStatus.Reimbursed, "Failed to cancel issue request");

                // TODO: check vault status changed to "banned"
                // Set issue period back to its initial value to minimize side effects.
                await sudo(userInterBtcAPI, () => userInterBtcAPI.redeem.setRedeemPeriod(initialRedeemPeriod));
            });
        }
    }).timeout(10 * 60000);

    // TODO: discuss if we need this test ehre since it tests vault behavior
    it.skip("should issue and auto-execute redeem", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = newMonetaryAmount(0.000013, wrappedCurrency, true);
            const redeemAmount = newMonetaryAmount(0.000011, wrappedCurrency, true);
            await issueAndRedeem(userInterBtcAPI, bitcoinCoreClient, userAccount, undefined, issueAmount, redeemAmount, false);
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(10 * 60 * 1000);

    // TODO: double the timeout and run on `master` branch only, before a release
    it.skip("should issue and manually execute redeem", async () => {
        await runWhileMiningBTCBlocks(bitcoinCoreClient, async () => {
            const issueAmount = newMonetaryAmount(0.00013, wrappedCurrency, true);
            const redeemAmount = newMonetaryAmount(0.00011, wrappedCurrency, true);
            await issueAndRedeem(
                userInterBtcAPI, 
                bitcoinCoreClient, 
                userAccount, 
                undefined, 
                issueAmount, 
                redeemAmount, 
                false, 
                ExecuteRedeem.Manually
            );
        });
        // The `ExecuteRedeem` event has been emitted at this point.
        // Do not check balances as this is already checked in the parachain integration tests.
    }).timeout(10 * 60 * 1000);
});
