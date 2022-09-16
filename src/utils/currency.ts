import Big, { BigSource } from "big.js";
import BN from "bn.js";
import {
    Bitcoin,
    Currency,
    ExchangeRate,
    InterBtc,
    Interlay,
    KBtc,
    Kintsugi,
    Kusama,
    MonetaryAmount,
    Polkadot,
    VoteInterlay,
    VoteKintsugi,
} from "@interlay/monetary-js";
import { InterbtcPrimitivesOracleKey } from "@polkadot/types/lookup";
import { GovernanceCurrency, CurrencyExt, ForeignAsset, CollateralCurrencyExt } from "../types/currency";
import { ApiPromise } from "@polkadot/api";
import { FeeEstimationType } from "../types/oracleTypes";
import { newCurrencyId, storageKeyToNthInner } from "./encoding";
import { InterbtcPrimitivesCurrencyId, InterbtcPrimitivesTokenSymbol } from "../interfaces";
import { AssetRegistryAPI } from "../parachain/asset-registry";
import { Option } from "@polkadot/types/codec";
import { u128 } from "@polkadot/types";

// set maximum exponents
Big.PE = 21;
Big.NE = -12;

export const MBTC_IN_SAT = 100_000;
export const ATOMIC_UNIT = 0;

export function roundTwoDecimals(input: string): string {
    const number = new Big(input);
    return number.round(2).toString();
}

export function satToMBTC(sat: string): string {
    const satAmount = new Big(sat);
    return satAmount.div(MBTC_IN_SAT).toString();
}

export function computeLazyDistribution(stake: Big, perToken: Big, tally: Big): Big {
    return stake.mul(perToken).sub(tally);
}

export function roundLastNDigits(n: number, x: BN | Big | string): string {
    const power = 10 ** n;
    // Use BN such that we perform integer division
    const bigNumber = new BN(x.toString());
    return bigNumber.div(new BN(power)).mul(new BN(power)).toString();
}

export function atomicToBaseAmount(atomicAmount: BigSource, currency: Currency): Big {
    return new Big(atomicAmount).div(new Big(10).pow(currency.decimals));
}

export function newMonetaryAmount(amount: BigSource, currency: CurrencyExt, base = false): MonetaryAmount<CurrencyExt> {
    const finalAmount = base ? new Big(amount) : atomicToBaseAmount(amount, currency);
    return new MonetaryAmount<CurrencyExt>(currency, finalAmount);
}

export function newCollateralBTCExchangeRate(
    rate: Big,
    counterCurrency: Currency,
    useBaseUnits = false
): ExchangeRate<Bitcoin, Currency> {
    const [baseCurrencyUnit, counterCurrencyUnit] = useBaseUnits
        ? [Bitcoin.decimals, counterCurrency.decimals]
        : [ATOMIC_UNIT, ATOMIC_UNIT];
    return new ExchangeRate<Bitcoin, Currency>(Bitcoin, counterCurrency, rate, baseCurrencyUnit, counterCurrencyUnit);
}

export function createInclusionOracleKey(api: ApiPromise, type: FeeEstimationType): InterbtcPrimitivesOracleKey {
    return api.createType("InterbtcPrimitivesOracleKey", { FeeEstimation: type });
}

export function createExchangeRateOracleKey(
    api: ApiPromise,
    collateralCurrency: CurrencyExt
): InterbtcPrimitivesOracleKey {
    const currencyId = newCurrencyId(api, collateralCurrency);
    return api.createType("InterbtcPrimitivesOracleKey", { ExchangeRate: currencyId });
}

export function toVoting(governanceCurrency: GovernanceCurrency): Currency {
    switch (governanceCurrency) {
        case Interlay:
            return VoteInterlay;
        case Kintsugi:
            return VoteKintsugi;
        default:
            throw new Error("Provided currency is not a governance currency");
    }
}

export async function getCollateralCurrencies(
    api: ApiPromise,
    assetRegistry: AssetRegistryAPI
): Promise<Array<CollateralCurrencyExt>> {
    const collatCeilEntries = await api.query.vaultRegistry.systemCollateralCeiling.entries();

    const isOptionGreaterThanZero = (value: Option<u128>) =>
        value.isNone ? false : value.unwrap().toBn().gt(new BN(0));

    const collateralCurrencyPrimitives = collatCeilEntries
        .filter(([_, ceiling]) => isOptionGreaterThanZero(ceiling))
        .map(([storageKey, _]) => storageKeyToNthInner(storageKey));

    return Promise.all(
        collateralCurrencyPrimitives.map((currencyPair) =>
            currencyIdToMonetaryCurrency(assetRegistry, currencyPair.collateral)
        )
    );
}

export function isForeignAsset(currencyExt: CurrencyExt): currencyExt is ForeignAsset {
    // disable rule, use of any is deliberate for run time check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (currencyExt as any).id !== undefined;
}

export function isCurrency(currencyExt: CurrencyExt): currencyExt is Currency {
    return !isForeignAsset(currencyExt);
}

export function isCurrencyEqual(currency: CurrencyExt, otherCurrency: CurrencyExt): boolean {
    if (isForeignAsset(currency) && isForeignAsset(otherCurrency)) {
        return currency.id === otherCurrency.id;
    } else if (isCurrency(currency) && isCurrency(otherCurrency)) {
        return currency.ticker === otherCurrency.ticker;
    }

    return false;
}

export async function currencyIdToMonetaryCurrency(
    assetRegistryApi: AssetRegistryAPI,
    currencyId: InterbtcPrimitivesCurrencyId
): Promise<CurrencyExt> {
    if (currencyId.isToken) {
        return tokenSymbolToCurrency(currencyId.asToken);
    } else if (currencyId.isForeignAsset) {
        const foreignAssetId = currencyId.asForeignAsset;
        return assetRegistryApi.getForeignAsset(foreignAssetId);
    }

    throw new Error(`No handling implemented for currencyId type of ${currencyId.type}`);
}

/**
 * A method that will only try to find a hard-coded currencies.
 * Only for use when we are certain the currency is not a foreign asset.
 * @param tokenSymbol the InterbtcPrimitivesTokenSymbol to look up
 */
export function tokenSymbolToCurrency(tokenSymbol: InterbtcPrimitivesTokenSymbol): Currency {
    if (tokenSymbol.isIbtc) {
        return InterBtc;
    } else if (tokenSymbol.isDot) {
        return Polkadot;
    } else if (tokenSymbol.isKsm) {
        return Kusama;
    } else if (tokenSymbol.isKbtc) {
        return KBtc;
    } else if (tokenSymbol.isKint) {
        return Kintsugi;
    } else if (tokenSymbol.isIntr) {
        return Interlay;
    }
    throw new Error(`No entry provided for token symbol of type '${tokenSymbol?.type}'`);
}
