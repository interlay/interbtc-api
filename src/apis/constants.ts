import { Balance, BalanceOf, BlockNumber, Moment, RuntimeDbWeight, Weight } from "@polkadot/types/interfaces/runtime";
import { DOT } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { u32, u64 } from "@polkadot/types/primitive";
import { Vec } from "@polkadot/types/codec";
import { WeightToFeeCoefficient } from "@polkadot/types/interfaces/support";

export interface ConstantsAPI {
    getDotExistentialDeposit(): Balance;
    getPolkaBtcExistentialDeposit(): Balance;
    getStakedRelayersMinimumDeposit(): DOT;
    getStakedRelayersMinimumStake(): DOT;
    getStakedRelayersVotingPeriod(): BlockNumber;
    getSystemBlockExecutionWeight(): Weight;
    getSystemBlockHashCount(): BlockNumber;
    getSystemDbWeight(): RuntimeDbWeight;
    getSystemExtrinsicBaseWeight(): Weight;
    getSystemMaximumBlockLength(): u32;
    getSystemMaximumBlockWeight(): Weight;
    getTimestampMinimumPeriod(): Moment;
    getTransactionByteFee(): BalanceOf;
    getTransactionWeightToFee(): Vec<WeightToFeeCoefficient>;
}

export class DefaultConstantsAPI implements ConstantsAPI {
    constructor(private api: ApiPromise) {}

    /**
     * @returns The minimum amount of DOT required to keep an account open.
     */
    getDotExistentialDeposit(): Balance {
        return this.api.consts.dot.existentialDeposit;
    }

    /**
     * @returns The minimum amount of PolkaBTC required to keep an account open.
     */
    getPolkaBtcExistentialDeposit(): Balance {
        return this.api.consts.polkaBtc.existentialDeposit;
    }

    /**
     * @returns The minimum amount of deposit required to propose an update
     */
    getStakedRelayersMinimumDeposit(): DOT {
        return this.api.consts.stakedRelayers.minimumDeposit;
    }

    /**
     * @returns The minimum amount of stake required to participate
     */
    getStakedRelayersMinimumStake(): DOT {
        return this.api.consts.stakedRelayers.minimumStake;
    }

    /**
     * @returns How often (in blocks) to check for new votes
     */
    getStakedRelayersVotingPeriod(): BlockNumber {
        return this.api.consts.stakedRelayers.votingPeriod;
    }

    /**
     * @returns The weight of the overhead invoked on the block import process, independent of the
     * extrinsics included in that block.
     */
    getSystemBlockExecutionWeight(): Weight {
        return this.api.consts.system.blockExecutionWeight;
    }

    /**
     * @returns Maximum number of block number to block hash mappings to keep (oldest pruned first).
     */
    getSystemBlockHashCount(): BlockNumber {
        return this.api.consts.system.blockHashCount;
    }

    /**
     * @returns The weight of database operations that the runtime can invoke.
     */
    getSystemDbWeight(): RuntimeDbWeight {
        return this.api.consts.system.dbWeight;
    }

    /**
     * @returns The base weight of any extrinsic processed by the runtime, independent of the 
     * logic of that extrinsic. (Signature verification, nonce increment, fee, etc...)
     */
    getSystemExtrinsicBaseWeight(): Weight {
        return this.api.consts.system.extrinsicBaseWeight;
    }

    /**
     * @returns Maximum size of all encoded transactions (in bytes) that are allowed in one block.
     */
    getSystemMaximumBlockLength(): u32 {
        return this.api.consts.system.maximumBlockLength;
    }

    /**
     * Weights are a fixed number designed to manage the time is takes to validate a block. 
     * Each transaction has a base weight that accounts for the overhead of inclusion 
     * (e.g. signature verification) as well as a dispatch weight that accounts for the 
     * time to execute the transaction. 
     * @returns The maximum weight allowed by the parachain, currently 2 seconds of compute with a 6 second average block time.
     */
    getSystemMaximumBlockWeight(): Weight {
        return this.api.consts.system.maximumBlockWeight;
    }

    /**
     * @returns The minimum period between blocks. Beware that this is different to the *expected* period
     * that the block production apparatus provides. Your chosen consensus system will generally
     * work with this to determine a sensible block time. e.g. For Aura, it will be double this
     * period on default settings.
     */
    getTimestampMinimumPeriod(): Moment {
        return this.api.consts.timestamp.minimumPeriod;
    }

    /**
     * @returns The fee to be paid for making a transaction; the per-byte portion.
     */
    getTransactionByteFee(): BalanceOf {
        return this.api.consts.transactionPayment.transactionByteFee;
    }

    /**
     * @returns The polynomial that is applied in order to derive fee from weight.
     */
    getTransactionWeightToFee(): Vec<WeightToFeeCoefficient> {
        return this.api.consts.transactionPayment.weightToFee;
    }
}
