import Big from "big.js";

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
    return x.round(0, 3);
}

export function roundUpBtcToNearestSatoshi(amountBtc: string): string {
    const amountSat = new Big(btcToSat(amountBtc));
    const amountSatRounded = roundUpBigToNearestInteger(amountSat).toString();
    return satToBTC(amountSatRounded);
}

export function satToBTC(sat: string): string {
    const satAmount = roundUpBigToNearestInteger(new Big(sat));
    return satAmount.div(BTC_IN_SAT).toString();
}

export function satToMBTC(sat: string): string {
    const satAmount = new Big(sat);
    return satAmount.div(MBTC_IN_SAT).toString();
}

export function btcToSat(btc: string): string {
    const btcAmount: Big = new Big(btc);
    const satAmount: Big = btcAmount.mul(BTC_IN_SAT);

    // Round up to the nearest Satoshi
    return roundUpBigToNearestInteger(satAmount).toString();
}

export function planckToDOT(planck: string): string {
    const planckAmount = new Big(planck);
    return planckAmount.div(DOT_IN_PLANCK).toString();
}

export function dotToPlanck(dot: string): string | undefined {
    const dotAmount = new Big(dot);
    const planckAmount = dotAmount.mul(DOT_IN_PLANCK);
    if (planckAmount.gte(1)) {
        return planckAmount.toString();
    }
    // reject any values that are less than 1 planck
    return undefined;
}
