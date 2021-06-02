import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import * as bitcoinjs from "bitcoinjs-lib";
import { assert } from "chai";
import Big from "big.js";
import BN from "bn.js";
import { AccountId } from "@polkadot/types/interfaces";

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
    DefaultVaultsAPI,
} from "../../../../src";
import { issue } from "../../../../src/utils/issue";
import { DefaultElectrsAPI } from "../../../../src/external/electrs";
import { DefaultIssueAPI } from "../../../../src/parachain/issue";
import { DefaultOracleAPI } from "../../../../src/parachain/oracle";
import { DefaultRedeemAPI } from "../../../../src/parachain/redeem";
import { defaultParachainEndpoint } from "../../../config";
import { DefaultTreasuryAPI } from "../../../../src/parachain/treasury";

describe("Initialize parachain state", () => {
    let api: ApiPromise;
    let issueAPI: IssueAPI;
    let redeemAPI: RedeemAPI;
    let oracleAPI: OracleAPI;
    let electrsAPI: ElectrsAPI;
    let treasuryAPI: TreasuryAPI;
    let btcRelayAPI: BTCRelayAPI;
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    let alice: KeyringPair;
    let bob: KeyringPair;
    let charlie_stash: KeyringPair;

    function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function accountIdFromKeyring(keyPair: KeyringPair): AccountId {
        return api.createType("AccountId", keyPair.address);
    }

    async function waitForRegister(api: DefaultVaultsAPI, accountId: AccountId) {
        while (true) {
            try {
                await api.get(accountId);
                return;
            } catch (_) { }
            await sleep(1000);
        }
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
        btcRelayAPI = new DefaultBTCRelayAPI(api, electrsAPI);

        const vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest);

        // wait for all vaults to register
        await Promise.all([alice, bob, charlie_stash].map(accountIdFromKeyring).map((accountId) => waitForRegister(vaultsAPI, accountId)));
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

    it("should issue 0.1 PolkaBTC", async () => {
        const polkaBtcToIssue = new Big(0.1);
        const feesToPay = await issueAPI.getFeesToPay(polkaBtcToIssue);
        const aliceAccountId = api.createType("AccountId", alice.address);
        const alicePolkaBTCBefore = await treasuryAPI.balance(aliceAccountId);
        await issue(api, electrsAPI, bitcoinCoreClient, alice, polkaBtcToIssue, charlie_stash.address);
        const alicePolkaBTCAfter = await treasuryAPI.balance(aliceAccountId);
        assert.equal(
            alicePolkaBTCBefore.add(polkaBtcToIssue).sub(feesToPay).toString(),
            alicePolkaBTCAfter.toString(),
            "Issued amount is different from the requested amount"
        );
    });

    it("should redeem 0.05 PolkaBTC", async () => {
        const polkaBtcToRedeem = new Big("0.05");
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        const daveAccountId = api.createType("AccountId", charlie_stash.address);
        await redeemAPI.request(polkaBtcToRedeem, redeemAddress, daveAccountId);
    });
});
