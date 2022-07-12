import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import {
    currencyIdToMonetaryCurrency,
    DefaultInterBtcApi,
    getCorrespondingCollateralCurrencies,
    InterBtcApi,
    InterbtcPrimitivesVaultId,
    newMonetaryAmount,
} from "../../../../../src/index";
import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { createSubstrateAPI } from "../../../../../src/factory";
import {
    USER_1_URI,
    VAULT_3_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    ESPLORA_BASE_PATH,
} from "../../../../config";
import { assert } from "../../../../chai";
import { issueSingle } from "../../../../../src/utils/issueRedeem";
import { newVaultId, WrappedCurrency } from "../../../../../src";
import { Interlay } from "@interlay/monetary-js";

describe("refund", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_3: KeyringPair;
    let vault_3_ids: Array<InterbtcPrimitivesVaultId>;
    let wrappedCurrency: WrappedCurrency;
    let interBtcAPI: InterBtcApi;
    let governanceCcyTicker: string;

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
        userAccount = keyring.addFromUri(USER_1_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        const governanceCurrency = interBtcAPI.getGovernanceCurrency();
        const collateralCurrencies = getCorrespondingCollateralCurrencies(governanceCurrency);
        governanceCcyTicker = governanceCurrency.ticker;
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_3.address, collateralCurrency, wrappedCurrency)
        );
    });

    after(async () => {
        api.disconnect();
    });

    it("should not generate a refund request", async () => {
        for (const vault_3_id of vault_3_ids) {
            const currencyTicker = currencyIdToMonetaryCurrency(vault_3_id.currencies.collateral).ticker;
            const issueResult = await issueSingle(
                interBtcAPI,
                bitcoinCoreClient,
                userAccount,
                newMonetaryAmount(0.00005, wrappedCurrency, true),
                vault_3_id,
                false,
                false
            );
            assert.isRejected(
                interBtcAPI.refund.getRequestByIssueId(issueResult.request.id),
                `Expected rejection for refund request with vault 3 (${currencyTicker})`
            );
        }
    }).timeout(2000000);

    it("should generate a refund request", async function () {
        if (interBtcAPI.getGovernanceCurrency().ticker === Interlay.ticker) {
            // Skip this test when running the INTR parachain (gov currency: INTR).
            // Vaults have had too much collateral, resulting in issuing more IBTC rather than
            // refunding the overpaid amount. So we had false negative failed tests.
            this.skip();
        }
        for (const vault_3_id of vault_3_ids) {
            const currencyTicker = currencyIdToMonetaryCurrency(vault_3_id.currencies.collateral).ticker;
            const issueResult = await issueSingle(
                interBtcAPI,
                bitcoinCoreClient,
                userAccount,
                newMonetaryAmount(0.000012, wrappedCurrency, true),
                vault_3_id,
                true,
                true
            );
            const refund = await interBtcAPI.refund.getRequestByIssueId(issueResult.request.id);
            assert.notEqual(
                refund.amountBtc.toString(),
                "0",
                `Expected non-zero amount for refund request with vault 3 (${currencyTicker})`
            );
            const refundRequests = await interBtcAPI.refund.list();
            assert.isAtLeast(
                refundRequests.length,
                1,
                `Expected at leas 1 refund request with vault 3 (${currencyTicker})`
            );
        }
    }).timeout(2000000);
});
