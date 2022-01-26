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
    VoteInterlay,
    VoteKintsugi
} from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { EscrowPoint, InterbtcPrimitivesCurrencyId } from "@polkadot/types/lookup";
import BN from "bn.js";
import { newCurrencyId } from "../utils";

export enum CurrencyIdLiteral {
    DOT = "DOT",
    INTERBTC = "INTERBTC",
    INTR = "INTR",
    KSM = "KSM",
    KBTC = "KBTC",
    KINT = "KINT",
}

export type WrappedIdLiteral = CurrencyIdLiteral.INTERBTC | CurrencyIdLiteral.KBTC;
export type CollateralIdLiteral =
    | CurrencyIdLiteral.DOT
    | CurrencyIdLiteral.KSM
    | CurrencyIdLiteral.KINT
    | CurrencyIdLiteral.INTR;

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

export const GovernanceCurrency = [Interlay, Kintsugi];
export type GovernanceCurrency = typeof GovernanceCurrency[number];

export const GovernanceUnit = [InterlayUnit, KintsugiUnit];
export type GovernanceUnit = typeof GovernanceUnit[number];

export const VotingCurrency = [VoteInterlay, VoteKintsugi];
export type VotingCurrency = typeof VotingCurrency[number];

export const VoteUnit = GovernanceUnit;
export type VoteUnit = GovernanceUnit;

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

export function currencyIdToMonetaryCurrency<U extends CurrencyUnit>(currencyId: InterbtcPrimitivesCurrencyId): Currency<U> {
    // The currencyId is always a token, since it is just a tuple struct
    if (!currencyId.isToken) {
        throw new Error("The currency ID must be a token");
    }
    const token = currencyId.asToken;
    if (token.isInterbtc) {
        return InterBtc as unknown as Currency<U>;
    } else if (token.isDot) {
        return Polkadot as unknown as Currency<U>;
    } else if (token.isKsm) {
        return Kusama as unknown as Currency<U>;
    } else if (token.isKbtc) {
        return KBtc as unknown as Currency<U>;
    } else if (token.isKint) {
        return Kintsugi as unknown as Currency<U>;
    } else if (token.isIntr) {
        return Interlay as unknown as Currency<U>;
    }
    throw new Error("No CurrencyId entry for provided ticker");
}

export function currencyIdLiteralToMonetaryCurrency<U extends CurrencyUnit>(
    api: ApiPromise,
    currencyIdLiteral: CurrencyIdLiteral
): Currency<U> {
    return currencyIdToMonetaryCurrency(
        newCurrencyId(api, currencyIdLiteral)
    );
}

export function currencyIdToLiteral(currencyId: InterbtcPrimitivesCurrencyId): CurrencyIdLiteral {
    const monetaryCurrency = currencyIdToMonetaryCurrency(currencyId);
    return tickerToCurrencyIdLiteral(monetaryCurrency.ticker);
}

export function tickerToMonetaryCurrency<U extends CurrencyUnit>(api: ApiPromise, ticker: string): Currency<U> {
    const currencyIdLiteral = tickerToCurrencyIdLiteral(ticker);
    return currencyIdToMonetaryCurrency(newCurrencyId(api, currencyIdLiteral));
}

export type RWEscrowPoint = {
    bias: BN,
    slope: BN,
    ts: BN
}

export function parseEscrowPoint(e: EscrowPoint): RWEscrowPoint {
    return {
        bias: e.bias.toBn(),
        slope: e.slope.toBn(),
        ts: e.ts.toBn()
    };
}
