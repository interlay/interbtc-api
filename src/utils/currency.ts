import Big, { BigSource } from "big.js";
import BN from "bn.js";
import {
    Bitcoin,
    BitcoinUnit,
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
import {
    CurrencyUnit,
    tickerToCurrencyIdLiteral,
    GovernanceCurrency,
    GovernanceUnit,
    CollateralCurrency,
} from "../types/currency";
import { ApiPromise } from "@polkadot/api";
import { FeeEstimationType } from "../types/oracleTypes";
import { newCurrencyId } from "./encoding";

// set maximum exponents
Big.PE = 21;
Big.NE = -12;

export const MBTC_IN_SAT = 100_000;

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

export function newMonetaryAmount<U extends CurrencyUnit>(
    amount: BigSource,
    currency: Currency<U>,
    base = false
): MonetaryAmount<Currency<U>, U> {
    const unit = base ? currency.base : currency.rawBase;
    return new MonetaryAmount<Currency<U>, U>(currency, amount, unit);
}

export function newCollateralBTCExchangeRate<U extends CurrencyUnit>(
    rate: Big,
    counterCurrency: Currency<U>,
    useBaseUnits = false
): ExchangeRate<Bitcoin, BitcoinUnit, Currency<U>, U> {
    const [baseCurrencyUnit, counterCurrencyUnit] = useBaseUnits
        ? [Bitcoin.base, counterCurrency.base]
        : [Bitcoin.rawBase, counterCurrency.rawBase];
    return new ExchangeRate<Bitcoin, BitcoinUnit, Currency<U>, U>(
        Bitcoin,
        counterCurrency,
        rate,
        baseCurrencyUnit,
        counterCurrencyUnit
    );
}

export function createInclusionOracleKey(api: ApiPromise, type: FeeEstimationType): InterbtcPrimitivesOracleKey {
    return api.createType("InterbtcPrimitivesOracleKey", { FeeEstimation: type });
}

export function createExchangeRateOracleKey<U extends CurrencyUnit>(
    api: ApiPromise,
    collateralCurrency: Currency<U>
): InterbtcPrimitivesOracleKey {
    const currencyId = newCurrencyId(api, tickerToCurrencyIdLiteral(collateralCurrency.ticker));
    return api.createType("InterbtcPrimitivesOracleKey", { ExchangeRate: currencyId });
}

export function toVoting(governanceCurrency: GovernanceCurrency): Currency<GovernanceUnit> {
    switch (governanceCurrency) {
        case Interlay:
            return VoteInterlay as Currency<GovernanceUnit>;
        case Kintsugi:
            return VoteKintsugi as Currency<GovernanceUnit>;
        default:
            throw new Error("Provided currency is not a governance currency");
    }
}

export function getCorrespondingCollateralCurrency(governanceCurrency: Currency<GovernanceUnit>): CollateralCurrency {
    switch (governanceCurrency.ticker) {
        case "KINT":
            return Kusama;
        case "INTR":
            return Polkadot;
        default:
            throw new Error("Provided currency is not a governance currency");
    }
}
