import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { TypeRegistry } from "@polkadot/types";
import { UInt } from "@polkadot/types/codec";
import { GenericAccountId } from "@polkadot/types/generic";
import { H256, Hash, AccountId } from "@polkadot/types/interfaces";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { ImportMock } from "ts-mock-imports";
import { DefaultRedeemAPI } from "../../../src/apis/redeem";
import sinon from "sinon";
import * as DefaultVaultsAPI from "../../../src/apis/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import { H256Le, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";

export type RequestResult = { hash: Hash; vault: Vault };

describe.skip("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    const registry: TypeRegistry = new TypeRegistry();
    const randomDecodedAccountId = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
    let requestResult: RequestResult;

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
    });

    beforeEach(() => {
        redeemAPI = new DefaultRedeemAPI(api);
        sinon.stub(redeemAPI, <any>"vaults").get(() => {
            return {
                selectRandomVaultRedeem() {
                    return Promise.resolve({ id: new GenericAccountId(registry, randomDecodedAccountId) });
                },
                get(id: AccountId) {
                    return { id };
                },
            };
        });
    });

    after(() => {
        return api.disconnect();
    });

    describe("request", () => {
        it("should fail if no account is set", () => {
            const amount = api.createType("Balance", 10);
            assert.isRejected(redeemAPI.request(amount, randomDecodedAccountId));
        });

        it("should page listed requests", async () => {
            // requires PolkaBTC to have already been issued
            const bob = keyring.addFromUri("//Bob");
            redeemAPI.setAccount(alice);
            const bobVaultId = api.createType("AccountId", bob.address);
            const sentRequests = 4;
            for (let i = 0; i < sentRequests; i++) {
                const amount = api.createType("Balance", i);
                await redeemAPI.request(amount, randomDecodedAccountId, bobVaultId);
            }

            const listingsPerPage = 2;
            const requestsIterator = redeemAPI.getPagedIterator(listingsPerPage);
            let curr = await requestsIterator.next();
            let requestCount = 0;
            while (!curr.done) {
                requestCount += curr.value.length;
                assert.isTrue(curr.value.length <= listingsPerPage);
                curr = await requestsIterator.next();
            }
            assert.equal(requestCount, sentRequests);
        });
    });

    describe("execute", () => {
        it("should fail if no account is set", () => {
            const redeemId: H256 = <H256>{};
            const txId: H256Le = <H256Le>{};
            const txBlockHeight: u32 = <u32>{};
            const merkleProof: Bytes = <Bytes>{};
            const rawTx: Bytes = <Bytes>{};
            assert.isRejected(redeemAPI.execute(redeemId, txId, txBlockHeight, merkleProof, rawTx));
        });

        it("should request if account is set", async () => {
            redeemAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 10);
            requestResult = await redeemAPI.request(amount, randomDecodedAccountId);
        });

        it("should send 'executeRedeem' transaction after obtaining 'requestRedeem' response", async () => {
            redeemAPI.setAccount(alice);
            const requestHash: H256 = requestResult.hash;
            const txId: H256Le = requestHash;
            const txBlockHeight: u32 = new UInt(registry, 1);
            const merkleProof: Bytes = <Bytes>{};
            const rawTx: Bytes = <Bytes>{};
            const result = await redeemAPI.execute(requestHash, txId, txBlockHeight, merkleProof, rawTx);
            assert.isTrue(result);
        });
    });

    describe("cancel", () => {
        let requestResult: RequestResult;

        it("should cancel a request", async () => {
            redeemAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 11);
            requestResult = await redeemAPI.request(amount, randomDecodedAccountId);
            const result = await redeemAPI.cancel(requestResult.hash);
            // FIXME: assumes redeem request is not expired. Add logic to check if it is expired
            assert.isFalse(result);
        });

        it("should get expired redeem requests", async () => {
            redeemAPI.setAccount(alice);
            const aliceId = api.createType("AccountId", alice.address);

            // FIXME: add expired redeem request for callback to be called
            const redeemExpired = (_redeemId: string) => {
                setTimeout(() => {
                    assert.isTrue(false);
                }, 1000);
            };
            redeemAPI.subscribeToRedeemExpiry(aliceId, redeemExpired);
        });
    });
});
