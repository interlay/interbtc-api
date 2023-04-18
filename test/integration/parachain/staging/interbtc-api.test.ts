import { ApiPromise, Keyring } from "@polkadot/api";

import { assert } from "../../../chai";
import {
    createAPIRegistry,
    createSubstrateAPI,
    DefaultInterBtcApi,
    InterBtcApi,
    newMonetaryAmount,
} from "../../../../src";
import { SingleAccountSigner } from "../../../utils/SingleAccountSigner";
import { ORACLE_URI, PARACHAIN_ENDPOINT } from "../../../config";
import { submitExtrinsic } from "../../../utils/helpers";

describe("InterBtcApi", () => {
    const keyring = new Keyring();
    const keyringPair = keyring.addFromUri(ORACLE_URI);
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

    describe("removeAccount", () => {
        it("should remove account after it was set", () => {
            interBTC.setAccount(keyringPair);
            interBTC.removeAccount();
            assert.isUndefined(interBTC.account);
        });

        it("should fail to send transaction after account removal", async () => {
            interBTC.setAccount(keyringPair);
            interBTC.removeAccount();

            const governanceCurrency = interBTC.getGovernanceCurrency();
            const amount = newMonetaryAmount(1, governanceCurrency, true);
            const aliceAddress = keyring.addFromUri("//Alice").address;
            const tx = submitExtrinsic(interBTC, interBTC.tokens.transfer(aliceAddress, amount));
            // Transfer to Alice should be rejected, since Bob's account was removed.
            await assert.isRejected(tx);
        });
    });
});
