import Big, { BigSource } from "big.js";
import BN from "bn.js";
import { Bitcoin, BTCUnit, Currency, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";
import { CurrencyUnit, tickerToCurrencyIdLiteral } from "../types/currency";
import { OracleKey } from "../interfaces";
import { ApiPromise } from "@polkadot/api";
import { FeeEstimationType } from "../types/oracleTypes";

// set maximum exponents
Big.PE = 21;
Big.NE = -12;

export const BTC_IN_SAT = 100_000_000;
export const MBTC_IN_SAT = 100_000;
export const DOT_IN_PLANCK = 10_000_000_000;

export function roundTwoDecimals(input: string): string {
    const number = new Big(input);
    return number.round(2).toString();
}

export function roundUpBigToNearestInteger(x: Big): Big {
    /*
    Uses the round method, defined as follows:

    Big.round(dp, rm) -> Big
    dp? : number : integer, -1e+6 to 1e+6 inclusive
    rm? : number : 0, 1, 2 or 3
    Returns a Big number whose value is the value of this Big number
    rounded using rounding mode rm to a maximum of dp decimal places,
    or, if dp is negative, to an integer which is a multiple of 10**-dp.
    */
    return x.round(0, 3);
}

export function roundUpBtcToNearestSatoshi(amountBtc: Big): Big {
    return satToBTC(btcToSat(amountBtc));
}

export function bnToBig(x: BN): Big {
    return new Big(x.toString());
}

export function bigToBn(x: Big): BN {
    // Convert to string using `toFixed`, to avoid cases like `5e+23`
    return new BN(roundUpBigToNearestInteger(x).toFixed());
}

export function satToBTC(sat: BN): Big {
    const satAmount = bnToBig(sat);
    return satAmount.div(BTC_IN_SAT);
}

export function satToMBTC(sat: string): string {
    const satAmount = new Big(sat);
    return satAmount.div(MBTC_IN_SAT).toString();
}

export function btcToSat(btc: Big): BN {
    const satAmount = btc.mul(BTC_IN_SAT);

    // Round up to the nearest Satoshi
    return bigToBn(satAmount);
}

export function planckToDOT(planck: BN): Big {
    const planckAmount = bnToBig(planck);
    return planckAmount.div(DOT_IN_PLANCK);
}

export function dotToPlanck(dot: Big): BN {
    return bigToBn(dot.mul(DOT_IN_PLANCK));
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

export function newMonetaryAmount<C extends CurrencyUnit>(
    amount: BigSource,
    currency: Currency<C>,
    base = false
): MonetaryAmount<Currency<C>, C> {
    const unit = base ? currency.base : currency.rawBase;
    return new MonetaryAmount<Currency<C>, C>(currency, amount, unit);
}

export function newCollateralBTCExchangeRate<C extends CurrencyUnit>(
    rate: Big,
    counterCurrency: Currency<C>,
    useBaseUnits = false
): ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C> {
    const [baseCurrencyUnit, counterCurrencyUnit] = useBaseUnits
        ? [Bitcoin.base, counterCurrency.base]
        : [Bitcoin.rawBase, counterCurrency.rawBase];
    return new ExchangeRate<Bitcoin, BTCUnit, Currency<C>, C>(
        Bitcoin,
        counterCurrency,
        rate,
        baseCurrencyUnit,
        counterCurrencyUnit
    );
}

export function createInclusionOracleKey(api: ApiPromise, type: FeeEstimationType): OracleKey {
    return api.createType("OracleKey", { FeeEstimation: type });
}

export function createExchangeRateOracleKey<C extends CurrencyUnit>(
    api: ApiPromise,
    collateralCurrency: Currency<C>
): OracleKey {
    const currencyId = api.createType("CurrencyId", tickerToCurrencyIdLiteral(collateralCurrency.ticker));
    return api.createType("OracleKey", { ExchangeRate: currencyId });
}
