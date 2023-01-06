import { MonetaryAmount } from "@interlay/monetary-js";
import { CurrencyExt } from "../..";

enum PoolType {
    STANDARD = "STANDARD",
    STABLE = "STABLE",
}

type LPToken = CurrencyExt; // TODO: specify when the currencies are refactored to have LP token type

type PooledCurrencies = Array<MonetaryAmount<CurrencyExt>>;

export { PoolType };
export type { LPToken, PooledCurrencies };
