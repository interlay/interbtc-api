import { ApiPromise } from "@polkadot/api";
import { Codec } from "@polkadot/types/types";
import { AddressOrPair } from "@polkadot/api/types";

import { DefaultTransactionAPI } from "../parachain";

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
