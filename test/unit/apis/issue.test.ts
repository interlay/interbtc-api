import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { H256, Hash } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { GenericAccountId } from "@polkadot/types/generic";
import { H256Le, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { DefaultIssueAPI } from "../../../src/apis/issue";
import { createPolkadotAPI } from "../../../src/factory";
import * as DefaultVaultsAPI from "../../../src/apis/vaults";
import { ImportMock } from "ts-mock-imports";
import { Keyring } from "@polkadot/api";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { ISubmittableResult } from "@polkadot/types/types";

export type RequestResult = { hash: Hash; vault: Vault };

function printEvents(testType: string, events: EventRecord[]) {
    console.log(`${testType} events:`);
    events.forEach(({ phase, event: { data, method, section, meta } }) => {
        console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
        // console.log(meta.documentation);
    });
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let keyring: Keyring;
    const delayMs: number = 18000;

    // alice is the root account
    let alice: KeyringPair;
    const registry: TypeRegistry = new TypeRegistry();
    const defaultEndpoint = "ws://127.0.0.1:9944";
    const randomDecodedAccountId = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
    let events: EventRecord[] = [];

    function txCallback(unsubscribe: any, result: ISubmittableResult) {
        if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
        } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
            events = result.events;
            unsubscribe();
        }
    }

    describe.skip("exchangeRateOracle", () => {

        it("should setExchangeRate", async () => {
            api = await createPolkadotAPI(defaultEndpoint);
            keyring = new Keyring({ type: "sr25519" });

            const bob = keyring.addFromUri("//Bob");
            const alice = keyring.addFromUri("//Alice");

            let unsubscribe: any = await api.tx.exchangeRateOracle.setExchangeRate(20)
                .signAndSend(bob, (result) => txCallback(unsubscribe, result));
            await delay(delayMs);
            printEvents("setExchangeRate", events);

            const bobBTCAddress = "BF3408F6C0DEC0879F7C1D4D0A5E8813FC0DB569";
            unsubscribe = await api.tx.vaultRegistry.registerVault(100, bobBTCAddress)
                .signAndSend(bob, (result) => txCallback(unsubscribe, result));
            await delay(delayMs);
            printEvents("registerVault", events);
        });

    });

    describe.skip("request", () => {
        beforeEach(async () => {
            api = await createPolkadotAPI(defaultEndpoint);
            issueAPI = new DefaultIssueAPI(api);
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
        let issueAPI: DefaultIssueAPI;

        beforeEach(async () => {
            api = await createPolkadotAPI(defaultEndpoint);
            keyring = new Keyring({ type: "sr25519" });

            // Alice is also the root account
            alice = keyring.addFromUri("//Alice");
            const mockManager = ImportMock.mockClass(DefaultVaultsAPI, "DefaultVaultsAPI");
            mockManager.mock("selectRandomVault", <Vault>{
                id: new GenericAccountId(registry, randomDecodedAccountId),
            });
            issueAPI = new DefaultIssueAPI(api);
        });

        afterEach(() => {
            return api.disconnect();
        });

        it("should fail if no account is set", () => {
            const issueId: H256 = <H256>{};
            const txId: H256Le = <H256Le>{};
            const txBlockHeight: u32 = <u32>{};
            const merkleProof: Bytes = <Bytes>{};
            const rawTx: Bytes = <Bytes>{};
            assert.isRejected(issueAPI.execute(issueId, txId, txBlockHeight, merkleProof, rawTx));
        });

        it("should request if account is set", async () => {
            issueAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 10);
            await issueAPI.request(amount);
            await delay(delayMs);
            printEvents("requestIssue", issueAPI.events);
        });

        it("should send 'executeIssue' transaction after obtaining 'requestIssue' response", async () => {
            // The test does not check for the succesful termination of 'execute'.
            // Instead, it checks that the API call can be bundled into a transaction
            // and published on-chain without any errors being thrown.
            issueAPI.setAccount(alice);
            const requestHash: H256 = issueAPI.requestHash;
            const txId: H256Le = requestHash;
            const txBlockHeight: u32 = new UInt(registry, 1);
            const merkleProof: Bytes = <Bytes>{};
            const rawTx: Bytes = <Bytes>{};
            await issueAPI.execute(requestHash, txId, txBlockHeight, merkleProof, rawTx);
            await delay(delayMs);
            printEvents("executeIssue", issueAPI.events);
        });
    });



    describe.skip("cancel", () => {
        let api: ApiPromise;
        let issueAPI: DefaultIssueAPI;

        beforeEach(async () => {
            api = await createPolkadotAPI(defaultEndpoint);
            keyring = new Keyring({ type: "sr25519" });

            // Alice is also the root account
            alice = keyring.addFromUri("//Alice");
            const mockManager = ImportMock.mockClass(DefaultVaultsAPI, "DefaultVaultsAPI");
            mockManager.mock("selectRandomVault", <Vault>{
                id: new GenericAccountId(registry, randomDecodedAccountId),
            });
            issueAPI = new DefaultIssueAPI(api);
        });

        it("should cancel a request", async () => {
            issueAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 11);
            await issueAPI.request(amount);
            await delay(delayMs);
            printEvents("requestIssue", issueAPI.events);

            // delay the sending of the cancel transaction so that the
            // request transaction propagates and Error: 1014 does not occur
            await issueAPI.cancel(issueAPI.requestHash);
            await delay(delayMs);
            printEvents("cancelIssueRequest", issueAPI.events);
        });
    });
});
