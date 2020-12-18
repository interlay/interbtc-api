import {
    DOT,
    ActiveStakedRelayer,
    StatusCode,
    Vault,
    StatusUpdate,
    InactiveStakedRelayer,
} from "../interfaces/default";
import { u128, u256 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import BN from "bn.js";
import { calculateAPY, FIXEDI128_SCALING_FACTOR, pagedIterator, scaleFixedPointType } from "../utils";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { CollateralAPI, DefaultCollateralAPI } from "./collateral";

export interface StakedRelayerAPI {
    list(): Promise<ActiveStakedRelayer[]>;
    map(): Promise<Map<AccountId, ActiveStakedRelayer>>;
    getPagedIterator(perPage: number): AsyncGenerator<ActiveStakedRelayer[]>;
    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer>;
    isStakedRelayerActive(stakedRelayerId: AccountId): Promise<boolean>;
    isStakedRelayerInactive(stakedRelayerId: AccountId): Promise<boolean>;
    getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT>;
    getTotalStakedDOTAmount(): Promise<DOT>;
    getMonitoredVaultsCollateralizationRate(): Promise<Vault[]>;
    getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]>;
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
    getOngoingStatusUpdateVotes(): Promise<Array<[BlockNumber, number, number]>>;
    getAllActiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    getAllInactiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    getAllStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    getFeesPolkaBTC(stakedRelayerId: string): Promise<string>;
    getFeesDOT(stakedRelayerId: string): Promise<string>;
    getAPY(stakedRelayerId: string): Promise<string>;
    getSLA(stakedRelayerId: string): Promise<string>;
    getMaxSLA(): Promise<string>;
}

export class DefaultStakedRelayerAPI implements StakedRelayerAPI {
    private vaultsAPI: VaultsAPI;
    private collateralAPI: CollateralAPI;
    private oracleAPI: OracleAPI;

    constructor(private api: ApiPromise, btcNetwork: Network) {
        this.collateralAPI = new DefaultCollateralAPI(this.api);
        this.oracleAPI = new DefaultOracleAPI(this.api);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
    }

    async list(): Promise<ActiveStakedRelayer[]> {
        const activeStakedRelayersMap = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        return activeStakedRelayersMap.map((v) => v[1]);
    }

    async map(): Promise<Map<AccountId, ActiveStakedRelayer>> {
        const activeStakedRelayers = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        const activeStakedRelayerPairs: [AccountId, ActiveStakedRelayer][] = activeStakedRelayers.map(
            (activeStakedRelayer) => {
                return [
                    this.api.createType("AccountId", activeStakedRelayer[0].args[0].toU8a()),
                    activeStakedRelayer[1],
                ];
            }
        );
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

    async getMonitoredVaultsCollateralizationRate(): Promise<Vault[]> {
        return this.vaultsAPI.list();
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

    async getFeesPolkaBTC(stakedRelayerId: string): Promise<string> {
        const parseId = this.api.createType("AccountId", stakedRelayerId);
        const fees = await this.api.query.fee.totalRewardsPolkaBTC(parseId);
        return fees.toString();
    }

    async getFeesDOT(stakedRelayerId: string): Promise<string> {
        const parseId = this.api.createType("AccountId", stakedRelayerId);
        const fees = await this.api.query.fee.totalRewardsDOT(parseId);
        return fees.toString();
    }

    /**
     * Get the total APY for a staked relayer based on the income in PolkaBTC and DOT
     * divided by the locked DOT.
     *
     * @note this does not account for interest compounding
     *
     * @param stakedRelayerId the id of the relayer
     * @returns the APY as a percentage string
     */
    async getAPY(stakedRelayerId: string): Promise<string> {
        const parsedStakedRelayerId = this.api.createType("AccountId", stakedRelayerId);
        const [feesPolkaBTC, feesDOT, dotToBtcRate, lockedDOT] = await Promise.all([
            await this.getFeesPolkaBTC(stakedRelayerId),
            await this.getFeesDOT(stakedRelayerId),
            await this.oracleAPI.getExchangeRate(),
            await (await this.collateralAPI.balanceLockedDOT(parsedStakedRelayerId)).toString(),
        ]);
        return calculateAPY(feesPolkaBTC, feesDOT, lockedDOT, dotToBtcRate);
    }

    async getSLA(stakedRelayerId: string): Promise<string> {
        const parsedId = this.api.createType("AccountId", stakedRelayerId);
        const sla = await this.api.query.sla.relayerSla(parsedId);
        return scaleFixedPointType(sla);
    }

    async getMaxSLA(): Promise<string> {
        const maxSLA = await this.api.query.sla.relayerTargetSla();
        return scaleFixedPointType(maxSLA);
    }
}
