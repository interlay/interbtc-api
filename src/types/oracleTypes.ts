import { ExchangeRate } from "@interlay/monetary-js";
import { CurrencyExt } from "./currency";

export interface OracleStatus<B extends CurrencyExt, C extends CurrencyExt> {
    id: string;
    source: string;
    feed: string;
    lastUpdate: Date;
    exchangeRate: ExchangeRate<B, C>;
    online: boolean;
}
