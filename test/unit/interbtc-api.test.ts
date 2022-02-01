import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "../chai";
import sinon from "sinon";
import { createAPIRegistry, DefaultInterBtcApi, InterBtcApi } from "../../src/interbtc-api";
import { SingleAccountSigner } from "../utils/SingleAccountSigner";

describe("InterBtcApi", () => {
    const keyring = new Keyring();
    const keyringPair = keyring.addFromUri("//Bob");
    let interBTC: InterBtcApi;
    const registry = createAPIRegistry();

    before(async () => {
        const api = sinon.createStubInstance(ApiPromise);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interBTC = new DefaultInterBtcApi(<any>api);
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
