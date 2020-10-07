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

export function satToBTC(sat: string): string {
    const satAmount = new Big(sat);
    return satAmount.div(BTC_IN_SAT).toString();
}

export function satToMBTC(sat: string): string {
    const satAmount = new Big(sat);
    return satAmount.div(MBTC_IN_SAT).toString();
}

export function btcToSat(btc: string): string | undefined {
    const btcAmount: Big = new Big(btc);
    const satAmount: Big = btcAmount.mul(BTC_IN_SAT);
    if (satAmount.mod(1).eq(0)) {
        return satAmount.toString();
    }
    // reject any values that are less than 1 sat
    return undefined;
}

export function planckToDOT(planck: string): string {
    const planckAmount = new Big(planck);
    return planckAmount.div(DOT_IN_PLANCK).toString();
}

export function dotToPlanck(dot: string): string | undefined {
    const dotAmount: Big = new Big(dot);
    const planckAmount: Big = dotAmount.mul(DOT_IN_PLANCK);
    if (planckAmount.mod(1).eq(0)) {
        return planckAmount.toString();
    }
    // reject any values that are less than 1 planck
    return undefined;
}
