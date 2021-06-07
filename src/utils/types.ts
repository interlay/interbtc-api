import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";

export function newAccountId(api: ApiPromise, accountId: string): AccountId {
    return api.createType("AccountId", accountId);
}