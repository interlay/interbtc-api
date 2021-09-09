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
    REGTEST_ESPLORA_BASE_PATH,
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
    ALICE_URI,
    BOB_URI,
    CHARLIE_STASH_URI,
    DAVE_STASH_URI,
    DEFAULT_BITCOIN_CORE_HOST,
    DEFAULT_BITCOIN_CORE_NETWORK,
    DEFAULT_BITCOIN_CORE_PASSWORD,
    DEFAULT_BITCOIN_CORE_PORT,
    DEFAULT_BITCOIN_CORE_USERNAME,
    DEFAULT_BITCOIN_CORE_WALLET,
    DEFAULT_PARACHAIN_ENDPOINT,
    EVE_STASH_URI,
    FERDIE_STASH_URI,
    FERDIE_URI,
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

    let alice: KeyringPair;
    let bob: KeyringPair;

    // vault_1
    let charlie_stash: KeyringPair;
    // vault_2
    let dave_stash: KeyringPair;
    // vault_3
    let eve_stash: KeyringPair;
    // vault_to_ban
    let ferdie_stash: KeyringPair;
    // vault_to_liquidate
    let ferdie: KeyringPair;

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
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri(ALICE_URI);
        bob = keyring.addFromUri(BOB_URI);
        // Vaults in docker-compose
        charlie_stash = keyring.addFromUri(CHARLIE_STASH_URI);
        dave_stash = keyring.addFromUri(DAVE_STASH_URI);
        eve_stash = keyring.addFromUri(EVE_STASH_URI);
        ferdie_stash = keyring.addFromUri(FERDIE_STASH_URI);
        ferdie = keyring.addFromUri(FERDIE_URI);

        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, alice);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, alice);
        oracleAPI = new DefaultOracleAPI(api, InterBtc, bob);
        tokensAPI = new DefaultTokensAPI(api, alice);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, InterBtc, alice);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);

        // wait for all vaults to register
        await Promise.all(
            [charlie_stash, dave_stash, eve_stash, ferdie_stash, ferdie]
                .map(accountIdFromKeyring)
                .map((accountId) => waitForRegister(vaultsAPI, accountId))
        );
    });

    after(async () => {
        api.disconnect();
    });

    it("should set the stable confirmations and ready the BTC-Relay", async () => {
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
        const aliceAccountId = api.createType("AccountId", alice.address);
        const aliceInterBTCBefore = await tokensAPI.balance(InterBtc, aliceAccountId);

        await initializeIssue(api, electrsAPI, bitcoinCoreClient, alice, interBtcToIssue, charlie_stash.address);
        const aliceInterBTCAfter = await tokensAPI.balance(InterBtc, aliceAccountId);
        assert.equal(
            aliceInterBTCBefore.add(interBtcToIssue).sub(feesToPay).toString(),
            aliceInterBTCAfter.toString(),
            "Issued amount is different from the requested amount"
        );
        const totalIssuance = await tokensAPI.total(InterBtc);
        assert.equal(totalIssuance.toString(), interBtcToIssue.toString());
        const vaultIssuedAmount = await vaultsAPI.getIssuedAmount(newAccountId(api, charlie_stash.address));
        assert.equal(vaultIssuedAmount.toString(), interBtcToIssue.toString());
    });

    it("should redeem 0.05 InterBtc", async () => {
        const interBtcToRedeem = InterBtcAmount.from.BTC(0.05);
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        await redeemAPI.request(interBtcToRedeem, redeemAddress);
    });
});
