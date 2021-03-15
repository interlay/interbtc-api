import { ReplaceAPI } from "../../parachain";
import { BlockNumber } from "@polkadot/types/interfaces";
import { PolkaBTC, DOT } from "../../interfaces/default";
import BN from "bn.js";
import { ReplaceRequestExt } from "../../parachain/replace";
import { AccountId } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";

export class MockReplaceAPI implements ReplaceAPI {
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

    async request(_amount: PolkaBTC): Promise<void> {
        return;
    }
}
