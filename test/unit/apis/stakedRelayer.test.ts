import { DOT } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { assert } from "../../chai";
import StakedRelayerAPI from "../../../src/apis/stakedRelayer";
import { createAPI } from "../../../src/factory";
import BN from "bn.js";

describe("stakedRelayerAPI", () => {
    
    function numberToDOT(x: number): DOT {
        return new BN(x) as DOT;
    }
    describe.skip("request", () => {
        let api: ApiPromise;
        let stakedRelayerAPI: StakedRelayerAPI;

        
        beforeEach(async () => {
            const defaultEndpoint = "ws://127.0.0.1:9944";
            api = await createAPI(defaultEndpoint);
            stakedRelayerAPI = new StakedRelayerAPI(api);
        });

        afterEach(() => {
            return api.disconnect();
        });

        it("should getStakedDOTAmounts", async () => {
            const stakedDOTAmount = await stakedRelayerAPI.getStakedDOTAmounts();
            assert.notEqual(typeof(stakedDOTAmount), undefined);
        });

        it("should compute totalStakedDOTAmount with nonzero sum", async () => {
            const stakedDOTAmounts: DOT[] = [1 , 2, 3].map(x => numberToDOT(x));
            const totalStakedDOTAmount: BN = await stakedRelayerAPI.getTotalStakedDOTAmount(stakedDOTAmounts);
            assert.equal(totalStakedDOTAmount.toNumber(), 6);
        });

        it("should compute totalStakedDOTAmount with zero sum", async () => {
            const stakedDOTAmounts: DOT[] = [];
            const totalStakedDOTAmount = await stakedRelayerAPI.getTotalStakedDOTAmount(stakedDOTAmounts);
            assert.equal(totalStakedDOTAmount.toNumber(), 0);
        });

        // commented because function is only a stub now
        // it("should getFeesEarned", async () => {
        //     const feesEarned = await stakedRelayerAPI.getFeesEarned();
        //     assert.notEqual(typeof(feesEarned), undefined);
        // });

        it("should getLatestBTCBlockFromBTCRelay", async () => {
            const latestBTCBlockFromBTCRelay = await stakedRelayerAPI.getLatestBTCBlockFromBTCRelay();
            assert.notEqual(typeof(latestBTCBlockFromBTCRelay), undefined);
        });

        it("should getLatestBTCBlockHeightFromBTCRelay", async () => {
            const latestBTCBlockHeightFromBTCRelay = await stakedRelayerAPI.getLatestBTCBlockHeightFromBTCRelay();
            assert.notEqual(typeof(latestBTCBlockHeightFromBTCRelay), undefined);
        });

        it("should getLatestBTCBlockFromBTCCore", async () => {
            const latestBTCBlockFromBTCCore = await stakedRelayerAPI.getLatestBTCBlockFromBTCCore();
            assert.notEqual(typeof(latestBTCBlockFromBTCCore), undefined);
        });

        it("should getMonitoredVaultsCollateralizationRate", async () => {
            const monitoredVaultsCollateralizationRate = await stakedRelayerAPI.getMonitoredVaultsCollateralizationRate();
            assert.notEqual(typeof(monitoredVaultsCollateralizationRate), undefined);
        });

        it("should getLastBTCDOTExchangeRateAndTime", async () => {
            const lastBTCDOTExchangeRateAndTime = await stakedRelayerAPI.getLastBTCDOTExchangeRateAndTime();
            assert.notEqual(typeof(lastBTCDOTExchangeRateAndTime), undefined);
        });

        it("should getCurrentStateOfBTCParachain", async () => {
            const currentStateOfBTCParachain = await stakedRelayerAPI.getCurrentStateOfBTCParachain();
            assert.notEqual(typeof(currentStateOfBTCParachain), undefined);
        });

        it("should getOngoingStatusUpdateVotes", async () => {
            const ongoingStatusUpdateVotes = await stakedRelayerAPI.getOngoingStatusUpdateVotes();
            assert.notEqual(typeof(ongoingStatusUpdateVotes), undefined);
        });

    });
});
