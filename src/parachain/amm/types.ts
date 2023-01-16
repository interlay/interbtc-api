import { MonetaryAmount } from "@interlay/monetary-js";
import { CurrencyExt } from "../..";

enum PoolType {
    STANDARD = "STANDARD",
    STABLE = "STABLE",
}

type PooledCurrencies = Array<MonetaryAmount<CurrencyExt>>;

export { PoolType };
export type { PooledCurrencies };
