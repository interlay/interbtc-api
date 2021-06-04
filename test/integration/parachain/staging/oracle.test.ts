import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import { DefaultOracleAPI, OracleAPI } from "../../../../src/parachain/oracle";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import BN from "bn.js";

describe.only("OracleAPI", () => {
    let api: ApiPromise;
    let oracle: OracleAPI;
    let bob: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        const keyring = new Keyring({ type: "sr25519" });
        bob = keyring.addFromUri("//Bob");
    });

    beforeEach(async () => {
        oracle = new DefaultOracleAPI(api);
        oracle.setAccount(bob);
    });

    after(() => {
        return api.disconnect();
    });

    describe.only("Oracle", () => {
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

        it.only("should convert satoshi to planck", async () => {
            const planck = await oracle.convertSatoshiToPlanck(new BN(100));
            assert.equal(planck.toString(), "3855231787");
        });

        it("should set BTC tx fees", async () => {
            const prev = await oracle.getBtcTxFeesPerByte();
            const fees = {fast: 505, half: 303, hour: 202};
            await oracle.setBtcTxFeesPerByte(fees);
            const newTxFees = await oracle.getBtcTxFeesPerByte();
            assert.deepEqual(fees, newTxFees);

            await oracle.setBtcTxFeesPerByte(prev);
        });

        it("should get names by id", async () => {
            const expectedSources = new Map<string, string>();
            expectedSources.set("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "Alice");
            expectedSources.set("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "Bob");
            expectedSources.set("5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", "Charlie");
            const sources = await oracle.getSourcesById();
            for (const entry of sources.entries()) {
                assert.equal(entry[1], expectedSources.get(entry[0]));
            }
        });
    });
});
