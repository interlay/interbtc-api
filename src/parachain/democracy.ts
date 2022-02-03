import { ApiPromise } from "@polkadot/api";

import { addHexPrefix } from "../utils/encoding";
import { TransactionAPI } from "..";

/**
 * @category InterBTC Bridge
 */
export interface DemocracyAPI {
    /**
     * @param proposalHash
     * @param referendumIndex
     */
    enactProposal(
        proposalHash: string,
        referendumIndex: number
    ): Promise<void>;
    /**
     * @param proposalHash
     * @param delay
     */
    fastTrack(
        proposalIndex: number,
        delay: number
    ): Promise<void>;
}

export class DefaultDemocracyAPI implements DemocracyAPI {
    constructor(
        private api: ApiPromise, 
        private transactionAPI: TransactionAPI
    ) {}

    async enactProposal(
        proposalHash: string,
        referendumIndex: number
    ): Promise<void> {
        const parsedHash = this.api.createType("H256", addHexPrefix(proposalHash));
        const tx = this.api.tx.democracy.enactProposal(parsedHash, referendumIndex);
        await this.transactionAPI.sendLogged(tx, this.api.events.democracy.Passed);
    }

    async fastTrack(
        proposalIndex: number,
        delay: number
    ): Promise<void> {
        const tx = this.api.tx.democracy.fastTrack(proposalIndex, delay);
        await this.transactionAPI.sendLogged(tx, this.api.events.democracy.Passed);
    }

}
