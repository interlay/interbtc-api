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
    getSystemBlockHashCount(): BlockNumber;
    getSystemDbWeight(): RuntimeDbWeight;
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
