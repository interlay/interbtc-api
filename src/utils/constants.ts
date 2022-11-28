import Big from "big.js";

export const PERCENTAGE_GRANULARITY = 3;
export const FIXEDI128_SCALING_FACTOR = 18;
export const PERMILL_BASE = 1000000;

// IssueCompleted errors occur due to the vault having
// already auto-executed the issuance
export const IGNORED_ERROR_MESSAGES = ["issue.IssueCompleted"];

export const ACCOUNT_NOT_SET_ERROR_MESSAGE = "cannot sign transaction without setting account";

export const MS_PER_YEAR = Big(86400 * 365 * 1000);
