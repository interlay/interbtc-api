import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultOracleAPI, OracleAPI } from "../../../src/parachain/oracle";
import { createPolkadotAPI } from "../../../src/factory";
import { assert } from "../../chai";
import { defaultParachainEndpoint } from "../../config";

describe("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let alice: KeyringPair;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
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

    describe("Oracle", () => {
        it("should return oracle info", async () => {
            const info = await oracle.getInfo();
            assert.equal(info.names[0], "Bob");
            assert.isTrue(info.online);
            assert.equal(info.feed, "DOT/BTC");
        });

        it("[docker-compose initial setup] should set a rate of 3855.23187", async () => {
            const exchangeRate = await oracle.getExchangeRate();
            assert.equal(exchangeRate.toString(), "3855.23187");
        });

        it("should set exchange rate", async () => {
            const previousExchangeRate = await oracle.getExchangeRate();
            const exchangeRateToSet = "3855.23195";
            await oracle.setExchangeRate(exchangeRateToSet);
            const exchangeRate = await oracle.getExchangeRate();
            assert.equal(exchangeRateToSet, exchangeRate.toString());

            // Revert the exchange rate to its initial value,
            // so that this test is idempotent
            await oracle.setExchangeRate(previousExchangeRate.toString());
        });

        it("should set BTC tx fees", async () => {
            const prev = await oracle.getBtcTxFeesPerByte();
            const fees = {fast: 505, half: 303, hour: 202};
            await oracle.setBtcTxFeesPerByte(fees);
            const newTxFees = await oracle.getBtcTxFeesPerByte();
            assert.deepEqual(fees, newTxFees);

            await oracle.setBtcTxFeesPerByte(prev);
        });
    });
});
