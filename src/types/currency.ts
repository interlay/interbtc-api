import {
    PolkadotAmount,
    KusamaAmount,
    Polkadot,
    Kusama,
    Bitcoin,
    BTCUnit,
    KusamaUnit,
    PolkadotUnit,
    MonetaryAmount,
    Currency,
} from "@interlay/monetary-js";

export enum CurrencyIdLiteral {
    DOT = "DOT",
    KSM = "KSM",
    INTERBTC = "INTERBTC",
}

export type CollateralAmount = PolkadotAmount | KusamaAmount;
export type CollateralCurrency = Polkadot | Kusama;
export type CollateralUnit = PolkadotUnit | KusamaUnit;
export type CurrencyUnit = BTCUnit | PolkadotUnit | KusamaUnit;

export function monetaryToCurrencyId<C extends CurrencyUnit>(
    monetary: MonetaryAmount<Currency<C>, C>
): CurrencyIdLiteral {
    switch (monetary.currency.name) {
        case Bitcoin.name: {
            return CurrencyIdLiteral.INTERBTC;
        }
        case Polkadot.name: {
            return CurrencyIdLiteral.DOT;
        }
        case Kusama.name: {
            return CurrencyIdLiteral.KSM;
        }
        // TODO: Add `Ethereum` currency?
    }
    throw new Error("No CurrencyId entry for provided Monetary");
}

export function tickerToCurrencyIdLiteral(ticker: string): CurrencyIdLiteral {
    switch (ticker) {
        case Bitcoin.ticker: {
            return CurrencyIdLiteral.INTERBTC;
        }
        case Polkadot.ticker: {
            return CurrencyIdLiteral.DOT;
        }
        case Kusama.ticker: {
            return CurrencyIdLiteral.KSM;
        }
    }
    throw new Error("No CurrencyId entry for provided ticker");
}
