/* eslint @typescript-eslint/no-var-requires: "off" */
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import {Codec} from "@polkadot/types/types";

import { CurrencyIdLiteral, currencyIdLiteralToMonetaryCurrency, DefaultInterBtcApi, newMonetaryAmount } from "..";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT, SUDO_URI, VAULT_1_URI } from "../../test/config";
import { sudo } from "../../test/utils/helpers";
import { createSubstrateAPI } from "../factory";
import { newAccountId } from "./encoding";

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

        await sudo(api, () => api.tokens.setBalance(account, amount));
        console.log("OK: Balance successfully set.");


};

async function main(): Promise<void> {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    const vault_1 = keyring.addFromUri(VAULT_1_URI);

    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
    const sudoAccount = keyring.addFromUri(SUDO_URI);
    const oracleAccount = keyring.addFromUri(ORACLE_URI);

    const oracleAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", oracleAccount, ESPLORA_BASE_PATH);
    const sudoAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

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
    } catch(error) {
        console.error(`Error: ${error.message}`);
    }
}

main();