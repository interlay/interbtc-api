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
} from "../../../../src";
import { issueSingle } from "../../../../src/utils/issue";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI } from "../../../../src/parachain/issue";
import { DefaultOracleAPI } from "../../../../src/parachain/oracle";
import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { defaultParachainEndpoint } from "../../../config";
import { DefaultTreasuryAPI } from "../../../../src/parachain/treasury";

describe.only("Initialize parachain state", () => {
    let api: ApiPromise;
    let issueAPI: IssueAPI;
    let redeemAPI: RedeemAPI;
    let oracleAPI: OracleAPI;
    let electrsAPI: ElectrsAPI;
    let treasuryAPI: TreasuryAPI;
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
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");
        charlie_stash = keyring.addFromUri("//Charlie//stash");

        electrsAPI = new DefaultElectrsAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        oracleAPI = new DefaultOracleAPI(api, bob);
        treasuryAPI = new DefaultTreasuryAPI(api, alice);
        nominationAPI = new DefaultNominationAPI(api, bitcoinjs.networks.regtest, alice);
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);

        // Sleep for 2 min to wait for vaults to register
        await sleep(2 * 60 * 1000);
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

        await bitcoinCoreClient.mineBlocksWithoutDelay(10);
    });

    it("should set the issue and redeem periods", async () => {
        const issuePeriodToSet = 50;
        const redeemPeriodToSet = 50;
        await issueAPI.setIssuePeriod(50);
        const issuePeriod = await issueAPI.getIssuePeriod();
        assert.equal(issuePeriodToSet, issuePeriod, "Setting the issue period failed");

        await redeemAPI.setRedeemPeriod(50);
        const redeemPeriod = await redeemAPI.getRedeemPeriod();
        assert.equal(redeemPeriodToSet, redeemPeriod, "Setting the redeem period failed");
    });

    it("should set the exchange rate", async () => {
        const exchangeRateToSet = "3855.23187";
        await oracleAPI.setExchangeRate(exchangeRateToSet);
        const exchangeRate = await oracleAPI.getExchangeRate();
        assert.equal(exchangeRateToSet, exchangeRate.toString());
    });

    it("should enable vault nomination", async () => {
        await nominationAPI.setNominationEnabled(true);
        const isNominationEnabled = await nominationAPI.isNominationEnabled();
        assert.isTrue(isNominationEnabled);
    });

    it("should issue 0.1 InterBTC", async () => {
        const interBtcToIssue = new Big(0.1);
        const feesToPay = await issueAPI.getFeesToPay(interBtcToIssue);
        const aliceAccountId = api.createType("AccountId", alice.address);
        const aliceInterBTCBefore = await treasuryAPI.balance(aliceAccountId);
        await issueSingle(api, electrsAPI, bitcoinCoreClient, alice, interBtcToIssue, charlie_stash.address);
        const aliceInterBTCAfter = await treasuryAPI.balance(aliceAccountId);
        assert.equal(
            aliceInterBTCBefore.add(interBtcToIssue).sub(feesToPay).toString(),
            aliceInterBTCAfter.toString(),
            "Issued amount is different from the requested amount"
        );
    });

    it("should redeem 0.05 InterBTC", async () => {
        const interBtcToRedeem = new Big("0.05");
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        await redeemAPI.request(interBtcToRedeem, redeemAddress);
    });
});
