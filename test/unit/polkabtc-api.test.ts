import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "../chai";
import sinon from "sinon";
import { DefaultPolkaBTCAPI, PolkaBTCAPI } from "../../src/polkabtc-api";
import { SingleAccountSigner } from "../utils/SingleAccountSigner";
import { createAPIRegistry } from "../../src/factory";

describe("PolkaBTCAPI", () => {
    const keyring = new Keyring();
    const keyringPair = keyring.addFromUri("//Bob");
    let polkaBTC: PolkaBTCAPI;
    const registry = createAPIRegistry();

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
            const signer = new SingleAccountSigner(registry, keyringPair);
            polkaBTC.setAccount(keyringPair.address, signer);
            assert.isDefined(polkaBTC.account);
        });

        it("should fail to set address without signer", () => {
            assert.throw(() => polkaBTC.setAccount(keyringPair.address));
        });
    });
});
