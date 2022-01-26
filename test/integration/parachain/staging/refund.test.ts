import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { InterBtc, InterBtcAmount, Polkadot } from "@interlay/monetary-js";

import { DefaultInterBTCAPI, InterBTCAPI, InterbtcPrimitivesVaultId } from "../../../../src/index";
import { BitcoinCoreClient } from "../../../../src/utils/bitcoin-core-client";
import { createPolkadotAPI } from "../../../../src/factory";
import { USER_1_URI, VAULT_3_URI, BITCOIN_CORE_HOST, BITCOIN_CORE_NETWORK, BITCOIN_CORE_PASSWORD, BITCOIN_CORE_PORT, BITCOIN_CORE_USERNAME, BITCOIN_CORE_WALLET, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH, WRAPPED_CURRENCY_TICKER, COLLATERAL_CURRENCY_TICKER } from "../../../config";
import { assert } from "../../../chai";
import { issueSingle } from "../../../../src/utils/issueRedeem";
import { CollateralCurrency, newVaultId, tickerToMonetaryCurrency, WrappedCurrency } from "../../../../src";

describe("refund", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_3: KeyringPair;
    let vault_3_id: InterbtcPrimitivesVaultId;
    let wrappedCurrency: WrappedCurrency;
    let interBtcAPI: InterBTCAPI;

    before(async function () {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        userAccount = keyring.addFromUri(USER_1_URI);
        interBtcAPI = new DefaultInterBTCAPI(api, "regtest", wrappedCurrency, userAccount, ESPLORA_BASE_PATH);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_id = newVaultId(api, vault_3.address, Polkadot, wrappedCurrency);
    });

    after(async () => {
        api.disconnect();
    });

    it("should not generate a refund request", async () => {
        const issueResult = await issueSingle(
            api,
            bitcoinCoreClient,
            userAccount,
            InterBtcAmount.from.BTC(0.00005),
            vault_3_id,
            false,
            false
        );
        assert.isRejected(interBtcAPI.refund.getRequestByIssueId(issueResult.request.id));
    }).timeout(1000000);

    it("should generate a refund request", async () => {
        const issueResult = await issueSingle(
            api,
            bitcoinCoreClient,
            userAccount,
            InterBtcAmount.from.BTC(0.00005),
            vault_3_id,
            true,
            true
        );
        const refund = await interBtcAPI.refund.getRequestByIssueId(issueResult.request.id);
        assert.notEqual(refund.amountBtc.toString(), "0");
    }).timeout(1000000);

    it("should list a single refund request", async () => {
        const refundRequests = await interBtcAPI.refund.list();
        assert.equal(refundRequests.length, 1);
    }).timeout(100000);
});
