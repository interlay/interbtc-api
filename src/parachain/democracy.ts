import { ApiPromise } from "@polkadot/api";
import { DemocracyVote } from "@polkadot/types/lookup";

import { addHexPrefix } from "../utils/encoding";
import { TransactionAPI } from "..";

/**
 * @category InterBTC Bridge
 */
export interface DemocracyAPI {
    /**
     * @param proposalHash The hash of the current external proposal
     * @param delay The number of block after voting has ended in approval
     * and this should be enacted. This doesn't have a minimum amount
     */
    fastTrack(
        proposalHash: string,
        delay: number
    ): Promise<void>;
    /**
     * @param proposalHash the hash of the proposal preimage
     * @param value the amount of deposit (must be at least `MinimumDeposit`)
     */
    propose(
        proposalHash: string,
        value: number
    ): Promise<void>;
    /**
     * @param proposal the index of the proposal to second
     * @param upperBound an upper bound on the current number of seconds on this
     * proposal. Extrinsic is weighted according to this value with no refund
     */
    second(
        proposal: string,
        upperBound: number
    ): Promise<void>;
    /**
     * @param referendumIndex the index of the referendum to vote for
     * @param vote the vote configuration
     */
    vote(
        referendumIndex: number,
        vote: DemocracyVote
    ): Promise<void>;
    /**
     * @param referendumIndex the index of referendum of the vote to be removed
     */
    removeVote(
        referendumIndex: number
    ): Promise<void>;
}

export class DefaultDemocracyAPI implements DemocracyAPI {
    constructor(
        private api: ApiPromise, 
        private transactionAPI: TransactionAPI
    ) {}

    async fastTrack(
        proposalHash: string,
        delay: number
    ): Promise<void> {
        const parsedHash = this.api.createType("H256", addHexPrefix(proposalHash));
        const tx = this.api.tx.democracy.fastTrack(parsedHash, delay);
        await this.transactionAPI.sendLogged(tx, this.api.events.democracy.Passed);
    }

    async propose(
        proposalHash: string,
        value: number
    ): Promise<void> {
        const parsedHash = this.api.createType("H256", addHexPrefix(proposalHash));
        const tx = this.api.tx.democracy.propose(parsedHash, value);
        await this.transactionAPI.sendLogged(tx, this.api.events.democracy.Passed);
    }

    async second(
        proposal: string,
        upperBound: number
    ): Promise<void> {
        const parsedHash = this.api.createType("H256", addHexPrefix(proposal));
        const tx = this.api.tx.democracy.second(parsedHash, upperBound);
        await this.transactionAPI.sendLogged(tx, this.api.events.democracy.Passed);
    }

    async vote(
        referendumIndex: number,
        vote: DemocracyVote
    ): Promise<void> {
        const tx = this.api.tx.democracy.vote(referendumIndex, vote);
        await this.transactionAPI.sendLogged(tx, this.api.events.democracy.Passed);
    }

    async removeVote(
        referendumIndex: number
    ): Promise<void> {
        const tx = this.api.tx.democracy.removeVote(referendumIndex);
        await this.transactionAPI.sendLogged(tx, this.api.events.democracy.Passed);
    }

}
