import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import { createPolkadotAPI } from "../../../../src/factory";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import { DefaultFeeAPI, FeeAPI } from "../../../../src";
import { assert } from "chai";

describe("fee", () => {
    let api: ApiPromise;
    let feeAPI: FeeAPI;
    let keyring: Keyring;
    let alice: KeyringPair;
    let eve_stash: KeyringPair;

    before(async function () {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        feeAPI = new DefaultFeeAPI(api);
        alice = keyring.addFromUri("//Alice");
        eve_stash = keyring.addFromUri("//Eve//stash");
    });

    after(async () => {
        api.disconnect();
    });

    it("should check getReplaceGriefingCollateralRate", async () => {
        const replaceGriefingCollateralRate = await feeAPI.getReplaceGriefingCollateralRate();
        assert.equal(replaceGriefingCollateralRate.toString(), "0.1");
    }).timeout(1000000);
});
