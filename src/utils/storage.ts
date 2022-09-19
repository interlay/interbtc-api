import { xxhashAsHex, blake2AsHex } from "@polkadot/util-crypto";
import { bnToHex } from "@polkadot/util";
import { StorageKey, Bytes } from "@polkadot/types/primitive";
import { ApiPromise } from "@polkadot/api";
import BN from "bn.js";
import { ITuple, Codec } from "@polkadot/types/types";
import { AddressOrPair } from "@polkadot/api/types";

import { stripHexPrefix } from "./encoding";
import { DefaultTransactionAPI } from "../parachain";

export function getStorageKey(moduleName: string, storageItemName: string): string {
    return xxhashAsHex(moduleName, 128) + stripHexPrefix(xxhashAsHex(storageItemName, 128));
}

export function blake2_128Concat(data: `0x${string}`): string {
    return blake2AsHex(data, 128) + stripHexPrefix(data);
}

export function getStorageMapItemKey(
    moduleName: string,
    storageItemName: string,
    mapItemKey: `0x${string}`,
    nestedMapItemKey?: `0x${string}`
): string {
    let storageKey = getStorageKey(moduleName, storageItemName) + stripHexPrefix(blake2_128Concat(mapItemKey));
    if (nestedMapItemKey) {
        storageKey += stripHexPrefix(blake2_128Concat(nestedMapItemKey));
    }
    return storageKey;
}

export async function setNumericStorage(
    api: ApiPromise,
    moduleName: string,
    storageItemName: string,
    value: BN,
    account: AddressOrPair,
    bits = 32,
    isLittleEndian = true
): Promise<void> {
    const data = bnToHex(value, { bitLength: bits, isLe: isLittleEndian });
    await setStorage(api, moduleName, storageItemName, data, account);
}

export async function setCodecStorage(
    api: ApiPromise,
    moduleName: string,
    storageItemName: string,
    value: Codec,
    account: AddressOrPair,
    isLittleEndian = true
): Promise<void> {
    const data = value.toHex(isLittleEndian);
    await setStorage(api, moduleName, storageItemName, data, account);
}

async function setStorage(
    api: ApiPromise,
    moduleName: string,
    storageItemName: string,
    data: string,
    account: AddressOrPair
): Promise<void> {
    const key = getStorageKey(moduleName, storageItemName);
    const storageKey = api.createType("StorageKey", key);
    const storageData = api.createType("StorageData", data);
    const tx = api.tx.sudo.sudo(api.tx.system.setStorage([[storageKey, storageData] as ITuple<[StorageKey, Bytes]>]));
    await DefaultTransactionAPI.sendLogged(api, account, tx, undefined, true);
}
