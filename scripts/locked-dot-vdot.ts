import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { StorageKey } from "@polkadot/types/primitive/StorageKey";
import { Codec } from "@polkadot/types/types";
import { AccountId } from "@polkadot/types/interfaces";
import { InterbtcPrimitivesCurrencyId } from "../src";
import BN from "bn.js";
import Big from "big.js";
import * as fsp from "fs/promises";

const PARACHAIN_ENDPOINT = "wss://api.interlay.io/parachain";

type LendTokenCcyId = {
    "LendToken": number;
};
type TokenCcyId = {
    "Token": string;
};
type ForeignAssetCcyId = {
    "ForeignAsset": number;
};

const CCY = {
    DOT: { "Token": "DOT" } as TokenCcyId,
    qDOT: { "LendToken": 2 } as LendTokenCcyId,
    VDOT: { "ForeignAsset": 3 } as ForeignAssetCcyId,
    qVDOT: { "LendToken": 4 } as LendTokenCcyId,
};

const CCY_SYMBOLS = new Set(Object.keys(CCY));

type ReservedBalanceData = {
    "accountId": AccountId;
    "ccyId": InterbtcPrimitivesCurrencyId;
    "symbol": string;
    "reserved": BN;
}

type TokenBalance = {
    // token symbol
    [key: string]: string;
};

type UnderlyingBalance = {
    // token symbol
    [key: string]: {
        locked: string;
        rateApplied: string;
    }
};

type AccountsMap = {
    [key: string]: {
        reserved: TokenBalance;
        underlying?: UnderlyingBalance;
    };
};

type LendTokenRate = {
    // lend token symbol
    [key: string]: Big
};

// first key is account id, collateral values are in planck
type OutputFormat = {
    [key: string]: TokenBalance;
};

// Run from project root folder with `npx tsx ./scripts/locked-dot-vdot.ts [options]`
// eg. `npx tsx ./scripts/locked-dot-vdot.ts --block-hash 0xb541ad774ba9e8d35d9551a3b6580e813990cd17abe1d8dcc1bde3a0d6f43348`
const argsPromise = yargs(hideBin(process.argv))
    .option("block-hash", {
        // eslint-disable-next-line max-len
        description: "Block hash at which to query, defaults to latest block. Must be prefixed with '0x' and have a length of 66. eg. Last block on March 31, 2024, has the hash 0xb541ad774ba9e8d35d9551a3b6580e813990cd17abe1d8dcc1bde3a0d6f43348",
        type: "string",
        alias: "b"
    })
    .option("output-file", {
        description: "Which file to write json results to, defaults to 'output-{blockhash}.json'",
        type: "string",
        alias: "o"
    })
    .option("print-only", {
        description: "Do not write results to file, only log to console, defaults to false.",
        type: "boolean",
        alias: "p",
        default: false
    })
    .check((argv) => {
        if(argv["block-hash"]) {
            const hash = argv["block-hash"];
            if (!(hash.slice(0, 2) === "0x")) {
                throw Error("Block hash must be a hex string starting with '0x'");
            } else if (hash.length != 66) {
                throw Error("Block hash must be a hex string with a length of 66 characters");
            }
        }

        return 1;
    })
    .argv;

// only interested in DOT, VDOT, qDOT, and qVDOT, all else can be null
const getSymbol = (currencyId: InterbtcPrimitivesCurrencyId): string => {
    if (currencyId.isToken) {
        // only care about DOT
        if (currencyId.asToken.isDot) {
            return "DOT";
        }
    } else if (currencyId.isForeignAsset) {
        // only interested in VDOT with number 3
        if (currencyId.asForeignAsset.toNumber() === 3) {
            return "VDOT";
        }
    } else if (currencyId.isLendToken) {
        // only interested in 2 (qDOT) and 4 (qVDOT)
        const lendTokenId = currencyId.asLendToken.toNumber();
        switch(lendTokenId) {
            case 2:
                return "qDOT";
            case 4:
                return "qVDOT";
        }
    };
    return "something else";
};

const storageKeyToNthInner = <T extends Codec>(s: StorageKey<T[]>, n = 0): T => {
    return s.args[n];
};

const organizeReservedBalances = (data: ReservedBalanceData[]): AccountsMap => {
    const map = <AccountsMap>{};

    data.forEach((entry) => {
        const accountId = entry.accountId.toHuman();
        const symbol = entry.symbol;
        const reservedString = entry.reserved.toString();
        const reservedBalance: TokenBalance = {};
        reservedBalance[symbol] = reservedString;

        if (!map[accountId]) {
            // create first entry
            map[accountId] = {
                reserved: reservedBalance
            };
        } else {
            // entry exists, merge balances together
            const existingReservedBalance = map[accountId].reserved;
            const newReservedBalance = {
                ...existingReservedBalance,
                ...reservedBalance
            };

            map[accountId].reserved = newReservedBalance;
        }        
    });

    return map;
};

const isLendTokenSymbol = (symbol: string): boolean => symbol.startsWith("q");

const transformEnrichedToOutput = (enrichedData: AccountsMap): OutputFormat => {
    const output: OutputFormat = {};
    for (const [account, data] of Object.entries(enrichedData)) {
        const {reserved, underlying} = data;
        const collateral: TokenBalance = {};
        for(const token of ["DOT", "VDOT"]) {
            const reservedPlanck = BigInt(reserved[token] || 0);
            const lockedPlanck = underlying ? BigInt(underlying[token]?.locked || 0) : BigInt(0);
            const totalCollateralPlanck = reservedPlanck + lockedPlanck;

            if (totalCollateralPlanck > 0) {
                collateral[token] = totalCollateralPlanck.toString();
            }
        }

        output[account] = collateral;
    }

    return output;
};

// warning! mutates dataByAccountId
const enrichWithUnderlyingLocked = (dataByAccountId: AccountsMap, rates: LendTokenRate) => {
    Object.keys(dataByAccountId).forEach((accountId) => {
        Object.keys(dataByAccountId[accountId].reserved).forEach((symbol) => {
            if(isLendTokenSymbol(symbol)) {
                // strip the "q"
                const underlyingSymbol = symbol.substring(1);
                const lendTokensReserved = Big(dataByAccountId[accountId].reserved[symbol]);
                const underlyingValue = lendTokensReserved.mul(rates[symbol]);

                const newUnderlyingBalance: UnderlyingBalance = {};

                newUnderlyingBalance[underlyingSymbol] = {
                    locked: underlyingValue.round(0).toString(),
                    rateApplied: rates[symbol].toString(),
                };

                // might need to merge data
                const oldUnderlyingBalance: UnderlyingBalance = dataByAccountId[accountId].underlying || {};

                // assign directly
                dataByAccountId[accountId].underlying = {
                    ...oldUnderlyingBalance,
                    ...newUnderlyingBalance
                };
            }
        });
    });

    return dataByAccountId;

};

const fetchReserved = async (api: ApiPromise, blockhash: string): Promise<ReservedBalanceData[]> => {
    const accounts = await api.at(blockhash)
        .then((apiAt) => apiAt.query.tokens.accounts.entries())
        .then((data) => data.map(([key, value]) => {
                const accountId = storageKeyToNthInner(key, 0) as AccountId;
                const ccyId = storageKeyToNthInner(key, 1) as InterbtcPrimitivesCurrencyId;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const reserved = (value as any).reserved.toBn() as BN;
                return {
                    accountId,
                    ccyId,
                    reserved
                };
            })
        );
    return accounts.filter((data) => !data.reserved.isZero())
    .map((data) => ({
        ...data,
        // reservedAsString: data.reserved.toString(),
        symbol: getSymbol(data.ccyId)
    }))
    .filter((data) => CCY_SYMBOLS.has(data.symbol));
};

const getLendTokenRates = async (api: ApiPromise, blockhash: string): Promise<LendTokenRate> => {
    const apiAt = await api.at(blockhash);

    const qDotToDotRaw = await apiAt.query.loans.exchangeRate(CCY.DOT);
    const qVdotToVdotRaw = await apiAt.query.loans.exchangeRate(CCY.VDOT);

    // divide raw rate by 10**18
    const divisor = Big(10).pow(18);

    const rates = {
        qDOT: Big(qDotToDotRaw.toString()).div(divisor),
        qVDOT: Big(qVdotToVdotRaw.toString()).div(divisor),
    };

    return rates;
};

const main = async (): Promise<void> => {
    const args = await argsPromise;

    await cryptoWaitReady();
    const api = await createSubstrateAPI(PARACHAIN_ENDPOINT);

    const blockhash = (args.blockHash) 
    ? args.blockHash
    : (await api.query.system.number()
        .then((currentProcessingNumber) => api.query.system.blockHash(currentProcessingNumber.toNumber() - 1))
    ).toString();
    
    console.log(`Querying blockhash: ${blockhash}`);
    
    const reservedBalancesData = await fetchReserved(api, blockhash);

    const dataByAccountId = organizeReservedBalances(reservedBalancesData);

    const rates = await getLendTokenRates(api, blockhash);
    const enrichedData = enrichWithUnderlyingLocked(dataByAccountId, rates);

    const outputFormatted = transformEnrichedToOutput(enrichedData);

    let writeFilePromise = Promise.resolve();
    if (!args.printOnly) {
        const outFilename = args.outputFile || `output-${blockhash}.json`;
        writeFilePromise = fsp.writeFile(outFilename, JSON.stringify(outputFormatted, null, 2), "utf-8");
    } else {
        // print to console
        console.log(JSON.stringify(enrichedData, null, 2));
    }
    
    await Promise.all([
        writeFilePromise,
        api.disconnect()
    ]);
};

main().catch((err) => {
    console.error("Error thrown by script:");
    console.error(err);
});
