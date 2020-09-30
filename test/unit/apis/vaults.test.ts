import { PolkaBTC, Vault } from "../../../src/interfaces/default";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { assert } from "../../chai";
import { DefaultVaultsAPI } from "../../../src/apis/vaults";
import { createPolkadotAPI } from "../../../src/factory";
import BN from "bn.js";
import sinon from "sinon";

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("vaultsAPI", () => {
    let keyring: Keyring;
    let bob: KeyringPair;
    let events: EventRecord[] = [];
    let api: ApiPromise;
    let vaultsAPI: DefaultVaultsAPI;
    const defaultEndpoint = "ws://127.0.0.1:9944";
    const delayMs = 25000;

    function numberToPolkaBTC(x: number): PolkaBTC {
        return new BN(x) as PolkaBTC;
    }

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

        it("should select random vault", async () => {
            const polkaBTCCollateral = api.createType("PolkaBTC", 0);
            const randomVault = await vaultsAPI.selectRandomVault(polkaBTCCollateral);
            assert.equal(randomVault.toHuman(), bob.address);
        });

        it("should get vault collateralization", async () => {
            const vaultId = api.createType("AccountId", bob.address);
            const collateralization = await vaultsAPI.getCollateralization(vaultId);
            assert.isTrue(collateralization > 1);
        });

        it("should get vault theft flag", async () => {
            const charlieId = api.createType("AccountId", charlie.address);
            const flaggedForTheft = await vaultsAPI.isVaultFlaggedForTheft(charlieId);
            assert.isTrue(flaggedForTheft);
        });

    });
});
