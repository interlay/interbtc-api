import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultOracleAPI, OracleAPI } from "../../../src/apis/oracle";
import { createPolkadotAPI } from "../../../src/factory";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let alice: KeyringPair;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        const keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
        bob = keyring.addFromUri("//Bob");
    });

    beforeEach(async () => {
        oracle = new DefaultOracleAPI(api);
        oracle.setAccount(bob);
    });

    after(() => {
        return api.disconnect();
    });

    describe("getInfo", () => {
        it("should return oracle info", async () => {
            const info = await oracle.getInfo();
            assert.equal(info.names[0], "Bob");
            assert.isTrue(info.online);
            assert.equal(info.feed, "DOT/BTC");
        });
    });

    describe("setExchangeRate", () => {
        it("should set exchange rate", async () => {
            const exchangeRateToSet = "3855.23195";
            await oracle.setExchangeRate(exchangeRateToSet);
            const exchangeRate = await oracle.getExchangeRate();
            assert.equal(exchangeRateToSet, exchangeRate.toString());
        });
    });
});
