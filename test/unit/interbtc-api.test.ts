import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "../chai";
import sinon from "sinon";
import { createAPIRegistry, DefaultInterBTCAPI, InterBTCAPI } from "../../src/interbtc-api";
import { SingleAccountSigner } from "../utils/SingleAccountSigner";
import { Currency, Polkadot } from "@interlay/monetary-js";
import { CollateralUnit } from "../../src";

describe("InterBTCAPI", () => {
    const keyring = new Keyring();
    const keyringPair = keyring.addFromUri("//Bob");
    let interBTC: InterBTCAPI;
    const registry = createAPIRegistry();

    before(async () => {
        const api = sinon.createStubInstance(ApiPromise);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interBTC = new DefaultInterBTCAPI(<any>api, Polkadot);
    });

    describe("setAccount", () => {
        it("should succeed to set KeyringPair", () => {
            interBTC.setAccount(keyringPair);
            assert.isDefined(interBTC.account);
        });

        it("should succeed to set address with signer", () => {
            const signer = new SingleAccountSigner(registry, keyringPair);
            interBTC.setAccount(keyringPair, signer);
            assert.isDefined(interBTC.account);
        });


        it("should fail to set address without signer", () => {
            assert.throw(() => interBTC.setAccount(keyringPair.address));
        });
    });
});
