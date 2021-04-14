export const PERCENTAGE_GRANULARITY = 3;
export const FIXEDI128_SCALING_FACTOR = 18;

// IssueCompleted errors occur due to the vault having
// already auto-executed the issuance
export const IGNORED_ERROR_MESSAGES = ["issue.IssueCompleted"];

export const ACCOUNT_NOT_SET_ERROR_MESSAGE = "cannot request without setting account";

export const mainnetApiBasePath = "https://blockstream.info/api";
export const testnetApiBasePath = "https://electr-testnet.do.polkabtc.io";
export const regtestApiBasePath = "http://0.0.0.0:3002";
