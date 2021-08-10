import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultSystemAPI, SystemAPI } from "../../../../src/parachain/system";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { KeyringPair } from "@polkadot/keyring/types";

describe("systemAPI", () => {
    let api: ApiPromise;
    let systemAPI: SystemAPI;
    let keyring: Keyring;
    let alice_stash: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        alice_stash = keyring.addFromUri("//Alice//stash");
        systemAPI = new DefaultSystemAPI(api);
    });

    after(async () => {
        api.disconnect();
    });

    it("should getCurrentBlockNumber", async () => {
        const currentBlockNumber = await systemAPI.getCurrentBlockNumber();
        assert.isDefined(currentBlockNumber);
    });

    it("should getStatusCode", async () => {
        const statusCode = await systemAPI.getStatusCode();
        assert.isDefined(statusCode);
    });

});
