import { Collateral, ErrorCode, StatusCode } from "../../../src/interfaces/default";
import { u32, u64, u128, Bytes } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import BN from "bn.js";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { PendingStatusUpdate, StakedRelayerAPI } from "../../../src/parachain/staked-relayer";
import Big from "big.js";
import { AddressOrPair } from "@polkadot/api/types";
import { MockTransactionAPI } from "../transaction";

export class MockStakedRelayerAPI extends MockTransactionAPI implements StakedRelayerAPI {
    list(): Promise<AccountId[]> {
        throw new Error("Method not implemented.");
    }
    getWrappingFees(stakedRelayerId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getCollateralFees(stakedRelayerId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    reportVaultTheft(vaultId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        throw new Error("Method not implemented.");
    }
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

    deregister(): Promise<void> {
        return Promise.resolve();
    }

    async isStakedRelayerActive(_stakedRelayerId: AccountId): Promise<boolean> {
        return true;
    }

    async isStakedRelayerInactive(_stakedRelayerId: AccountId): Promise<boolean> {
        return false;
    }

    async getStakedDOTAmount(_activeStakedRelayerId: AccountId): Promise<Collateral> {
        return Promise.resolve(new BN(101456) as Collateral);
    }

    numberToDOT(x: number): Collateral {
        return new BN(x) as Collateral;
    }

    async getStakedDOTAmounts(): Promise<Collateral[]> {
        const mockStakedDOTAmounts: Collateral[] = [0.04, 4, 12].map((x) => this.numberToDOT(x));
        return Promise.resolve(mockStakedDOTAmounts);
    }

    async getTotalStakedDOTAmount(): Promise<Collateral> {
        const stakedDOTAmounts: Collateral[] = await this.getStakedDOTAmounts();
        if (stakedDOTAmounts.length) {
            const sumReducer = (accumulator: Collateral, currentValue: Collateral) => accumulator.add(currentValue) as Collateral;
            return stakedDOTAmounts.reduce(sumReducer);
        }
        return new BN(0) as Collateral;
    }

    async getFeesEarned(_activeStakedRelayerId: AccountId): Promise<Collateral> {
        return new BN(120.6) as Collateral;
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

    async getFeesWrapped(_stakedRelayerId: AccountId): Promise<Big> {
        return new Big("10.22");
    }

    async getFeesCollateral(_stakedRelayerId: AccountId): Promise<Big> {
        return new Big("10.22");
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
