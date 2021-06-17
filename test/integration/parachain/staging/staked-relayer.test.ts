import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultStakedRelayerAPI, StakedRelayerAPI } from "../../../../src/parachain/staked-relayer";
import { createPolkadotAPI } from "../../../../src/factory";
import { assert } from "../../../chai";
import { DEFAULT_PARACHAIN_ENDPOINT } from "../../../config";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import Big from "big.js";
import { DefaultElectrsAPI, ElectrsAPI, newAccountId, REGTEST_ESPLORA_BASE_PATH } from "../../../../src";

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

    it("should list relayers", async () => {
        const list = (await stakedRelayerAPI.list()).map(v => v.toString());
        assert.deepEqual(list, [alice_stash.address]);
    });

    it("should getLastBTCDOTExchangeRateAndTime", async () => {
        const lastBTCDOTExchangeRateAndTime = await stakedRelayerAPI.getLastBTCDOTExchangeRateAndTime();
        assert.isDefined(lastBTCDOTExchangeRateAndTime);
    });

    it("should getCurrentStateOfBTCParachain", async () => {
        const currentStateOfBTCParachain = await stakedRelayerAPI.getCurrentStateOfBTCParachain();
        assert.isDefined(currentStateOfBTCParachain);
    });

    it("should getMaxSLA", async () => {
        const feesToPay = await stakedRelayerAPI.getMaxSLA();
        assert.equal(feesToPay, 100);
    });

    it("should get SLA", async () => {
        const sla = await stakedRelayerAPI.getSLA(newAccountId(api, alice_stash.address));
        const slaBig = new Big(sla);
        const slaBenchmark = new Big("0");
        assert.isTrue(slaBig.gte(slaBenchmark));
    });

    it("should get APY", async () => {
        const apy = await stakedRelayerAPI.getAPY(newAccountId(api, alice_stash.address));
        const apyBenchmark = new Big("0");
        assert.isTrue(apy.gte(apyBenchmark));
    });

    it("should getFees", async () => {
        const feesInterBTC = await stakedRelayerAPI.getWrappingFees(newAccountId(api, alice_stash.address));
        const feesDOT = await stakedRelayerAPI.getCollateralFees(newAccountId(api, alice_stash.address));
        const feeBenchmark = new Big("0");
        assert.isTrue(new Big(feesInterBTC).gte(feeBenchmark));
        assert.isTrue(new Big(feesDOT).gte(feeBenchmark));
    });
});
