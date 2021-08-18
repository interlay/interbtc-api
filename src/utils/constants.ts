export const PERCENTAGE_GRANULARITY = 3;
export const FIXEDI128_SCALING_FACTOR = 18;

// IssueCompleted errors occur due to the vault having
// already auto-executed the issuance
export const IGNORED_ERROR_MESSAGES = ["issue.IssueCompleted"];

export const ACCOUNT_NOT_SET_ERROR_MESSAGE = "cannot request without setting account";

export const MAINNET_ESPLORA_BASE_PATH = "https://blockstream.info/api";
export const TESTNET_ESPLORA_BASE_PATH = "https://btc-testnet.interlay.io";
export const REGTEST_ESPLORA_BASE_PATH = "http://localhost:3002";
