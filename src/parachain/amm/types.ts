import { MonetaryAmount } from "@interlay/monetary-js";
import { CurrencyExt } from "../..";

enum PoolType {
    STANDARD = "STANDARD",
    STABLE_PLAIN = "STABLE_PLAIN",
    STABLE_META = "STABLE_META",
}

type PooledCurrencies = Array<MonetaryAmount<CurrencyExt>>;

export { PoolType };
export type { PooledCurrencies };
