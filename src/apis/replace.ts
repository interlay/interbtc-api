import { ApiPromise } from "@polkadot/api";
import { DOT, PolkaBTC, ReplaceRequest } from "../interfaces/default";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";

export interface ReplaceAPI {
    getBtcDustValue(): Promise<PolkaBTC>;
    getGriefingCollateral(): Promise<DOT>;
    getReplacePeriod(): Promise<BlockNumber>;
    list(): Promise<ReplaceRequest[]>;
    listWithId(): Promise<[string, ReplaceRequest][]>;
}

export class DefaultReplaceAPI implements ReplaceAPI {
    constructor(private api: ApiPromise) {}

    async getBtcDustValue(): Promise<PolkaBTC> {
        return await this.api.query.replace.replaceBtcDustValue();
    }

    async getGriefingCollateral(): Promise<DOT> {
        return await this.api.query.replace.replaceGriefingCollateral();
    }

    async getReplacePeriod(): Promise<BlockNumber> {
        return await this.api.query.replace.replacePeriod();
    }

    async list(): Promise<ReplaceRequest[]> {
        const replaceRequests = await this.api.query.replace.replaceRequests.entries();
        return replaceRequests.filter((v) => v[1].isSome).map((v) => v[1].value as ReplaceRequest);
    }

    private storageKeyToIdString(s: StorageKey): string {
        return s.args.map((k) => k.toString())[0];
    }

    async listWithId(): Promise<[string, ReplaceRequest][]> {
        const redeemRequests = await this.api.query.replace.replaceRequests.entries();
        return redeemRequests
            .filter((v) => v[1].isSome)
            .map((v) => [this.storageKeyToIdString(v[0]), v[1].value as ReplaceRequest]);
    }
}
