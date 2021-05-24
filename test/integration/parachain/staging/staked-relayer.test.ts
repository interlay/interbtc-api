import { ApiPromise, Keyring } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultStakedRelayerAPI, StakedRelayerAPI } from "../../../../src/parachain/staked-relayer";
import { createPolkadotAPI } from "../../../../src/factory";
import { StakedRelayer, DOT } from "../../../../src/interfaces/default";
import { assert } from "../../../chai";
import { defaultParachainEndpoint } from "../../../config";
import * as bitcoinjs from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import Big from "big.js";
import { TypeRegistry } from "@polkadot/types";
import { DefaultElectrsAPI, ElectrsAPI } from "../../../../src";

describe("stakedRelayerAPI", () => {
    function numberToDOT(x: number): DOT {
        return new BN(x) as DOT;
    }

    let api: ApiPromise;
    let stakedRelayerAPI: StakedRelayerAPI;
    let keyring: Keyring;
    let eve: KeyringPair;
    let electrsAPI: ElectrsAPI;
    const registry = new TypeRegistry();

    before(async () => {
        api = await createPolkadotAPI(defaultParachainEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        eve = keyring.addFromUri("//Eve");
    });

    beforeEach(() => {
        electrsAPI = new DefaultElectrsAPI("http://0.0.0.0:3002");
        stakedRelayerAPI = new DefaultStakedRelayerAPI(api, bitcoinjs.networks.regtest, electrsAPI);
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        it("should getStakedDOTAmount", async () => {
            sinon.stub(stakedRelayerAPI, "get").returns(Promise.resolve(<StakedRelayer>{ stake: new BN(100) as DOT }));
            const activeStakedRelayerId = <AccountId>{};
            const stakedDOTAmount = await stakedRelayerAPI.getStakedInsuranceAmount(activeStakedRelayerId);
            assert.equal(stakedDOTAmount.toString(), "0.00000001");
        });

        it("should compute totalStakedDOTAmount with nonzero sum", async () => {
            const mockStakedDOTAmounts: DOT[] = [1, 2, 3].map((x) => numberToDOT(x));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sinon.stub(stakedRelayerAPI, <any>"getStakedInsuranceAmounts").returns(Promise.resolve(mockStakedDOTAmounts));
            const totalStakedDOTAmount = await stakedRelayerAPI.getTotalStakedInsuranceAmount();
            assert.equal(totalStakedDOTAmount.toString(), "6");
        });

        it("should compute totalStakedDOTAmount with zero sum", async () => {
            const mockStakedDOTAmounts: DOT[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sinon.stub(stakedRelayerAPI, <any>"getStakedInsuranceAmounts").returns(Promise.resolve(mockStakedDOTAmounts));
            const totalStakedDOTAmount = await stakedRelayerAPI.getTotalStakedInsuranceAmount();
            assert.equal(totalStakedDOTAmount.toString(), "0");
        });

        it("should listIncludingIds", async () => {
            const relayersMap = await stakedRelayerAPI.map();
            assert.isDefined(relayersMap);
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

        it("should page listed requests", async () => {
            const listingsPerPage = 2;
            const requestsIterator = stakedRelayerAPI.getPagedIterator(listingsPerPage);
            let curr = await requestsIterator.next();
            while (!curr.done) {
                assert.isTrue(curr.value.length <= listingsPerPage);
                curr = await requestsIterator.next();
            }
        });
    });

    describe("sla", () => {
        it("should getMaxSLA", async () => {
            const feesToPay = await stakedRelayerAPI.getMaxSLA();
            assert.equal(feesToPay, 100);
        });

        it("should get SLA", async () => {
            const sla = await stakedRelayerAPI.getSLA(registry.createType("AccountId", eve.address));
            const slaBig = new Big(sla);
            const slaBenchmark = new Big("0");
            assert.isTrue(slaBig.gte(slaBenchmark));
        });
    });

    describe("fees", () => {
        it("should getFees", async () => {
            const feesPolkaBTC = await stakedRelayerAPI.getWrappingFees(registry.createType("AccountId", eve.address));
            const feesDOT = await stakedRelayerAPI.getInsuranceFees(registry.createType("AccountId", eve.address));
            const feeBenchmark = new Big("0");
            assert.isTrue(new Big(feesPolkaBTC).gte(feeBenchmark));
            assert.isTrue(new Big(feesDOT).gte(feeBenchmark));
        });
    });
});
