import { LpCurrency, CurrencyExt } from "../../../types";
import { isCurrencyEqual } from "../../../utils";
import { MonetaryAmount } from "@interlay/monetary-js";
import { PooledCurrencies } from "../types";

class LiquidityPoolCalculator<TLpToken extends LpCurrency> {
    constructor(public pooledCurrencies: PooledCurrencies, public totalSupply: MonetaryAmount<TLpToken>) {}

    private _getCurrencyReserve(currency: CurrencyExt): MonetaryAmount<CurrencyExt> {
        const reserve = this.pooledCurrencies.find(({ currency: reserveCurrency }) =>
            isCurrencyEqual(currency, reserveCurrency)
        );

        if (reserve !== undefined) {
            return reserve;
        }

        throw new Error(`_getCurrencyReserve: Invalid monetary amount, ${currency.ticker} is not part of this pool.`);
    }

    /**
     * Calculates how much of pooled currencies needs to be deposited
     * into pool with current ratio of currencies.
     *
     * @param amount Amount of one of the pooled currencies.
     * @returns Monetary amounts of all pooled currencies in balanced proportion.
     * @throws If pool is empty. Note: handle by checking `isEmpty` property of pool.
     */
    public getLiquidityDepositInputAmounts(amount: MonetaryAmount<CurrencyExt>): Array<MonetaryAmount<CurrencyExt>> {
        const inputCurrencyReserve = this._getCurrencyReserve(amount.currency);

        const ratio = amount.toBig().div(inputCurrencyReserve.toBig());
        const expectedLiquidityDepositAmounts = this.pooledCurrencies.map((reserveAmount) => reserveAmount.mul(ratio));

        return expectedLiquidityDepositAmounts;
    }

    /**
     * Calculates expected amount of LP token account will get after depositing
     * `amount` of pooled currency into pool.
     *
     * @note This method assumes all pooled currencies will be added in balance.
     * @param amount Amount of one of the pooled currencies.
     * @returns Expected amount of lp token that will be received after `amount` is added to pool.
     * @throws If pool is empty. Note: handle by checking `isEmpty` property of pool.
     */
    public getLiquidityDepositLpTokenAmount(amount: MonetaryAmount<CurrencyExt>): MonetaryAmount<TLpToken> {
        const currencyReserveAmount = this._getCurrencyReserve(amount.currency);
        const changeCoefficient = amount.div(currencyReserveAmount.toBig()).toBig();
        const newLpTokenAmount = this.totalSupply.mul(changeCoefficient);

        return newLpTokenAmount;
    }

    /**
     * Calculates expected amount of pooled currencies account will get
     * after withdrawing `amount` of LP token.
     *
     * @note This method assumes all pooled currencies will be withdrawn in balance.
     * @param amount Amount of liquidity in LP token to be withdrawn.
     * @returns Amounts of pooled currencies to be returned to account.
     * @throws If pool is empty. Note: handle by checking `isEmpty` property of pool.
     */
    public getLiquidityWithdrawalPooledCurrencyAmounts(
        amount: MonetaryAmount<TLpToken>
    ): Array<MonetaryAmount<CurrencyExt>> {
        const changeCoefficient = amount.div(this.totalSupply.toBig()).toBig();

        const pooledCurrencyAmounts = this.pooledCurrencies.map((reserveAmount) =>
            reserveAmount.mul(changeCoefficient)
        );

        return pooledCurrencyAmounts;
    }
}

export { LiquidityPoolCalculator };
