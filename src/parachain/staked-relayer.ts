import { DOT, StakedRelayer, StatusCode, StatusUpdate } from "../interfaces/default";
import { u64, u128, u256 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import BN from "bn.js";
import { pagedIterator, decodeFixedPointType, Transaction } from "../utils";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { CollateralAPI, DefaultCollateralAPI } from "./collateral";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { AddressOrPair } from "@polkadot/api/types";

/**
 * @category PolkaBTC Bridge
 */
export interface StakedRelayerAPI {
    /**
     * @returns An array containing the active staked relayers
     */
    list(): Promise<StakedRelayer[]>;
    /**
     * @returns A mapping from the active staked relayer AccountId to the StakedRelayer object
     */
    map(): Promise<Map<AccountId, StakedRelayer>>;
    /**
     * @param perPage Number of staked relayers to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<StakedRelayer[]>;
    /**
     * @param activeStakedRelayerId The ID of the staked relayer to fetch
     * @returns An StakedRelayer object
     */
    get(activeStakedRelayerId: AccountId): Promise<StakedRelayer>;
    /**
     * @param stakedRelayerId The ID of the relayer for which to check the status
     * @returns A boolean value
     */
    isStakedRelayerActive(stakedRelayerId: AccountId): Promise<boolean>;
    /**
     * @param stakedRelayerId The ID of the relayer for which to check the status
     * @returns A boolean value
     */
    isStakedRelayerInactive(stakedRelayerId: AccountId): Promise<boolean>;
    /**
     * @param stakedRelayerId The ID of the relayer for which to fetch the staked DOT amount
     * @returns The staked DOT amount, denoted in Planck
     */
    getStakedDOTAmount(activeStakedRelayerId: AccountId): Promise<DOT>;
    /**
     * @returns The total staked DOT amount, denoted in Planck
     */
    getTotalStakedDOTAmount(): Promise<DOT>;
    /**
     * @returns A mapping from vault IDs to their collateralization
     */
    getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>>;
    /**
     * @returns A tuple denoting [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime]
     */
    getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]>;
    /**
     * @returns A parachain status code object
     */
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
    /**
     * @returns A tuple denoting [statusUpdateStorageKey, statusUpdateEnd, statusUpdateAyes, statusUpdateNays]
     */
    getOngoingStatusUpdateVotes(): Promise<Array<PendingStatusUpdate>>;
    /**
     * @returns An array of { id, statusUpdate } objects
     */
    getAllActiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    /**
     * @returns An array of { id, statusUpdate } objects
     */
    getAllInactiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    /**
     * @returns An array of { id, statusUpdate } objects
     */
    getAllStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>>;
    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns Total rewards in PolkaBTC, denoted in Satoshi, for the given staked relayer
     */
    getFeesPolkaBTC(stakedRelayerId: AccountId): Promise<string>;
    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns Total rewards in DOT, denoted in Planck, for the given staked relayer
     */
    getFeesDOT(stakedRelayerId: AccountId): Promise<string>;
    /**
     * Get the total APY for a staked relayer based on the income in PolkaBTC and DOT
     * divided by the locked DOT.
     *
     * @note this does not account for interest compounding
     *
     * @param stakedRelayerId the id of the relayer
     * @returns the APY as a percentage string
     */
    getAPY(stakedRelayerId: AccountId): Promise<string>;
    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns The SLA score, an integer in the range [0, MaxSLA]
     */
    getSLA(stakedRelayerId: AccountId): Promise<number>;
    /**
     * @returns The maximum SLA score, a positive integer
     */
    getMaxSLA(): Promise<number>;
    /**
     * @returns The number of blocks to wait until eligible to vote
     */
    getStakedRelayersMaturityPeriod(): Promise<BlockNumber>;
    deregisterStakedRelayer(): Promise<void>;
    /**
     * Set an account to use when sending transactions from this API
     * @param account Keyring account
     */
    setAccount(account: AddressOrPair): void;
}

export interface PendingStatusUpdate {
    statusUpdateStorageKey: u64;
    statusUpdateEnd: BlockNumber;
    statusUpdateAyes: number;
    statusUpdateNays: number;
}

export class DefaultStakedRelayerAPI implements StakedRelayerAPI {
    private vaultsAPI: VaultsAPI;
    private collateralAPI: CollateralAPI;
    private oracleAPI: OracleAPI;
    private feeAPI: FeeAPI;
    transaction: Transaction;

    constructor(private api: ApiPromise, btcNetwork: Network, private account?: AddressOrPair) {
        this.collateralAPI = new DefaultCollateralAPI(api);
        this.oracleAPI = new DefaultOracleAPI(api);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.feeAPI = new DefaultFeeAPI(api);
        this.transaction = new Transaction(api);
    }

    async deregisterStakedRelayer(): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        const tx = this.api.tx.stakedRelayers.deregisterStakedRelayer();
        await this.transaction.sendLogged(tx, this.account, this.api.events.stakedRelayers.DeregisterStakedRelayer);
    }

    async list(): Promise<StakedRelayer[]> {
        const activeStakedRelayersMap = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        return activeStakedRelayersMap.map((v) => v[1]);
    }

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

    getPagedIterator(perPage: number): AsyncGenerator<StakedRelayer[]> {
        return pagedIterator<StakedRelayer>(this.api.query.issue.issueRequests, perPage);
    }

    get(activeStakedRelayerId: AccountId): Promise<StakedRelayer> {
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

    async getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]> {
        const lastBTCDOTExchangeRate = await this.api.query.exchangeRateOracle.exchangeRate();
        const lastBTCDOTExchangeRateTime = await this.api.query.exchangeRateOracle.lastExchangeRateTime();
        return [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime];
    }

    async getCurrentStateOfBTCParachain(): Promise<StatusCode> {
        return await this.api.query.security.parachainStatus();
    }

    async getOngoingStatusUpdateVotes(): Promise<Array<PendingStatusUpdate>> {
        const statusUpdatesMappings = await this.api.query.stakedRelayers.activeStatusUpdates.entries();
        const statusUpdates = statusUpdatesMappings.map<[u64, StatusUpdate]>((v) => [v[0].args[0], v[1]]);
        const pendingUpdates = statusUpdates.filter((statusUpdate) => statusUpdate[1].proposal_status.isPending);
        return pendingUpdates.map((pendingUpdate) => ({
            statusUpdateStorageKey: pendingUpdate[0],
            statusUpdateEnd: pendingUpdate[1].end,
            statusUpdateAyes: pendingUpdate[1].tally.aye.size,
            statusUpdateNays: pendingUpdate[1].tally.nay.size,
        }));
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
        const activeStatusUpdates = await this.getAllActiveStatusUpdates();
        const inactiveStatusUpdates = await this.getAllInactiveStatusUpdates();
        return [...activeStatusUpdates, ...inactiveStatusUpdates];
    }

    async getFeesPolkaBTC(stakedRelayerId: AccountId): Promise<string> {
        const fees = await this.api.query.fee.totalRewardsPolkaBTC(stakedRelayerId);
        return fees.toString();
    }

    async getFeesDOT(stakedRelayerId: AccountId): Promise<string> {
        const fees = await this.api.query.fee.totalRewardsDOT(stakedRelayerId);
        return fees.toString();
    }

    async getAPY(stakedRelayerId: AccountId): Promise<string> {
        const [feesPolkaBTC, feesDOT, dotToBtcRate, lockedDOT] = await Promise.all([
            await this.getFeesPolkaBTC(stakedRelayerId),
            await this.getFeesDOT(stakedRelayerId),
            await this.oracleAPI.getExchangeRate(),
            await (await this.collateralAPI.balanceLockedDOT(stakedRelayerId)).toString(),
        ]);
        return this.feeAPI.calculateAPY(feesPolkaBTC, feesDOT, lockedDOT, dotToBtcRate);
    }

    async getSLA(stakedRelayerId: AccountId): Promise<number> {
        const sla = await this.api.query.sla.relayerSla(stakedRelayerId);
        return Number(decodeFixedPointType(sla));
    }

    async getMaxSLA(): Promise<number> {
        const maxSLA = await this.api.query.sla.relayerTargetSla();
        return Number(decodeFixedPointType(maxSLA));
    }

    async getStakedRelayersMaturityPeriod(): Promise<BlockNumber> {
        return await this.api.query.stakedRelayers.maturityPeriod();
    }

    setAccount(account: AddressOrPair): void {
        this.account = account;
    }
}
