import { CurrencyExt } from "../../../types";
import { isCurrencyEqual } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { PoolType, LPToken, PooledCurrencies } from "../types";
import { LiquidityPoolBase } from "./types";

class StableLiquidityPool implements LiquidityPoolBase {
    public type = PoolType.STABLE;
    constructor(
        public lpToken: LPToken,
        public pooledCurrencies: PooledCurrencies,
        public apr: string,
        public tradingFee: Big,
        public poolId: number,
        public A: Big,
        public totalSupply: MonetaryAmount<LPToken>
    ) {}

    private _xp(amounts: Array<MonetaryAmount<CurrencyExt>>): Array<Big> {
        return amounts.map((balance) => balance.toBig());
    }

    private _distance(x: Big, y: Big): Big {
        return x.sub(y).abs();
    }

    private _getD(amountsInBaseDenomination: Array<Big>, amp: Big): Big {
        const nCoins = Big(amountsInBaseDenomination.length);
        const sum = amountsInBaseDenomination.reduce((result, amount) => result.add(amount), Big(0));

        if (sum.eq(0)) {
            return Big(0);
        }

        let Dprev = Big(0);
        let D = sum;
        const Ann = amp.mul(nCoins);

        for (let i = 0; i < 255; i++) {
            let D_P = D;

            for (let j = 0; j < amountsInBaseDenomination.length; j++) {
                D_P = D_P.mul(D).div(amountsInBaseDenomination[j].mul(nCoins));
            }

            Dprev = D;
            D = Ann.mul(sum)
                .add(D_P.mul(nCoins))
                .mul(D)
                .div(Ann.sub(1).mul(D).add(nCoins.add(1)).mul(D_P));

            if (this._distance(D, Dprev).lte(1)) {
                return D;
            }
        }

        throw new Error("_getD: Calculation error.");
    }

    public getTokenIndex(currency: CurrencyExt): number {
        return this.pooledCurrencies.findIndex(({ currency: pooledCurrency }) =>
            isCurrencyEqual(currency, pooledCurrency)
        );
    }

    // TODO: rename to 'currenciesInBaseDenomination'
    public get xp(): Array<Big> {
        return this._xp(this.pooledCurrencies);
    }

    /**
     * Sort amounts in same order as `pooledCurrencies`.
     *
     * @param amounts Array of monetary
     * @returns Amounts containing currency amounts at the same index as `this.pooledCurrencies`
     * @throws When currencies of `amounts` differ from `pooledCurrencies`
     */
    _sortAmounts(amounts: Array<MonetaryAmount<CurrencyExt>>): Array<MonetaryAmount<CurrencyExt>> {
        if (amounts.length !== this.pooledCurrencies.length) {
            throw new Error(
                "StableLiquidityPool: _sortAmounts: Amounts count is different from pooledCurrencies count."
            );
        }
        const sortedAmounts = new Array(amounts.length);
        for (const amount of amounts) {
            const indexToSave = this.getTokenIndex(amount.currency);

            const isCurrencyNotFound = indexToSave === -1;
            const isCurrencyNonunique = sortedAmounts[indexToSave] !== undefined;
            if (isCurrencyNotFound) {
                throw new Error(
                    `StableLiquidityPool: _sortAmounts: Currency ${amount.currency.name} is not part of the pool.`
                );
            }
            if (isCurrencyNonunique) {
                throw new Error(`StableLiquidityPool: _sortAmounts: Currency ${amount.currency.name} is not unique.`);
            }

            sortedAmounts[indexToSave] = amount;
        }
        return sortedAmounts;
    }

    // TODO: rename to something like `calculateLiquidityDeposit`
    /**
     *
     * @param amounts Array of monetary amount for each pooled currency of this pool.
     * @param deposit
     * @returns
     */
    public calculateTokenAmount(
        amounts: Array<MonetaryAmount<CurrencyExt>>,
        deposit: boolean
    ): MonetaryAmount<CurrencyExt> {
        const sortedAmounts = this._sortAmounts(amounts);

        const amp = this.A;
        const D0 = this._getD(this.xp, amp);

        const newBalances = this.pooledCurrencies.map((balance, i) =>
            deposit ? balance.add(sortedAmounts[i]) : balance.sub(sortedAmounts[i])
        );
        const D1 = this._getD(this._xp(newBalances), amp);

        if (this.totalSupply.isZero()) {
            // TODO: check is D1 in base or atomic denomination??
            // if not in base divide by decimals first
            return new MonetaryAmount(this.lpToken, D1);
        }
        const diff = deposit ? D1.sub(D0) : D0.sub(D1);

        // TODO: is D0 in base or atomic denomination?
        return new MonetaryAmount(this.lpToken, diff.mul(this.totalSupply.toBig()).div(D0));
    }

    public calculateRemoveLiquidityOneToken(
        tokenLPAmount: MonetaryAmount<LPToken>,
        outputCurrencyIndex: number
    ): [MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>] {
        //TODO
        throw new Error("Method not implemented.");
    }

    public calculateSwap(
        inputIndex: number,
        outputIndex: number,
        inputAmount: MonetaryAmount<CurrencyExt>
    ): MonetaryAmount<CurrencyExt> {
        // TODO
        throw new Error("Method not implemented.");
    }
}

export { StableLiquidityPool };
