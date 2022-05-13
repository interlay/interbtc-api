import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { 
    currencyIdToLiteral,
    DefaultInterBtcApi, 
    DefaultTransactionAPI, 
    getCorrespondingCollateralCurrency, 
    InterBtcApi, 
    InterbtcPrimitivesVaultId, 
    newMonetaryAmount,
} from "../../../../../src/index";

import { BitcoinCoreClient } from "../../../../../src/utils/bitcoin-core-client";
import { createSubstrateAPI } from "../../../../../src/factory";
import {
    USER_1_URI,
    VAULT_2_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    VAULT_3_URI,
    ESPLORA_BASE_PATH,
} from "../../../../config";
import { assert } from "../../../../chai";
import { issueSingle } from "../../../../../src/utils/issueRedeem";
import { CollateralCurrency, currencyIdToMonetaryCurrency, newAccountId, newVaultId, WrappedCurrency } from "../../../../../src";
import { BitcoinUnit, MonetaryAmount } from "@interlay/monetary-js";

describe("replace", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_3: KeyringPair;
    let vault_3_id: InterbtcPrimitivesVaultId;
    let vault_2: KeyringPair;
    let vault_2_id: InterbtcPrimitivesVaultId;
    let interBtcAPI: InterBtcApi;

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrency: CollateralCurrency;

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
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        collateralCurrency = getCorrespondingCollateralCurrency(interBtcAPI.getGovernanceCurrency());
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_id = newVaultId(api, vault_3.address, collateralCurrency, wrappedCurrency);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_id = newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency);
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        let dustValue : MonetaryAmount<WrappedCurrency, BitcoinUnit>;
        let feesEstimate : MonetaryAmount<WrappedCurrency, BitcoinUnit>;

        before(async () => {
            dustValue = await interBtcAPI.replace.getDustValue();
            feesEstimate = newMonetaryAmount((await interBtcAPI.oracle.getBitcoinFees()), wrappedCurrency, false);
        });

        it("should request vault replacement", async () => {
            // try to set value above dust + estimated fees
            const issueAmount = dustValue.add(feesEstimate).mul(1.2);
            const replaceAmount = dustValue;
            await issueSingle(
                interBtcAPI,
                bitcoinCoreClient,
                userAccount,
                issueAmount,
                vault_3_id
            );

            interBtcAPI.setAccount(vault_3);
            await interBtcAPI.replace.request(
                replaceAmount, 
                currencyIdToMonetaryCurrency(vault_3_id.currencies.collateral) as CollateralCurrency
            );

            const finalizedPromise = new Promise<void>((resolve, _) => interBtcAPI.system.subscribeToFinalizedBlockHeads(
                async (header) => {
                    const events = await interBtcAPI.api.query.system.events.at(header.parentHash);
                    if (DefaultTransactionAPI.doesArrayContainEvent(events, api.events.replace.AcceptReplace)) {
                        resolve();
                    }
                })
            );

            await finalizedPromise;

            const requestsList = await interBtcAPI.replace.list();
            const requestsMap = await interBtcAPI.replace.map();
            assert.equal(requestsList.length, 1);
            assert.equal(requestsMap.size, 1);
            const firstMapEntry = requestsMap.values().next();
            // `deepEqual` fails with: Cannot convert 'Pending' via asCancelled
            // Need to manually compare some fields
            // Only check the first element to ensure parsing is correct
            assert.equal(requestsList[0].btcAddress, firstMapEntry.value.btcAddress);
            assert.equal(requestsList[0].amount.toString(), firstMapEntry.value.amount.toString());
            assert.equal(requestsList[0].btcHeight.toString(), firstMapEntry.value.btcHeight.toString());
        }).timeout(1000000);

        it("should fail vault replace request if not having enough tokens", async () => {
            const replaceAmount = dustValue;

            interBtcAPI.setAccount(vault_2);

            // check precondition: vault does not hold enough issued tokens to request a replace
            const tokensInVault = await interBtcAPI.vaults.getIssuedAmount(
                newAccountId(api, vault_2.address),
                currencyIdToLiteral(vault_2_id.currencies.collateral)
            );

            // vault 2 should have 0 issued tokens, but tests added later may interfere...
            // just double check here that we don't have enough to match the replace request.
            assert.isAbove(
                replaceAmount.add(feesEstimate).toBig(wrappedCurrency.base).toNumber(), 
                tokensInVault.toBig(wrappedCurrency.base).toNumber(), 
                "Pre-condition failed: vault needs fewer tokens than replace request"
            );

            try {
                await interBtcAPI.replace.request(
                    replaceAmount, 
                    currencyIdToMonetaryCurrency(vault_3_id.currencies.collateral) as CollateralCurrency
                );
                assert.fail("Expected error to be thrown due to lack of issued tokens for vault, but call completed.");
            } catch (e) {
                assert.isTrue(e instanceof Error, "Expected replace request to fail with Error");
            }

        }).timeout(300000);
    });

    it("should getDustValue", async () => {
        const dustValue = await interBtcAPI.replace.getDustValue();
        assert.equal(dustValue.str.BTC(), "0.00001");
    }).timeout(500);

    it("should getReplacePeriod", async () => {
        const replacePeriod = await interBtcAPI.replace.getReplacePeriod();
        assert.equal(replacePeriod.toString(), "7200");
    }).timeout(500);

    it("should list replace request by a vault", async () => {
        const vault3Id = newAccountId(api, vault_3.address);
        const replaceRequests = await interBtcAPI.replace.mapReplaceRequests(vault3Id);
        replaceRequests.forEach((request) => {
            assert.deepEqual(request.oldVault.accountId, vault3Id);
        });
    });

});
