/* eslint @typescript-eslint/no-var-requires: "off" */
import { BitcoinUnit, Currency } from "@interlay/monetary-js";
import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { VaultRegistryVaultStatus } from "@polkadot/types/lookup";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import Big from "big.js";

import {
    CollateralCurrency,
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
    stripHexPrefix,
    VaultRegistryVault,
    WrappedCurrency,
    currencyIdToMonetaryCurrency
} from "..";
import { ESPLORA_BASE_PATH, PARACHAIN_ENDPOINT, SUDO_URI, VAULT_1_URI } from "../../test/config";
import { sudo } from "../../test/utils/helpers";
import { createSubstrateAPI } from "../factory";
import { newAccountId, newCurrencyId, newVaultCurrencyPair, newVaultId } from "./encoding";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

interface SetBalanceParams {
    value: number,
    currencySymbol: string,
    address: string
}

interface SetVaultParamsBase {
    accountId: string;
    collateralSymbol: string;
    wrappedSymbol: string;
}

interface SetIssuedTokensParams extends SetVaultParamsBase {
    value: string;
}

interface SetLiquidationVaultParams {
    collateralSymbol: string;
    wrappedSymbol: string;
    toBeIssued: string;
    issued: string;
    toBeRedeemed: string;
    collateral: string;
}

interface FundVaultAccountParams {
    accountId: string;
    collateralSymbol: string;
}

type Writable<T> = { -readonly [k in keyof T]: Writable<T[k]> };
type MutableVaultData = Writable<VaultRegistryVault>;

let vault_1: KeyringPair;
let sudoAccount: KeyringPair;

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

const setStorageAtKeyBatch = async (api: ApiPromise, newStorage: [string, `0x${string}`][]) => {
    const txs = newStorage.map((storage) => api.tx.sudo.sudo(api.tx.system.setStorage([storage])));
    const batchedTxs = api.tx.utility.batchAll(txs);
    await DefaultTransactionAPI.sendLogged(api, sudoAccount, batchedTxs, undefined, true);
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

const disconnectApiOnExit = <Params>(
    api: ApiPromise,
    callback: (params: Params) => Promise<void>
) => async (params: Params) => {
    await callback(params);
    await api.disconnect();
};

// Changes deposited collateral and issued tokens of the vault to allow premium redeem
const setPremiumRedeem = (interBtcApi: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        interBtcApi.api,
        async ({ accountId, collateralSymbol, wrappedSymbol }: SetVaultParamsBase) => {
            const { api } = interBtcApi;
            const collateralCurrency = getCurrencyFromSymbol(api, collateralSymbol) as CollateralCurrency;
            const wrappedCurrency = getCurrencyFromSymbol(api, wrappedSymbol) as WrappedCurrency;
            const vaultId = newVaultId(api, accountId, collateralCurrency, wrappedCurrency);

            const oneBTC = "100000000";
            const parsedIssuedTokens = api.createType("u128", oneBTC);
            // Sets issued tokens amount to 1 BTC
            const newIssuedTokensAmount = newMonetaryAmount<BitcoinUnit>(oneBTC, wrappedCurrency);
            const issuedTokensModifier = (vaultData: MutableVaultData): MutableVaultData =>
                ({ ...vaultData, issuedTokens: parsedIssuedTokens });

            console.log("Setting vault issued tokens to 1 BTC...");
            await modifyVaultData(api, vaultId, issuedTokensModifier);

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
            console.log(
                `OK: Vault collateralization ratio succesfully set to premium redeem value: ${newCollateralizationRatio.toString()}.`
            );
        }
    );

const setLiquidationVault = ({ api }: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        api,
        async ({ collateralSymbol, wrappedSymbol, toBeIssued, toBeRedeemed, issued, collateral }: SetLiquidationVaultParams) => {
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
        }
    );

const setBalance = (interBtcApi: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        interBtcApi.api,
        async ({ address, currencySymbol, value }: SetBalanceParams) => {
            const { api } = interBtcApi;
            console.log(`Setting ${currencySymbol} balance of ${address} to ${value}...`);
            const account = newAccountId(api, address);

            const currency = getCurrencyFromSymbol(api, currencySymbol);

            const amount = newMonetaryAmount(value, currency);

            await sudo(interBtcApi, async () => await interBtcApi.tokens.setBalance(account, amount));
            console.log("OK: Balance successfully set.");
        }
    );

const setVaultIssuedTokens = ({ api }: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        api,
        async ({ accountId, collateralSymbol, wrappedSymbol, value }: SetIssuedTokensParams) => {
            const vaultId = constructVaultId(api, accountId, collateralSymbol, wrappedSymbol);

            const parsedIssuedTokens = api.createType("u128", value);

            const modifier = (vaultData: MutableVaultData): MutableVaultData => ({ ...vaultData, issuedTokens: parsedIssuedTokens });

            console.log(`Setting vault issued tokens to ${value}...`);
            await modifyVaultData(api, vaultId, modifier);
            console.log("OK: Succesfully set vault issued tokens.");
        }
    );

const setVaultTheft = ({ api }: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        api,
        async ({ accountId, collateralSymbol, wrappedSymbol }: SetVaultParamsBase) => {
            const vaultId = constructVaultId(api, accountId, collateralSymbol, wrappedSymbol);

            const theftCommittedStatus = { "committedTheft": true } as unknown as VaultRegistryVaultStatus;

            const modifier = (vaultData: MutableVaultData): MutableVaultData => ({ ...vaultData, status: theftCommittedStatus });

            console.log("Setting vault to 'CommittedTheft' status...");
            await modifyVaultData(api, vaultId, modifier);
            console.log("OK: Succesfully set vault to 'CommittedTheft' status.");
        }
    );

const setVaultBan = (interBtcApi: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        interBtcApi.api,
        async ({ accountId, collateralSymbol, wrappedSymbol }: SetVaultParamsBase) => {
            const { api } = interBtcApi;
            const vaultId = constructVaultId(api, accountId, collateralSymbol, wrappedSymbol);
            const currentBlockNumber = await interBtcApi.system.getCurrentBlockNumber();

            // Bans vault for the next 1000 blocks
            const newBannedUntil = api.createType("Option<u32>", currentBlockNumber + 1000);

            const modifier = (vaultData: MutableVaultData): MutableVaultData => ({ ...vaultData, bannedUntil: newBannedUntil });

            console.log("Setting vault to be banned for the next 1,000 blocks...");
            await modifyVaultData(api, vaultId, modifier);
            console.log(`OK: Succesfully banned vault until block ${newBannedUntil}.`);
        }
    );

const setVaultUnban = ({ api }: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        api,
        async ({ accountId, collateralSymbol, wrappedSymbol }: SetVaultParamsBase) => {
            const vaultId = constructVaultId(api, accountId, collateralSymbol, wrappedSymbol);

            const newBannedUntil = null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const modifier = (vaultData: MutableVaultData): MutableVaultData => ({ ...vaultData, bannedUntil: <any>newBannedUntil });

            console.log("Setting vault to be unbanned...");
            await modifyVaultData(api, vaultId, modifier);
            console.log("OK: Succesfully unbanned vault.");
        }
    );

const fundVaultAccount = (interBtcApi: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        interBtcApi.api,
        async ({ accountId, collateralSymbol }: FundVaultAccountParams) => {
            const newCollateralBalance = 10000000000000;
            console.log("Funding vault account with collateral token...");
            await setBalance(interBtcApi)({ address: accountId, currencySymbol: collateralSymbol, value: newCollateralBalance });
        }
    );

const setVaultReward = (interBtcApi: DefaultInterBtcApi) =>
    disconnectApiOnExit(
        interBtcApi.api,
        async ({ accountId, collateralSymbol, wrappedSymbol }: SetVaultParamsBase) => {
            const { api } = interBtcApi;
            const nonceHex = interBtcApi.api.createType("u32", 0).toHex();
            const vaultIdHex = constructVaultId(api, accountId, collateralSymbol, wrappedSymbol).toHex();
            const accountHex = api.createType("AccountId32", accountId).toHex();
            const rewardCurrencyHex = newCurrencyId(api, interBtcApi.getGovernanceCurrency().ticker as CurrencyIdLiteral).toHex();
            const nonceVaultIdTupleHex = nonceHex + stripHexPrefix(vaultIdHex) as `0x${string}`;
            const nonceVaultIdAccountTupleHex = nonceVaultIdTupleHex + stripHexPrefix(accountHex) as `0x${string}`;
            const vaultIdAccountTupleHex = vaultIdHex + stripHexPrefix(accountHex) as `0x${string}`;

            // Global pool
            const globalRewardTallyStorageKey = getStorageMapItemKey("VaultRewards", "RewardTally", rewardCurrencyHex, vaultIdHex);
            const globalRewardTallyData = "0x109da49d82b6fe2c4d740f50a4040000";
            const globalStakeStorageKey = getStorageMapItemKey("VaultRewards", "Stake", vaultIdHex);
            const globalStakeData = "0x0000c0f26e1f724ad547030000000000";

            console.log("Writing into VaultRewards storage...");
            await setStorageAtKeyBatch(interBtcApi.api, [
                [globalRewardTallyStorageKey, globalRewardTallyData],
                [globalStakeStorageKey, globalStakeData]
            ]);

            // Local pool
            const localRewardPerTokenStorageKey =
                getStorageMapItemKey("VaultStaking", "RewardPerToken", rewardCurrencyHex, nonceVaultIdTupleHex);
            const localRewardPerTokenData = "0x2ea3f99f9a5c380d0000000000000000";
            const localRewardTallyStorageKey =
                getStorageMapItemKey("VaultStaking", "RewardTally", rewardCurrencyHex, nonceVaultIdAccountTupleHex);
            const localRewardTallyData = "0xe0efbe1ff0a9ea7217f3dc0a3c000000";
            const localSlashPerTokenStorageKey = getStorageMapItemKey("VaultStaking", "SlashPerToken", nonceHex, vaultIdHex);
            const localSlashPerTokenData = "0xcf149c9d789c05000000000000000000";
            const localSlashTallyStorageKey = getStorageMapItemKey("VaultStaking", "SlashTally", nonceHex, vaultIdAccountTupleHex);
            const localSlashTallyData = "0xa62ed4024fa35e810e117c1900000000";
            const localStakeStorageKey = getStorageMapItemKey("VaultStaking", "Stake", nonceHex, vaultIdAccountTupleHex);
            const localStakeData = "0x14b9f12a808c9588a5f278073f000000";
            const localTotalCurrentStakeStorageKey = getStorageMapItemKey("VaultStaking", "TotalCurrentStake", nonceHex, vaultIdHex);
            const localTotalCurrentStakeData = "0x000000fed5929588a5f278073f000000";
            const localTotalRewardsStorageKey =
                getStorageMapItemKey("VaultStaking", "TotalRewards", rewardCurrencyHex, nonceVaultIdTupleHex);
            const localTotalRewardsData = "0x000064a7b3b6e00d0000000000000000";
            const localTotalStakeStorageKey = getStorageMapItemKey("VaultStaking", "TotalStake", nonceHex, vaultIdHex);
            const localTotalStakeData = "0x14b9f12a808c9588a5f278073f000000";

            console.log("Writing into VaultStaking storage...");
            await setStorageAtKeyBatch(api, [
                [localRewardPerTokenStorageKey, localRewardPerTokenData],
                [localRewardTallyStorageKey, localRewardTallyData],
                [localSlashPerTokenStorageKey, localSlashPerTokenData],
                [localSlashTallyStorageKey, localSlashTallyData],
                [localStakeStorageKey, localStakeData],
                [localTotalCurrentStakeStorageKey, localTotalCurrentStakeData],
                [localTotalRewardsStorageKey, localTotalRewardsData],
                [localTotalStakeStorageKey, localTotalStakeData]
            ]);
            console.log("OK: Successfully set vault reward.");
        }
    );


async function main(): Promise<void> {
    console.log("Initializing crypto functions...");
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    vault_1 = keyring.addFromUri(VAULT_1_URI);
    sudoAccount = keyring.addFromUri(SUDO_URI);

    console.log("Connecting to parachain...");
    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);
    console.log("OK: Successfully connected to parachain.\n");

    const sudoAccountInterBtcApi = new DefaultInterBtcApi(api, "regtest", sudoAccount, ESPLORA_BASE_PATH);

    const defaultVaultAccountId = vault_1.address;
    const defaultCollateralSymbol = currencyIdToMonetaryCurrency(sudoAccountInterBtcApi.api.consts.currency.getRelayChainCurrencyId).ticker;
    const defaultWrappedSymbol = sudoAccountInterBtcApi.getWrappedCurrency().ticker;
    console.log(`Default vault to use: ${defaultVaultAccountId}-${defaultCollateralSymbol}-${defaultWrappedSymbol}.\n`);

    const SET_VAULT_PARAMS_BASE = {
        accountId: {
            alias: "a",
            type: "string",
            demandOption: false,
            describe: "accountId of the vault",
            default: defaultVaultAccountId
        },
        collateralSymbol: {
            alias: "c",
            type: "string",
            demandOption: false,
            describe: "collateral currency symbol of the vault",
            default: defaultCollateralSymbol
        },
        wrappedSymbol: {
            alias: "w",
            type: "string",
            demandOption: false,
            describe: "wrapped currency symbol of the vault",
            default: defaultWrappedSymbol
        }
    };

    try {
        await yargs(hideBin(process.argv))
            .command(
                "balance",
                "Sets token balance of an account",
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
                        describe: "currency symbol in which to set balance"
                    },
                    address: {
                        alias: "a",
                        type: "string",
                        demandOption: false,
                        describe: "address of which to set balance"
                    }
                },
                setBalance(sudoAccountInterBtcApi)
            )
            .command(
                "liquidationVault",
                "Sets system liquidation vault",
                {
                    collateralSymbol: {
                        alias: "c",
                        type: "string",
                        demandOption: false,
                        describe: "collateral currency symbol of liquidation vault",
                        default: defaultCollateralSymbol
                    },
                    wrappedSymbol: {
                        alias: "w",
                        type: "string",
                        demandOption: false,
                        describe: "wrapped currency symbol of liquidation vault",
                        default: defaultWrappedSymbol
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
                },
                setLiquidationVault(sudoAccountInterBtcApi)
            )
            .command(
                "vaultIssuedTokens",
                "Sets issued tokens of a vault",
                {
                    ...SET_VAULT_PARAMS_BASE,
                    value: {
                        alias: "v",
                        type: "string",
                        demandOption: true,
                        describe: "new issued tokens value"
                    }
                },
                setVaultIssuedTokens(sudoAccountInterBtcApi)
            )
            .command(
                "vaultPremiumRedeem",
                "Sets collateral ratio of vault to be within premium redeem range",
                SET_VAULT_PARAMS_BASE,
                setPremiumRedeem(sudoAccountInterBtcApi)
            )
            .command(
                "vaultTheft",
                "Sets vault status to theft",
                SET_VAULT_PARAMS_BASE,
                setVaultTheft(sudoAccountInterBtcApi)
            )
            .command(
                "vaultBan",
                "Bans vault for next 1000 blocks",
                SET_VAULT_PARAMS_BASE,
                setVaultBan(sudoAccountInterBtcApi)
            )
            .command(
                "vaultUnban",
                "Unbans vault",
                SET_VAULT_PARAMS_BASE,
                setVaultUnban(sudoAccountInterBtcApi)
            )
            .command(
                "vaultFund",
                "Funds vault account with collateral token",
                {
                    accountId: {
                        alias: "a",
                        type: "string",
                        demandOption: false,
                        describe: "accountId of the vault",
                        default: defaultVaultAccountId
                    },
                    collateralSymbol: {
                        alias: "c",
                        type: "string",
                        demandOption: false,
                        describe: "collateral currency symbol of the vault",
                        default: defaultCollateralSymbol
                    }
                },
                fundVaultAccount(sudoAccountInterBtcApi)
            )
            .command(
                "vaultReward",
                "Sets claimable amount of rewards for vault",
                SET_VAULT_PARAMS_BASE,
                setVaultReward(sudoAccountInterBtcApi)
            )
            .help()
            .strict()
            .recommendCommands()
            .argv;
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();