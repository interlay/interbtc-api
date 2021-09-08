import {
    DOTAmount,
    KSMAmount,
    Polkadot,
    Kusama,
    BTCUnit,
    KSMUnit,
    DOTUnit,
    Currency,
    KINTUnit,
    INTRUnit,
    interBTC,
    kBTC,
    interBTCAmount,
    kBTCAmount,
    KINT,
    INTR,
} from "@interlay/monetary-js";
import { CurrencyId } from "../interfaces";

export enum CurrencyIdLiteral {
    DOT = "DOT",
    KSM = "KSM",
    INTERBTC = "INTERBTC",
    KBTC = "KBTC",
    KINT = "KINT",
    INTR = "INTR",
}

export const CollateralAmount = [DOTAmount, KSMAmount];
export type CollateralAmount = typeof CollateralAmount[number];

export const CollateralCurrency = [Polkadot, Kusama] as const;
export type CollateralCurrency = typeof CollateralCurrency[number];

export const CollateralUnit = [DOTUnit, KSMUnit];
export type CollateralUnit = typeof CollateralUnit[number];

export const CurrencyUnit = [BTCUnit, DOTUnit, KSMUnit, KINTUnit, INTRUnit];
export type CurrencyUnit = typeof CurrencyUnit[number];

export const WrappedCurrency = [interBTC, kBTC];
export type WrappedCurrency = typeof WrappedCurrency[number];

export const WrappedAmount = [interBTCAmount, kBTCAmount];
export type WrappedAmount = typeof WrappedAmount[number];

export function tickerToCurrencyIdLiteral(ticker: string): CurrencyIdLiteral {
    switch (ticker) {
        case Polkadot.ticker: {
            return CurrencyIdLiteral.DOT;
        }
        case Kusama.ticker: {
            return CurrencyIdLiteral.KSM;
        }
        case kBTC.ticker: {
            return CurrencyIdLiteral.KBTC;
        }
        case interBTC.ticker: {
            return CurrencyIdLiteral.INTERBTC;
        }
        case KINT.ticker: {
            return CurrencyIdLiteral.KINT;
        }
        case INTR.ticker: {
            return CurrencyIdLiteral.INTR;
        }
    }
    throw new Error("No CurrencyId entry for provided ticker");
}

export function currencyIdToMonetaryCurrency<U extends CurrencyUnit>(currencyId: CurrencyId): Currency<U> {
    if (currencyId.isInterbtc) {
        return interBTC as unknown as Currency<U>;
    } else if (currencyId.isDot) {
        return Polkadot as unknown as Currency<U>;
    } else if (currencyId.isKsm) {
        return Kusama as unknown as Currency<U>;
    } else if (currencyId.isKbtc) {
        return kBTC as unknown as Currency<U>;
    } else if (currencyId.isKint) {
        return KINT as unknown as Currency<U>;
    } else if (currencyId.isIntr) {
        return INTR as unknown as Currency<U>;
    }
    throw new Error("No CurrencyId entry for provided ticker");
}
