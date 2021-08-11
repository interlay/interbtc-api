import * as interbtcIndex from "@interlay/interbtc-index-client";
import { IndexApi as RawIndexApi, IndexVaultStatus, SatoshisTimeData } from "@interlay/interbtc-index-client";
import { Bitcoin, BTCAmount, Polkadot, PolkadotAmount, PolkadotUnit } from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import Big from "big.js";
import { Issue, Redeem, VaultExt, VaultStatusExt } from "../types";
import { DOTBTCOracleStatus } from "../types/oracleTypes";
import { newCollateralBTCExchangeRate } from "../utils/currency";

// TODO: export SatoshisTimeData from `interbtcIndex`
export interface BTCTimeData {
    date: Date;
    btc: BTCAmount;
}

/* Add wrappers here. Use keys matching the raw API call names to override those APIs with the wrappers. */
const explicitWrappers = (index: RawIndexApi, api: ApiPromise) => {
    return {
        getLatestSubmissionForEachOracle: async (): Promise<DOTBTCOracleStatus[]> => {
            const oracleStatus = await index.getLatestSubmissionForEachOracle();
            return oracleStatus.map((rawStatus) => {
                const exchangeRate = newCollateralBTCExchangeRate<PolkadotUnit>(
                    new Big(rawStatus.exchangeRate),
                    Polkadot
                );
                return {
                    ...rawStatus,
                    exchangeRate,
                };
            });
        },
        getLatestSubmission: async (): Promise<DOTBTCOracleStatus> => {
            const submission = await index.getLatestSubmission();
            const exchangeRate = newCollateralBTCExchangeRate<PolkadotUnit>(new Big(submission.exchangeRate), Polkadot);
            return {
                ...submission,
                exchangeRate,
            };
        },
        currentVaultData: async (): Promise<VaultExt[]> => {
            const indexCachedVaults = await index.currentVaultData();
            return indexCachedVaults.map((indexVault) => {
                const status = ((indexStatus) => {
                    if (indexStatus === IndexVaultStatus.Active) return VaultStatusExt.Active;
                    else if (indexStatus === IndexVaultStatus.Inactive) return VaultStatusExt.Inactive;
                    else if (indexStatus === IndexVaultStatus.Liquidated) return VaultStatusExt.Liquidated;
                    else if (indexStatus === IndexVaultStatus.CommittedTheft) return VaultStatusExt.CommittedTheft;
                    else throw new Error("Unknown vault status from Index");
                })(indexVault.status);
                return {
                    wallet: indexVault.wallet,
                    backingCollateral: new PolkadotAmount(indexVault.backingCollateral),
                    id: api.createType("AccountId", indexVault.id),
                    status,
                    bannedUntil: indexVault.bannedUntil === null ? undefined : indexVault.bannedUntil,
                    toBeIssuedTokens: new BTCAmount(Bitcoin, indexVault.toBeIssuedTokens),
                    issuedTokens: new BTCAmount(Bitcoin, indexVault.issuedTokens),
                    toBeRedeemedTokens: new BTCAmount(Bitcoin, indexVault.toBeRedeemedTokens),
                    toBeReplacedTokens: new BTCAmount(Bitcoin, indexVault.toBeReplacedTokens),
                    replaceCollateral: new PolkadotAmount(indexVault.replaceCollateral),
                    liquidatedCollateral: new PolkadotAmount(indexVault.liquidatedCollateral),
                };
            });
        },
        getIssues: async (
            page?: number,
            perPage?: number,
            sortBy?: interbtcIndex.IssueColumns,
            sortAsc?: boolean,
            network?: interbtcIndex.BitcoinNetwork
        ): Promise<Issue[]> => {
            const issues = await index.getIssues({ page, perPage, sortBy, sortAsc, network });
            return issues.map(indexIssueToTypedIssue);
        },
        getRedeems: async (
            page?: number,
            perPage?: number,
            sortBy?: interbtcIndex.RedeemColumns,
            sortAsc?: boolean,
            network?: interbtcIndex.BitcoinNetwork
        ): Promise<Redeem[]> => {
            const redeems = await index.getRedeems({ page, perPage, sortBy, sortAsc, network });
            return redeems.map(indexRedeemToTypedRedeem);
        },
        getFilteredIssues: async (
            page?: number,
            perPage?: number,
            sortBy?: interbtcIndex.IssueColumns,
            sortAsc?: boolean,
            network?: interbtcIndex.BitcoinNetwork,
            filterIssueColumns?: Array<interbtcIndex.FilterIssueColumns>
        ): Promise<Issue[]> => {
            const issues = await index.getFilteredIssues({
                page,
                perPage,
                sortBy,
                sortAsc,
                network,
                filterIssueColumns,
            });
            return issues.map(indexIssueToTypedIssue);
        },
        getFilteredRedeems: async (
            page?: number,
            perPage?: number,
            sortBy?: interbtcIndex.RedeemColumns,
            sortAsc?: boolean,
            network?: interbtcIndex.BitcoinNetwork,
            filterRedeemColumns?: Array<interbtcIndex.FilterRedeemColumns>
        ): Promise<Redeem[]> => {
            const redeems = await index.getFilteredRedeems({
                page,
                perPage,
                sortBy,
                sortAsc,
                network,
                filterRedeemColumns,
            });
            return redeems.map(indexRedeemToTypedRedeem);
        },
        getRecentDailyIssues: async (daysBack?: number): Promise<BTCTimeData[]> => {
            const issues = await index.getRecentDailyIssues({ daysBack });
            return issues.map(satoshisToBtcTimeData);
        },
        getRecentDailyRedeems: async (daysBack?: number): Promise<BTCTimeData[]> => {
            const redeems = await index.getRecentDailyRedeems({ daysBack });
            return redeems.map(satoshisToBtcTimeData);
        },
        
        getDustValue: async (): Promise<BTCAmount> => {
            return BTCAmount.from.Satoshi(await index.getDustValue());
        },
    };
};

/* Rest of the file autogenerates thin wrappers for the rest of the API calls and takes care of the typing. */

// The generated client contains the following autogenerated middleware helpers, which must be filtered out
const GeneratedMiddlewareFns = ["withMiddleware", "withPreMiddleware", "withPostMiddleware"] as const;
type GeneratedMiddlewareFns = typeof GeneratedMiddlewareFns[number];
// For every 'foo() => Promise<T>' function, the generated client
// has a 'fooRaw() => <Promise<ApiResponse<T>>' counterpart. These must be filtered out.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawApiResponse = Promise<interbtcIndex.ApiResponse<any>>;

export type ExplicitlyWrappedIndexAPI = ReturnType<typeof explicitWrappers>;

export type ThinWrappedIndexAPI = Pick<
    interbtcIndex.IndexApi,
    {
        [ApiFn in keyof interbtcIndex.IndexApi]-?: ReturnType<interbtcIndex.IndexApi[ApiFn]> extends RawApiResponse
            ? never
            : ApiFn extends GeneratedMiddlewareFns
            ? never
            : ApiFn extends keyof ExplicitlyWrappedIndexAPI
            ? never
            : ApiFn;
    }[keyof interbtcIndex.IndexApi]
>;

export type WrappedIndexAPI = ThinWrappedIndexAPI & ExplicitlyWrappedIndexAPI;

export const DefaultIndexAPI: (configuration: interbtcIndex.Configuration, api: ApiPromise) => WrappedIndexAPI = (
    configuration,
    api
) => {
    const index = new interbtcIndex.IndexApi(configuration);

    const instantiatedExplicitWrappers = explicitWrappers(index, api);

    const excludeFromThinWrappers = (key: string) =>
        Object.keys(explicitWrappers).includes(key) ||
        (GeneratedMiddlewareFns as readonly string[]).includes(key) ||
        key.includes("Raw") ||
        key === "constructor";
    const keys = (Object.getOwnPropertyNames(Object.getPrototypeOf(index)) as (keyof typeof index)[]).filter(
        (apiName) => !excludeFromThinWrappers(apiName)
    );

    const thinWrappers = Object.fromEntries(
        keys.map((apiName) => {
            return [
                apiName,
                // all functions only have one arg
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (arg?: any) => {
                    return index[apiName](arg);
                },
            ];
        })
    ) as ThinWrappedIndexAPI;

    return {
        ...instantiatedExplicitWrappers,
        ...thinWrappers,
    };
};

export function indexIssueToTypedIssue(issue: interbtcIndex.Issue): Issue {
    return {
        ...issue,
        amountInterBTC: BTCAmount.from.Satoshi(issue.amountInterBTC),
        bridgeFee: BTCAmount.from.Satoshi(issue.bridgeFee),
        griefingCollateral: PolkadotAmount.from.Planck(issue.griefingCollateral),
        btcAmountSubmittedByUser: issue.btcAmountSubmittedByUser
            ? BTCAmount.from.Satoshi(issue.btcAmountSubmittedByUser)
            : undefined,
        refundAmountBTC: issue.refundAmountBTC ? BTCAmount.from.Satoshi(issue.refundAmountBTC) : undefined,
        executedAmountBTC: issue.executedAmountBTC ? BTCAmount.from.Satoshi(issue.executedAmountBTC) : undefined,
    };
}

export function indexRedeemToTypedRedeem(redeem: interbtcIndex.Redeem): Redeem {
    return {
        ...redeem,
        amountBTC: BTCAmount.from.Satoshi(redeem.amountBTC),
        dotPremium: PolkadotAmount.from.Planck(redeem.dotPremium),
        bridgeFee: BTCAmount.from.Satoshi(redeem.bridgeFee),
        btcTransferFee: BTCAmount.from.Satoshi(redeem.btcTransferFee),
    };
}

export function satoshisToBtcTimeData(data: SatoshisTimeData): BTCTimeData {
    return {
        date: new Date(data.date),
        btc: BTCAmount.from.Satoshi(data.sat),
    };
}