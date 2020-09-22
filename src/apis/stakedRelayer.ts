import { DOT, ActiveStakedRelayer, H256Le, StatusCode, Vault } from "@interlay/polkabtc/interfaces/default";
import { u128, u32 } from "@polkadot/types/primitive";
import { AccountId, Balance, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import Vaults from "./vaults";
import BN from "bn.js";
import * as esplora from "@interlay/esplora-btc-api";

export interface StakedRelayerAPIInterface {
    list(): Promise<ActiveStakedRelayer[]>;
    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer>;
    getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT>;
    getTotalStakedDOTAmount(): Promise<DOT>;
    getFeesEarned(activeStakedRelayerId: AccountId): Promise<DOT>;
    getLatestBTCBlockFromBTCRelay(): Promise<H256Le>;
    getLatestBTCBlockHeightFromBTCRelay(): Promise<u32>;
    getLatestBTCBlockFromBTCCore(): Promise<number | undefined>;
    getMonitoredVaultsCollateralizationRate(): Promise<Vault[]>;
    getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]>;
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
    getOngoingStatusUpdateVotes(): Promise<Array<[BlockNumber, Balance, Balance]>>;
}

class StakedRelayerAPI {
    private vaults: Vaults;

    constructor(private api: ApiPromise) {
        this.vaults = new Vaults(api);
    }

    async list(): Promise<ActiveStakedRelayer[]> {
        const activeStakedRelayersMap = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        return activeStakedRelayersMap.map((v) => v[1]);
    }

    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer> {
        return this.api.query.stakedRelayers.activeStakedRelayers.at(activeStakedRelayerId);
    }

    async getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT> {
        const activeStakedRelayer: ActiveStakedRelayer = await this.get(activeStakedRelayerId);
        return activeStakedRelayer.stake;
    }

    private async getStakedDOTAmounts(): Promise<DOT[]> {
        const activeStakedRelayersMappings = await this.list();
        const activeStakedRelayersStakes: DOT[] = activeStakedRelayersMappings.map(v => v.stake);
        return activeStakedRelayersStakes;
    }

    async getTotalStakedDOTAmount(): Promise<DOT> {
        const stakedDOTAmounts: DOT[] = await this.getStakedDOTAmounts();
        if(stakedDOTAmounts.length) {
            const sumReducer = (accumulator: DOT, currentValue: DOT) => accumulator.add(currentValue) as DOT;
            return stakedDOTAmounts.reduce(sumReducer);
        }
        return new BN(0) as DOT;
    }

    async getFeesEarned(_activeStakedRelayerId: AccountId): Promise<DOT> {
        return new BN(0) as DOT;
    }

    async getLatestBTCBlockFromBTCRelay(): Promise<H256Le> {
        return await this.api.query.btcRelay.bestBlock();
    }

    async getLatestBTCBlockHeightFromBTCRelay(): Promise<u32> {
        return await this.api.query.btcRelay.bestBlockHeight();
    }

    async getLatestBTCBlockFromBTCCore(): Promise<number | undefined> {
        const basePath = "https://blockstream.info/api";
        const blockApi = new esplora.BlockApi({basePath: basePath});
        blockApi.getLastBlockHeight()
            .then(response => {
                return response.data;
            });

        // if the request times out
        return undefined;
    }

    async getMonitoredVaultsCollateralizationRate(): Promise<Vault[]> {
        return this.vaults.list();
    }

    async getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]> {
        const lastBTCDOTExchangeRate = await this.api.query.exchangeRateOracle.exchangeRate();
        const lastBTCDOTExchangeRateTime = await this.api.query.exchangeRateOracle.lastExchangeRateTime();
        return [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime];
    }

    async getCurrentStateOfBTCParachain(): Promise<StatusCode> {
        return await this.api.query.security.parachainStatus();
    }

    async getOngoingStatusUpdateVotes(): Promise<Array<[BlockNumber, Balance, Balance]>> {
        const statusUpdatesMappings = await this.api.query.stakedRelayers.statusUpdates.entries();
        const statusUpdates = statusUpdatesMappings.map((v) => v[1]);
        const pendingUpdates = statusUpdates.filter(statusUpdate => statusUpdate.proposal_status.isPending);
        const ongoingStatusUpdateVotes: Array<[BlockNumber, Balance, Balance]> = pendingUpdates.map(
            pendingUpdate => [
                pendingUpdate.time,
                pendingUpdate.tally.ayes,
                pendingUpdate.tally.nays
            ] 
        );

        return ongoingStatusUpdateVotes;
    }

}

export default StakedRelayerAPI;
