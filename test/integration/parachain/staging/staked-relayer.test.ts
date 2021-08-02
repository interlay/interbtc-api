import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultStakedRelayerAPI, StakedRelayerAPI } from "../../../../src/parachain/staked-relayer";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import { DefaultElectrsAPI, ElectrsAPI, REGTEST_ESPLORA_BASE_PATH } from "../../../../src";

describe("stakedRelayerAPI", () => {
    let api: ApiPromise;
    let stakedRelayerAPI: StakedRelayerAPI;
    let keyring: Keyring;
    let alice_stash: KeyringPair;
    let electrsAPI: ElectrsAPI;

    before(async () => {
        api = await createPolkadotAPI(DEFAULT_PARACHAIN_ENDPOINT);
        keyring = new Keyring({ type: "sr25519" });
        alice_stash = keyring.addFromUri("//Alice//stash");
        electrsAPI = new DefaultElectrsAPI(REGTEST_ESPLORA_BASE_PATH);
        stakedRelayerAPI = new DefaultStakedRelayerAPI(api, bitcoinjs.networks.regtest, electrsAPI);
    });

    after(async () => {
        api.disconnect();
    });

    it("should getMonitoredVaultsCollateralizationRate", async () => {
        const monitoredVaultsCollateralizationRate = await stakedRelayerAPI.getMonitoredVaultsCollateralizationRate();
        assert.isDefined(monitoredVaultsCollateralizationRate);
    });

    it("should getLastBTCDOTExchangeRateAndTime", async () => {
        const lastBTCDOTExchangeRateAndTime = await stakedRelayerAPI.getLastBTCDOTExchangeRateAndTime();
        assert.isDefined(lastBTCDOTExchangeRateAndTime);
    });

    it("should getCurrentStateOfBTCParachain", async () => {
        const currentStateOfBTCParachain = await stakedRelayerAPI.getCurrentStateOfBTCParachain();
        assert.isDefined(currentStateOfBTCParachain);
    });

});
