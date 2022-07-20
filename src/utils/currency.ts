import Big, { BigSource } from "big.js";
import BN from "bn.js";
import {
    Bitcoin,
    Currency,
    ExchangeRate,
    Interlay,
    Kintsugi,
    Kusama,
    MonetaryAmount,
    Polkadot,
    VoteInterlay,
    VoteKintsugi,
} from "@interlay/monetary-js";
import { InterbtcPrimitivesOracleKey } from "@polkadot/types/lookup";
import { tickerToCurrencyIdLiteral, GovernanceCurrency, CollateralCurrency } from "../types/currency";
import { ApiPromise } from "@polkadot/api";
import { FeeEstimationType } from "../types/oracleTypes";
import { newCurrencyId } from "./encoding";

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

export function newMonetaryAmount(amount: BigSource, currency: Currency, base = false): MonetaryAmount<Currency> {
    const finalAmount = base ? new Big(amount) : atomicToBaseAmount(amount, currency);
    return new MonetaryAmount<Currency>(currency, finalAmount);
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
    collateralCurrency: Currency
): InterbtcPrimitivesOracleKey {
    const currencyId = newCurrencyId(api, tickerToCurrencyIdLiteral(collateralCurrency.ticker));
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

export function getCorrespondingCollateralCurrencies(
    governanceCurrency: GovernanceCurrency
): Array<CollateralCurrency> {
    switch (governanceCurrency.ticker) {
        case "KINT":
            return [Kusama, Kintsugi];
        case "INTR":
            return [Polkadot];
        default:
            throw new Error("Provided currency is not a governance currency");
    }
}
