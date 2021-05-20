import { xxhashAsHex } from "@polkadot/util-crypto";
import { bnToHex } from "@polkadot/util";
import { StorageKey, Bytes } from "@polkadot/types/primitive";
import { ApiPromise } from "@polkadot/api";
import BN from "bn.js";
import { ITuple } from "@polkadot/types/types";

import { stripHexPrefix } from "..";
import { TransactionAPI } from "../parachain";

export function getStorageKey(moduleName: string, storageItemName: string): string {
    return xxhashAsHex(moduleName, 128) + stripHexPrefix(xxhashAsHex(storageItemName, 128));
}

export async function setNumericStorage(
    api: ApiPromise,
    moduleName: string,
    storageItemName: string,
    value: BN,
    transactionAPI: TransactionAPI,
    bits = 32,
    isLittleEndian = true
): Promise<void> {
    const key = getStorageKey(moduleName, storageItemName);
    const data = bnToHex(value, bits, isLittleEndian);
    const storageKey = api.createType("StorageKey", key);
    const storageData = api.createType("StorageData", data);
    const tx = api.tx.sudo
        .sudo(
            api.tx.system.setStorage([[storageKey, storageData] as ITuple<[StorageKey, Bytes]>])
        );
    await transactionAPI.sendLogged(tx);
}