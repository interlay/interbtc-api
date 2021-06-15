import { Balance, BalanceOf, BlockNumber, Moment, RuntimeDbWeight } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { Vec } from "@polkadot/types/codec";
import { WeightToFeeCoefficient } from "@polkadot/types/interfaces/support";

/**
 * @category InterBTC Bridge
 * The type Big represents Wrapped or Collateral token denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface ConstantsAPI {
    /**
     * @returns The minimum amount of DOT required to keep an account open.
     */
    getDotExistentialDeposit(): Balance;
    /**
     * @returns The minimum amount of InterBTC required to keep an account open.
     */
    getInterBtcExistentialDeposit(): Balance;
    /**
     * @returns Maximum number of block number to block hash mappings to keep (oldest pruned first).
     */
    getSystemBlockHashCount(): BlockNumber;
    /**
     * @returns The weight of database operations that the runtime can invoke.
     */
    getSystemDbWeight(): RuntimeDbWeight;
    /**
     * @returns The minimum period between blocks. Beware that this is different to the *expected* period
     * that the block production apparatus provides. Your chosen consensus system will generally
     * work with this to determine a sensible block time. e.g. For Aura, it will be double this
     * period on default settings.
     */
    getTimestampMinimumPeriod(): Moment;
    /**
     * @returns The fee to be paid for making a transaction; the per-byte portion.
     */
    getTransactionByteFee(): BalanceOf;
    /**
     * @returns The polynomial that is applied in order to derive fee from weight.
     */
    getTransactionWeightToFee(): Vec<WeightToFeeCoefficient>;
}

export class DefaultConstantsAPI implements ConstantsAPI {
    constructor(private api: ApiPromise) {}

    getDotExistentialDeposit(): Balance {
        return this.api.consts.collateral.existentialDeposit;
    }

    getInterBtcExistentialDeposit(): Balance {
        return this.api.consts.wrapped.existentialDeposit;
    }

    getSystemBlockHashCount(): BlockNumber {
        return this.api.consts.system.blockHashCount;
    }

    getSystemDbWeight(): RuntimeDbWeight {
        return this.api.consts.system.dbWeight;
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
