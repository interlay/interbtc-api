import { ApiPromise, Keyring } from "@polkadot/api";

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

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        interBTC = new DefaultInterBtcApi(api);
    });

    afterAll(async () => {
        await api.disconnect();
    });

    describe("setAccount", () => {
        it("should succeed to set KeyringPair", () => {
            interBTC.setAccount(keyringPair);
            expect(interBTC.account).toBeDefined();
        });

        it("should succeed to set address with signer", () => {
            const signer = new SingleAccountSigner(registry, keyringPair);
            interBTC.setAccount(keyringPair, signer);
            expect(interBTC.account).toBeDefined();
        });

        it("should fail to set address without signer", () => {
            expect(() => interBTC.setAccount(keyringPair.address)).toThrow();
        });
    });

    describe("removeAccount", () => {
        it("should remove account after it was set", () => {
            interBTC.setAccount(keyringPair);
            interBTC.removeAccount();
            expect(interBTC.account).not.toBeDefined();
        });

        it("should fail to send transaction after account removal", async () => {
            interBTC.setAccount(keyringPair);
            interBTC.removeAccount();

            const governanceCurrency = interBTC.getGovernanceCurrency();
            const amount = newMonetaryAmount(1, governanceCurrency, true);
            const aliceAddress = keyring.addFromUri("//Alice").address;
            const tx = submitExtrinsic(interBTC, interBTC.tokens.transfer(aliceAddress, amount));
            // Transfer to Alice should be rejected, since Bob's account was removed.
            await expect(tx).rejects.toThrow();
        });
    });
});
