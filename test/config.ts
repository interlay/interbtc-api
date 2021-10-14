import { REGTEST_ESPLORA_BASE_PATH } from "../src/external/electrs";

// The default config is for regtest and a local standalone parachain, started using docker-compose
const DEFAULT_PARACHAIN_ENDPOINT = "ws://127.0.0.1:9944";
const DEFAULT_FAUCET_ENDPOINT = "http://0.0.0.0:3036";
const DEFAULT_BITCOIN_CORE_NETWORK = "regtest";
const DEFAULT_BITCOIN_CORE_HOST = "0.0.0.0";
const DEFAULT_BITCOIN_CORE_USERNAME = "rpcuser";
const DEFAULT_BITCOIN_CORE_PASSWORD = "rpcpassword";
const DEFAULT_BITCOIN_CORE_PORT = "18443";
const DEFAULT_BITCOIN_CORE_WALLET = "Alice";
const DEFAULT_REDEEM_ADDRESS = "bcrt1qed0qljupsmqhxul67r7358s60reqa2qtte0kay";
const DEFAULT_USER_1_URI="//Dave";
const DEFAULT_USER_2_URI="//Eve";
const DEFAULT_ORACLE_URI="//Bob";
const DEFAULT_VAULT_1="//Charlie//stash";
const DEFAULT_VAULT_2="//Dave//stash";
const DEFAULT_VAULT_3="//Eve//stash";
const DEFAULT_VAULT_TO_LIQUIDATE="//Ferdie//stash";
const DEFAULT_VAULT_TO_BAN="//Ferdie";
const DEFAULT_SUDO_URI="//Alice";

// Use the config set in the environment, or fallback to the config for local testing
export const PARACHAIN_ENDPOINT = process.env.PARACHAIN_ENDPOINT || DEFAULT_PARACHAIN_ENDPOINT;
export const FAUCET_ENDPOINT = process.env.FAUCET_ENDPOINT || DEFAULT_FAUCET_ENDPOINT;
export const BITCOIN_CORE_NETWORK = process.env.BITCOIN_CORE_NETWORK || DEFAULT_BITCOIN_CORE_NETWORK;
export const BITCOIN_CORE_HOST = process.env.BITCOIN_CORE_HOST || DEFAULT_BITCOIN_CORE_HOST;
export const BITCOIN_CORE_USERNAME = process.env.BITCOIN_CORE_USERNAME || DEFAULT_BITCOIN_CORE_USERNAME;
export const BITCOIN_CORE_PASSWORD = process.env.BITCOIN_CORE_PASSWORD || DEFAULT_BITCOIN_CORE_PASSWORD;
export const BITCOIN_CORE_PORT = process.env.BITCOIN_CORE_PORT || DEFAULT_BITCOIN_CORE_PORT;
export const BITCOIN_CORE_WALLET = process.env.BITCOIN_CORE_WALLET || DEFAULT_BITCOIN_CORE_WALLET;
export const REDEEM_ADDRESS = process.env.REDEEM_ADDRESS || DEFAULT_REDEEM_ADDRESS;

export const USER_1_URI = process.env.USER_1_URI || DEFAULT_USER_1_URI;
export const USER_2_URI = process.env.USER_2_URI || DEFAULT_USER_2_URI;

export const ORACLE_URI = process.env.ORACLE_URI || DEFAULT_ORACLE_URI;

export const VAULT_1 = process.env.VAULT_1 || DEFAULT_VAULT_1;
export const VAULT_2 = process.env.VAULT_2 || DEFAULT_VAULT_2;
export const VAULT_3 = process.env.VAULT_3 || DEFAULT_VAULT_3;
export const VAULT_TO_LIQUIDATE = process.env.VAULT_TO_LIQUIDATE || DEFAULT_VAULT_TO_LIQUIDATE;
export const VAULT_TO_BAN = process.env.VAULT_TO_BAN || DEFAULT_VAULT_TO_BAN;

export const SUDO_URI = process.env.SUDO_URI || DEFAULT_SUDO_URI;

export const ESPLORA_BASE_PATH = process.env.SUDO_URI || REGTEST_ESPLORA_BASE_PATH;
