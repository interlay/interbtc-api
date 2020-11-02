import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import BN from "bn.js";
import { DefaultVaultsAPI } from "../../../src/apis/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import { PolkaBTC } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";

describe("vaultsAPI", () => {
    let bob: KeyringPair;
    let charlie: KeyringPair;
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;

    function numberToPolkaBTC(x: number): PolkaBTC {
        return new BN(x) as PolkaBTC;
    }

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
        charlie = keyring.addFromUri("//Charlie");
    });

    beforeEach(async () => {
        vaultsAPI = new DefaultVaultsAPI(api);
    });

    after(() => {
        return api.disconnect();
    });

    it("should select random vault for issue", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 0);
        const randomVault = await vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral);
        assert.equal(randomVault.toHuman(), bob.address);
    });

    it("should fail if no vault for issuing is found", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 90000000000);
        assert.isRejected(vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral));
    });

    it("should select random vault for redeem", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 0);
        const randomVault = await vaultsAPI.selectRandomVaultRedeem(polkaBTCCollateral);
        assert.equal(randomVault.toHuman(), bob.address);
    });

    it("should fail if no vault for redeeming is found", async () => {
        const polkaBTCCollateral = api.createType("PolkaBTC", 90000000000);
        assert.isRejected(vaultsAPI.selectRandomVaultRedeem(polkaBTCCollateral));
    });

    it("should fail to get vault collateralization for vault with zero collateral", async () => {
        const charlieId = api.createType("AccountId", charlie.address);
        assert.isRejected(vaultsAPI.getCollateralization(charlieId));
    });
    j
    it("should fail to get total collateralization when no tokens are issued", async () => {
        assert.isRejected(vaultsAPI.getTotalCollateralization());
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
});
