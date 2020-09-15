import { DOT, PolkaBTC, Vault, ActiveStakedRelayer, H256Le, StatusCode } from "@interlay/polkabtc/interfaces/default";
import { Bytes, U256, bool, u128, u32, u64 } from '@polkadot/types/primitive';
import { AccountId, Balance, BalanceOf, BlockNumber, ExtrinsicsWeight, H256, Hash, Moment, Releases } from '@polkadot/types/interfaces/runtime';
import { ApiPromise } from "@polkadot/api";
import Vaults from "./vaults";
import BN from "bn.js";
import * as esplora from '@interlay/esplora-btc-api';

interface StakedRelayerAPI {
    list(): Promise<ActiveStakedRelayer[]>;
    get(activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer>;
    getStakedDOTAmount(): Promise<DOT>;
    getFeesEarned(activeStakedRelayerId: AccountId): Promise<DOT>;
    getLatestBTCBlockFromBTCRelay(): Promise<H256Le>;
    getLatestBTCBlockFromBTCCore(): any;
    getMonitoredVaultsCollateralizationRate(): any;
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

    async getStakedDOTAmount(): Promise<DOT> {
        const activeStakedRelayersMappings = await this.api.query.stakedRelayers.activeStakedRelayers.entries();
        const activeStakedRelayers: DOT[] = activeStakedRelayersMappings.map((v) => v[1].stake);
        const sumReducer = (accumulator: DOT, currentValue: DOT) => accumulator.add(currentValue) as DOT;
        return activeStakedRelayers.reduce(sumReducer);
    }

    async getFeesEarned(activeStakedRelayerId: AccountId): Promise<DOT> {
        return new BN(0) as DOT;
    }

    async getLatestBTCBlockFromBTCRelay(): Promise<H256Le> {
        return await this.api.query.btcRelay.bestBlock();
    }

    async getLatestBTCBlockFromBTCCore(): Promise<import("axios").AxiosResponse<number>> {
        const basePath = "https://blockstream.info/api";
        const blockApi = new esplora.BlockApi({basePath: basePath});
        return await blockApi.getLastBlockHeight();
    }

    async getMonitoredVaultsCollateralizationRate() {
        return this.vaults.list();
    }

    async getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]> {
        const lastBTCDOTExchangeRate = await this.api.query.exchangeRateOracle.exchangeRate();
        const lastBTCDOTExchangeRateTime = await this.api.query.exchangeRateOracle.lastExchangeRateTime();
        return [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime]
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
