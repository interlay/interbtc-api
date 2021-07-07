import {
    BTCAmount,
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
import BN from "bn.js";

export enum CurrencyIdLiteral {
    DOT = "DOT",
    KSM = "KSM",
    INTERBTC = "INTERBTC",
}

export type CurrencyAmount = BTCAmount | PolkadotAmount | KusamaAmount;
export type BridgeCurrency = Bitcoin | Polkadot | Kusama;
export type CollateralAmount = PolkadotAmount | KusamaAmount;
export type CollateralCurrency = Polkadot | Kusama;
export type CollateralUnits = PolkadotUnit | KusamaUnit;
export type CurrencyUnits = BTCUnit | PolkadotUnit | KusamaUnit;

export function monetaryToCurrencyId<C extends CurrencyUnits>(
    monetary: MonetaryAmount<Currency<C>, C>
): CurrencyIdLiteral {
    switch (monetary.currency.name) {
        case Bitcoin.name: {
            return CurrencyIdLiteral.INTERBTC;
        }
        case "Polkadot": {
            return CurrencyIdLiteral.DOT;
        }
        case "Kusama": {
            return CurrencyIdLiteral.KSM;
        }
        // TODO: Add `Ethereum` currency?
    }
    throw new Error("No CurrencyId entry for provided Monetary");
}

export function currencyIdToMonetary(currencyId: CurrencyIdLiteral): CollateralCurrency {
    switch (currencyId) {
        case CurrencyIdLiteral.DOT: {
            return Polkadot;
        }
        case CurrencyIdLiteral.KSM: {
            return Kusama;
        }
    }
    throw new Error("No CurrencyId entry for provided Monetary");
}

export function rawAmountToCurrency(currencyId: CurrencyIdLiteral, rawAmount: BN): CurrencyAmount {
    switch (currencyId) {
        case CurrencyIdLiteral.DOT: {
            return PolkadotAmount.from.Planck(rawAmount.toString());
        }
        case CurrencyIdLiteral.INTERBTC: {
            return BTCAmount.from.Satoshi(rawAmount.toString());
        }
        case CurrencyIdLiteral.KSM: {
            return KusamaAmount.from.Planck(rawAmount.toString());
        }
    }
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
