import { Balance, BalanceOf, BlockNumber, Moment, RuntimeDbWeight, Weight } from "@polkadot/types/interfaces/runtime";
import { DOT } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { u32, u64 } from "@polkadot/types/primitive";
import { Vec } from "@polkadot/types/codec";
import { WeightToFeeCoefficient } from "@polkadot/types/interfaces/support";

export interface ConstantsAPI {
    getDotExistentialDeposit(): Balance;
    getPolkaBtcExistentialDeposit(): Balance;
    getStakedRelayersMaturityPeriod(): BlockNumber;
    getStakedRelayersMinimumDeposit(): DOT;
    getStakedRelayersMinimumParticipants(): u64;
    getStakedRelayersMinimumStake(): DOT;
    getStakedRelayersVoteThreshold(): u64;
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

    getDotExistentialDeposit(): Balance {
        return this.api.consts.dot.existentialDeposit;
    }

    getPolkaBtcExistentialDeposit(): Balance {
        return this.api.consts.polkaBtc.existentialDeposit;
    }

    getStakedRelayersMaturityPeriod(): BlockNumber {
        return this.api.consts.stakedRelayers.maturityPeriod;
    }

    getStakedRelayersMinimumDeposit(): DOT {
        return this.api.consts.stakedRelayers.minimumDeposit;
    }

    getStakedRelayersMinimumParticipants(): u64 {
        return this.api.consts.stakedRelayers.minimumParticipants;
    }

    getStakedRelayersMinimumStake(): DOT {
        return this.api.consts.stakedRelayers.minimumStake;
    }

    getStakedRelayersVoteThreshold(): u64 {
        return this.api.consts.stakedRelayers.voteThreshold;
    }

    getStakedRelayersVotingPeriod(): BlockNumber {
        return this.api.consts.stakedRelayers.votingPeriod;
    }

    getSystemBlockExecutionWeight(): Weight {
        return this.api.consts.system.blockExecutionWeight;
    }

    getSystemBlockHashCount(): BlockNumber {
        return this.api.consts.system.blockHashCount;
    }

    getSystemDbWeight(): RuntimeDbWeight {
        return this.api.consts.system.dbWeight;
    }

    getSystemExtrinsicBaseWeight(): Weight {
        return this.api.consts.system.extrinsicBaseWeight;
    }

    getSystemMaximumBlockLength(): u32 {
        return this.api.consts.system.maximumBlockLength;
    }

    getSystemMaximumBlockWeight(): Weight {
        return this.api.consts.system.maximumBlockWeight;
    }

    getTimestampMinimumPeriod(): Moment {
        return this.api.consts.timestamp.minimumPeriod;
    }

    getTransactionByteFee(): BalanceOf {
        return this.api.consts.transactionPayment.transactionByteFee;
    }

    getTransactionWeightToFee(): Vec<WeightToFeeCoefficient> {
        return this.api.consts.transactionPayment.weightToFee;
    }
}
