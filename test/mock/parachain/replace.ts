import { ReplaceAPI } from "../../../src/parachain";
import { BlockNumber } from "@polkadot/types/interfaces";
import { PolkaBTC, DOT } from "../../../src/interfaces/default";
import BN from "bn.js";
import { ReplaceRequestExt } from "../../../src/parachain/replace";
import { AccountId } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";

export class MockReplaceAPI implements ReplaceAPI {
    withdraw(_requestId: string): Promise<void> {
        return Promise.resolve();
    }
    
    setAccount(_account: AddressOrPair): void {
        return;
    }
    
    async getBtcDustValue(): Promise<PolkaBTC> {
        return Promise.resolve(new BN(1) as PolkaBTC);
    }

    async getGriefingCollateralRate(): Promise<DOT> {
        return Promise.resolve(new BN(12) as DOT);
    }

    async getReplacePeriod(): Promise<BlockNumber> {
        return Promise.resolve(new BN(12) as BlockNumber);
    }

    async list(): Promise<ReplaceRequestExt[]> {
        return Promise.resolve([]);
    }

    async map(): Promise<Map<AccountId, ReplaceRequestExt>> {
        return Promise.resolve(new Map<AccountId, ReplaceRequestExt>());
    }

    async request(_amount: PolkaBTC): Promise<string> {
        return "0x41fd1760b07dc5bc3b1548b6ffdd057444fb3a426460a199a6e2d42a7960e83c";
    }
}
