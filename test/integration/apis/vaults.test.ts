import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultVaultsAPI } from "../../../src/apis/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import { PolkaBTC, Vault } from "../../../src/interfaces/default";
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

    it("should getIssuedPolkaBTCAmount", async () => {
        sinon.stub(vaultsAPI, "get").returns(Promise.resolve(<Vault>{ issued_tokens: new BN(100) as PolkaBTC }));
        const vaultId = <AccountId>{};
        const issuedPolkaBTCAmount: PolkaBTC = await vaultsAPI.getIssuedPolkaBTCAmount(vaultId);
        assert.equal(issuedPolkaBTCAmount.toNumber(), 100);
    });

    it("should compute totalIssuedPolkaBTCAmount with nonzero sum", async () => {
        const mockIssuedPolkaBTCAmount: PolkaBTC[] = [1, 2, 3].map((x) => numberToPolkaBTC(x));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedPolkaBTCAmounts").returns(Promise.resolve(mockIssuedPolkaBTCAmount));
        const totalIssuedPolkaBTCAmount: BN = await vaultsAPI.getTotalIssuedPolkaBTCAmount();
        assert.equal(totalIssuedPolkaBTCAmount.toNumber(), 6);
    });

    it("should compute totalIssuedPolkaBTCAmount with zero sum", async () => {
        const mockIssuedPolkaBTCAmount: PolkaBTC[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sinon.stub(vaultsAPI, <any>"getIssuedPolkaBTCAmounts").returns(Promise.resolve(mockIssuedPolkaBTCAmount));
        const totalIssuedPolkaBTCAmount = await vaultsAPI.getTotalIssuedPolkaBTCAmount();
        assert.equal(totalIssuedPolkaBTCAmount.toNumber(), 0);
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
