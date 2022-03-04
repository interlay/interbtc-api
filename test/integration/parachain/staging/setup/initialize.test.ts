import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId } from "@polkadot/types/interfaces";
import { Bitcoin, BitcoinUnit, Currency, ExchangeRate, Kusama, Polkadot } from "@interlay/monetary-js";
import { assert } from "chai";
import Big from "big.js";

import {
    BitcoinCoreClient,
    createSubstrateAPI,
    VaultsAPI,
    newAccountId,
    CollateralUnit,
    CurrencyIdLiteral,
    newVaultId,
    WrappedCurrency,
    InterBtcApi,
    DefaultInterBtcApi,
    getCorrespondingCollateralCurrency,
    CollateralCurrency,
    tickerToCurrencyIdLiteral,
    newMonetaryAmount,
} from "../../../../../src";
import {
    initializeVaultNomination,
    initializeExchangeRate,
    initializeStableConfirmations,
    initializeIssue,
    initializeBtcTxFees
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
import { sleep, SLEEP_TIME_MS } from "../../../../utils/helpers";

describe.skip("Initialize parachain state", () => {
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

    let wrappedCurrency: WrappedCurrency;
    let collateralCurrency: CollateralCurrency;

    function accountIdFromKeyring(keyPair: KeyringPair): AccountId {
        return newAccountId(api, keyPair.address);
    }

    async function waitForRegister(api: VaultsAPI, accountId: AccountId, collateralCurrency: CurrencyIdLiteral) {
        while (true) {
            try {
                await api.get(accountId, collateralCurrency);
                return;
            } catch (e) { console.log(e); }
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

        wrappedCurrency = userInterBtcAPI.getWrappedCurrency();
        collateralCurrency = getCorrespondingCollateralCurrency(userInterBtcAPI.getGovernanceCurrency());
        const collateralCurrencyLiteral = tickerToCurrencyIdLiteral(collateralCurrency.ticker);
        const vaultCollateralPairs: [KeyringPair, CurrencyIdLiteral][] = [
            [vault_1, collateralCurrencyLiteral],
            [vault_2, collateralCurrencyLiteral],
            [vault_3, collateralCurrencyLiteral],
            [vault_to_ban, collateralCurrencyLiteral],
            [vault_to_liquidate, collateralCurrencyLiteral]
        ];
        // wait for all vaults to register
        await Promise.all(
            vaultCollateralPairs
                .map(([keyring, collateral]): [AccountId, CurrencyIdLiteral] => [accountIdFromKeyring(keyring), collateral])
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
            userInterBtcAPI.btcRelay.getStableParachainConfirmations()
        ]);

        if (stableBitcoinConfirmations != 0 || stableParachainConfirmations != 0) {
            await initializeStableConfirmations(
                api,
                {
                    bitcoinConfirmations: stableBitcoinConfirmationsToSet,
                    parachainConfirmations: stableParachainConfirmationsToSet
                },
                sudoAccount,
                bitcoinCoreClient
            );
            [stableBitcoinConfirmations, stableParachainConfirmations] = await Promise.all([
                userInterBtcAPI.btcRelay.getStableBitcoinConfirmations(),
                userInterBtcAPI.btcRelay.getStableParachainConfirmations()
            ]);
        }
        assert.equal(stableBitcoinConfirmationsToSet, stableBitcoinConfirmations, "Setting the Bitcoin confirmations failed");
        assert.equal(stableParachainConfirmationsToSet, stableParachainConfirmations, "Setting the Parachain confirmations failed");
    });

    it("should set the exchange rate", async () => {
        async function setCollateralExchangeRate<C extends CollateralUnit>(value: Big, currency: Currency<C>) {
            const exchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, typeof currency, typeof currency.units>(Bitcoin, currency, value);
            // result will be medianized
            await initializeExchangeRate(exchangeRate, sudoInterBtcAPI.oracle);
        }
        const exchangeRateValue = new Big("3855.23187");
        await setCollateralExchangeRate(exchangeRateValue, Polkadot);
        await setCollateralExchangeRate(exchangeRateValue, Kusama);
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

    it("should issue 0.00007 wrapped", async () => {
        const wrappedToIssue = newMonetaryAmount(0.00007, wrappedCurrency, true);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(wrappedToIssue);
        const userAccountId = newAccountId(api, userAccount.address);
        const userWrappedBefore = (await userInterBtcAPI.tokens.balance(wrappedCurrency, userAccountId)).free;

        await initializeIssue(
            userInterBtcAPI, bitcoinCoreClient, userAccount, wrappedToIssue, newVaultId(api, vault_1.address, collateralCurrency, wrappedCurrency)
        );
        const collateralCurrencyLiteral = tickerToCurrencyIdLiteral(collateralCurrency.ticker);
        const [userWrappedAfter, totalIssuance, vaultIssuedAmount] = await Promise.all([
            userInterBtcAPI.tokens.balance(wrappedCurrency, userAccountId),
            userInterBtcAPI.tokens.total(wrappedCurrency),
            userInterBtcAPI.vaults.getIssuedAmount(newAccountId(api, vault_1.address), collateralCurrencyLiteral)
        ]);

        assert.equal(
            userWrappedBefore.add(wrappedToIssue).sub(feesToPay).toString(),
            userWrappedAfter.free.toString(),
            "Issued amount is different from the requested amount"
        );
        // TODO: get the total issuance and vault issued amount before and calculate difference
        // so that this test can be run more than once without resetting the chain
        // assert.equal(totalIssuance.toString(), wrappedToIssue.toString());
        // assert.equal(vaultIssuedAmount.toString(), wrappedToIssue.toString());
    });

    it("should redeem 0.00005 InterBtc", async () => {
        const wrappedToRedeem = newMonetaryAmount(0.00005, wrappedCurrency, true);
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        await userInterBtcAPI.redeem.request(wrappedToRedeem, redeemAddress);

        const redeemRequests = await userInterBtcAPI.redeem.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 redeem request"
        );
    });
});
