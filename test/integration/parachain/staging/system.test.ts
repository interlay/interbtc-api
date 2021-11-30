import { ApiPromise, Keyring } from "@polkadot/api";
import * as fs from "fs";
import * as path from "path";

import { DefaultSystemAPI, SystemAPI } from "../../../../src/parachain/system";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { SUDO_URI, PARACHAIN_ENDPOINT } from "../../../config";
import { KeyringPair } from "@polkadot/keyring/types";
import { sudo } from "../../../utils/helpers";

describe("systemAPI", () => {
    let api: ApiPromise;
    let systemAPI: SystemAPI;
    let sudoAccount: KeyringPair;
    let keyring: Keyring;

    before(async () => {
        api = await createPolkadotAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        systemAPI = new DefaultSystemAPI(api, sudoAccount);
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

    // TODO: Unskip once differences between rococo-local and standalone are fixed
    it.skip("should setCode", async () => {
        const code = fs.readFileSync(
            path.join(__dirname, "../../../mock/rococo_runtime.compact.wasm")
        ).toString("hex");
        await sudo(systemAPI, (api) => api.setCode(code));
    });
});
