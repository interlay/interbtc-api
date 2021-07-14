export const PERCENTAGE_GRANULARITY = 3;
export const FIXEDI128_SCALING_FACTOR = 18;

// IssueCompleted errors occur due to the vault having
// already auto-executed the issuance
export const IGNORED_ERROR_MESSAGES = ["issue.IssueCompleted"];

export const ACCOUNT_NOT_SET_ERROR_MESSAGE = "cannot request without setting account";

export const MAINNET_ESPLORA_BASE_PATH = "https://blockstream.info/api";
export const TESTNET_ESPLORA_BASE_PATH = "https://electr-testnet.do.polkabtc.io";
export const REGTEST_ESPLORA_BASE_PATH = "http://0.0.0.0:3002";

export const INDEX_URL = process.env.INTERBTC_INDEX_SERVER_URL || "http://localhost:3007";
