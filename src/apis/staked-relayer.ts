import { DOT, StakedRelayer, StatusCode, StatusUpdate } from "../interfaces/default";
import { u128, u256 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { VaultsAPI, DefaultVaultsAPI, VaultExt } from "./vaults";
import BN from "bn.js";
import { calculateAPY, FIXEDI128_SCALING_FACTOR, pagedIterator, decodeFixedPointType } from "../utils";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { CollateralAPI, DefaultCollateralAPI } from "./collateral";

export interface StakedRelayerAPI {
    list(): Promise<StakedRelayer[]>;
    map(): Promise<Map<AccountId, StakedRelayer>>;
    getPagedIterator(perPage: number): AsyncGenerator<StakedRelayer[]>;
    get(activeStakedRelayerId: AccountId): Promise<StakedRelayer>;
    isStakedRelayerActive(stakedRelayerId: AccountId): Promise<boolean>;
    isStakedRelayerInactive(stakedRelayerId: AccountId): Promise<boolean>;
    getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT>;
    getTotalStakedDOTAmount(): Promise<DOT>;
    getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>>;
    getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]>;
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
    getOngoingStatusUpdateVotes(): Promise<Array<[string, BlockNumber, number, number]>>;
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

    /**
     * @returns An array containing the active staked relayers
     */
    async list(): Promise<StakedRelayer[]> {
        const activeStakedRelayersMap = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        return activeStakedRelayersMap.map((v) => v[1]);
    }

    /**
     * @returns A mapping from the active staked relayer AccountId to the StakedRelayer object
     */
    async map(): Promise<Map<AccountId, StakedRelayer>> {
        const activeStakedRelayers = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        const activeStakedRelayerPairs: [AccountId, StakedRelayer][] = activeStakedRelayers.map(
            (activeStakedRelayer) => {
                return [
                    this.api.createType("AccountId", activeStakedRelayer[0].args[0].toU8a()),
                    activeStakedRelayer[1],
                ];
            }
        );
        const activeStakedRelayersMap = new Map<AccountId, StakedRelayer>();
        activeStakedRelayerPairs.forEach((activeStakedRelayerPair) =>
            activeStakedRelayersMap.set(activeStakedRelayerPair[0], activeStakedRelayerPair[1])
        );
        return activeStakedRelayersMap;
    }

    /**
     * @param perPage Number of staked relayers to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<StakedRelayer[]> {
        return pagedIterator<StakedRelayer>(this.api.query.issue.issueRequests, perPage);
    }

    /**
     * @param activeStakedRelayerId The ID of the staked relayer to fetch
     * @returns An StakedRelayer object
     */
    get(activeStakedRelayerId: AccountId): Promise<StakedRelayer> {
        return this.api.query.stakedRelayers.activeStakedRelayers(activeStakedRelayerId);
    }

    /**
     * @param stakedRelayerId The ID of the relayer for which to check the status
     * @returns A boolean value
     */
    async isStakedRelayerActive(stakedRelayerId: AccountId): Promise<boolean> {
        const active = await this.api.query.stakedRelayers.activeStakedRelayers(stakedRelayerId);
        return active.stake.gt(new BN(0));
    }

    /**
     * @param stakedRelayerId The ID of the relayer for which to check the status
     * @returns A boolean value
     */
    async isStakedRelayerInactive(stakedRelayerId: AccountId): Promise<boolean> {
        const inactive = await this.api.query.stakedRelayers.inactiveStakedRelayers(stakedRelayerId);
        return inactive.stake.gt(new BN(0));
    }

    /**
     * @param stakedRelayerId The ID of the relayer for which to fetch the staked DOT amount
     * @returns The staked DOT amount, denoted in Planck
     */
    async getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT> {
        const stakedRelayer = await this.get(activeStakedRelayerId);
        return stakedRelayer.stake;
    }

    private async getStakedDOTAmounts(): Promise<DOT[]> {
        const activeStakedRelayersMappings = await this.list();
        const activeStakedRelayersStakes: DOT[] = activeStakedRelayersMappings.map((v) => v.stake);
        return activeStakedRelayersStakes;
    }

    /**
     * @returns The total staked DOT amount, denoted in Planck
     */
    async getTotalStakedDOTAmount(): Promise<DOT> {
        const stakedDOTAmounts: DOT[] = await this.getStakedDOTAmounts();
        if (stakedDOTAmounts.length) {
            const sumReducer = (accumulator: DOT, currentValue: DOT) => accumulator.add(currentValue) as DOT;
            return stakedDOTAmounts.reduce(sumReducer);
        }
        return new BN(0) as DOT;
    }

    /**
     * @returns A mapping from vault IDs to their collateralization
     */
    async getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>> {
        const vaults = await this.vaultsAPI.list();

        const collateralizationRates = await Promise.all(
            vaults.map<Promise<[AccountId, Big | undefined]>>(async (vault) => [
                vault.id,
                await this.vaultsAPI.getVaultCollateralization(vault.id),
            ])
        );

        const map = new Map<AccountId, Big>();
        collateralizationRates
            .filter<[AccountId, Big]>(this.isMonitoredVaultCollateralizationDefined)
            .forEach((pair) => map.set(pair[0], pair[1]));
        return map;
    }

    private isMonitoredVaultCollateralizationDefined(pair: [AccountId, Big | undefined]): pair is [AccountId, Big] {
        return pair[1] !== undefined;
    }

    /**
     * @returns A tuple denoting [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime]
     */
    async getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]> {
        const lastBTCDOTExchangeRate = await this.api.query.exchangeRateOracle.exchangeRate();
        const lastBTCDOTExchangeRateTime = await this.api.query.exchangeRateOracle.lastExchangeRateTime();
        return [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime];
    }

    /**
     * @returns A parachain status code object
     */
    async getCurrentStateOfBTCParachain(): Promise<StatusCode> {
        return await this.api.query.security.parachainStatus();
    }

    /**
     * @returns A tuple denoting [statusUpdateStorageKey, statusUpdateEnd, statusUpdateAyes, statusUpdateNays]
     */
    async getOngoingStatusUpdateVotes(): Promise<Array<[string, BlockNumber, number, number]>> {
        const statusUpdatesMappings = await this.api.query.stakedRelayers.activeStatusUpdates.entries();
        const statusUpdates = statusUpdatesMappings.map<[string, StatusUpdate]>((v) => [v[0].toString(), v[1]]);
        const pendingUpdates = statusUpdates.filter((statusUpdate) => statusUpdate[1].proposal_status.isPending);
        return pendingUpdates.map((pendingUpdate) => [
            pendingUpdate[0],
            pendingUpdate[1].end,
            pendingUpdate[1].tally.aye.size,
            pendingUpdate[1].tally.nay.size,
        ]);
    }

    /**
     * @returns An array of { id, statusUpdate } objects
     */
    async getAllActiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        const result = await this.api.query.stakedRelayers.activeStatusUpdates.entries();
        return result.map(([key, value]) => {
            return { id: new u256(this.api.registry, key.args[0].toU8a()), statusUpdate: value };
        });
    }

    /**
     * @returns An array of { id, statusUpdate } objects
     */
    async getAllInactiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        const result = await this.api.query.stakedRelayers.inactiveStatusUpdates.entries();
        return result.map(([key, value]) => {
            return { id: new u256(this.api.registry, key.args[0].toU8a()), statusUpdate: value };
        });
    }

    /**
     * @returns An array of { id, statusUpdate } objects
     */
    async getAllStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        // TODO: page this so we don't fetch ALL status updates at once
        const activeStatusUpdates = await this.getAllActiveStatusUpdates();
        const inactiveStatusUpdates = await this.getAllInactiveStatusUpdates();
        return [...activeStatusUpdates, ...inactiveStatusUpdates];
    }

    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns Total rewards in PolkaBTC, denoted in Satoshi, for the given staked relayer
     */
    async getFeesPolkaBTC(stakedRelayerId: string): Promise<string> {
        const parseId = this.api.createType("AccountId", stakedRelayerId);
        const fees = await this.api.query.fee.totalRewardsPolkaBTC(parseId);
        return fees.toString();
    }

    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns Total rewards in DOT, denoted in Planck, for the given staked relayer
     */
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

    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns The SLA score, an integer in the range [0, MaxSLA]
     */
    async getSLA(stakedRelayerId: string): Promise<string> {
        const parsedId = this.api.createType("AccountId", stakedRelayerId);
        const sla = await this.api.query.sla.relayerSla(parsedId);
        return decodeFixedPointType(sla);
    }

    /**
     * @returns The maximum SLA score, a positive integer
     */
    async getMaxSLA(): Promise<string> {
        const maxSLA = await this.api.query.sla.relayerTargetSla();
        return decodeFixedPointType(maxSLA);
    }
}
