import { ApiPromise } from "@polkadot/api";
import { Codec } from "@polkadot/types/types";
import { xxhashAsHex, blake2AsHex } from "@polkadot/util-crypto";
import { AddressOrPair } from "@polkadot/api/types";

import { DefaultTransactionAPI } from "../parachain";
import { stripHexPrefix } from "./encoding";

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

export async function setRawStorage(
    api: ApiPromise,
    key: string,
    value: Codec,
    account: AddressOrPair,
    isLittleEndian = true
): Promise<void> {
    await setStorageAtKey(api, key, value.toHex(isLittleEndian), account);
}

export async function setStorageAtKey(
    api: ApiPromise,
    key: string,
    data: `0x${string}`,
    sudoAccount: AddressOrPair
): Promise<void> {
    const tx = api.tx.sudo.sudo(api.tx.system.setStorage([[key, data]]));
    await DefaultTransactionAPI.sendLogged(api, sudoAccount, tx, undefined, true);
}
