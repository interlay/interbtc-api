import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "../chai";
import sinon from "sinon";
import { DefaultPolkaBTCAPI, PolkaBTCAPI } from "../../src/polkabtc-api";

describe("PolkaBTCAPI", () => {
    const keyring = new Keyring();
    const keyringPair = keyring.addFromUri("//Bob");
    let polkaBTC: PolkaBTCAPI;

    beforeEach(async () => {
        const api = sinon.createStubInstance(ApiPromise);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        polkaBTC = new DefaultPolkaBTCAPI(<any>api);
    });

    describe("setAccount", () => {
        it("should succeed to set KeyringPair", () => {
            polkaBTC.setAccount(keyringPair);
            assert.isDefined(polkaBTC.account);
        });

        it("should succeed to set address with signer", () => {
            polkaBTC.setAccount(keyringPair);
            assert.isDefined(polkaBTC.account);
        });
    });
});
