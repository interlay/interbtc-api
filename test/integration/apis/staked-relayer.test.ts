import { ApiPromise, Keyring } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultStakedRelayerAPI, StakedRelayerAPI } from "../../../src/apis/staked-relayer";
import { createPolkadotAPI } from "../../../src/factory";
import { StakedRelayer, DOT } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";
import * as bitcoin from "bitcoinjs-lib";
import { KeyringPair } from "@polkadot/keyring/types";
import Big from "big.js";

describe("stakedRelayerAPI", () => {
    function numberToDOT(x: number): DOT {
        return new BN(x) as DOT;
    }

    let api: ApiPromise;
    let stakedRelayerAPI: StakedRelayerAPI;
    let keyring: Keyring;
    let eve: KeyringPair;

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        eve = keyring.addFromUri("//Eve");
    });

    beforeEach(() => {
        stakedRelayerAPI = new DefaultStakedRelayerAPI(api, bitcoin.networks.regtest);
    });

    after(async () => {
        api.disconnect();
    });

    describe("request", () => {
        it("should getStakedDOTAmount", async () => {
            sinon
                .stub(stakedRelayerAPI, "get")
                .returns(Promise.resolve(<StakedRelayer>{ stake: new BN(100) as DOT,  }));
            const activeStakedRelayerId = <AccountId>{};
            const stakedDOTAmount: DOT = await stakedRelayerAPI.getStakedDOTAmount(activeStakedRelayerId);
            assert.equal(stakedDOTAmount.toNumber(), 100);
        });

        it("should compute totalStakedDOTAmount with nonzero sum", async () => {
            const mockStakedDOTAmounts: DOT[] = [1, 2, 3].map((x) => numberToDOT(x));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sinon.stub(stakedRelayerAPI, <any>"getStakedDOTAmounts").returns(Promise.resolve(mockStakedDOTAmounts));
            const totalStakedDOTAmount: BN = await stakedRelayerAPI.getTotalStakedDOTAmount();
            assert.equal(totalStakedDOTAmount.toNumber(), 6);
        });

        it("should compute totalStakedDOTAmount with zero sum", async () => {
            const mockStakedDOTAmounts: DOT[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sinon.stub(stakedRelayerAPI, <any>"getStakedDOTAmounts").returns(Promise.resolve(mockStakedDOTAmounts));
            const totalStakedDOTAmount = await stakedRelayerAPI.getTotalStakedDOTAmount();
            assert.equal(totalStakedDOTAmount.toNumber(), 0);
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

        it("should getOngoingStatusUpdateVotes", async () => {
            const ongoingStatusUpdateVotes = await stakedRelayerAPI.getOngoingStatusUpdateVotes();
            assert.isDefined(ongoingStatusUpdateVotes);
        });

        it("should getAllStatusUpdates", async () => {
            const allStatusUpdates = await stakedRelayerAPI.getAllStatusUpdates();
            assert.isDefined(allStatusUpdates);
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

        it("should sucessfully return", async () => {
            const returnValue = await stakedRelayerAPI.getStakedRelayersMaturityPeriod();
            assert.isDefined(returnValue);
        });
    });

    describe("sla", () => {
        it("should getMaxSLA", async () => {
            const feesToPay = await stakedRelayerAPI.getMaxSLA();
            assert.equal(feesToPay, "100");
        });

        it("should get SLA", async () => {
            const sla = await stakedRelayerAPI.getSLA(eve.address);
            const slaBig = new Big(sla);
            const slaBenchmark = new Big("0");
            assert.isTrue(slaBig.gte(slaBenchmark));
        });
    });

    describe("fees", () => {
        it("should getFees", async () => {
            const feesPolkaBTC = await stakedRelayerAPI.getFeesPolkaBTC(eve.address);
            const feesDOT = await stakedRelayerAPI.getFeesDOT(eve.address);
            const feeBenchmark = new Big("0");
            assert.isTrue(new Big(feesPolkaBTC).gte(feeBenchmark));
            assert.isTrue(new Big(feesDOT).gte(feeBenchmark));
        });
    });
});
