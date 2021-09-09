import { DefaultOracleAPI, OracleAPI } from "./oracle";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import { BitcoinUnit, Currency, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";

import { decodeFixedPointType } from "..";
import { CollateralUnit, WrappedCurrency } from "../types";

/**
 * @category InterBTC Bridge
 */
export interface FeeAPI {
    /**
     * @param amount Amount, in BTC, for which to compute the required
     * griefing collateral
     * @param griefingCollateralRate
     * @returns The griefing collateral
     */
    getGriefingCollateral<C extends CollateralUnit>(
        amount: MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
        griefingCollateralRate: Big,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param feesWrapped Wrapped token fees accrued, in wrapped token (e.g. BTC)
     * @param lockedCollateral Collateral value representing the value locked to gain yield.
     * @param exchangeRate (Optional) Conversion rate, as a `Monetary.js` object
     * @returns The APY, given the parameters
     */
    calculateAPY<C extends CollateralUnit>(
        feesWrapped: MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
        lockedCollateral: MonetaryAmount<Currency<C>, C>,
        exchangeRate?: ExchangeRate<Currency<BitcoinUnit>, BitcoinUnit, Currency<C>, C>
    ): Promise<Big>;
    /**
     * @returns The griefing collateral rate for issuing InterBTC
     */
    getIssueGriefingCollateralRate(): Promise<Big>;
    /**
     * @returns The griefing collateral rate for the Vault replace request
     */
    getReplaceGriefingCollateralRate(): Promise<Big>;
    /**
     * @returns The percentage of issued token that is received by the vault as reward
     */
    getIssueFee(): Promise<Big>;
}

export class DefaultFeeAPI implements FeeAPI {
    private oracleAPI: OracleAPI;

    constructor(private api: ApiPromise, wrappedCurrency: WrappedCurrency) {
        this.oracleAPI = new DefaultOracleAPI(api, wrappedCurrency);
    }

    async getGriefingCollateral<C extends CollateralUnit>(
        amount: MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
        griefingCollateralRate: Big,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const collateralAmount = await this.oracleAPI.convertWrappedToCollateral(amount, collateralCurrency);
        return collateralAmount.mul(griefingCollateralRate);
    }

    async getIssueGriefingCollateralRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const griefingCollateralRate = await this.api.query.fee.issueGriefingCollateral.at(head);
        return decodeFixedPointType(griefingCollateralRate);
    }

    async getReplaceGriefingCollateralRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const griefingCollateralRate = await this.api.query.fee.replaceGriefingCollateral.at(head);
        return decodeFixedPointType(griefingCollateralRate);
    }

    async getIssueFee(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const issueFee = await this.api.query.fee.issueFee.at(head);
        return decodeFixedPointType(issueFee);
    }

    async calculateAPY<C extends CollateralUnit>(
        feesWrapped: MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>,
        lockedCollateral: MonetaryAmount<Currency<C>, C>,
        exchangeRate?: ExchangeRate<Currency<BitcoinUnit>, BitcoinUnit, Currency<C>, C>
    ): Promise<Big> {
        if (lockedCollateral.isZero()) {
            return new Big(0);
        }
        if (exchangeRate === undefined) {
            exchangeRate = await this.oracleAPI.getExchangeRate(lockedCollateral.currency);
        }

        const feesWrappedAsCollateral = exchangeRate.toCounter(feesWrapped).toBig();

        // convert to percentage
        return feesWrappedAsCollateral.div(lockedCollateral.toBig()).mul(100);
    }
}
