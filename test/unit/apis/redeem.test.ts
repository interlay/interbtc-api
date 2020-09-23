import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { H256, Hash } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { GenericAccountId } from "@polkadot/types/generic";
import { H256Le, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import RedeemAPI from "../../../src/apis/redeem";
import { createAPI } from "../../../src/factory";
import * as VaultsAPI from "../../../src/apis/vaults";
import { ImportMock } from 'ts-mock-imports';
import { Keyring } from '@polkadot/api';

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: RedeemAPI;
    let api: ApiPromise;
    let keyring: Keyring; 
    // alice is the root account
    let alice: KeyringPair;
    const registry: TypeRegistry = new TypeRegistry();
    const defaultEndpoint = "ws://127.0.0.1:9944";
    const randomDecodedAccountId = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
    let requestResult: RequestResult;

    describe("request", () => {

        beforeEach(async () => {
            api = await createAPI(defaultEndpoint);
            redeemAPI = new RedeemAPI(api);
        });

        it("should fail if no account is set", () => {
            const amount = api.createType("PolkaBTC", 10);
            assert.isRejected(redeemAPI.request(amount, randomDecodedAccountId));
        });
    });

    describe("execute", () => {

        beforeEach(async () => {
            api = await createAPI(defaultEndpoint);
            keyring = new Keyring({ type: 'sr25519' });
            alice = keyring.addFromUri("//Alice");
            let mockManager = ImportMock.mockClass(VaultsAPI);
            mockManager.mock("selectRandomVault", <Vault> { 
                id: new GenericAccountId(registry, randomDecodedAccountId) 
            });
            redeemAPI = new RedeemAPI(api);
        });

        afterEach(() => {
            return api.disconnect();
        });

        it("should fail if no account is set", () => {
            const issueId: H256 = <H256> {};
            const txId: H256Le = <H256Le> {};
            const txBlockHeight: u32 = <u32> {};
            const merkleProof: Bytes = <Bytes> {};
            const rawTx: Bytes = <Bytes> {};
            assert.isRejected(redeemAPI.execute(issueId, txId, txBlockHeight, merkleProof, rawTx));
        });

        it("should request if account is set", async () => {
            redeemAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 10);
            requestResult = await redeemAPI.request(amount, randomDecodedAccountId);
        });

        it("should send 'executeIssue' transaction after obtaining 'requestIssue' response", async () => {
            // The test does not check for the succesful termination of 'execute'.
            // Instead, it checks that the API call can be bundled into a transaction
            // and published on-chain without any errors being thrown.
            redeemAPI.setAccount(alice);
            const requestHash: H256 = requestResult.hash;
            const txId: H256Le = requestHash;
            const txBlockHeight: u32 = new UInt (registry, 1);
            const merkleProof: Bytes = <Bytes> {};
            const rawTx: Bytes = <Bytes> {};
            await redeemAPI.execute(requestHash, txId, txBlockHeight, merkleProof, rawTx);
        });

    });

    function delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    describe("cancel", () => { 
        let api: ApiPromise;
        let redeemAPI: RedeemAPI;
        let requestResult: RequestResult;
        let alice: KeyringPair;
        let bob: KeyringPair;
        let keyring: Keyring;
        let registry: TypeRegistry;

        beforeEach(async () => {
            api = await createAPI(defaultEndpoint);
            keyring = new Keyring({ type: 'sr25519' });
            alice = keyring.addFromUri("//Alice");
            bob = keyring.addFromUri("//Bob");
            registry = new TypeRegistry();
            let decodedAccountId = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
            let mockManager = ImportMock.mockClass(VaultsAPI);
            mockManager.mock("selectRandomVault", <Vault> { id:
                new GenericAccountId(
                    registry, 
                    decodedAccountId
                ) 
            });
            redeemAPI = new RedeemAPI(api);
        });

        afterEach(() => {
            return api.disconnect();
        });
        
        it("should cancel a request", async () => {
            redeemAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 11);
            requestResult = await redeemAPI.request(amount, randomDecodedAccountId);

            // delay the sending of the cancel transaction so that the
            // request transaction propagates and Error: 1014 does not occur
            await delay(7000);
            await redeemAPI.cancel(requestResult.hash);
        });
    });
});
