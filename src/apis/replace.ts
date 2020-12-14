import { ApiPromise } from "@polkadot/api";
import { DOT, PolkaBTC, ReplaceRequest } from "../interfaces/default";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";
import { Network } from "bitcoinjs-lib";
import { encodeBtcAddress } from "../utils/bitcoin";

export interface ReplaceRequestExt extends Omit<ReplaceRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeReplaceRequest(req: ReplaceRequest, network: Network): ReplaceRequestExt {
    const { btc_address, ...obj } = req;
    return Object.assign(
        {
            btc_address: encodeBtcAddress(btc_address, network),
        },
        obj
    ) as ReplaceRequestExt;
}

export interface ReplaceAPI {
    getBtcDustValue(): Promise<PolkaBTC>;
    getGriefingCollateral(): Promise<DOT>;
    getReplacePeriod(): Promise<BlockNumber>;
    list(): Promise<ReplaceRequestExt[]>;
    listWithId(): Promise<[string, ReplaceRequestExt][]>;
}

export class DefaultReplaceAPI implements ReplaceAPI {
    private btcNetwork: Network;

    constructor(private api: ApiPromise, btcNetwork: Network) {
        this.btcNetwork = btcNetwork;
    }

    async getBtcDustValue(): Promise<PolkaBTC> {
        return await this.api.query.replace.replaceBtcDustValue();
    }

    async getGriefingCollateral(): Promise<DOT> {
        return await this.api.query.fee.replaceGriefingCollateral();
    }

    async getReplacePeriod(): Promise<BlockNumber> {
        return await this.api.query.replace.replacePeriod();
    }

    async list(): Promise<ReplaceRequestExt[]> {
        const replaceRequests = await this.api.query.replace.replaceRequests.entries();
        return replaceRequests
            .filter((v) => v[1].isSome)
            .map((v) => v[1].unwrap())
            .map((req: ReplaceRequest) => encodeReplaceRequest(req, this.btcNetwork));
    }

    private storageKeyToIdString(s: StorageKey): string {
        return s.args.map((k) => k.toString())[0];
    }

    async listWithId(): Promise<[string, ReplaceRequestExt][]> {
        const redeemRequests = await this.api.query.replace.replaceRequests.entries();
        return redeemRequests
            .filter((v) => v[1].isSome)
            .map((v) => {
                return { id: v[0], req: v[1].unwrap() };
            })
            .map(({ id, req }) => {
                return [this.storageKeyToIdString(id), encodeReplaceRequest(req, this.btcNetwork)];
            });
    }
}
