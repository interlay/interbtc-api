import { ReplaceAPI } from "../../parachain";
import { BlockNumber } from "@polkadot/types/interfaces";
import { PolkaBTC, DOT } from "../../interfaces/default";
import BN from "bn.js";
import { ReplaceRequestExt } from "../../parachain/replace";
import { AccountId } from "@polkadot/types/interfaces";

export class MockReplaceAPI implements ReplaceAPI {
    async getBtcDustValue(): Promise<PolkaBTC> {
        return Promise.resolve(new BN(1) as PolkaBTC);
    }

    async getGriefingCollateral(): Promise<DOT> {
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
}
