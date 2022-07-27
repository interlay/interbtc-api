import {
    Polkadot,
    Kusama,
    Currency,
    PolkadotAmount,
    KusamaAmount,
    InterBtc,
    KBtc,
    InterBtcAmount,
    KBtcAmount,
    Kintsugi,
    Interlay,
    VoteInterlay,
    VoteKintsugi,
    MonetaryAmount,
    KintsugiAmount,
    InterlayAmount,
} from "@interlay/monetary-js";
import { ApiPromise } from "@polkadot/api";
import {
    EscrowLockedBalance,
    EscrowPoint,
    InterbtcPrimitivesCurrencyId,
    OrmlTokensAccountData,
} from "@polkadot/types/lookup";
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

export const CollateralAmount = [PolkadotAmount, KusamaAmount, InterlayAmount, KintsugiAmount];
export type CollateralAmount = typeof CollateralAmount[number];

export const CollateralCurrency = [Polkadot, Kusama, Interlay, Kintsugi] as const;
export type CollateralCurrency = typeof CollateralCurrency[number];

export const WrappedCurrency = [InterBtc, KBtc];
export type WrappedCurrency = typeof WrappedCurrency[number];

export const WrappedAmount = [InterBtcAmount, KBtcAmount];
export type WrappedAmount = typeof WrappedAmount[number];

export const GovernanceCurrency = [Interlay, Kintsugi];
export type GovernanceCurrency = typeof GovernanceCurrency[number];

export const VotingCurrency = [VoteInterlay, VoteKintsugi];
export type VotingCurrency = typeof VotingCurrency[number];

export type StakedBalance = {
    amount: MonetaryAmount<GovernanceCurrency>;
    endBlock: number;
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

export function currencyIdToMonetaryCurrency(currencyId: InterbtcPrimitivesCurrencyId): Currency {
    // The currencyId is always a token, since it is just a tuple struct
    if (!currencyId.isToken) {
        throw new Error("The currency ID must be a token");
    }
    const token = currencyId.asToken;
    if (token.isIbtc) {
        return InterBtc;
    } else if (token.isDot) {
        return Polkadot;
    } else if (token.isKsm) {
        return Kusama;
    } else if (token.isKbtc) {
        return KBtc;
    } else if (token.isKint) {
        return Kintsugi;
    } else if (token.isIntr) {
        return Interlay;
    }
    throw new Error("No CurrencyId entry for provided ticker");
}

export function currencyIdLiteralToMonetaryCurrency(api: ApiPromise, currencyIdLiteral: CurrencyIdLiteral): Currency {
    return currencyIdToMonetaryCurrency(newCurrencyId(api, currencyIdLiteral));
}

export function currencyIdToLiteral(currencyId: InterbtcPrimitivesCurrencyId): CurrencyIdLiteral {
    const monetaryCurrency = currencyIdToMonetaryCurrency(currencyId);
    return tickerToCurrencyIdLiteral(monetaryCurrency.ticker);
}

export function tickerToMonetaryCurrency(api: ApiPromise, ticker: string): Currency {
    const currencyIdLiteral = tickerToCurrencyIdLiteral(ticker);
    return currencyIdToMonetaryCurrency(newCurrencyId(api, currencyIdLiteral));
}

export type RWEscrowPoint = {
    bias: BN;
    slope: BN;
    ts: BN;
};

export function parseEscrowPoint(e: EscrowPoint): RWEscrowPoint {
    return {
        bias: e.bias.toBn(),
        slope: e.slope.toBn(),
        ts: e.ts.toBn(),
    };
}

export class ChainBalance {
    free: MonetaryAmount<Currency>;
    transferable: MonetaryAmount<Currency>;
    reserved: MonetaryAmount<Currency>;
    currency: Currency;

    constructor(currency: Currency, free?: BigSource, transferable?: BigSource, reserved?: BigSource) {
        this.currency = currency;
        this.free = newMonetaryAmount(free || 0, currency);
        this.transferable = newMonetaryAmount(transferable || 0, currency);
        this.reserved = newMonetaryAmount(reserved || 0, currency);
    }

    /*
        First stringifies the `MonetaryAmount`s, then the entire object.
        Allows for simple comparison in tests.
    */
    toString(): string {
        const stringifiedChainBalance = Object.fromEntries(Object.entries(this).map(([k, v]) => [k, v.toString()]));
        return JSON.stringify(stringifiedChainBalance);
    }
}

export function parseOrmlTokensAccountData(data: OrmlTokensAccountData, currency: Currency): ChainBalance {
    return new ChainBalance(
        currency,
        data.free.toString(),
        data.free.sub(data.frozen).toString(),
        data.reserved.toString()
    );
}

export function parseEscrowLockedBalance(
    governanceCurrency: GovernanceCurrency,
    escrowLockedBalance: EscrowLockedBalance
): StakedBalance {
    return {
        amount: newMonetaryAmount(escrowLockedBalance.amount.toString(), governanceCurrency),
        endBlock: escrowLockedBalance.end.toNumber(),
    };
}
