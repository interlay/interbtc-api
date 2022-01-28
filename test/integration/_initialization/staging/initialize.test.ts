import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId } from "@polkadot/types/interfaces";
import { Bitcoin, BitcoinUnit, Currency, ExchangeRate, InterBtc, InterBtcAmount, Kusama, Polkadot } from "@interlay/monetary-js";
import { assert } from "chai";
import Big from "big.js";

import {
    BitcoinCoreClient,
    createPolkadotAPI,
    VaultsAPI,
    newAccountId,
    CollateralUnit,
    CurrencyIdLiteral,
    newVaultId,
    WrappedCurrency,
    tickerToMonetaryCurrency,
    DefaultInterBTCAPI,
    InterBTCAPI,
} from "../../../../src";
import {
    initializeVaultNomination,
    initializeExchangeRate,
    initializeStableConfirmations,
    initializeIssue,
    initializeBtcTxFees
} from "../../../../src/utils/setup";
import {
    SUDO_URI,
    ORACLE_URI,
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
    WRAPPED_CURRENCY_TICKER
} from "../../../config";
import { sleep, SLEEP_TIME_MS } from "../../../utils/helpers";

describe("Initialize parachain state", () => {
    let api: ApiPromise;
    let userInterBtcAPI: InterBTCAPI;
    let sudoInterBtcAPI: InterBTCAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    let sudoAccount: KeyringPair;
    let oracleAccount: KeyringPair;
    let userAccount: KeyringPair;

    let vault_1: KeyringPair;
    let vault_2: KeyringPair;
    let vault_3: KeyringPair;
    let vault_to_ban: KeyringPair;
    let vault_to_liquidate: KeyringPair;

    let wrappedCurrency: WrappedCurrency;

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
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        oracleAccount = keyring.addFromUri(ORACLE_URI);
        userAccount = keyring.addFromUri(USER_1_URI);
        vault_1 = keyring.addFromUri(VAULT_1_URI);
        vault_2 = keyring.addFromUri(VAULT_2_URI);
        vault_3 = keyring.addFromUri(VAULT_3_URI);
        vault_to_ban = keyring.addFromUri(VAULT_TO_BAN_URI);
        vault_to_liquidate = keyring.addFromUri(VAULT_TO_LIQUIDATE_URI);
        wrappedCurrency = tickerToMonetaryCurrency(api, WRAPPED_CURRENCY_TICKER) as WrappedCurrency;
        
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );

        userInterBtcAPI = new DefaultInterBTCAPI(api, "regtest", wrappedCurrency, userAccount, ESPLORA_BASE_PATH);
        sudoInterBtcAPI = new DefaultInterBTCAPI(api, "regtest", wrappedCurrency, sudoAccount, ESPLORA_BASE_PATH);

        const vaultCollateralPairs: [KeyringPair, CurrencyIdLiteral][] = [
            [vault_1, CurrencyIdLiteral.DOT],
            [vault_2, CurrencyIdLiteral.KSM],
            [vault_3, CurrencyIdLiteral.DOT],
            [vault_to_ban, CurrencyIdLiteral.DOT],
            [vault_to_liquidate, CurrencyIdLiteral.DOT]
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
        const previousIssueApiAccount = userInterBtcAPI.issue.getAccount();
        userInterBtcAPI.issue.setAccount(sudoAccount);
        // Speed up the process by only requiring 0 parachain and 0 bitcoin confirmations
        const stableBitcoinConfirmationsToSet = 0;
        const stableParachainConfirmationsToSet = 0;
        await initializeStableConfirmations(
            api,
            {
                bitcoinConfirmations: stableBitcoinConfirmationsToSet,
                parachainConfirmations: stableParachainConfirmationsToSet
            },
            userInterBtcAPI.issue,
            bitcoinCoreClient
        );
        const stableBitcoinConfirmations = await userInterBtcAPI.btcRelay.getStableBitcoinConfirmations();
        const stableParachainConfirmations = await userInterBtcAPI.btcRelay.getStableParachainConfirmations();
        assert.equal(stableBitcoinConfirmationsToSet, stableBitcoinConfirmations, "Setting the Bitcoin confirmations failed");
        assert.equal(stableParachainConfirmationsToSet, stableParachainConfirmations, "Setting the Parachain confirmations failed");
        if (previousIssueApiAccount) {
            userInterBtcAPI.issue.setAccount(previousIssueApiAccount);
        }
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
        await initializeBtcTxFees(setFeeEstimate, sudoInterBtcAPI.oracle);
        // just check that this is set since we medianize results
        const getFeeEstimate = await sudoInterBtcAPI.oracle.getBitcoinFees();
        assert.isDefined(getFeeEstimate);
    });

    it("should enable vault nomination", async () => {
        await initializeVaultNomination(true, sudoInterBtcAPI.nomination);
        const isNominationEnabled = await sudoInterBtcAPI.nomination.isNominationEnabled();
        assert.isTrue(isNominationEnabled);
    });

    it("should issue 0.00007 InterBtc", async () => {
        const interBtcToIssue = InterBtcAmount.from.BTC(0.00007);
        const feesToPay = await userInterBtcAPI.issue.getFeesToPay(interBtcToIssue);
        const userAccountId = newAccountId(api, userAccount.address);
        const userInterBTCBefore = (await userInterBtcAPI.tokens.balance(InterBtc, userAccountId)).free;

        await initializeIssue(
            api, bitcoinCoreClient, userAccount, interBtcToIssue, newVaultId(api, vault_1.address, Polkadot, wrappedCurrency)
        );
        const userInterBTCAfter = (await userInterBtcAPI.tokens.balance(InterBtc, userAccountId)).free;
        assert.equal(
            userInterBTCBefore.add(interBtcToIssue).sub(feesToPay).toString(),
            userInterBTCAfter.toString(),
            "Issued amount is different from the requested amount"
        );
        const totalIssuance = await userInterBtcAPI.tokens.total(InterBtc);
        assert.equal(totalIssuance.toString(), interBtcToIssue.toString());
        const vaultIssuedAmount = await userInterBtcAPI.vaults.getIssuedAmount(newAccountId(api, vault_1.address), CurrencyIdLiteral.DOT);
        assert.equal(vaultIssuedAmount.toString(), interBtcToIssue.toString());
    });

    it("should redeem 0.00005 InterBtc", async () => {
        const interBtcToRedeem = InterBtcAmount.from.BTC(0.00005);
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        await userInterBtcAPI.redeem.request(interBtcToRedeem, redeemAddress);

        const redeemRequests = await userInterBtcAPI.redeem.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });
});
