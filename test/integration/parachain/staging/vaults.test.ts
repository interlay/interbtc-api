import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultVaultsAPI } from "../../../../src/parachain/vaults";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoinjs from "bitcoinjs-lib";
import Big from "big.js";
import { TypeRegistry } from "@polkadot/types";

describe("vaultsAPI", () => {
    let ferdie_stash: KeyringPair;
    let charlie_stash: KeyringPair;
    let dave_stash: KeyringPair;
    let eve_stash: KeyringPair;
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;
    const registry = new TypeRegistry();

    before(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        const keyring = new Keyring({ type: "sr25519" });
        charlie_stash = keyring.addFromUri("//Charlie//stash");
        dave_stash = keyring.addFromUri("//Dave//stash");
        eve_stash = keyring.addFromUri("//Eve//stash");
        ferdie_stash = keyring.addFromUri("//Ferdie//stash");
    });

    beforeEach(async () => {
        vaultsAPI = new DefaultVaultsAPI(api, bitcoinjs.networks.regtest);
    });

    after(() => {
        return api.disconnect();
    });

    function vaultIsATestVault(vaultAddress: string): boolean {
        return vaultAddress === dave_stash.address ||
                vaultAddress === charlie_stash.address ||
                vaultAddress === eve_stash.address ||
                vaultAddress === ferdie_stash.address;
    }

    it("should get issuable", async () => {
        const issuablePolkaBTC = await vaultsAPI.getIssuablePolkaBTC();
        const issuablePolkaBTCBig = new Big(issuablePolkaBTC);
        const minIssuablePolkaBTC = new Big(1);
        assert.isTrue(issuablePolkaBTCBig.gte(minIssuablePolkaBTC));
    });

    it("should select random vault for issue", async () => {
        const polkaBTCCollateral = api.createType("Balance", 0);
        const randomVault = await vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for issuing is found", async () => {
        const polkaBTCCollateral = api.createType("Balance", 90000000000);
        assert.isRejected(vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral));
    });

    it("should select random vault for redeem", async () => {
        const polkaBTCCollateral = api.createType("Balance", 0);
        const randomVault = await vaultsAPI.selectRandomVaultRedeem(polkaBTCCollateral);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for redeeming is found", async () => {
        const polkaBTCCollateral = api.createType("Balance", 90000000000);
        assert.isRejected(vaultsAPI.selectRandomVaultRedeem(polkaBTCCollateral));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        const charlieId = api.createType("AccountId", charlie_stash.address);
        assert.isRejected(vaultsAPI.getVaultCollateralization(charlieId));
    });

    it("should fail to get total collateralization when no tokens are issued", async () => {
        assert.isRejected(vaultsAPI.getSystemCollateralization());
    });

    it("should get vault theft flag", async () => {
        const bobId = api.createType("AccountId", ferdie_stash.address);
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
        const bobId = api.createType("AccountId", ferdie_stash.address);
        const issueRequests = await vaultsAPI.mapIssueRequests(bobId);
        issueRequests.forEach((request) => {
            assert.deepEqual(request.vault, bobId);
        });
    });

    it("should list redeem request by a vault", async () => {
        const bobId = api.createType("AccountId", ferdie_stash.address);
        const redeemRequests = await vaultsAPI.mapRedeemRequests(bobId);
        redeemRequests.forEach((request) => {
            assert.deepEqual(request.vault, bobId);
        });
    });

    it("should list replace request by a vault", async () => {
        const bobId = api.createType("AccountId", ferdie_stash.address);
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
            const sla = await vaultsAPI.getSLA(registry.createType("AccountId", charlie_stash.address));
            assert.isString(sla);
        });
    });

    describe("fees", () => {
        it("should getFees", async () => {
            const feesPolkaBTC = await vaultsAPI.getFeesIssuing(registry.createType("AccountId", charlie_stash.address));
            const feesDOT = await vaultsAPI.getFeesBacking(registry.createType("AccountId", charlie_stash.address));
            const benchmarkFees = new Big("0");
            assert.isTrue(new Big(feesPolkaBTC).gte(benchmarkFees));
            assert.isTrue(new Big(feesDOT).gte(benchmarkFees));
        });

        it("should getAPY", async () => {
            const apy = await vaultsAPI.getAPY(registry.createType("AccountId", charlie_stash.address));
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
