import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultOracleAPI, OracleAPI } from "../../../src/apis/oracle";
import { createPolkadotAPI } from "../../../src/factory";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";
import { sendLoggedTx } from "../../../src/utils";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let bob: KeyringPair;

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

    describe("getInfo", () => {
        it("should return oracle info", async () => {
            const info = await oracle.getInfo();
            assert.equal(info.name, "Bob");
            assert.isTrue(info.online);
            assert.equal(info.feed, "BTC/DOT");
        });
    });

    describe.skip("setExchangeRate", () => {
        it("should set exchange rate", async () => {
            const exchangeRateTx = api.tx.exchangeRateOracle.setExchangeRate(1);
            await sendLoggedTx(exchangeRateTx, bob, api);

            const bobBTCAddress = "0xbf3408f6c0dec0879f7c1d4d0a5e8813fc0db569";
            const registerVaultTx = api.tx.vaultRegistry.registerVault(6, bobBTCAddress);
            await sendLoggedTx(registerVaultTx, bob, api);
        });
    });
});
