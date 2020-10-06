import { DOT, ActiveStakedRelayer, H256Le, StatusCode, Vault, StatusUpdate } from "../interfaces/default";
import { u128, u32, u256 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import BN from "bn.js";

export interface StakedRelayerAPI {
    list(): Promise<ActiveStakedRelayer[]>;
    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer>;
    getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT>;
    getTotalStakedDOTAmount(): Promise<DOT>;
    getFeesEarned(activeStakedRelayerId: AccountId): Promise<DOT>;
    getLatestBTCBlockFromBTCRelay(): Promise<H256Le>;
    getLatestBTCBlockHeightFromBTCRelay(): Promise<u32>;
    getMonitoredVaultsCollateralizationRate(): Promise<Vault[]>;
    getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]>;
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
    getOngoingStatusUpdateVotes(): Promise<Array<[BlockNumber, number, number]>>;
    getAllStatusUpdates(): Promise<Array<{ id: u256; status_update: StatusUpdate }>>;
}

export class DefaultStakedRelayerAPI implements StakedRelayerAPI {
    private vaults: VaultsAPI;

    constructor(private api: ApiPromise) {
        this.vaults = new DefaultVaultsAPI(api);
    }

    async list(): Promise<ActiveStakedRelayer[]> {
        const activeStakedRelayersMap = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        return activeStakedRelayersMap.map((v) => v[1]);
    }

    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer> {
        return this.api.query.stakedRelayers.activeStakedRelayers(activeStakedRelayerId);
    }

    async getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT> {
        const stakedRelayer = await this.get(activeStakedRelayerId);
        return stakedRelayer.stake;
    }

    private async getStakedDOTAmounts(): Promise<DOT[]> {
        const activeStakedRelayersMappings = await this.list();
        const activeStakedRelayersStakes: DOT[] = activeStakedRelayersMappings.map((v) => v.stake);
        return activeStakedRelayersStakes;
    }

    async getTotalStakedDOTAmount(): Promise<DOT> {
        const stakedDOTAmounts: DOT[] = await this.getStakedDOTAmounts();
        if (stakedDOTAmounts.length) {
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

    async getOngoingStatusUpdateVotes(): Promise<Array<[BlockNumber, number, number]>> {
        const statusUpdatesMappings = await this.api.query.stakedRelayers.activeStatusUpdates.entries();
        const statusUpdates = statusUpdatesMappings.map((v) => v[1]);
        const pendingUpdates = statusUpdates.filter((statusUpdate) => statusUpdate.proposal_status.isPending);
        return pendingUpdates.map((pendingUpdate) => [
            pendingUpdate.time,
            pendingUpdate.tally.aye.size,
            pendingUpdate.tally.nay.size,
        ]);
    }

    async getAllStatusUpdates(): Promise<Array<{ id: u256; status_update: StatusUpdate }>> {
        // TODO: page this so we don't fetch ALL status updates at once
        const activeStatusUpdates = await this.api.query.stakedRelayers.activeStatusUpdates.entries().then((result) =>
            result.map(([key, value]) => {
                return { id: new u256(this.api.registry, key.args[0].toU8a()), status_update: value };
            })
        );
        const inactiveStatusUpdates = await this.api.query.stakedRelayers.inactiveStatusUpdates
            .entries()
            .then((result) =>
                result.map(([key, value]) => {
                    return { id: new u256(this.api.registry, key.args[0].toU8a()), status_update: value };
                })
            );
        return [...activeStatusUpdates, ...inactiveStatusUpdates];
    }
}
