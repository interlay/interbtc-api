import { ApiPromise } from "@polkadot/api";
import { CurrencyId } from "../interfaces/types";

export enum CurrencyIdLiteral {
    DOT = "DOT",
    KSM = "KSM",
    INTERBTC = "INTERBTC",
}

export function encodeCurrencyIdLiteral(api: ApiPromise, c: CurrencyIdLiteral): CurrencyId {
    return api.createType("CurrencyId", c);
}
