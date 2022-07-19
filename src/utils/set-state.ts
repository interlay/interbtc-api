/* eslint @typescript-eslint/no-var-requires: "off" */
import { BitcoinUnit, Currency } from "@interlay/monetary-js";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import Big from "big.js";

import {
    CollateralCurrency,
    CollateralIdLiteral,
    CollateralUnit,
    CurrencyIdLiteral,
    currencyIdLiteralToMonetaryCurrency,
    CurrencyUnit,
    DefaultInterBtcApi,
    DefaultTransactionAPI,
    FIXEDI128_SCALING_FACTOR,
    getStorageMapItemKey,
    InterbtcPrimitivesVaultId,
    newMonetaryAmount,
    VaultRegistryVault,
    WrappedCurrency
} from "..";
import { ESPLORA_BASE_PATH, ORACLE_URI, PARACHAIN_ENDPOINT, SUDO_URI, VAULT_1_URI } from "../../test/config";
import { sudo } from "../../test/utils/helpers";
import { createSubstrateAPI } from "../factory";
import { decodeFixedPointType, newAccountId, newVaultCurrencyPair, newVaultId } from "./encoding";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

interface SetBalanceParams {
    value: number,
    currencySymbol: string,
    address: string
}

interface SetIssuedTokensParams {
    value: string;
    accountId: string;
    collateralSymbol: string;
    wrappedSymbol: string;
}

interface SetLiquidationVaultParams {
    collateralSymbol: string;
    wrappedSymbol: string;
    toBeIssued: string;
    issued: string;
    toBeRedeemed: string;
    collateral: string;
}

interface SetPremiumRedeemParams {
    accountId: string;
    collateralSymbol: string;
    wrappedSymbol: string;
}

type Writable<T> = { -readonly [k in keyof T]: Writable<T[k]> };
type MutableVaultData = Writable<VaultRegistryVault>;

let vault_1: KeyringPair;
let sudoAccount: KeyringPair;
let oracleAccount: KeyringPair;

const getCurrencyFromSymbol = <U extends CurrencyUnit>(api: ApiPromise, symbol: string) => {
    if (!Object.values(CurrencyIdLiteral).includes(symbol as CurrencyIdLiteral)) {
        throw new Error(`Unknown currency symbol: ${symbol}`);
    }
    return currencyIdLiteralToMonetaryCurrency<U>(api, symbol as CurrencyIdLiteral);
};

const setStorageAtKey = async (api: ApiPromise, key: string, data: `0x${string}`) => {
    const tx = api.tx.sudo.sudo(api.tx.system.setStorage([[key, data]]));
    await DefaultTransactionAPI.sendLogged(api, sudoAccount, tx, undefined, true);
};

const constructVaultId = (
    api: ApiPromise,
    accountId: string,
    collateralCurrencySymbol: string,
    wrappedCurrencySymbol: string
): InterbtcPrimitivesVaultId => {
    const collateralCurrency = getCurrencyFromSymbol(api, collateralCurrencySymbol) as CollateralCurrency;
    const wrappedCurrency = getCurrencyFromSymbol(api, wrappedCurrencySymbol) as WrappedCurrency;
    const vaultId = newVaultId(api, accountId, collateralCurrency, wrappedCurrency);
    return vaultId;
};

const getVault = async (api: ApiPromise, vaultId: InterbtcPrimitivesVaultId) => {
    const vaults = await api.query.vaultRegistry.vaults.entries();
    const vault = vaults.find(vault => vault[1].value.id.eq(vaultId));

    if (vault === undefined) {
        throw new Error(`Vault not found, vault id: ${vaultId.toString()}`);
    }
    return vault;
};

const modifyVaultData = async (
    api: ApiPromise,
    vaultId: InterbtcPrimitivesVaultId,
    modifier: ((vaultData: MutableVaultData) => MutableVaultData)
) => {
    const [storageKey, vaultData] = await getVault(api, vaultId);

    const parsedVaultData = JSON.parse(JSON.stringify(vaultData)) as MutableVaultData;
    const modifiedVaultData = modifier(parsedVaultData);

    const storageData = api.createType("Option<VaultRegistryVault>", modifiedVaultData).toHex();

    console.log("Writing into vault storage...");
    await setStorageAtKey(api, storageKey.toString(), storageData);
};

// Changes deposited collateral and issued tokens of the vault to allow premium redeem
const setPremiumRedeem = (
    interBtcApi: DefaultInterBtcApi
) => async ({accountId, collateralSymbol, wrappedSymbol}: SetPremiumRedeemParams) => {
    const { api } = interBtcApi;
    const collateralCurrency = getCurrencyFromSymbol(api, collateralSymbol) as CollateralCurrency;
    const wrappedCurrency = getCurrencyFromSymbol(api, wrappedSymbol) as WrappedCurrency;
    const vaultId = newVaultId(api, accountId, collateralCurrency, wrappedCurrency);

    // Sets issued tokens amount to 1 BTC
    const newIssuedTokensAmount = newMonetaryAmount<BitcoinUnit>("100000000", wrappedCurrency);
    await setVaultIssuedTokens(interBtcApi)({ accountId, collateralSymbol, wrappedSymbol, value: newIssuedTokensAmount.toString() });

    // Sets vault backing collateral to average between premium redeem threshold and liquidation threshold
    const premiumRedeemThreshold = await interBtcApi.vaults.getPremiumRedeemThreshold(collateralCurrency);
    const liquidationThreshold = await interBtcApi.vaults.getLiquidationCollateralThreshold(collateralCurrency);
    const newCollateralizationRatio = premiumRedeemThreshold.add(liquidationThreshold).div(2);
    const newIssuedTokensInCollateralAmount = await interBtcApi.oracle.convertWrappedToCurrency(
        newIssuedTokensAmount,
        collateralCurrency as Currency<CollateralUnit>
    );
    const scalingFactor = new Big(Math.pow(10, FIXEDI128_SCALING_FACTOR));
    const newCollateralAmount = newIssuedTokensInCollateralAmount.toBig().mul(newCollateralizationRatio).mul(scalingFactor);
    const totalStakeDataHex = api.createType("u128", newCollateralAmount.toFixed()).toHex(true);

    const nonceHex = api.createType("u32", 0).toHex();     // 0 nonce by default
    const totalStakeStorageKey = getStorageMapItemKey("VaultStaking", "TotalCurrentStake", nonceHex, vaultId.toHex());
    
    console.log("Setting backing collateral...");
    await setStorageAtKey(api, totalStakeStorageKey, totalStakeDataHex);
    console.log(`OK: Vault collateralization ratio succesfully set to premium redeem value: ${newCollateralizationRatio.toString()}.`);
};

const setLiquidationVault = (
    { api }: DefaultInterBtcApi
) => async ({ collateralSymbol, wrappedSymbol, toBeIssued, toBeRedeemed, issued, collateral }: SetLiquidationVaultParams) => {
    const collateralCurrency = getCurrencyFromSymbol(api, collateralSymbol) as CollateralCurrency;
    const wrappedCurrency = getCurrencyFromSymbol(api, wrappedSymbol) as WrappedCurrency;
    const currencyPair = newVaultCurrencyPair(api, collateralCurrency, wrappedCurrency);

    const storageKey = getStorageMapItemKey("VaultRegistry", "LiquidationVault", currencyPair.toHex());

    const liquidationVault = {
        currencyPair,
        toBeIssuedTokens: api.createType("u128", toBeIssued),
        toBeRedeemedTokens: api.createType("u128", toBeRedeemed),
        issuedTokens: api.createType("u128", issued),
        collateral: api.createType("u128", collateral)

    };
    const storageData = api.createType("Option<VaultRegistrySystemVault>", liquidationVault).toHex();

    console.log(`Setting the liquidation vault for currency pair ${collateralSymbol}-${wrappedSymbol}...`);
    await setStorageAtKey(api, storageKey, storageData);
    console.log("OK: Liquidation vault successfully set.");
};

const setBalance = (interBtcApi: DefaultInterBtcApi) => async ({ address, currencySymbol, value }: SetBalanceParams) => {
    console.log(`Setting ${currencySymbol} balance of ${address} to ${value}...`);
    const account = newAccountId(interBtcApi.api, address);

    const currency = getCurrencyFromSymbol(interBtcApi.api, currencySymbol);

    const amount = newMonetaryAmount(value, currency);

    await sudo(interBtcApi, async () => await interBtcApi.tokens.setBalance(account, amount));
    console.log("OK: Balance successfully set.");
};

const setVaultIssuedTokens = (
    interBtcApi: DefaultInterBtcApi
) => async ({ accountId, collateralSymbol, wrappedSymbol, value }: SetIssuedTokensParams) => {
    const vaultId = constructVaultId(interBtcApi.api, accountId, collateralSymbol, wrappedSymbol);

    const parsedIssuedTokens = interBtcApi.api.createType("u128", value);

    const modifier = (vaultData: MutableVaultData): MutableVaultData => ({ ...vaultData, issuedTokens: parsedIssuedTokens });

    console.log(`Setting vault issued tokens to ${value}...`);
    await modifyVaultData(interBtcApi.api, vaultId, modifier);
    console.log("OK: Succesfully set vault issued tokens.");
};

async function main(): Promise<void> {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    vault_1 = keyring.addFromUri(VAULT_1_URI);
    sudoAccount = keyring.addFromUri(SUDO_URI);
    oracleAccount = keyring.addFromUri(ORACLE_URI);

    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

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
                    currencySymbol: {
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
            .command("issuedTokens", "set issued tokens of a vault",
                {
                    value: {
                        alias: "v",
                        type: "string",
                        demandOption: true,
                        describe: "new issued tokens value"
                    },
                    accountId: {
                        alias: "a",
                        type: "string",
                        demandOption: true,
                        describe: "accountId of the vault",
                    },
                    collateralSymbol: {
                        alias: "c",
                        type: "string",
                        demandOption: true,
                        describe: "collateral currency symbol of the vault",
                    },
                    wrappedSymbol: {
                        alias: "w",
                        type: "string",
                        demandOption: true,
                        describe: "wrapped currency symbol of the vault"
                    }
                }, setVaultIssuedTokens(sudoAccountInterBtcApi))
            .command("liquidationVault", "sets system liquidation value",
                {
                    collateralSymbol: {
                        alias: "c",
                        type: "string",
                        demandOption: true,
                        describe: "collateral currency symbol of liquidation vault"
                    },
                    wrappedSymbol: {
                        alias: "w",
                        type: "string",
                        demandOption: true,
                        describe: "wrapped currency symbol of liquidation vault"
                    },
                    toBeIssued: {
                        type: "string",
                        demandOption: false,
                        default: "20000000",
                        describe: "toBeIssuedTokens value of liquidation vault"
                    },
                    issued: {
                        type: "string",
                        demandOption: false,
                        default: "30000000",
                        describe: "issuedTokens value of liquidation vault"
                    },
                    toBeRedeemed: {
                        type: "string",
                        demandOption: false,
                        default: "10000000",
                        describe: "toBeRedeemedTokens value of liquidation vault"
                    },
                    collateral: {
                        type: "string",
                        demandOption: false,
                        default: "100000000",
                        describe: "collateral value of liquidation vault"
                    }
                }, setLiquidationVault(sudoAccountInterBtcApi))
            .command("premiumRedeem", "sets collateral ratio of vault to be within premium redeem range",
                {
                    accountId: {
                        alias: "a",
                        type: "string",
                        demandOption: true,
                        describe: "accountId of the vault",
                    },
                    collateralSymbol: {
                        alias: "c",
                        type: "string",
                        demandOption: true,
                        describe: "collateral currency symbol of the vault",
                    },
                    wrappedSymbol: {
                        alias: "w",
                        type: "string",
                        demandOption: true,
                        describe: "wrapped currency symbol of the vault"
                    }
                }, setPremiumRedeem(sudoAccountInterBtcApi))
            .help()
            .argv;
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();