import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultVaultsAPI } from "../../../src/parachain/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import { assert } from "../../chai";
import { defaultParachainEndpoint } from "../../config";
import * as bitcoin from "bitcoinjs-lib";
import Big from "big.js";

describe("vaultsAPI", () => {
    let bob: KeyringPair;
    let charlie: KeyringPair;
    let dave: KeyringPair;
    let eve: KeyringPair;
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;

    before(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
        charlie = keyring.addFromUri("//Charlie");
        dave = keyring.addFromUri("//Dave");
        eve = keyring.addFromUri("//Eve");
    });

    beforeEach(async () => {
        vaultsAPI = new DefaultVaultsAPI(api, bitcoin.networks.regtest);
    });

    after(() => {
        return api.disconnect();
    });

    it("should getIssuablePolkaBTC", async () => {
        const issuablePolkaBTC = await vaultsAPI.getIssuablePolkaBTC();
        const issuablePolkaBTCBig = new Big(issuablePolkaBTC);
        const minIssuablePolkaBTC = new Big(1);
        assert.isTrue(issuablePolkaBTCBig.gte(minIssuablePolkaBTC));
    });

    it("should select random vault for issue", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 0);
        const randomVault = await vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral);
        assert.isTrue(
            randomVault.toHuman() === dave.address ||
            randomVault.toHuman() === charlie.address ||
            randomVault.toHuman() === eve.address
        );
    });

    it("should fail if no vault for issuing is found", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 90000000000);
        assert.isRejected(vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral));
    });

    it("should select random vault for redeem", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 0);
        const randomVault = await vaultsAPI.selectRandomVaultRedeem(polkaBTCCollateral);
        assert.isTrue(
            randomVault.toHuman() === dave.address ||
            randomVault.toHuman() === charlie.address ||
            randomVault.toHuman() === eve.address
        );
    });

    it("should fail if no vault for redeeming is found", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 90000000000);
        assert.isRejected(vaultsAPI.selectRandomVaultRedeem(polkaBTCCollateral));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        const charlieId = api.createType("AccountId", charlie.address);
        assert.isRejected(vaultsAPI.getVaultCollateralization(charlieId));
    });

    it("should fail to get total collateralization when no tokens are issued", async () => {
        assert.isRejected(vaultsAPI.getSystemCollateralization());
    });

    it("should get vault theft flag", async () => {
        const bobId = api.createType("AccountId", bob.address);
        const flaggedForTheft = await vaultsAPI.isVaultFlaggedForTheft(bobId);
        assert.isTrue(flaggedForTheft);
    });

    it("should page listed requests", async () => {
        const listingsPerPage = 2;
        const requestsIterator = vaultsAPI.getPagedIterator(listingsPerPage);
        let curr = await requestsIterator.next();
        while (!curr.done) {
            assert.isTrue(curr.value.length <= listingsPerPage);
            curr = await requestsIterator.next();
        }
    });

    it("should list issue request by a vault", async () => {
        const bobId = api.createType("AccountId", bob.address);
        const issueRequests = await vaultsAPI.mapIssueRequests(bobId);
        issueRequests.forEach((request) => {
            assert.deepEqual(request.vault, bobId);
        });
    });

    it("should list redeem request by a vault", async () => {
        const bobId = api.createType("AccountId", bob.address);
        const redeemRequests = await vaultsAPI.mapRedeemRequests(bobId);
        redeemRequests.forEach((request) => {
            assert.deepEqual(request.vault, bobId);
        });
    });

    it("should list replace request by a vault", async () => {
        const bobId = api.createType("AccountId", bob.address);
        const replaceRequests = await vaultsAPI.mapReplaceRequests(bobId);
        replaceRequests.forEach((request) => {
            assert.deepEqual(request.old_vault, bobId);
        });
    });

    it("should get the issuable PolkaBTC", async () => {
        const issuablePolkaBtc = await vaultsAPI.getIssuablePolkaBTC();
        const issuablePolkaBtcU128 = api.createType("u128", issuablePolkaBtc);
        const zeroU128 = api.createType("u128", 0);
        assert.isTrue(issuablePolkaBtcU128.gt(zeroU128));
    });

    describe("sla", () => {
        it("should getMaxSLA", async () => {
            const sla = await vaultsAPI.getMaxSLA();
            assert.equal(sla, "100");
        });

        it("should get SLA", async () => {
            const sla = await vaultsAPI.getSLA(charlie.address);
            assert.isString(sla);
        });
    });

    describe("fees", () => {
        it("should getFees", async () => {
            const feesPolkaBTC = await vaultsAPI.getFeesPolkaBTC(charlie.address);
            const feesDOT = await vaultsAPI.getFeesDOT(charlie.address);
            const benchmarkFees = new Big("0");
            assert.isTrue(new Big(feesPolkaBTC).gte(benchmarkFees));
            assert.isTrue(new Big(feesDOT).gte(benchmarkFees));
        });

        it("should getAPY", async () => {
            const apy = await vaultsAPI.getAPY(charlie.address);
            const apyBig = new Big(apy);
            const apyBenchmark = new Big("0");
            assert.isTrue(apyBig.gte(apyBenchmark));
        });

        it("should getPunishmentFee", async () => {
            const punishmentFee = await vaultsAPI.getPunishmentFee();
            assert.equal(punishmentFee, "0.1");
        });
    });
});
