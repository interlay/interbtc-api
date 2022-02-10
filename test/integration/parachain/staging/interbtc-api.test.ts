import { ApiPromise, Keyring } from "@polkadot/api";
import { assert } from "chai";

import { createAPIRegistry, createSubstrateAPI, DefaultInterBtcApi, InterBtcApi } from "../../../../src";
import { SingleAccountSigner } from "../../../utils/SingleAccountSigner";
import { PARACHAIN_ENDPOINT } from "../../../config";

describe("InterBtcApi", () => {
    const keyring = new Keyring();
    const keyringPair = keyring.addFromUri("//Bob");
    let interBTC: InterBtcApi;
    const registry = createAPIRegistry();
    let api: ApiPromise;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        interBTC = new DefaultInterBtcApi(api);
    });

    after(async () => {
        await api.disconnect();
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
