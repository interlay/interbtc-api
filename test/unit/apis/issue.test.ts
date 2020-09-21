import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { H256, Hash } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { GenericAccountId } from "@polkadot/types/generic";
import { H256Le, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import IssueAPI from "../../../src/apis/issue";
import { createAPI } from "../../../src/factory";
import * as VaultsAPI from "../../../src/apis/vaults";
import { ImportMock } from 'ts-mock-imports';
import { Keyring } from '@polkadot/api';

export type RequestResult = { hash: Hash; vault: Vault };

describe("issue", () => {
    describe.skip("request", () => {
        let api: ApiPromise;
        let issueAPI: IssueAPI;

        beforeEach(async () => {
            const defaultEndpoint = "ws://127.0.0.1:9944";
            api = await createAPI(defaultEndpoint);
            issueAPI = new IssueAPI(api);
        });

        afterEach(() => {
            return api.disconnect();
        });

        it("should fail if no account is set", () => {
            const amount = api.createType("PolkaBTC", 10);
            assert.isRejected(issueAPI.request(amount));
        });
    });

    describe.skip("execute", () => {
        let api: ApiPromise;
        let issueAPI: IssueAPI;
        let requestResult: RequestResult;
        let alice: KeyringPair;
        let bob: KeyringPair;
        let keyring: Keyring;
        let registry: TypeRegistry;
        

        beforeEach(async () => {
            // api = await createAPI("mock", false);
            const defaultEndpoint = "ws://127.0.0.1:9944";
            api = await createAPI(defaultEndpoint);
            keyring = new Keyring({ type: 'sr25519' });

            // Alice is also the root account
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
            issueAPI = new IssueAPI(api);
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
            assert.isRejected(issueAPI.execute(issueId, txId, txBlockHeight, merkleProof, rawTx));
        });

        it("should request if account is set", async () => {
            issueAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 10);
            requestResult = await issueAPI.request(amount);
        });

        it("should succesfully execute after requesting", async () => {
            issueAPI.setAccount(alice);
            const requestHash: H256 = requestResult.hash;
            const txId: H256Le = requestHash;
            const txBlockHeight: u32 = new UInt (registry, 1);
            const merkleProof: Bytes = <Bytes> {};
            const rawTx: Bytes = <Bytes> {};
            await issueAPI.execute(requestHash, txId, txBlockHeight, merkleProof, rawTx);
        });

    });

    describe.skip("cancel", () => { 
        let api: ApiPromise;
        let issueAPI: IssueAPI;
        let requestResult: RequestResult;
        let alice: KeyringPair;
        let bob: KeyringPair;
        let keyring: Keyring;
        let registry: TypeRegistry;

        beforeEach(async () => {
            const defaultEndpoint = "ws://127.0.0.1:9944";
            api = await createAPI(defaultEndpoint);
            keyring = new Keyring({ type: 'sr25519' });

            // Alice is also the root account
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
            issueAPI = new IssueAPI(api);
        });
        
        it("should cancel a request", async () => {
            issueAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 11);
            requestResult = await issueAPI.request(amount);
            await issueAPI.cancel(requestResult.hash);
        });
    });
});
