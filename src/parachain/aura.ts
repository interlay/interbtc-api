import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import { Vec } from "@polkadot/types";

/**
 * @category InterBTC Bridge
 */
export interface AuraApi {
    /**
     * @returns Array of system authorities.
     */
    getAuthorities(): Promise<Array<AccountId>>;
}

export class DefaultAuraAPI implements AuraApi {
    constructor(private api: ApiPromise) { }

    async getAuthorities(): Promise<Array<AccountId>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const api = await this.api.at(head);
        return api.query.aura.authorities<Vec<AccountId>>();
    }
}
