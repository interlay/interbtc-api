import {
    PolkadotAmount,
    KusamaAmount,
    Polkadot,
    Kusama,
    BTCUnit,
    KusamaUnit,
    PolkadotUnit,
    Currency,
    InterBTC,
    KBTC,
    Kintsugi,
    Interlay,
    KintsugiUnit,
    InterlayUnit,
    InterBTCAmount,
    KBTCAmount,
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

export const COLLTERAL_AMOUNT_VALUES = [PolkadotAmount, KusamaAmount];
export type CollateralAmount = typeof COLLTERAL_AMOUNT_VALUES[number];

export const COLLATERAL_CURRENCIES = [Polkadot, Kusama] as const;
export type CollateralCurrency = typeof COLLATERAL_CURRENCIES[number];

export const COLLATERAL_UNITS = [PolkadotUnit, KusamaUnit];
export type CollateralUnit = typeof COLLATERAL_UNITS[number];

export const CURRENCY_UNITS = [BTCUnit, PolkadotUnit, KusamaUnit, KintsugiUnit, InterlayUnit];
export type CurrencyUnit = typeof CURRENCY_UNITS[number];

export const WRAPPED_CURRENCIES = [InterBTC, KBTC];
export type WrappedCurrency = typeof WRAPPED_CURRENCIES[number];

export const WRAPPED_AMONUT_VALUES = [InterBTCAmount, KBTCAmount];
export type WrappedAmount = typeof WRAPPED_AMONUT_VALUES[number];

export function tickerToCurrencyIdLiteral(ticker: string): CurrencyIdLiteral {
    switch (ticker) {
        case Polkadot.ticker: {
            return CurrencyIdLiteral.DOT;
        }
        case Kusama.ticker: {
            return CurrencyIdLiteral.KSM;
        }
        case KBTC.ticker: {
            return CurrencyIdLiteral.KBTC;
        }
        case InterBTC.ticker: {
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

export function currencyIdToMonetaryCurrency<C extends CurrencyUnit>(currencyId: CurrencyId): Currency<C> {
    if (currencyId.isInterbtc) {
        return InterBTC as unknown as Currency<C>;
    } else if (currencyId.isDot) {
        return Polkadot as unknown as Currency<C>;
    } else if (currencyId.isKsm) {
        return Kusama as unknown as Currency<C>;
    } else if (currencyId.isKbtc) {
        return KBTC as unknown as Currency<C>;
    } else if (currencyId.isKint) {
        return Kintsugi as unknown as Currency<C>;
    } else if (currencyId.isIntr) {
        return Interlay as unknown as Currency<C>;
    }
    throw new Error("No CurrencyId entry for provided ticker");
}
