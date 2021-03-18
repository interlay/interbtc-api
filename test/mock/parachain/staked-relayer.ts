import { DOT, ErrorCode, StakedRelayer, StatusCode, StatusUpdate } from "../../../src/interfaces/default";
import { u32, u64, u128, u256 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import BN from "bn.js";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { GenericAccountId } from "@polkadot/types/generic";
import { PendingStatusUpdate, StakedRelayerAPI } from "../../../src/parachain/staked-relayer";
import Big from "big.js";
import { AddressOrPair } from "@polkadot/api/types";

function createStatusUpdate(): { id: u256; statusUpdate: StatusUpdate } {
    const registry = new TypeRegistry();
    const statusCode = new (registry.createClass("StatusCode"))(registry, { error: true });
    const statusUpdate = new (registry.createClass("StatusUpdate"))(registry, { statusCode });
    return { id: new UInt(registry, 0), statusUpdate: statusUpdate };
}

export class MockStakedRelayerAPI implements StakedRelayerAPI {
    registry = new TypeRegistry();

    register(_planckStake: BN): Promise<void> {
        return Promise.resolve();
    }
    suggestStatusUpdate(
        _depositPlanck: BN,
        _statusCode: StatusCode,
        _message: string, 
        _addError?: ErrorCode, 
        _removeError?: string, 
        _blockHash?: string
    ): Promise<void> {
        return Promise.resolve();
    }
    suggestInvalidBlock(_deposit: BN, _blockHash: string, _message: string): Promise<void> {
        return Promise.resolve();
    }
    voteOnStatusUpdate(_statusUpdateId: BN, _approve: boolean): Promise<void> {
        return Promise.resolve();
    }

    setAccount(_account: AddressOrPair): void {
        return;
    }

    async list(): Promise<StakedRelayer[]> {
        return [
            <StakedRelayer>{
                stake: new BN(10.2) as DOT,
            },
            <StakedRelayer>{
                stake: new BN(11.9) as DOT,
            },
        ];
    }

    async map(): Promise<Map<AccountId, StakedRelayer>> {
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";
        return new Map([
            [new GenericAccountId(this.registry, decodedAccountId), <StakedRelayer>{ stake: new BN(10.2) as DOT }],
            [new GenericAccountId(this.registry, decodedAccountId), <StakedRelayer>{ stake: new BN(11.9) as DOT }],
        ]);
    }

    getPagedIterator(_perPage: number): AsyncGenerator<StakedRelayer[]> {
        return {} as AsyncGenerator<StakedRelayer[]>;
    }

    get(_activeStakedRelayerId: AccountId): Promise<StakedRelayer> {
        return Promise.resolve(<StakedRelayer>{});
    }

    deregister(): Promise<void> {
        return Promise.resolve();
    }

    async isStakedRelayerActive(_stakedRelayerId: AccountId): Promise<boolean> {
        return true;
    }

    async isStakedRelayerInactive(_stakedRelayerId: AccountId): Promise<boolean> {
        return false;
    }

    async getStakedDOTAmount(_activeStakedRelayerId: AccountId): Promise<DOT> {
        return Promise.resolve(new BN(101456) as DOT);
    }

    numberToDOT(x: number): DOT {
        return new BN(x) as DOT;
    }

    async getStakedDOTAmounts(): Promise<DOT[]> {
        const mockStakedDOTAmounts: DOT[] = [0.04, 4, 12].map((x) => this.numberToDOT(x));
        return Promise.resolve(mockStakedDOTAmounts);
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
        return new BN(120.6) as DOT;
    }

    async getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>> {
        return new Map<AccountId, Big>();
    }

    async getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]> {
        const registry = new TypeRegistry();
        return [new UInt(registry, 123), new UInt(registry, 1600793494) as Moment];
    }

    async getCurrentStateOfBTCParachain(): Promise<StatusCode> {
        return <StatusCode>{
            isRunning: true,
            isError: false,
            isShutdown: false,
        };
    }

    async getOngoingStatusUpdateVotes(): Promise<Array<PendingStatusUpdate>> {
        return [
            {
                statusUpdateStorageKey: new u64(this.registry, 1),
                statusUpdateEnd: new u32(this.registry, 11208) as BlockNumber,
                statusUpdateAyes: 5,
                statusUpdateNays: 5,
            },
        ];
    }

    async getAllActiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        return [createStatusUpdate()];
    }

    async getAllInactiveStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        return [createStatusUpdate()];
    }

    async getAllStatusUpdates(): Promise<Array<{ id: u256; statusUpdate: StatusUpdate }>> {
        return [createStatusUpdate()];
    }

    async getFeesPolkaBTC(_stakedRelayerId: AccountId): Promise<string> {
        return "10.22";
    }

    async getFeesDOT(_stakedRelayerId: AccountId): Promise<string> {
        return "10.22";
    }

    async getAPY(_stakedRelayerId: AccountId): Promise<string> {
        return "130.23988247";
    }

    async getSLA(_stakedRelayerId: AccountId): Promise<number> {
        return 20;
    }

    async getMaxSLA(): Promise<number> {
        return 100;
    }

    async getStakedRelayersMaturityPeriod(): Promise<BlockNumber> {
        return new BN(11208) as BlockNumber;
    }
}
