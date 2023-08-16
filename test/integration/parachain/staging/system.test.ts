import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";

import { createSubstrateAPI } from "../../../../src/factory";
import { SUDO_URI, PARACHAIN_ENDPOINT, ESPLORA_BASE_PATH } from "../../../config";
import { BLOCK_TIME_SECONDS, DefaultInterBtcApi, InterBtcApi } from "../../../../src";

describe("systemAPI", () => {
    let api: ApiPromise;
    let sudoAccount: KeyringPair;
    let interBtcAPI: InterBtcApi;
    let keyring: Keyring;

    beforeAll(async () => {
        api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        sudoAccount = keyring.addFromUri(SUDO_URI);
        interBtcAPI = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);
    });

    afterAll(async () => {
        api.disconnect();
    });

    it("should getCurrentBlockNumber", async () => {
        const currentBlockNumber = await interBtcAPI.system.getCurrentBlockNumber();
        expect(currentBlockNumber).toBeDefined();
    });

    it("should getFutureBlockNumber", async () => {
        const approximately10BlocksTime = 10 * BLOCK_TIME_SECONDS;
        const [currentBlockNumber, futureBlockNumber] = await Promise.all([
            interBtcAPI.system.getCurrentBlockNumber(),
            interBtcAPI.system.getFutureBlockNumber(approximately10BlocksTime),
        ]);

        expect(futureBlockNumber).toBeGreaterThanOrEqual(currentBlockNumber + 9);
        expect(futureBlockNumber).toBeLessThanOrEqual(currentBlockNumber + 11);
    });

    it("should get paymentInfo", async () => {
        const tx = api.tx.system.remark("");
        expect(tx.hasPaymentInfo).toBe(true);
        await expect(tx.paymentInfo(sudoAccount)).resolves.toBeDefined();
    });
});
