import { PolkaBTC, Vault } from "../../../src/interfaces/default";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { assert } from "../../chai";
import { DefaultVaultsAPI } from "../../../src/apis/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import BN from "bn.js";
import sinon from "sinon";
import { sendLoggedTx } from "../../../src/utils";


function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("vaultsAPI", () => {
    let keyring: Keyring;
    let bob: KeyringPair;
    let charlie: KeyringPair;
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;
    const defaultEndpoint = "ws://127.0.0.1:9944";
    const delayMs = 25000;

    function numberToPolkaBTC(x: number): PolkaBTC {
        return new BN(x) as PolkaBTC;
    }

    describe.skip("exchangeRateOracle", () => {
        it("should setExchangeRate", async () => {
            api = await createPolkadotAPI(defaultEndpoint);
            keyring = new Keyring({ type: "sr25519" });
            bob = keyring.addFromUri("//Bob");
            charlie = keyring.addFromUri("//Charlie");

            const exchangeRateTx = api.tx.exchangeRateOracle.setExchangeRate(1);
            await sendLoggedTx(exchangeRateTx, bob, api);

            const bobBTCAddress = "BF3408F6C0DEC0879F7C1D4D0A5E8813FC0DB569";
            const registerBobVaultTx = api.tx.vaultRegistry.registerVault(10, bobBTCAddress);
            await sendLoggedTx(registerBobVaultTx, bob, api);

            const charlieBTCAddress = "66c7060feb882664ae62ffad0051fe843e318e85";
            const registerCharlieVaultTx = api.tx.vaultRegistry.registerVault(0, charlieBTCAddress);
            await sendLoggedTx(registerCharlieVaultTx, charlie, api);
        });
    });

    describe.skip("request", () => {

        beforeEach(async () => {
            api = await createPolkadotAPI(defaultEndpoint);
            vaultsAPI = new DefaultVaultsAPI(api);
        });

        afterEach(() => {
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
            const polkaBTCCollateral = api.createType("Balance", 0);
            const randomVault = await vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral);
            assert.equal(randomVault.toHuman(), bob.address);
        });

        it("should fail if no vault for issuing is found", async () => {
            const polkaBTCCollateral = api.createType("Balance", 90000000000);
            assert.isRejected(vaultsAPI.selectRandomVaultIssue(polkaBTCCollateral));
        });

        it("should select random vault for redeem", async () => {
            const polkaBTCCollateral = api.createType("Balance", 0);
            const randomVault = await vaultsAPI.selectRandomVaultRedeem(polkaBTCCollateral);
            assert.equal(randomVault.toHuman(), bob.address);
        });

        it("should fail if no vault for redeeming is found", async () => {
            const polkaBTCCollateral = api.createType("Balance", 90000000000);
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
});
