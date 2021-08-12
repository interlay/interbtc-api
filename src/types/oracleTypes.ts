import { Bitcoin, BTCUnit, Currency, ExchangeRate, Polkadot, PolkadotUnit, UnitList } from "@interlay/monetary-js";

export interface OracleStatus<
    B extends Currency<BaseUnit>,
    BaseUnit extends UnitList,
    C extends Currency<CounterUnit>,
    CounterUnit extends UnitList
> {
    id: string;
    source: string;
    feed: string;
    lastUpdate: Date;
    exchangeRate: ExchangeRate<B, BaseUnit, C, CounterUnit>;
    online: boolean;
}

export type DOTBTCOracleStatus = OracleStatus<Bitcoin, BTCUnit, Polkadot, PolkadotUnit>;
