import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import BN from "bn.js";
import sinon from "sinon";
import { DefaultStakedRelayerAPI, StakedRelayerAPI } from "../../../src/apis/staked-relayer";
import { createPolkadotAPI } from "../../../src/factory";
import { ActiveStakedRelayer, DOT } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";


describe("stakedRelayerAPI", () => {
    function numberToDOT(x: number): DOT {
        return new BN(x) as DOT;
    }

    describe("request", () => {
        let api: ApiPromise;
        let stakedRelayerAPI: StakedRelayerAPI;

        before(async () => {
            api = await createPolkadotAPI(defaultEndpoint);
        });

        beforeEach(() => {
            stakedRelayerAPI = new DefaultStakedRelayerAPI(api);
        });

        after(() => {
            return api.disconnect();
        });

        it("should getStakedDOTAmount", async () => {
            sinon
                .stub(stakedRelayerAPI, "get")
                .returns(Promise.resolve(<ActiveStakedRelayer>{ stake: new BN(100) as DOT }));
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

        // commented because function is only a stub now
        // it("should getFeesEarned", async () => {
        //     const feesEarned = await stakedRelayerAPI.getFeesEarned();
        //     assert.notEqual(typeof(feesEarned), undefined);
        // });

        it("should getLatestBTCBlockFromBTCRelay", async () => {
            const latestBTCBlockFromBTCRelay = await stakedRelayerAPI.getLatestBTCBlockFromBTCRelay();
            assert.isDefined(latestBTCBlockFromBTCRelay);
        });

        it("should getLatestBTCBlockHeightFromBTCRelay", async () => {
            const latestBTCBlockHeightFromBTCRelay = await stakedRelayerAPI.getLatestBTCBlockHeightFromBTCRelay();
            assert.isDefined(latestBTCBlockHeightFromBTCRelay);
        });

        it.skip("should getMonitoredVaultsCollateralizationRate", async () => {
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
    });
});
