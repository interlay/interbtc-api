import Big from "big.js";

// set maximum exponents
Big.PE, Big.NE = 40;

export const BTC_IN_SAT = 100_000_000;
export const DOT_IN_PLANCK = 10_000_000_000;

export function satToBTC(sat: string): string {
    const satAmount = new Big(sat);
    return (satAmount.div(BTC_IN_SAT)).toString();
}

export function BTCtoSat(btc: string): string | undefined {
    const btcAmount: Big = new Big(btc);
    const satAmount: Big = btcAmount.mul(BTC_IN_SAT);
    if (satAmount.mod(1).eq(0)) {
        return undefined;
    }
    return satAmount.toString();
}

export function planckToDOT(planck: string): string {
    const planckAmount = new Big(planck);
    return (planckAmount.div(DOT_IN_PLANCK)).toString();
}

export function DOTtoPlanck(dot: string): string | undefined {
    const dotAmount: Big = new Big(dot);
    const planckAmount: Big = dotAmount.mul(DOT_IN_PLANCK);
    if (planckAmount.mod(1).eq(0)) {
        return undefined;
    }
    return planckAmount.toString();
}