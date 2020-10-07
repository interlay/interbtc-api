import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { H256, Hash } from "@polkadot/types/interfaces";
import { H256Le, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { DefaultIssueAPI } from "../../../src/apis/issue";
import { createPolkadotAPI } from "../../../src/factory";
import { Keyring } from "@polkadot/api";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { ISubmittableResult } from "@polkadot/types/types";
import { ImportMock } from "ts-mock-imports";

export type RequestResult = { hash: Hash; vault: Vault };

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("issue", () => {
    let api: ApiPromise;
    let issueAPI: DefaultIssueAPI;
    let keyring: Keyring;
    const delayMs = 25000;

    // alice is the root account
    let alice: KeyringPair;
    let bob: KeyringPair;
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
                        const decoded = api.registry.findMetaError(parsedEventData.asModule);
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

            let unsubscribe: any = await api.tx.exchangeRateOracle.setExchangeRate(1)
                .signAndSend(bob, (result) => txCallback(unsubscribe, result));
            await delay(delayMs);
            printEvents("setExchangeRate", events);

            const bobBTCAddress = "0xbf3408f6c0dec0879f7c1d4d0a5e8813fc0db569";
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
            const amount = api.createType("Balance", 10);
            assert.isRejected(issueAPI.request(amount));
        });

        it("should page listed requests", async () => {
            keyring = new Keyring({ type: "sr25519" });
            bob = keyring.addFromUri("//Bob");
            alice = keyring.addFromUri("//Alice");
            issueAPI.setAccount(alice);
            const bobVaultId = api.createType("AccountId", bob.address);
            const sentRequests = 3;
            for (let i = 0; i < sentRequests; i++) {
                const amount = api.createType("Balance", i);
                await issueAPI.request(amount, bobVaultId);
            }

            const listingsPerPage = 2;
            let requestCount = 0;
            for await (const page of issueAPI.getPagedIterator(listingsPerPage)) {
                requestCount += page.length;
                assert.isTrue(page.length <= listingsPerPage);
            }
            assert.equal(requestCount, sentRequests);
        });

        it("should retrieve hash from request", async () => {
            keyring = new Keyring({ type: "sr25519" });
            bob = keyring.addFromUri("//Bob");
            alice = keyring.addFromUri("//Alice");
            issueAPI.setAccount(alice);
            const bobVaultId = api.createType("AccountId", bob.address);
            const amount = api.createType("Balance", 1);
            const requestResult = await issueAPI.request(amount, bobVaultId);
            assert.isTrue(requestResult.hash.length > 0);
        });
    });

    describe.skip("execute", () => {
        let txHash: Hash;
        let api: ApiPromise;
        let issueAPI: DefaultIssueAPI;

        beforeEach(async () => {
            keyring = new Keyring({ type: "sr25519" });
            // Alice is also the root account
            alice = keyring.addFromUri("//Alice");
            api = await createPolkadotAPI(defaultEndpoint);
            issueAPI = new DefaultIssueAPI(api);
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
            const amount = api.createType("Balance", 1);
            const bobVaultId = api.createType("AccountId", bob.address);
            const requestResult = await issueAPI.request(amount, bobVaultId);
            txHash = requestResult.hash;
            printEvents("requestIssue", issueAPI.events);
        });

        it("should consider execution successful if `isExecutionSucessful` returns true", async () => {
            const issueId =
                api.createType("H256", "0x81dd458cd3bb82cf68b52dce27a5ac1f616b0278b2f36c4c05bfd528c2e1e8e9");
            const txId: H256Le = api.createType(
                "H256",
                [70, 103, 64, 2, 223, 149, 66, 146, 36, 69, 6, 199, 80, 43, 96, 106, 174, 205, 77, 120, 69, 217,
                    253, 57, 140, 255, 196, 198, 144, 61, 18, 248]
            ) as H256Le;
            const txBlockHeight: u32 = api.createType("u32", 2);
            const merkleProof: Bytes = api.createType(
                "Bytes",
                [2, 0, 0, 0, 244, 134, 26, 210, 38, 249, 3, 175, 137, 182, 208, 251, 9, 59, 211, 77, 200, 110, 67,
                    171, 216, 90, 255, 111, 72, 97, 187, 76, 166, 94, 240, 19, 213, 54, 6, 130, 156, 254, 180,
                    145, 173, 84, 28, 196, 222, 78, 232, 5, 160, 160, 3, 117, 203, 70, 200, 166, 141, 180, 204,
                    179, 134, 5, 232, 26, 243, 99, 179, 94, 0, 0, 64, 32, 1, 0, 0, 0, 2, 0, 0, 0, 2, 56, 108,
                    49, 183, 51, 251, 228, 176, 233, 214, 204, 196, 69, 202, 199, 158, 219, 253, 38, 85, 184,
                    163, 65, 215, 198, 31, 60, 181, 117, 8, 151, 212, 70, 103, 64, 2, 223, 149, 66, 146, 36,
                    69, 6, 199, 80, 43, 96, 106, 174, 205, 77, 120, 69, 217, 253, 57, 140, 255, 196, 198,
                    144, 61, 18, 248, 1, 5]
            );
            const rawTx: Bytes = api.createType(
                "Bytes",
                [2, 0, 0, 0, 1, 22, 59, 241, 41, 121, 78, 23, 16, 159, 81, 145, 67, 102, 63, 131, 101, 232, 183, 64,
                    173, 236, 247, 249, 134, 8, 242, 39, 166, 231, 131, 49, 251, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 160,
                    134, 1, 0, 0, 0, 0, 0, 25, 118, 169, 20, 191, 52, 8, 246, 192, 222, 192, 135, 159, 124, 29,
                    77, 10, 94, 136, 19, 252, 13, 181, 105, 136, 172, 0, 0, 0, 0, 0, 0, 0, 0, 34, 106, 32, 129,
                    221, 69, 140, 211, 187, 130, 207, 104, 181, 45, 206, 39, 165, 172, 31, 97, 107, 2, 120, 178,
                    243, 108, 76, 5, 191, 213, 40, 194, 225, 232, 233, 0, 0, 0, 0]
            );
            issueAPI.setAccount(alice);
            ImportMock.mockFunction(issueAPI, "isExecutionSucessful", true);
            const isExecutionCorrect = await issueAPI.execute(issueId, txId, txBlockHeight, merkleProof, rawTx);
            assert.isTrue(isExecutionCorrect);
        });

        it("should consider execution failed if `isExecutionSucessful` returns false", async () => {
            const issueId =
                api.createType("H256", "0x81dd458cd3bb82cf68b52dce27a5ac1f616b0278b2f36c4c05bfd528c2e1e8e9");
            const txId: H256Le = api.createType(
                "H256",
                [70, 103, 64, 2, 223, 149, 66, 146, 36, 69, 6, 199, 80, 43, 96, 106, 174, 205, 77, 120, 69, 217,
                    253, 57, 140, 255, 196, 198, 144, 61, 18, 248]
            ) as H256Le;
            const txBlockHeight: u32 = api.createType("u32", 2);
            const merkleProof: Bytes = api.createType(
                "Bytes",
                [2, 0, 0, 0, 244, 134, 26, 210, 38, 249, 3, 175, 137, 182, 208, 251, 9, 59, 211, 77, 200, 110, 67,
                    171, 216, 90, 255, 111, 72, 97, 187, 76, 166, 94, 240, 19, 213, 54, 6, 130, 156, 254, 180,
                    145, 173, 84, 28, 196, 222, 78, 232, 5, 160, 160, 3, 117, 203, 70, 200, 166, 141, 180, 204,
                    179, 134, 5, 232, 26, 243, 99, 179, 94, 0, 0, 64, 32, 1, 0, 0, 0, 2, 0, 0, 0, 2, 56, 108,
                    49, 183, 51, 251, 228, 176, 233, 214, 204, 196, 69, 202, 199, 158, 219, 253, 38, 85, 184,
                    163, 65, 215, 198, 31, 60, 181, 117, 8, 151, 212, 70, 103, 64, 2, 223, 149, 66, 146, 36,
                    69, 6, 199, 80, 43, 96, 106, 174, 205, 77, 120, 69, 217, 253, 57, 140, 255, 196, 198,
                    144, 61, 18, 248, 1, 5]
            );
            const rawTx: Bytes = api.createType(
                "Bytes",
                [2, 0, 0, 0, 1, 22, 59, 241, 41, 121, 78, 23, 16, 159, 81, 145, 67, 102, 63, 131, 101, 232, 183, 64,
                    173, 236, 247, 249, 134, 8, 242, 39, 166, 231, 131, 49, 251, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 160,
                    134, 1, 0, 0, 0, 0, 0, 25, 118, 169, 20, 191, 52, 8, 246, 192, 222, 192, 135, 159, 124, 29,
                    77, 10, 94, 136, 19, 252, 13, 181, 105, 136, 172, 0, 0, 0, 0, 0, 0, 0, 0, 34, 106, 32, 129,
                    221, 69, 140, 211, 187, 130, 207, 104, 181, 45, 206, 39, 165, 172, 31, 97, 107, 2, 120, 178,
                    243, 108, 76, 5, 191, 213, 40, 194, 225, 232, 233, 0, 0, 0, 0]
            );
            issueAPI.setAccount(alice);
            ImportMock.mockFunction(issueAPI, "isExecutionSucessful", false);
            const isExecutionCorrect = await issueAPI.execute(issueId, txId, txBlockHeight, merkleProof, rawTx);
            assert.isFalse(isExecutionCorrect);
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
            const amount = api.createType("Balance", 1);
            await issueAPI.request(amount);
            printEvents("requestIssue", issueAPI.events);

            await issueAPI.cancel(issueAPI.requestHash);
            printEvents("cancelIssueRequest", issueAPI.events);
        });
    });
});
