import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import { assert } from "chai";
import Big from "big.js";
import BN from "bn.js";

import {
    IssueAPI,
    ElectrsAPI,
    BitcoinCoreClient,
    createPolkadotAPI,
    OracleAPI,
    RedeemAPI,
    TreasuryAPI,
    BTCRelayAPI,
    DefaultBTCRelayAPI,
    setNumericStorage,
    NominationAPI,
    DefaultNominationAPI,
    VaultsAPI,
    DefaultVaultsAPI,
    newAccountId,
    REGTEST_ESPLORA_BASE_PATH,
} from "../../../../src";
import { issueSingle } from "../../../../src/utils/";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI } from "../../../../src/parachain/issue";
import { DefaultOracleAPI } from "../../../../src/parachain/oracle";
import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { 
    DEFAULT_BITCOIN_CORE_HOST,
    DEFAULT_BITCOIN_CORE_NETWORK,
    DEFAULT_BITCOIN_CORE_PASSWORD,
    DEFAULT_BITCOIN_CORE_PORT,
    DEFAULT_BITCOIN_CORE_USERNAME,
    DEFAULT_BITCOIN_CORE_WALLET,
    DEFAULT_PARACHAIN_ENDPOINT
} from "../../../config";
import { DefaultTreasuryAPI } from "../../../../src/parachain/treasury";

describe("Initialize parachain state", () => {
    let api: ApiPromise;
    let issueAPI: IssueAPI;
    let redeemAPI: RedeemAPI;
    let oracleAPI: OracleAPI;
    let electrsAPI: ElectrsAPI;
    let treasuryAPI: TreasuryAPI;
    let vaultsAPI: VaultsAPI;
    let nominationAPI: NominationAPI;
    let btcRelayAPI: BTCRelayAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    let alice: KeyringPair;
    let bob: KeyringPair;
    let charlie_stash: KeyringPair;

    function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    before(async function () {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");
        charlie_stash = keyring.addFromUri("//Charlie//stash");

        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        bitcoinCoreClient = new BitcoinCoreClient(
            DEFAULT_BITCOIN_CORE_NETWORK,
            DEFAULT_BITCOIN_CORE_HOST,
            DEFAULT_BITCOIN_CORE_USERNAME,
            DEFAULT_BITCOIN_CORE_PASSWORD,
            DEFAULT_BITCOIN_CORE_PORT,
            DEFAULT_BITCOIN_CORE_WALLET
        );
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        oracleAPI = new DefaultOracleAPI(api, bob);
        treasuryAPI = new DefaultTreasuryAPI(api, alice);
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest, electrsAPI);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);

        // Sleep for 2 min to wait for vaults to register
        // await sleep(2 * 60 * 1000);
    });

    after(async () => {
        api.disconnect();
    });

    it("should set the stable confirmations and ready the Btc Relay", async () => {
        // Speed up the process by only requiring 1 parachain and 1 bitcoin confirmation
        const stableBitcoinConfirmationsToSet = 1;
        const stableParachainConfirmationsToSet = 1;
        await setNumericStorage(api, "BTCRelay", "StableBitcoinConfirmations", new BN(stableBitcoinConfirmationsToSet), issueAPI);
        await setNumericStorage(api, "BTCRelay", "StableParachainConfirmations", new BN(stableParachainConfirmationsToSet), issueAPI);
        const stableBitcoinConfirmations = await btcRelayAPI.getStableBitcoinConfirmations();
        assert.equal(stableBitcoinConfirmationsToSet, stableBitcoinConfirmations, "Setting the Bitcoin confirmations failed");
        const stableParachainConfirmations = await btcRelayAPI.getStableParachainConfirmations();
        assert.equal(stableParachainConfirmationsToSet, stableParachainConfirmations, "Setting the Parachain confirmations failed");

        await bitcoinCoreClient.mineBlocks(3);
    });

    it("should set the exchange rate", async () => {
        const exchangeRateToSet = new Big("3855.23187");
        await oracleAPI.setExchangeRate(exchangeRateToSet);
        const exchangeRate = await oracleAPI.getExchangeRate();
        assert.equal(exchangeRateToSet.toString(), exchangeRate.toString());
    });

    it("should enable vault nomination", async () => {
        await nominationAPI.setNominationEnabled(true);
        const isNominationEnabled = await nominationAPI.isNominationEnabled();
        assert.isTrue(isNominationEnabled);
    });

    it("should issue 0.1 PolkaBTC", async () => {
        const polkaBtcToIssue = new Big(0.1);
        const feesToPay = await issueAPI.getFeesToPay(polkaBtcToIssue);
        const aliceAccountId = api.createType("AccountId", alice.address);
        const alicePolkaBTCBefore = await treasuryAPI.balance(aliceAccountId);
        await issueSingle(api, electrsAPI, bitcoinCoreClient, alice, polkaBtcToIssue, charlie_stash.address);
        const alicePolkaBTCAfter = await treasuryAPI.balance(aliceAccountId);
        assert.equal(
            alicePolkaBTCBefore.add(polkaBtcToIssue).sub(feesToPay).toString(),
            alicePolkaBTCAfter.toString(),
            "Issued amount is different from the requested amount"
        );
        const totalIssuance = await treasuryAPI.total();
        assert.equal(totalIssuance.toString(), polkaBtcToIssue.toString());
        const vaultIssuedAmount = await vaultsAPI.getIssuedAmount(newAccountId(api, charlie_stash.address));
        assert.equal(vaultIssuedAmount.toString(), polkaBtcToIssue.toString());
    });

    it("should redeem 0.05 PolkaBTC", async () => {
        const polkaBtcToRedeem = new Big("0.05");
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        await redeemAPI.request(polkaBtcToRedeem, redeemAddress);
    });
});
