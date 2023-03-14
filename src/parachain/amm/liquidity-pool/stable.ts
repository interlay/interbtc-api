import { CurrencyExt, StableLpToken } from "../../../types";
import { isCurrencyEqual, STABLE_POOLS_APPROXIMATION_PRECISION } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import Big from "big.js";
import { PoolType, PooledCurrencies, LiquidityPoolBase } from "../types";
import { LiquidityPoolCalculator } from "./calculator";

// SOURCE: @zenlink-dex/sdk-core
class StableLiquidityPool extends LiquidityPoolCalculator<StableLpToken> implements LiquidityPoolBase {
    constructor(
        public type: PoolType.STABLE_META | PoolType.STABLE_PLAIN,
        public lpToken: StableLpToken,
        // Currencies that are part of the pool. In case of metapool it is LP token.
        public actuallyPooledCurrencies: PooledCurrencies,
        // Underlying currencies of pool. In case of metapool base currencies are included and LP token is excluded.
        public pooledCurrencies: PooledCurrencies,
        public rewardAmountsYearly: Array<MonetaryAmount<CurrencyExt>>,
        public tradingFee: Big, // Decimal point
        public poolId: number,
        public amplificationCoefficient: Big,
        public totalSupply: MonetaryAmount<StableLpToken>
    ) {
        super(pooledCurrencies, totalSupply);
    }

    private _xp(amounts: Array<MonetaryAmount<CurrencyExt>>): Array<Big> {
        return amounts.map((balance) => balance.toBig());
    }

    private _distance(x: Big, y: Big): Big {
        return x.sub(y).abs().mul(STABLE_POOLS_APPROXIMATION_PRECISION);
    }

    private get _feePerToken(): Big {
        const nCoins = Big(this.actuallyPooledCurrencies.length);

        return this.tradingFee.mul(nCoins).div(nCoins.sub(1).mul(4));
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
                .div(Ann.sub(1).mul(D).add(nCoins.add(1).mul(D_P)));

            if (this._distance(D, Dprev).lte(1)) {
                return D;
            }
        }

        throw new Error("_getD: Calculation error.");
    }

    private _getY(inIndex: number, outIndex: number, inBalance: Big, normalizedBalances: Array<Big>): Big {
        const nCoins = this.actuallyPooledCurrencies.length;
        if (inIndex === outIndex) {
            throw new Error("_getY: inIndex and outIndex must be different");
        }
        if (inIndex >= nCoins || outIndex >= nCoins) {
            throw new Error("_getY: Index out of range.");
        }

        const amp = this.amplificationCoefficient;
        const Ann = amp.mul(nCoins);
        const D = this._getD(normalizedBalances, amp);

        let sum = Big(0);
        let c = D;

        for (let i = 0; i < nCoins; i++) {
            if (i === outIndex) continue;
            const x = i === inIndex ? inBalance : normalizedBalances[i];

            sum = sum.add(x);
            c = c.mul(D).div(x.mul(nCoins));
        }

        c = c.mul(D).div(Ann.mul(nCoins));
        const b = sum.add(D.div(Ann));

        let lastY = Big(0);
        let y = D;

        for (let i = 0; i < 255; i++) {
            lastY = y;
            y = y.mul(y).add(c).div(y.mul(2).add(b).sub(D));
            if (this._distance(lastY, y).lte(1)) {
                return y;
            }
        }

        throw new Error("_getY: Calculation error.");
    }

    private _getYD(A: Big, index: number, xp: Array<Big>, D: Big): Big {
        const nCoins = this.actuallyPooledCurrencies.length;

        if (index >= nCoins) {
            throw new Error("_getYD: Index out of range.");
        }
        const Ann = A.mul(nCoins);
        let c = D;
        let s = Big(0);
        let _x = Big(0);
        let yPrev = Big(0);

        for (let i = 0; i < nCoins; i++) {
            if (i === index) continue;
            _x = xp[i];
            s = s.add(_x);
            c = c.mul(D).div(_x.mul(nCoins));
        }

        c = c.mul(D).div(Ann.mul(nCoins));
        const b = s.add(D.div(Ann));
        let y = D;

        for (let i = 0; i < 255; i++) {
            yPrev = y;
            y = y.mul(y).add(c).div(y.mul(2).add(b).sub(D));
            if (this._distance(yPrev, y).lte(1)) {
                return y;
            }
        }

        throw new Error("_getYD: Calculation error.");
    }

    /**
     * Sort amounts in same order as `actuallyPooledCurrencies`.
     *
     * @param amounts Array of monetary
     * @returns Amounts containing currency amounts at the same index as `this.actuallyPooledCurrencies`
     * @throws When currencies of `amounts` differ from `actuallyPooledCurrencies`
     */
    private _sortAmounts(amounts: Array<MonetaryAmount<CurrencyExt>>): Array<MonetaryAmount<CurrencyExt>> {
        if (amounts.length !== this.actuallyPooledCurrencies.length) {
            throw new Error(
                "StableLiquidityPool: _sortAmounts: Amounts count is different from actuallyPooledCurrencies count."
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

    public involvesToken(currency: CurrencyExt): boolean {
        return this.actuallyPooledCurrencies.some(({ currency: pooledCurrency }) =>
            isCurrencyEqual(pooledCurrency, currency)
        );
    }

    public getTokenIndex(currency: CurrencyExt): number {
        return this.actuallyPooledCurrencies.findIndex(({ currency: pooledCurrency }) =>
            isCurrencyEqual(currency, pooledCurrency)
        );
    }

    public get xp(): Array<Big> {
        return this._xp(this.actuallyPooledCurrencies);
    }

    /**
     *
     * @param amounts Array of monetary amount for each pooled currency of this pool.
     * @param deposit True for deposit, false for withdrawal
     * @returns LP token amount that will be minted/burned after operation.
     */
    public calculateTokenAmount(amounts: PooledCurrencies, deposit: boolean): MonetaryAmount<StableLpToken> {
        const sortedAmounts = this._sortAmounts(amounts);

        const amp = this.amplificationCoefficient;
        const D0 = this._getD(this.xp, amp);

        const newBalances = this.actuallyPooledCurrencies.map((balance, i) =>
            deposit ? balance.add(sortedAmounts[i]) : balance.sub(sortedAmounts[i])
        );
        const D1 = this._getD(this._xp(newBalances), amp);

        if (this.totalSupply.toBig().eq(0)) {
            return new MonetaryAmount(this.lpToken, D1);
        }
        const diff = deposit ? D1.sub(D0) : D0.sub(D1);

        return new MonetaryAmount(this.lpToken, diff.mul(this.totalSupply.toBig()).div(D0));
    }

    public calculateRemoveLiquidityOneToken(
        tokenLPAmount: MonetaryAmount<StableLpToken>,
        outputCurrencyIndex: number
    ): [MonetaryAmount<CurrencyExt>, MonetaryAmount<CurrencyExt>] {
        if (outputCurrencyIndex >= this.actuallyPooledCurrencies.length) {
            throw new Error("StableLiquidityPool: calculateRemoveLiquidityOneToken: Currency index out of range.");
        }

        const outputDecimals = this.actuallyPooledCurrencies[outputCurrencyIndex].currency.decimals;
        const amp = this.amplificationCoefficient;
        const xp = this.xp;
        const D0 = this._getD(xp, amp);
        const D1 = D0.sub(tokenLPAmount.toBig().mul(D0).div(this.totalSupply.toBig()));
        const newY = this._getYD(amp, outputCurrencyIndex, xp, D1);
        const reducedXP = xp;
        const _fee = this._feePerToken;

        for (let i = 0; i < this.actuallyPooledCurrencies.length; i++) {
            let expectedDx = Big(0);

            if (i === outputCurrencyIndex) {
                expectedDx = xp[i].mul(D1).div(D0).sub(newY);
            } else {
                expectedDx = xp[i].sub(xp[i].mul(D1).div(D0));
            }

            reducedXP[i] = reducedXP[i].sub(_fee.mul(expectedDx));
        }

        let dy = reducedXP[outputCurrencyIndex].sub(this._getYD(amp, outputCurrencyIndex, reducedXP, D1));
        dy = dy.sub(Big(10).pow(-outputDecimals));

        const fee = xp[outputCurrencyIndex].sub(newY).sub(dy);

        return [
            new MonetaryAmount(this.actuallyPooledCurrencies[outputCurrencyIndex].currency, dy),
            new MonetaryAmount(this.actuallyPooledCurrencies[outputCurrencyIndex].currency, fee),
        ];
    }

    public calculateSwap(
        inputIndex: number,
        outputIndex: number,
        inputAmount: MonetaryAmount<CurrencyExt>
    ): MonetaryAmount<CurrencyExt> {
        const outputDecimals = this.actuallyPooledCurrencies[outputIndex].currency.decimals;
        const normalizedBalances = this.xp;
        const newInBalance = normalizedBalances[inputIndex].add(inputAmount.toBig());

        const outBalance = this._getY(inputIndex, outputIndex, newInBalance, normalizedBalances);
        const outAmount = normalizedBalances[outputIndex].sub(outBalance).sub(Big(10).pow(-outputDecimals));
        const fee = this.tradingFee.mul(outAmount);

        return new MonetaryAmount(this.actuallyPooledCurrencies[outputIndex].currency, outAmount.sub(fee));
    }
}

export { StableLiquidityPool };
