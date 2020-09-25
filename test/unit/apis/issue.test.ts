import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { H256, Hash } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { H256Le, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { DefaultIssueAPI } from "../../../src/apis/issue";
import { createPolkadotAPI } from "../../../src/factory";
import { Keyring } from "@polkadot/api";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ISubmittableResult } from "@polkadot/types/types";

export type RequestResult = { hash: Hash; vault: Vault };


function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let keyring: Keyring;
    const delayMs: number = 25000;

    // alice is the root account
    let alice: KeyringPair;
    let bob: KeyringPair;
    const registry: TypeRegistry = new TypeRegistry();
    const defaultEndpoint = "ws://127.0.0.1:9944";
    let events: EventRecord[] = [];

    function txCallback(unsubscribe: any, result: ISubmittableResult) {
        if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
            events = result.events;
            unsubscribe();
        }
    }

    function printEvents(testType: string, events: EventRecord[]) {
        console.log(`\n${testType} events:`);

        let foundErrorEvent = false;
        events.forEach(({ event }) => {
            event.data.forEach(async (eventData: any) => {
                if (eventData.isModule) {
                    try {
                        const parsedEventData = eventData as DispatchError;
                        const decoded = await api.registry.findMetaError(parsedEventData.asModule);
                        const { documentation, name, section } = decoded;
                        if (documentation) {
                            console.log(`\t${section}.${name}: ${documentation.join(" ")}`);
                        } else {
                            console.log(`\t${section}.${name}`);
                        }
                        foundErrorEvent = true;
                    } catch (err) {
                        console.log("\tCould not find transaction failure details.");
                    }

                }
            });
        });

        if (!foundErrorEvent) {
            events.forEach(({ phase, event: { data, method, section } }) => {
                console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            });
        }
    }

    describe.skip("exchangeRateOracle", () => {
        it("should setExchangeRate", async () => {
            api = await createPolkadotAPI(defaultEndpoint);
            keyring = new Keyring({ type: "sr25519" });
            bob = keyring.addFromUri("//Bob");
            console.log("bob.address:");
            console.log(bob.address);

            let unsubscribe: any = await api.tx.exchangeRateOracle.setExchangeRate(1)
                .signAndSend(bob, (result) => txCallback(unsubscribe, result));
            await delay(delayMs);
            printEvents("setExchangeRate", events);

            const bobBTCAddress = "BF3408F6C0DEC0879F7C1D4D0A5E8813FC0DB569";
            unsubscribe = await api.tx.vaultRegistry.registerVault(6, bobBTCAddress)
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
            console.log("alice.address:");
            console.log(alice.address);

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
            const amount = api.createType("PolkaBTC", 1);
            const bobVaultId = api.createType("AccountId", bob.address);
            await issueAPI.request(amount, bobVaultId);
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
            issueAPI = new DefaultIssueAPI(api);
        });

        it("should cancel a request", async () => {
            issueAPI.setAccount(alice);
            const amount = api.createType("PolkaBTC", 1);
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
