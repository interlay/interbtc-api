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
        const issuableInterBTC = await vaultsAPI.getTotalIssuableAmount();
        const issuableInterBTCBig = new Big(issuableInterBTC);
        const minIssuableInterBTC = new Big(1);
        assert.isTrue(issuableInterBTCBig.gte(minIssuableInterBTC));
    });

    it("should select random vault for issue", async () => {
        const interBTC = new Big(0);
        const randomVault = await vaultsAPI.selectRandomVaultIssue(interBTC);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for issuing is found", async () => {
        const interBTC = new Big(9000000);
        assert.isRejected(vaultsAPI.selectRandomVaultIssue(interBTC));
    });

    it("should select random vault for redeem", async () => {
        const interBTC = new Big(0);
        const randomVault = await vaultsAPI.selectRandomVaultRedeem(interBTC);
        assert.isTrue(vaultIsATestVault(randomVault.toHuman()));
    });

    it("should fail if no vault for redeeming is found", async () => {
        const interBTC = new Big(9000000);
        assert.isRejected(vaultsAPI.selectRandomVaultRedeem(interBTC));
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

    it("should list issue request by a vault", async () => {
        const bobAddress = ferdie_stash.address;
        const bobId = api.createType("AccountId", bobAddress);
        const issueRequests = await vaultsAPI.mapIssueRequests(bobId);
        issueRequests.forEach((request) => {
            assert.deepEqual(request.vaultDOTAddress, bobAddress);
        });
    });

    it("should list redeem request by a vault", async () => {
        const bobAddress = ferdie_stash.address;
        const bobId = api.createType("AccountId", bobAddress);
        const redeemRequests = await vaultsAPI.mapRedeemRequests(bobId);
        redeemRequests.forEach((request) => {
            assert.deepEqual(request.vaultDOTAddress, bobAddress);
        });
    });

    it("should list replace request by a vault", async () => {
        const bobId = api.createType("AccountId", ferdie_stash.address);
        const replaceRequests = await vaultsAPI.mapReplaceRequests(bobId);
        replaceRequests.forEach((request) => {
            assert.deepEqual(request.old_vault, bobId);
        });
    });

    it("should get the issuable InterBTC for a vault", async () => {
        const bobId = api.createType("AccountId", ferdie_stash.address);
        const issuableInterBtc = await vaultsAPI.getIssuableAmount(bobId);
        assert.isTrue(issuableInterBtc.gt(0));
    });

    it("should get the issuable InterBTC", async () => {
        const issuableInterBtc = await vaultsAPI.getTotalIssuableAmount();
        assert.isTrue(issuableInterBtc.gt(0));
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
            const feesInterBTC = await vaultsAPI.getFeesWrapped(registry.createType("AccountId", charlie_stash.address));
            const feesDOT = await vaultsAPI.getFeesCollateral(registry.createType("AccountId", charlie_stash.address));
            const benchmarkFees = new Big("0");
            assert.isTrue(new Big(feesInterBTC).gte(benchmarkFees));
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
