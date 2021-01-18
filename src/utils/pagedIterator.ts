import { IssueRequest, Vault, RedeemRequest, StakedRelayer } from "../interfaces/default";
import { AugmentedQuery, PaginationOptions } from "@polkadot/api/types";
import { StorageKey } from "@polkadot/types/primitive";
import { Codec, Observable, CodecArg } from "@polkadot/types/types";
import { QueryableStorageEntry, ApiTypes } from "@polkadot/api/types";

export type PolkadotCodecType = IssueRequest | RedeemRequest | Vault | StakedRelayer;

export async function* pagedIterator<T extends PolkadotCodecType>(
    polkadotListings: AugmentedQuery<ApiTypes, (arg: CodecArg) => Observable<T>> & QueryableStorageEntry<ApiTypes>,
    perPage: number
): AsyncGenerator<T[]> {
    let startKey = undefined;
    let issueRequests: [StorageKey, Codec][];
    while (true) {
        perPage = await nextPageLength(polkadotListings, perPage, startKey);
        if (!perPage) {
            break;
        }
        issueRequests = await listPaged(polkadotListings, perPage, startKey);
        startKey = issueRequests[issueRequests.length - 1][0];
        yield issueRequests.map((v) => v[1] as T);
    }
}

async function listPaged<T extends PolkadotCodecType>(
    // eslint-disable-next-line max-len
    polkadotListings: AugmentedQuery<ApiTypes, (arg: CodecArg) => Observable<T>> & QueryableStorageEntry<ApiTypes>,
    perPage: number,
    startKey?: StorageKey
): Promise<[StorageKey, Codec][]> {
    const start = startKey ? startKey.toHex() : undefined;
    return (await polkadotListings.entriesPaged({ pageSize: perPage, startKey: start } as PaginationOptions)) as [
        StorageKey,
        Codec
    ][];
}

async function nextPageLength<T extends PolkadotCodecType>(
    // eslint-disable-next-line max-len
    polkadotListings: AugmentedQuery<ApiTypes, (arg: CodecArg) => Observable<T>> & QueryableStorageEntry<ApiTypes>,
    perPage: number,
    startKey?: StorageKey
): Promise<number> {
    // requesting ENTRIES using the last key as a cut-off point throws a substrate
    // error however, requesting KEYS with the last key only returns an empty array
    // the latter method can be used to check if all entries were "consumed"
    let keys: StorageKey[] = [];
    const start = startKey ? startKey.toHex() : undefined;
    keys = (await polkadotListings.keysPaged({
        pageSize: perPage,
        startKey: start,
    } as PaginationOptions)) as StorageKey[];
    return keys.length;
}
