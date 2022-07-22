import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import {
    AssetRegistryAPI,
    DefaultAssetRegistryAPI,
    DefaultInterBtcApi,
    DefaultTransactionAPI,
    getCorrespondingCollateralCurrencies,
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
import { assert, expect } from "../../../../chai";
import { issueSingle } from "../../../../../src/utils/issueRedeem";
import { currencyIdToMonetaryCurrency, newAccountId, newVaultId, WrappedCurrency } from "../../../../../src";
import { MonetaryAmount } from "@interlay/monetary-js";

describe("replace", () => {
    let api: ApiPromise;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;
    let userAccount: KeyringPair;
    let vault_3: KeyringPair;
    let vault_3_ids: Array<InterbtcPrimitivesVaultId>;
    let vault_2: KeyringPair;
    let vault_2_ids: Array<InterbtcPrimitivesVaultId>;
    let interBtcAPI: InterBtcApi;
    let assetRegistry: AssetRegistryAPI;

    let wrappedCurrency: WrappedCurrency;

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
        assetRegistry = new DefaultAssetRegistryAPI(api);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        wrappedCurrency = interBtcAPI.getWrappedCurrency();
        const collateralCurrencies = getCorrespondingCollateralCurrencies(interBtcAPI.getGovernanceCurrency());
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_3_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_3.address, collateralCurrency, wrappedCurrency)
        );
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_2_ids = collateralCurrencies.map((collateralCurrency) =>
            newVaultId(api, vault_2.address, collateralCurrency, wrappedCurrency)
        );
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        let dustValue: MonetaryAmount<WrappedCurrency>;
        let feesEstimate: MonetaryAmount<WrappedCurrency>;

        before(async () => {
            dustValue = await interBtcAPI.replace.getDustValue();
            feesEstimate = newMonetaryAmount(await interBtcAPI.oracle.getBitcoinFees(), wrappedCurrency, false);
        });

        it("should request vault replacement", async () => {
            for (const vault_3_id of vault_3_ids) {
                // try to set value above dust + estimated fees
                const issueAmount = dustValue.add(feesEstimate).mul(1.2);
                const replaceAmount = dustValue;
                await issueSingle(interBtcAPI, bitcoinCoreClient, userAccount, issueAmount, vault_3_id);

                interBtcAPI.setAccount(vault_3);
                await interBtcAPI.replace.request(
                    replaceAmount,
                    await currencyIdToMonetaryCurrency(assetRegistry, vault_3_id.currencies.collateral)
                );

                const finalizedPromise = new Promise<void>((resolve, _) =>
                    interBtcAPI.system.subscribeToFinalizedBlockHeads(async (header) => {
                        const events = await interBtcAPI.api.query.system.events.at(header.parentHash);
                        if (DefaultTransactionAPI.doesArrayContainEvent(events, api.events.replace.AcceptReplace)) {
                            resolve();
                        }
                    })
                );

                await finalizedPromise;
            }

            const requestsList = await interBtcAPI.replace.list();
            const requestsMap = await interBtcAPI.replace.map();
            assert.equal(
                requestsList.length,
                vault_3_ids.length,
                `Expected ${vault_3_ids.length} requests in list, got ${requestsList.length}`
            );
            assert.equal(
                requestsMap.size,
                vault_3_ids.length,
                `Expected ${vault_3_ids.length} requests in map, got ${requestsMap.size}`
            );

            // Need to manually compare some fields
            const membersFromListToExpect = requestsList.map((req) => ({
                btcAddress: req.btcAddress,
                btcHeight: req.btcHeight,
                amount: req.amount.toString(),
            }));

            const membersFromMapToCheck = Array.from(requestsMap.values()).map((req) => ({
                btcAddress: req.btcAddress,
                btcHeight: req.btcHeight,
                amount: req.amount.toString(),
            }));

            expect(membersFromMapToCheck).to.deep.include.members(membersFromListToExpect);
        }).timeout(2000000);

        it("should fail vault replace request if not having enough tokens", async () => {
            for (const vault_2_id of vault_2_ids) {
                const currencyTicker = (
                    await currencyIdToMonetaryCurrency(assetRegistry, vault_2_id.currencies.collateral)
                ).ticker;
                interBtcAPI.setAccount(vault_2);

                // fetch tokens held by vault
                const tokensInVault = await interBtcAPI.vaults.getIssuedAmount(
                    newAccountId(api, vault_2.address),
                    await currencyIdToMonetaryCurrency(assetRegistry, vault_2_id.currencies.collateral)
                );

                // make sure vault does not hold enough issued tokens to request a replace
                const replaceAmount = dustValue.add(tokensInVault);

                try {
                    await interBtcAPI.replace.request(
                        replaceAmount,
                        await currencyIdToMonetaryCurrency(assetRegistry, vault_2_id.currencies.collateral)
                    );
                    assert.fail(`Expected error to be thrown due to lack of issued tokens
                        for vault (collateral: ${currencyTicker}), but call completed.`);
                } catch (e) {
                    assert.isTrue(
                        e instanceof Error,
                        `Expected replace request to fail with Error (${currencyTicker} vault)`
                    );
                }
            }
        }).timeout(600000);
    });

    it("should getDustValue", async () => {
        const dustValue = await interBtcAPI.replace.getDustValue();
        assert.equal(dustValue.toString(), "0.00001");
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
