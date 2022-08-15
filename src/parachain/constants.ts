import { BlockNumber, Moment, RuntimeDbWeight } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";

/**
 * @category BTC Bridge
 * The type Big represents Wrapped or Collateral token denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface ConstantsAPI {
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
}

export class DefaultConstantsAPI implements ConstantsAPI {
    constructor(private api: ApiPromise) {}

    getSystemBlockHashCount(): BlockNumber {
        return this.api.consts.system.blockHashCount;
    }

    getSystemDbWeight(): RuntimeDbWeight {
        return this.api.consts.system.dbWeight;
    }

    getTimestampMinimumPeriod(): Moment {
        return this.api.consts.timestamp.minimumPeriod;
    }
}
