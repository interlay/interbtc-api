import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
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
    btcToSat, 
    TreasuryAPI
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
    let bitcoinCoreClient: BitcoinCoreClient;
    let keyring: Keyring;

    let alice: KeyringPair;
    let bob: KeyringPair;
    let dave: KeyringPair;

    function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    before(async function () {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        // Alice is also the root account
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");
        dave = keyring.addFromUri("//Dave");

        electrsAPI = new DefaultElectrsAPI("http://0.0.0.0:3002");
        bitcoinCoreClient = new BitcoinCoreClient("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
        issueAPI = new DefaultIssueAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        redeemAPI = new DefaultRedeemAPI(api, bitcoinjs.networks.regtest, electrsAPI, alice);
        oracleAPI = new DefaultOracleAPI(api, bob);
        treasuryAPI = new DefaultTreasuryAPI(api, alice);

        // Sleep for 30 sec to wait for vaults to register
        await sleep(30 * 1000);
    });

    after(async () => {
        api.disconnect();
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
        await issue(api, electrsAPI, bitcoinCoreClient, alice, polkaBtcToIssue, dave.address);
        const aliceAccountId = api.createType("AccountId", alice.address);
        const alicePolkaBTC = await treasuryAPI.balance(aliceAccountId);
        assert.equal(polkaBtcToIssue.toString(), alicePolkaBTC.toString(), "Issued amount is different from the requested amount");
    });

    it("should redeem 0.05 PolkaBTC", async () => {
        const polkaSatToRedeem = api.createType("Balance", btcToSat("0.05"));
        const redeemAddress = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
        const daveAccountId = api.createType("AccountId", dave.address);
        await redeemAPI.request(polkaSatToRedeem, redeemAddress, daveAccountId);
    });
});
