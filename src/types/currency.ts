import {
    Polkadot,
    Kusama,
    Currency,
    PolkadotAmount,
    KusamaAmount,
    PolkadotUnit,
    KusamaUnit,
    BitcoinUnit,
    KintsugiUnit,
    InterlayUnit,
    InterBtc,
    KBtc,
    InterBtcAmount,
    KBtcAmount,
    Kintsugi,
    Interlay,
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

export const CollateralAmount = [PolkadotAmount, KusamaAmount];
export type CollateralAmount = typeof CollateralAmount[number];

export const CollateralCurrency = [Polkadot, Kusama] as const;
export type CollateralCurrency = typeof CollateralCurrency[number];

export const CollateralUnit = [PolkadotUnit, KusamaUnit];
export type CollateralUnit = typeof CollateralUnit[number];

export const CurrencyUnit = [BitcoinUnit, PolkadotUnit, KusamaUnit, KintsugiUnit, InterlayUnit];
export type CurrencyUnit = typeof CurrencyUnit[number];

export const WrappedCurrency = [InterBtc, KBtc];
export type WrappedCurrency = typeof WrappedCurrency[number];

export const WrappedAmount = [InterBtcAmount, KBtcAmount];
export type WrappedAmount = typeof WrappedAmount[number];

export function tickerToCurrencyIdLiteral(ticker: string): CurrencyIdLiteral {
    switch (ticker) {
        case Polkadot.ticker: {
            return CurrencyIdLiteral.DOT;
        }
        case Kusama.ticker: {
            return CurrencyIdLiteral.KSM;
        }
        case KBtc.ticker: {
            return CurrencyIdLiteral.KBTC;
        }
        case InterBtc.ticker: {
            return CurrencyIdLiteral.INTERBTC;
        }
        case Kintsugi.ticker: {
            return CurrencyIdLiteral.KINT;
        }
        case Interlay.ticker: {
            return CurrencyIdLiteral.INTR;
        }
    }
    throw new Error("No CurrencyId entry for provided ticker");
}

export function currencyIdToMonetaryCurrency<U extends CurrencyUnit>(currencyId: CurrencyId): Currency<U> {
    if (currencyId.isInterbtc) {
        return InterBtc as unknown as Currency<U>;
    } else if (currencyId.isDot) {
        return Polkadot as unknown as Currency<U>;
    } else if (currencyId.isKsm) {
        return Kusama as unknown as Currency<U>;
    } else if (currencyId.isKbtc) {
        return KBtc as unknown as Currency<U>;
    } else if (currencyId.isKint) {
        return Kintsugi as unknown as Currency<U>;
    } else if (currencyId.isIntr) {
        return Interlay as unknown as Currency<U>;
    }
    throw new Error("No CurrencyId entry for provided ticker");
}
