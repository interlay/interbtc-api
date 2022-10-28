import {
    Polkadot,
    Kusama,
    Currency,
    InterBtc,
    KBtc,
    InterBtcAmount,
    KBtcAmount,
    Kintsugi,
    Interlay,
    VoteInterlay,
    VoteKintsugi,
    MonetaryAmount,
} from "@interlay/monetary-js";
import { EscrowLockedBalance, EscrowPoint, OrmlTokensAccountData } from "@polkadot/types/lookup";
import { BigSource } from "big.js";
import BN from "bn.js";
import { newMonetaryAmount } from "../utils";

export enum CurrencyIdLiteral {
    DOT = "DOT",
    INTERBTC = "IBTC",
    INTR = "INTR",
    KSM = "KSM",
    KBTC = "KBTC",
    KINT = "KINT",
}

export type WrappedIdLiteral = CurrencyIdLiteral.INTERBTC | CurrencyIdLiteral.KBTC;
export type GovernanceIdLiteral = CurrencyIdLiteral.INTR | CurrencyIdLiteral.KINT;
export type CollateralIdLiteral =
    | CurrencyIdLiteral.DOT
    | CurrencyIdLiteral.KSM
    | CurrencyIdLiteral.KINT
    | CurrencyIdLiteral.INTR;

const CollateralCurrency = [Polkadot, Kusama, Interlay, Kintsugi] as const;
type CollateralCurrency = typeof CollateralCurrency[number];

export type ForeignAsset = Currency & {foreignAsset: { id: number; coingeckoId: string }};
export type LendToken = Currency & {lendToken: { id: number }}; 
export type CollateralCurrencyExt = CollateralCurrency | ForeignAsset | LendToken;
export type CurrencyExt = Currency | ForeignAsset | LendToken;

export const WrappedCurrency = [InterBtc, KBtc];
export type WrappedCurrency = typeof WrappedCurrency[number];

export const WrappedAmount = [InterBtcAmount, KBtcAmount];
export type WrappedAmount = typeof WrappedAmount[number];

export const GovernanceCurrency = [Interlay, Kintsugi];
export type GovernanceCurrency = typeof GovernanceCurrency[number];

export const VotingCurrency = [VoteInterlay, VoteKintsugi];
export type VotingCurrency = typeof VotingCurrency[number];

export type StakedBalance = {
    amount: MonetaryAmount<GovernanceCurrency>;
    endBlock: number;
};

export type RWEscrowPoint = {
    bias: BN;
    slope: BN;
    ts: BN;
};

export function parseEscrowPoint(e: EscrowPoint): RWEscrowPoint {
    return {
        bias: e.bias.toBn(),
        slope: e.slope.toBn(),
        ts: e.ts.toBn(),
    };
}

export class ChainBalance {
    free: MonetaryAmount<CurrencyExt>;
    transferable: MonetaryAmount<CurrencyExt>;
    reserved: MonetaryAmount<CurrencyExt>;
    currency: CurrencyExt;

    constructor(currency: CurrencyExt, free?: BigSource, transferable?: BigSource, reserved?: BigSource) {
        this.currency = currency;
        this.free = newMonetaryAmount(free || 0, currency);
        this.transferable = newMonetaryAmount(transferable || 0, currency);
        this.reserved = newMonetaryAmount(reserved || 0, currency);
    }

    /*
        First stringifies the `MonetaryAmount`s, then the entire object.
        Allows for simple comparison in tests.
    */
    toString(): string {
        const stringifiedChainBalance = Object.fromEntries(Object.entries(this).map(([k, v]) => [k, v.toString()]));
        return JSON.stringify(stringifiedChainBalance);
    }
}

export function parseOrmlTokensAccountData(data: OrmlTokensAccountData, currency: CurrencyExt): ChainBalance {
    return new ChainBalance(
        currency,
        data.free.toString(),
        data.free.sub(data.frozen).toString(),
        data.reserved.toString()
    );
}

export function parseEscrowLockedBalance(
    governanceCurrency: GovernanceCurrency,
    escrowLockedBalance: EscrowLockedBalance
): StakedBalance {
    return {
        amount: newMonetaryAmount(escrowLockedBalance.amount.toString(), governanceCurrency),
        endBlock: escrowLockedBalance.end.toNumber(),
    };
}
