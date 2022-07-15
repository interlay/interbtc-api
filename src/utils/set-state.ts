/* eslint @typescript-eslint/no-var-requires: "off" */
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import { CollateralCurrency, CurrencyIdLiteral, currencyIdLiteralToMonetaryCurrency, DefaultInterBtcApi, DefaultTransactionAPI, InterbtcPrimitivesVaultId, newMonetaryAmount, setCodecStorage, VaultRegistryVault, WrappedCurrency } from "..";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT, SUDO_URI, VAULT_1_URI } from "../../test/config";
import { sudo } from "../../test/utils/helpers";
import { createSubstrateAPI } from "../factory";
import { newAccountId, newVaultId } from "./encoding";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

interface SetBalanceParams {
    value: number,
    currency: string,
    address: string
}

const getCurrencyFromSymbol = (api: DefaultInterBtcApi, symbol: string) => {
    if (!Object.values(CurrencyIdLiteral).includes(symbol as CurrencyIdLiteral)) {
        throw new Error(`Unknown currency symbol: ${symbol}`);
    }
    return currencyIdLiteralToMonetaryCurrency(api.api, symbol as CurrencyIdLiteral);
};

const setBalance = (api: DefaultInterBtcApi) => async ({ address, currency: currencySymbol, value }: SetBalanceParams) => {
    console.log(`\nSetting ${currencySymbol} balance of ${address} to ${value}...`);
    const account = newAccountId(api.api, address);

    const currency = getCurrencyFromSymbol(api, currencySymbol);

    const amount = newMonetaryAmount(value, currency);

    await sudo(api, async () => await api.tokens.setBalance(account, amount));
    console.log("OK: Balance successfully set.");
};

const getVaults = async (api: DefaultInterBtcApi) => (await api.api.query.vaultRegistry.vaults.entries());

const modifyVaultData = async (
    api: DefaultInterBtcApi,
    vaultId: InterbtcPrimitivesVaultId,
    // modifier: ((vault: VaultRegistryVault) => VaultRegistryVault)
) => {
    // TODO: fetch only vault
    const vaults = await getVaults(api);
    const vault = vaults.find(vault => vault[1].value.id.eq(vaultId));
    if (vault === undefined) {
        throw new Error(`Vault not found, vault id: ${vaultId.toHuman()}`);
    }
    console.log(vault);

    const storageKey = vault[0];

    type Writable<T> = { -readonly [k in keyof T]: Writable<T[k]> };
    type VaultData = Writable<VaultRegistryVault>;
    const modifiedVaultData = JSON.parse(JSON.stringify(vault))[1] as VaultData;

    const newIssuedTokens = api.api.createType("u128", 25000000);
    modifiedVaultData.issuedTokens = newIssuedTokens;

    const storageData = api.api.createType("Option<VaultRegistryVault>", modifiedVaultData).toHex();

    // TODO: set sudo account globally
    const keyring = new Keyring({ type: "sr25519" });
    const sudoAccount = keyring.addFromUri(SUDO_URI);

    console.log("Setting the storage...", storageKey, storageData);

    const tx = api.api.tx.sudo.sudo(api.api.tx.system.setStorage([[storageKey, storageData]]));
    await DefaultTransactionAPI.sendLogged(api.api, sudoAccount, tx, undefined, true);
    // await setCodecStorage(api.api, "vaultRegistry", "vaults", value, sudoAccount);
    console.log("Successfully set vault storage!");
};

async function main(): Promise<void> {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    const vault_1 = keyring.addFromUri(VAULT_1_URI);
    const sudoAccount = keyring.addFromUri(SUDO_URI);
    const oracleAccount = keyring.addFromUri(ORACLE_URI);

    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

    const oracleAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
    const sudoAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);


    const accountId = "5HKPmK9GYtE1PSLsS1qiYU9xQ9Si1NcEhdeCq9sw5bqu4ns8";
    const collateral = getCurrencyFromSymbol(sudoAccountInterBtcApi, "KSM") as CollateralCurrency;
    const wrapped = getCurrencyFromSymbol(sudoAccountInterBtcApi, "KBTC") as WrappedCurrency;
    const vaultId = newVaultId(sudoAccountInterBtcApi.api, accountId, collateral, wrapped);
    // const v = await modifyVaultData(sudoAccountInterBtcApi, vaultId);

    try {
        await yargs(hideBin(process.argv))
            .command("balance", "set token balance of an account",
                {
                    value: {
                        alias: "v",
                        type: "number",
                        demandOption: true,
                        describe: "new balance value"
                    },
                    currency: {
                        alias: "c",
                        type: "string",
                        demandOption: true,
                        describe: "currency in which balance to set, e.g. KINT`"
                    },
                    address: {
                        alias: "a",
                        type: "string",
                        demandOption: false,
                        describe: "address of which balance to set",
                        default: vault_1.address
                    }
                },
                setBalance(sudoAccountInterBtcApi))
            .help()
            .argv;
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();