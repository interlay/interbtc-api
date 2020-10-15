import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { ISubmittableResult } from "@polkadot/types/types";
import { DefaultOracleAPI, OracleAPI } from "../../../src/apis/oracle";
import { createPolkadotAPI } from "../../../src/factory";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";
import { delay, printEvents } from "../../helpers";


describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let events: EventRecord[] = [];
    let bob: KeyringPair;

    const delayMs = 25000;

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
    });

    beforeEach(async () => {
        oracle = new DefaultOracleAPI(api);
    });

    after(() => {
        return api.disconnect();
    });

    function txCallback(unsubscribe: any, result: ISubmittableResult) {
        if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
            events = result.events;
            unsubscribe();
        }
    }

    describe("getInfo", () => {
        it("should return oracle info", async () => {
            const info = await oracle.getInfo();
            assert.equal(info.name, "Bob");
            assert.isTrue(info.online);
            assert.equal(info.feed, "BTC/DOT");
        });
    });

    describe("setExchangeRate", () => {
        it("should set exchange rate", async () => {
            let unsubscribe: any = await api.tx.exchangeRateOracle
                .setExchangeRate(1)
                .signAndSend(bob, (result) => txCallback(unsubscribe, result));
            await delay(delayMs);
            printEvents(api, "setExchangeRate", events);

            const bobBTCAddress = "0xbf3408f6c0dec0879f7c1d4d0a5e8813fc0db569";
            unsubscribe = await api.tx.vaultRegistry
                .registerVault(6, bobBTCAddress)
                .signAndSend(bob, (result) => txCallback(unsubscribe, result));
            await delay(delayMs);
            printEvents(api, "registerVault", events);
        });
    });
});
