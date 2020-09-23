import { DOT, ActiveStakedRelayer, H256Le, StatusCode, Vault } from "@interlay/polkabtc/interfaces/default";
import { u128, u32 } from "@polkadot/types/primitive";
import { AccountId, Balance, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import BN from "bn.js";
import { U8aFixed, UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";

import { StakedRelayerAPI } from "../../apis/staked-relayer";

export class MockStakedRelayerAPI implements StakedRelayerAPI {
    async list(): Promise<ActiveStakedRelayer[]> {
        return [
            <ActiveStakedRelayer>{
                stake: new BN(10.2) as DOT,
            },
            <ActiveStakedRelayer>{
                stake: new BN(11.9) as DOT,
            },
        ];
    }

    get(_activeStakedRelayerId: AccountId): Promise<ActiveStakedRelayer> {
        return Promise.resolve(<ActiveStakedRelayer>{});
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

    async getLatestBTCBlockFromBTCRelay(): Promise<H256Le> {
        const registry = new TypeRegistry();
        return new U8aFixed(registry, "00000000000f6499c8547227") as H256Le;
    }

    async getLatestBTCBlockHeightFromBTCRelay(): Promise<u32> {
        const registry = new TypeRegistry();
        return new UInt(registry, 1835342) as u32;
    }

    async getLatestBTCBlockFromBTCCore(): Promise<number | undefined> {
        return 1835346;
    }

    async getMonitoredVaultsCollateralizationRate(): Promise<Vault[]> {
        return [
            <Vault>{
                // we need to define a collateralisation rate field in Vault
            },
        ];
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

    async getOngoingStatusUpdateVotes(): Promise<Array<[BlockNumber, Balance, Balance]>> {
        const registry = new TypeRegistry();
        return [[new BN(11208) as BlockNumber, new UInt(registry, 5), new UInt(registry, 5)]];
    }
}
