import { Bitcoin, Currency, ExchangeRate, Polkadot } from "@interlay/monetary-js";

export interface OracleStatus<B extends Currency, C extends Currency> {
    id: string;
    source: string;
    feed: string;
    lastUpdate: Date;
    exchangeRate: ExchangeRate<B, C>;
    online: boolean;
}

export type DOTBTCOracleStatus = OracleStatus<Bitcoin, Polkadot>;

export type FeeEstimationType = "Fast" | "Half" | "Hour";
