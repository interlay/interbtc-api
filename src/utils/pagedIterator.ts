import { Issue as IssueRequest, Vault, Redeem, ActiveStakedRelayer } from "../interfaces/default";
import { AugmentedQuery, PaginationOptions } from "@polkadot/api/types";
import { StorageKey } from "@polkadot/types/primitive";
import { Codec, Observable, CodecArg } from "@polkadot/types/types";
import { ApiPromise } from "@polkadot/api";
import { QueryableStorageEntry, ApiTypes } from "@polkadot/api/types";

export type PolkadotCodecType = IssueRequest | Redeem | Vault | ActiveStakedRelayer;

export async function* pagedIterator<T extends PolkadotCodecType>(
    api: ApiPromise,
    polkadotListings: AugmentedQuery<ApiTypes, (arg: CodecArg) => Observable<T>> & QueryableStorageEntry<ApiTypes>,
    perPage: number
): AsyncGenerator<T[]> {
    let startKey: StorageKey = api.createType("Bytes", "") as StorageKey;
    let issueRequests: [StorageKey, Codec][];
    while (true) {
        // a blank StorageKey is 0x in hex
        if (startKey.toHex() == "0x") {
            if (!isRemainingListNonempty(polkadotListings)) {
                return undefined;
            }
            issueRequests = await listPaged(polkadotListings, perPage);
        } else {
            if (!isRemainingListNonempty(polkadotListings, startKey)) {
                return undefined;
            }
            const keys = await api.query.issue.issueRequests.keysPaged(
                { pageSize: perPage, startKey: startKey.toHex() } as PaginationOptions
            );
            if (keys.length) {
                issueRequests = await listPaged(polkadotListings, perPage, startKey);
            } else {
                return undefined;
            }
        }

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
    let issueRequests: [StorageKey, Codec][] = [];

    if (startKey) {
        issueRequests =
            await polkadotListings.entriesPaged(
                { pageSize: perPage, startKey: startKey.toHex() } as PaginationOptions
            ) as [StorageKey, Codec][];
    } else {
        issueRequests =
            await polkadotListings.entriesPaged(
                { pageSize: perPage } as PaginationOptions
            ) as [StorageKey, Codec][];
    }
    return issueRequests;
}

async function isRemainingListNonempty<T extends PolkadotCodecType>(
    // eslint-disable-next-line max-len
    polkadotListings: AugmentedQuery<ApiTypes, (arg: CodecArg) => Observable<T>> & QueryableStorageEntry<ApiTypes>,
    startKey?: StorageKey
): Promise<boolean> {
    // requesting ENTRIES using the last key as a cut-off point throws a substrate 
    // error however, requesting KEYS with the last key only returns an empty array
    // the latter method can be used to check if all entries were "consumed"
    let keys: StorageKey[] = [];
    const minimumPageSize = 1;
    if (startKey) {
        keys = await polkadotListings.keysPaged(
            { pageSize: minimumPageSize, startKey: startKey.toHex() } as PaginationOptions
        ) as StorageKey[];
    } else {
        keys = await polkadotListings.keysPaged(
            { pageSize: minimumPageSize } as PaginationOptions
        ) as StorageKey[];
    }
    return keys.length > 0;
}
