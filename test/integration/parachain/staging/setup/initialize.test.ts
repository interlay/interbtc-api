import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId } from "@polkadot/types/interfaces";
import { Bitcoin, ExchangeRate, Interlay, Kintsugi, Kusama, Polkadot } from "@interlay/monetary-js";
import { assert } from "chai";
import Big from "big.js";

import {
    BitcoinCoreClient,
    createSubstrateAPI,
    VaultsAPI,
    newAccountId,
    InterBtcApi,
    DefaultInterBtcApi,
    getCorrespondingCollateralCurrencies,
    CollateralCurrencyExt,
    getStorageKey,
    CurrencyExt,
} from "../../../../../src";
import {
    initializeVaultNomination,
    initializeExchangeRate,
    initializeStableConfirmations,
    initializeBtcTxFees,
} from "../../../../../src/utils/setup";
import {
    SUDO_URI,
    VAULT_1_URI,
    VAULT_2_URI,
    BITCOIN_CORE_HOST,
    BITCOIN_CORE_NETWORK,
    BITCOIN_CORE_PASSWORD,
    BITCOIN_CORE_PORT,
    BITCOIN_CORE_USERNAME,
    BITCOIN_CORE_WALLET,
    PARACHAIN_ENDPOINT,
    VAULT_3_URI,
    VAULT_TO_LIQUIDATE_URI,
    VAULT_TO_BAN_URI,
    USER_1_URI,
    ESPLORA_BASE_PATH,
} from "../../../../config";
import {
    getExchangeRateValueToSetForTesting,
    sleep,
    SLEEP_TIME_MS,
    waitForFinalizedEvent,
} from "../../../../utils/helpers";
import { DefaultAssetRegistryAPI } from "../../../../../src/parachain/asset-registry";

describe("Initialize parachain state", () => {
    let api: ApiPromise;
    let userInterBtcAPI: InterBtcApi;
    let sudoInterBtcAPI: InterBtcApi;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    let sudoAccount: KeyringPair;
    let userAccount: KeyringPair;

    let vault_1: KeyringPair;
    let vault_2: KeyringPair;
    let vault_3: KeyringPair;
    let vault_to_ban: KeyringPair;
    let vault_to_liquidate: KeyringPair;

    let collateralCurrency: CollateralCurrencyExt;

    function accountIdFromKeyring(keyPair: KeyringPair): AccountId {
        return newAccountId(api, keyPair.address);
    }

    async function waitForRegister(api: VaultsAPI, accountId: AccountId, collateralCurrency: CollateralCurrencyExt) {
        for (;;) {
            try {
                await api.get(accountId, collateralCurrency);
                return;
            } catch (e) {
                console.log(e);
            }
            await sleep(SLEEP_TIME_MS);
        }
    }

    before(async function () {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        userAccount = keyring.addFromUri(USER_1_URI);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);

        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );

        userInterBtcAPI = new DefaultInterBtcApi(api, "regtest", userAccount, ESPLORA_BASE_PATH);
        sudoInterBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

        collateralCurrency = getCorrespondingCollateralCurrencies(userInterBtcAPI.getGovernanceCurrency())[0];
        const vaultCollateralPairs: [KeyringPair, CollateralCurrencyExt][] = [
            [vault_1, collateralCurrency],
            [vault_2, collateralCurrency],
            [vault_3, collateralCurrency],
            [vault_to_ban, collateralCurrency],
            [vault_to_liquidate, collateralCurrency],
        ];
        // wait for all vaults to register
        await Promise.all(
            vaultCollateralPairs
                .map(([keyring, collateralCurrency]): [AccountId, CollateralCurrencyExt] => [
                    accountIdFromKeyring(keyring),
                    collateralCurrency,
                ])
                .map(([accountId, collateral]) => waitForRegister(userInterBtcAPI.vaults, accountId, collateral))
        );
    });

    after(async () => {
        api.disconnect();
    });

    it("should set the stable confirmations and ready the BTC-Relay", async () => {
        // Speed up the process by only requiring 0 parachain and 0 bitcoin confirmations
        const stableBitcoinConfirmationsToSet = 0;
        const stableParachainConfirmationsToSet = 0;
        let [stableBitcoinConfirmations, stableParachainConfirmations] = await Promise.all([
            userInterBtcAPI.btcRelay.getStableBitcoinConfirmations(),
            userInterBtcAPI.btcRelay.getStableParachainConfirmations(),
        ]);

        if (stableBitcoinConfirmations != 0 || stableParachainConfirmations != 0) {
            await initializeStableConfirmations(
                api,
                {
                    bitcoinConfirmations: stableBitcoinConfirmationsToSet,
                    parachainConfirmations: stableParachainConfirmationsToSet,
                },
                sudoAccount,
                bitcoinCoreClient
            );
            [stableBitcoinConfirmations, stableParachainConfirmations] = await Promise.all([
                userInterBtcAPI.btcRelay.getStableBitcoinConfirmations(),
                userInterBtcAPI.btcRelay.getStableParachainConfirmations(),
            ]);
        }
        assert.equal(
            stableBitcoinConfirmationsToSet,
            stableBitcoinConfirmations,
            "Setting the Bitcoin confirmations failed"
        );
        assert.equal(
            stableParachainConfirmationsToSet,
            stableParachainConfirmations,
            "Setting the Parachain confirmations failed"
        );
    });

    it("should have at least one foreign asset registered", async () => {
        const assetRegistryMetadataHash = getStorageKey("AssetRegistry", "Metadata");
        const existingKeys = (await sudoInterBtcAPI.api.rpc.state.getKeys(assetRegistryMetadataHash)).toArray();

        if (existingKeys.length === 0) {
            // register a new foreign asset for the test
            const nextAssetId = (await sudoInterBtcAPI.api.query.assetRegistry.lastAssetId()).toNumber() + 1;

            const callToRegister = sudoInterBtcAPI.api.tx.assetRegistry.registerAsset(
                {
                    name: api.createType("Bytes", "Acala USD"),
                    symbol: api.createType("Bytes", "aUSD"),
                    decimals: api.createType("u32", 6),
                    existentialDeposit: api.createType("u128", 1000000),
                },
                api.createType("u32", nextAssetId)
            );

            // need sudo to add new foreign asset
            await sudoInterBtcAPI.api.tx.sudo.sudo(callToRegister).signAndSend(sudoAccount);

            // wait for finalized event
            await waitForFinalizedEvent(sudoInterBtcAPI, api.events.assetRegistry.RegisteredAsset);
        }

        const currencies = await sudoInterBtcAPI.assetRegistry.getForeignAssets();
        assert.isAtLeast(
            currencies.length,
            1,
            `Expected at least one foreign asset registered, but found ${currencies.length}`
        );
    });

    it("should set the exchange rate for foreign assets", async () => {
        const assetRegistryApi: DefaultAssetRegistryAPI = new DefaultAssetRegistryAPI(sudoInterBtcAPI.api);

        const foreignAssets = await assetRegistryApi.getForeignAssets();

        const initXchangePromises = foreignAssets.map((foreignAsset) => {
            const exchangeRate = new ExchangeRate(
                Bitcoin,
                foreignAsset,
                getExchangeRateValueToSetForTesting(foreignAsset)
            );
            return initializeExchangeRate(exchangeRate, sudoInterBtcAPI.oracle);
        });

        await Promise.all(initXchangePromises);
    });

    it("should set the exchange rate for collateral tokens", async () => {
        async function setCollateralExchangeRate(value: Big, currency: CurrencyExt) {
            const exchangeRate = new ExchangeRate(Bitcoin, currency, value);
            // result will be medianized
            return initializeExchangeRate(exchangeRate, sudoInterBtcAPI.oracle);
        }
        await Promise.all([
            setCollateralExchangeRate(getExchangeRateValueToSetForTesting(Polkadot), Polkadot),
            setCollateralExchangeRate(getExchangeRateValueToSetForTesting(Kusama), Kusama),
            setCollateralExchangeRate(getExchangeRateValueToSetForTesting(Kintsugi), Kintsugi),
            setCollateralExchangeRate(getExchangeRateValueToSetForTesting(Interlay), Interlay),
        ]);
    });

    it("should set BTC tx fees", async () => {
        const setFeeEstimate = new Big(1);
        let getFeeEstimate = await sudoInterBtcAPI.oracle.getBitcoinFees();
        if (!getFeeEstimate) {
            await initializeBtcTxFees(setFeeEstimate, sudoInterBtcAPI.oracle);
            // just check that this is set since we medianize results
            getFeeEstimate = await sudoInterBtcAPI.oracle.getBitcoinFees();
        }
        assert.isDefined(getFeeEstimate);
    });

    it("should enable vault nomination", async () => {
        let isNominationEnabled = await sudoInterBtcAPI.nomination.isNominationEnabled();
        if (!isNominationEnabled) {
            await initializeVaultNomination(true, sudoInterBtcAPI.nomination);
            isNominationEnabled = await sudoInterBtcAPI.nomination.isNominationEnabled();
        }
        assert.isTrue(isNominationEnabled);
    });
});
