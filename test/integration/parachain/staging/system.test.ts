import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import { createSubstrateAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { SUDO_URI, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH } from "../../../config";
import { BLOCK_TIME_SECONDS, DefaultInterBtcApi, InterBtcApi } from "../../../../src";

describe("systemAPI", () => {
    let api: ApiPromise;
    let sudoAccount: KeyringPair;
    let interBtcAPI: InterBtcApi;
    let keyring: Keyring;

    before(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);
    });

    after(async () => {
        api.disconnect();
    });

    it("should getCurrentBlockNumber", async () => {
        const currentBlockNumber = await interBtcAPI.system.getCurrentBlockNumber();
        assert.isDefined(currentBlockNumber);
    });

    it("should getStatusCode", async () => {
        const statusCode = await interBtcAPI.system.getStatusCode();
        assert.isDefined(statusCode);
    });

    it("should getFutureBlockNumber", async () => {
        const approximately10BlocksTime = 10 * BLOCK_TIME_SECONDS;
        const [currentBlockNumber, futureBlockNumber] = await Promise.all([
            interBtcAPI.system.getCurrentBlockNumber(),
            interBtcAPI.system.getFutureBlockNumber(approximately10BlocksTime),
        ]);

        assert.isAtLeast(futureBlockNumber, currentBlockNumber + 9);
        assert.isAtMost(futureBlockNumber, currentBlockNumber + 11);
    });
});
