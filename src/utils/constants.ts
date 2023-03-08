import Big from "big.js";

// https://github.com/paritytech/substrate/blob/8ae4738bd7ee57556ea42c33600dc95488b58db6/primitives/arithmetic/src/fixed_point.rs#L2200
export const FIXEDI128_SCALING_FACTOR = 18;

// https://github.com/paritytech/substrate/blob/8ae4738bd7ee57556ea42c33600dc95488b58db6/primitives/arithmetic/src/per_things.rs#L1881
export const PERMILL_BASE = 1000000;

// IssueCompleted errors occur due to the vault having
// already auto-executed the issuance
export const IGNORED_ERROR_MESSAGES = ["issue.IssueCompleted"];

export const ACCOUNT_NOT_SET_ERROR_MESSAGE = "cannot sign transaction without setting account";

export const MS_PER_YEAR = Big(1000 * 60 * 60 * 24 * 365);

export const BLOCK_TIME_SECONDS = 12;

export const SLEEP_TIME_MS = 1000;

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}