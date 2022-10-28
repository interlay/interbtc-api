import { OracleAPI } from "./oracle";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import { Bitcoin, ExchangeRate, MonetaryAmount } from "@interlay/monetary-js";

import { decodeFixedPointType } from "../utils/encoding";
import { CollateralCurrencyExt, CurrencyExt, WrappedCurrency } from "../types";
import { AssetRegistryAPI } from "../parachain/asset-registry";
import { currencyIdToMonetaryCurrency } from "../utils";
import { LoansAPI } from "./loans";

export enum GriefingCollateralType {
    Issue,
    Replace,
}

/**
 * @category BTC Bridge
 */
export interface FeeAPI {
    /**
     * @param amount Amount, in BTC, for which to compute the required
     * griefing collateral
     * @param collateralCurrency Currency for determining the griefing collateral
     * @param type Type of griefing collateral to compute (e.g. for issuing, replacing)
     * @returns The griefing collateral
     */
    getGriefingCollateral(
        amount: MonetaryAmount<WrappedCurrency>,
        type: GriefingCollateralType
    ): Promise<MonetaryAmount<CurrencyExt>>;
    /**
     * @param feesWrapped Wrapped token fees accrued, in wrapped token (e.g. BTC)
     * @param lockedCollateral Collateral value representing the value locked to gain yield.
     * @param exchangeRate (Optional) Conversion rate, as a `Monetary.js` object
     * @returns The APY, given the parameters
     */
    calculateAPY(
        feesWrapped: MonetaryAmount<WrappedCurrency>,
        lockedCollateral: MonetaryAmount<CollateralCurrencyExt>,
        exchangeRate?: ExchangeRate<Bitcoin, CollateralCurrencyExt>
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
    constructor(private api: ApiPromise, private oracleAPI: OracleAPI, private assetRegistryAPI: AssetRegistryAPI, private loansAPI: LoansAPI) {}

    async getGriefingCollateral(
        amount: MonetaryAmount<WrappedCurrency>,
        type: GriefingCollateralType
    ): Promise<MonetaryAmount<CurrencyExt>> {
        let ratePromise;
        switch (type) {
            case GriefingCollateralType.Issue: {
                ratePromise = this.getIssueGriefingCollateralRate();
                break;
            }
            case GriefingCollateralType.Replace: {
                ratePromise = this.getReplaceGriefingCollateralRate();
                break;
            }
        }

        const nativeCurrency = await currencyIdToMonetaryCurrency(
            this.assetRegistryAPI,
            this.loansAPI,
            this.api.consts.vaultRegistry.getGriefingCollateralCurrencyId
        );
        const [griefingCollateralRate, griefingAmount] = await Promise.all([
            ratePromise,
            this.oracleAPI.convertWrappedToCurrency(amount, nativeCurrency),
        ]);
        return griefingAmount.mul(griefingCollateralRate);
    }

    async getIssueGriefingCollateralRate(): Promise<Big> {
        const griefingCollateralRate = await this.api.query.fee.issueGriefingCollateral();
        return decodeFixedPointType(griefingCollateralRate);
    }

    async getReplaceGriefingCollateralRate(): Promise<Big> {
        const griefingCollateralRate = await this.api.query.fee.replaceGriefingCollateral();
        return decodeFixedPointType(griefingCollateralRate);
    }

    async getIssueFee(): Promise<Big> {
        const issueFee = await this.api.query.fee.issueFee();
        return decodeFixedPointType(issueFee);
    }

    async calculateAPY(
        feesWrapped: MonetaryAmount<WrappedCurrency>,
        lockedCollateral: MonetaryAmount<CollateralCurrencyExt>,
        exchangeRate?: ExchangeRate<Bitcoin, CollateralCurrencyExt>
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
