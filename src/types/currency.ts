import { BTCAmount, PolkadotAmount, KusamaAmount, CurrencyName, Polkadot, Kusama, Bitcoin, BTCUnit, ExchangeRate, KusamaUnit, PolkadotUnit, Ticker } from "@interlay/monetary-js";
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

export function monetaryToCurrencyId(monetary: CurrencyAmount): CurrencyIdLiteral {
    switch (monetary.currency.name) {
        case(CurrencyName.Bitcoin): {
            return CurrencyIdLiteral.INTERBTC;
        }
        case(CurrencyName.Polkadot): {
            return CurrencyIdLiteral.DOT;
        }
        case(CurrencyName.Kusama): {
            return CurrencyIdLiteral.KSM;
        }
        // TODO: Add `Ethereum` currency?
    }
    throw new Error("No CurrencyId entry for provided Monetary");
}

export function currencyIdToMonetary(currencyId: CurrencyIdLiteral): CollateralCurrency {
    switch (currencyId) {
        case(CurrencyIdLiteral.DOT): {
            return Polkadot;
        }
        case(CurrencyIdLiteral.KSM): {
            return Kusama;
        }
    }
    throw new Error("No CurrencyId entry for provided Monetary");
}

export function rawAmountToCurrency(currencyId: CurrencyIdLiteral, rawAmount: BN): CurrencyAmount {
    switch(currencyId) {
        case(CurrencyIdLiteral.DOT): {
            return PolkadotAmount.from.Planck(rawAmount.toString());
        }
        case(CurrencyIdLiteral.INTERBTC): {
            return BTCAmount.from.Satoshi(rawAmount.toString());
        }
        case(CurrencyIdLiteral.KSM): {
            return KusamaAmount.from.Planck(rawAmount.toString());
        }
    }
}

export function tickerToCurrencyIdLiteral(ticker: string): CurrencyIdLiteral {
    switch (ticker) {
        case (Ticker.Bitcoin): {
            return CurrencyIdLiteral.INTERBTC;
        }
        case (Ticker.Polkadot): {
            return CurrencyIdLiteral.DOT;
        }
        case (Ticker.Kusama): {
            return CurrencyIdLiteral.KSM;
        }
    }
    throw new Error("No CurrencyId entry for provided ticker");

}
