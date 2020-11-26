import { DOT, ActiveStakedRelayer, StatusCode, Vault, StatusUpdate } from "../interfaces/default";
import { u128, u256 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import BN from "bn.js";
import { pagedIterator } from "../utils";

export interface StakedRelayerAPI {
    list(): Promise<ActiveStakedRelayer[]>;
    map(): Promise<Map<AccountId, ActiveStakedRelayer>>;
    getPagedIterator(perPage: number): AsyncGenerator<ActiveStakedRelayer[]>;
    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer>;
    isStakedRelayerActive(stakedRelayerId: AccountId): Promise<boolean>;
    isStakedRelayerInactive(stakedRelayerId: AccountId): Promise<boolean>;
    getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT>;
    getTotalStakedDOTAmount(): Promise<DOT>;
    getFeesEarned(activeStakedRelayerId: AccountId): Promise<DOT>;
    getMonitoredVaultsCollateralizationRate(): Promise<Vault[]>;
    getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]>;
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
    getOngoingStatusUpdateVotes(): Promise<Array<[BlockNumber, number, number]>>;
    getAllActiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    getAllInactiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    getAllStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
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

    async map(): Promise<Map<AccountId, ActiveStakedRelayer>> {
        const activeStakedRelayers = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        const activeStakedRelayerPairs: [
            AccountId,
            ActiveStakedRelayer
        ][] = activeStakedRelayers.map((activeStakedRelayer) => [
            this.api.createType("AccountId", activeStakedRelayer[0]),
            activeStakedRelayer[1],
        ]);
        const activeStakedRelayersMap: Map<AccountId, ActiveStakedRelayer> = new Map<AccountId, ActiveStakedRelayer>();
        activeStakedRelayerPairs.forEach((activeStakedRelayerPair) =>
            activeStakedRelayersMap.set(activeStakedRelayerPair[0], activeStakedRelayerPair[1])
        );
        return activeStakedRelayersMap;
    }

    getPagedIterator(perPage: number): AsyncGenerator<ActiveStakedRelayer[]> {
        return pagedIterator<ActiveStakedRelayer>(this.api.query.issue.issueRequests, perPage);
    }

    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer> {
        return this.api.query.stakedRelayers.activeStakedRelayers(activeStakedRelayerId);
    }

    async isStakedRelayerActive(stakedRelayerId: AccountId): Promise<boolean> {
        const active = await this.api.query.stakedRelayers.activeStakedRelayers(stakedRelayerId);
        return active.stake.gt(new BN(0));
    }

    async isStakedRelayerInactive(stakedRelayerId: AccountId): Promise<boolean> {
        const inactive = await this.api.query.stakedRelayers.inactiveStakedRelayers(stakedRelayerId);
        return inactive.stake.gt(new BN(0));
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
            pendingUpdate.end,
            pendingUpdate.tally.aye.size,
            pendingUpdate.tally.nay.size,
        ]);
    }

    async getAllActiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        const result = await this.api.query.stakedRelayers.activeStatusUpdates.entries();
        return result.map(([key, value]) => {
            return { id: new u256(this.api.registry, key.args[0].toU8a()), statusUpdate: value };
        });
    }

    async getAllInactiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        const result = await this.api.query.stakedRelayers.inactiveStatusUpdates.entries();
        return result.map(([key, value]) => {
            return { id: new u256(this.api.registry, key.args[0].toU8a()), statusUpdate: value };
        });
    }

    async getAllStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        // TODO: page this so we don't fetch ALL status updates at once
        const activeStatusUpdates = await this.getAllActiveStatusUpdates();
        const inactiveStatusUpdates = await this.getAllInactiveStatusUpdates();
        return [...activeStatusUpdates, ...inactiveStatusUpdates];
    }
}
