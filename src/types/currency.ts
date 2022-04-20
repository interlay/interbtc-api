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
    VoteKintsugi,
    MonetaryAmount
} from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import { EscrowLockedBalance, EscrowPoint, InterbtcPrimitivesCurrencyId, OrmlTokensAccountData } from "@polkadot/types/lookup";
import { BigSource } from "big.js";
import BN from "bn.js";
import { newCurrencyId, newMonetaryAmount } from "../utils";

export enum CurrencyIdLiteral {
    DOT = "DOT",
    INTERBTC = "IBTC",
    INTR = "INTR",
    KSM = "KSM",
    KBTC = "KBTC",
    KINT = "KINT",
}

export type WrappedIdLiteral = CurrencyIdLiteral.INTERBTC | CurrencyIdLiteral.KBTC;
export type GovernanceIdLiteral = CurrencyIdLiteral.INTR | CurrencyIdLiteral.KINT;
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

export type StakedBalance<U extends GovernanceUnit> = {
    amount: MonetaryAmount<Currency<U>, U>,
    endBlock: number
};

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

export class ChainBalance<U extends CurrencyUnit> {
    free: MonetaryAmount<Currency<U>, U>;
    transferable: MonetaryAmount<Currency<U>, U>;
    reserved: MonetaryAmount<Currency<U>, U>;
    currency: Currency<U>;

    constructor(
        currency: Currency<U>,
        free?: BigSource,
        transferable?: BigSource,
        reserved?: BigSource
    ) {
        this.currency = currency;
        this.free = newMonetaryAmount(free || 0, currency);
        this.transferable = newMonetaryAmount(transferable || 0, currency);
        this.reserved = newMonetaryAmount(reserved || 0, currency);
    }

    /*
        First stringifies the `MonetaryAmount`s, then the entire object.
        Allows for simple comparison in tests.
    */
    toString(base?: U[keyof U]): string {
        const stringifiedChainBalance = Object.fromEntries(
            Object.entries(this).map(([k, v]) => [k, v.toString(base || this.currency.base)])
        );
        return JSON.stringify(stringifiedChainBalance);
    }
}

export function parseOrmlTokensAccountData<U extends CurrencyUnit>(
    data: OrmlTokensAccountData,
    currency: Currency<U>
): ChainBalance<U> {
    return new ChainBalance(
        currency,
        data.free.toString(),
        data.free.sub(data.frozen).toString(),
        data.reserved.toString()
    );
}

export function parseEscrowLockedBalance(
    governanceCurrency: Currency<GovernanceUnit>,
    escrowLockedBalance: EscrowLockedBalance
): StakedBalance<GovernanceUnit> {
    return {
        amount: newMonetaryAmount(escrowLockedBalance.amount.toString(), governanceCurrency),
        endBlock: escrowLockedBalance.end.toNumber()
    };
}
