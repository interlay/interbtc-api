import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId } from "@polkadot/types/interfaces";
import { Bitcoin, BitcoinUnit, Currency, ExchangeRate, InterBtc, InterBtcAmount, Kusama, Polkadot } from "@interlay/monetary-js";
import * as bitcoinjs from "bitcoinjs-lib";
import { assert } from "chai";
import Big from "big.js";

import {
    IssueAPI,
    ElectrsAPI,
    BitcoinCoreClient,
    createPolkadotAPI,
    OracleAPI,
    RedeemAPI,
    TokensAPI,
    BTCRelayAPI,
    DefaultBTCRelayAPI,
    NominationAPI,
    DefaultNominationAPI,
    VaultsAPI,
    DefaultVaultsAPI,
    newAccountId,
    CollateralUnit,
} from "../../../../src";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI } from "../../../../src/parachain/issue";
import { DefaultOracleAPI } from "../../../../src/parachain/oracle";
import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
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
} from "../../../config";
import { DefaultTokensAPI } from "../../../../src/parachain/tokens";
import { sleep, SLEEP_TIME_MS } from "../../../utils/helpers";

describe("Initialize parachain state", () => {
    let api: ApiPromise;
    let issueAPI: IssueAPI;
    let redeemAPI: RedeemAPI;
    let oracleAPI: OracleAPI;
    let electrsAPI: ElectrsAPI;
    let tokensAPI: TokensAPI;
    let vaultsAPI: VaultsAPI;
    let nominationAPI: NominationAPI;
    let btcRelayAPI: BTCRelayAPI;
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

    function accountIdFromKeyring(keyPair: KeyringPair): AccountId {
        return api.createType("AccountId", keyPair.address);
    }

    async function waitForRegister(api: VaultsAPI, accountId: AccountId) {
        while (true) {
            try {
                await api.get(accountId);
                return;
            } catch (_) { }
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
        
        electrsAPI = new DefaultElectrsAPI(ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            BITCOIN_CORE_NETWORK,
            BITCOIN_CORE_HOST,
            BITCOIN_CORE_USERNAME,
            BITCOIN_CORE_PASSWORD,
            BITCOIN_CORE_PORT,
            BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, userAccount);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, userAccount);
        oracleAPI = new DefaultOracleAPI(api, InterBtc, oracleAccount);
        tokensAPI = new DefaultTokensAPI(api, userAccount);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, userAccount);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, sudoAccount);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);

        // wait for all vaults to register
        await Promise.all(
            [vault_1, vault_2, vault_3, vault_to_ban, vault_to_liquidate]
                .map(accountIdFromKeyring)
                .map((accountId) => waitForRegister(vaultsAPI, accountId))
        );
    });

    after(async () => {
        api.disconnect();
    });

    it("should set the stable confirmations and ready the BTC-Relay", async () => {
        const previousIssueApiAccount = issueAPI.getAccount();
        issueAPI.setAccount(sudoAccount);
        // Speed up the process by only requiring 0 parachain and 0 bitcoin confirmations
        const stableBitcoinConfirmationsToSet = 0;
        const stableParachainConfirmationsToSet = 0;
        await initializeStableConfirmations(
            api,
            {
                bitcoinConfirmations: stableBitcoinConfirmationsToSet,
                parachainConfirmations: stableParachainConfirmationsToSet
            },
            issueAPI,
            bitcoinCoreClient
        );
        const stableBitcoinConfirmations = await btcRelayAPI.getStableBitcoinConfirmations();
        const stableParachainConfirmations = await btcRelayAPI.getStableParachainConfirmations();
        assert.equal(stableBitcoinConfirmationsToSet, stableBitcoinConfirmations, "Setting the Bitcoin confirmations failed");
        assert.equal(stableParachainConfirmationsToSet, stableParachainConfirmations, "Setting the Parachain confirmations failed");
        if (previousIssueApiAccount) {
            issueAPI.setAccount(previousIssueApiAccount);
        }
    });

    it("should set the exchange rate", async () => {
        async function setCollateralExchangeRate<C extends CollateralUnit>(value: Big, currency: Currency<C>) {
            const exchangeRate = new ExchangeRate<Bitcoin, BitcoinUnit, typeof currency, typeof currency.units>(Bitcoin, currency, value);
            // result will be medianized
            await initializeExchangeRate(exchangeRate, oracleAPI);
        }
        const exchangeRateValue = new Big("3855.23187");
        await setCollateralExchangeRate(exchangeRateValue, Polkadot);
        await setCollateralExchangeRate(exchangeRateValue, Kusama);
    });

    it("should set BTC tx fees", async () => {
        const setFeeEstimate = new Big(1);
        await initializeBtcTxFees(setFeeEstimate, oracleAPI);
        // just check that this is set since we medianize results
        const getFeeEstimate = await oracleAPI.getBitcoinFees();
        assert.isDefined(getFeeEstimate);
    });

    it("should enable vault nomination", async () => {
        await initializeVaultNomination(true, nominationAPI);
        const isNominationEnabled = await nominationAPI.isNominationEnabled();
        assert.isTrue(isNominationEnabled);
    });

    it("should issue 0.1 InterBtc", async () => {
        const interBtcToIssue = InterBtcAmount.from.BTC(0.1);
        const feesToPay = await issueAPI.getFeesToPay(interBtcToIssue);
        const userAccountId = api.createType("AccountId", userAccount.address);
        const sudoInterBTCBefore = await tokensAPI.balance(InterBtc, userAccountId);

        await initializeIssue(api, electrsAPI, bitcoinCoreClient, userAccount, interBtcToIssue, vault_1.address);
        const sudoInterBTCAfter = await tokensAPI.balance(InterBtc, userAccountId);
        assert.equal(
            sudoInterBTCBefore.add(interBtcToIssue).sub(feesToPay).toString(),
            sudoInterBTCAfter.toString(),
            "Issued amount is different from the requested amount"
        );
        const totalIssuance = await tokensAPI.total(InterBtc);
        assert.equal(totalIssuance.toString(), interBtcToIssue.toString());
        const vaultIssuedAmount = await vaultsAPI.getIssuedAmount(newAccountId(api, vault_1.address));
        assert.equal(vaultIssuedAmount.toString(), interBtcToIssue.toString());
    });

    it("should redeem 0.05 InterBtc", async () => {
        const interBtcToRedeem = InterBtcAmount.from.BTC(0.05);
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        await redeemAPI.request(interBtcToRedeem, redeemAddress);

        const redeemRequests = await redeemAPI.list();
        assert.isAtLeast(
            redeemRequests.length,
            1,
            "Error in initialization setup. Should have at least 1 issue request"
        );
    });
});
