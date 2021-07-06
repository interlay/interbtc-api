import { DefaultOracleAPI, OracleAPI } from "./oracle";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import {
    Bitcoin,
    BTCAmount,
    BTCUnit,
    Currency,
    ExchangeRate,
    MonetaryAmount,
    Polkadot,
    PolkadotAmount,
    PolkadotUnit,
} from "@interlay/monetary-js";

import { decodeFixedPointType } from "..";
import { CollateralUnits } from "../types";

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
    getGriefingCollateral<C extends CollateralUnits>(
        amount: BTCAmount,
        griefingCollateralRate: Big,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param feesWrapped Wrapped token fees accrued, in large denomination (e.g. BTC)
     * @param feesCollateral Collateral fees accrued, in large denomination (e.g. DOT)
     * @param lockedCollateral Collateral value representing the value locked to gain yield. Large denomination (e.g. DOT)
     * @param exchangeRate (Optional) Conversion rate of the large denominations (DOT/BTC as opposed to Planck/Satoshi)
     * @returns The APY, given the parameters
     */
    calculateAPY(
        feesWrapped: BTCAmount,
        feesCollateral: PolkadotAmount,
        lockedCollateral: PolkadotAmount,
        exchangeRate?: ExchangeRate<Polkadot, PolkadotUnit, Bitcoin, BTCUnit>
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

    constructor(private api: ApiPromise) {
        this.oracleAPI = new DefaultOracleAPI(api);
    }

    async getGriefingCollateral<C extends CollateralUnits>(
        amount: BTCAmount,
        griefingCollateralRate: Big,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const dotAmount = await this.oracleAPI.convertWrappedToCollateral(amount, collateralCurrency);
        return dotAmount.mul(griefingCollateralRate);
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

    async calculateAPY<C extends CollateralUnits>(
        feesWrapped: BTCAmount,
        feesCollateral: MonetaryAmount<Currency<C>, C>,
        lockedCollateral: MonetaryAmount<Currency<C>, C>,
        exchangeRate?: ExchangeRate<Currency<C>, C, Bitcoin, BTCUnit>
    ): Promise<Big> {
        if (lockedCollateral.isZero()) {
            return new Big(0);
        }
        if (exchangeRate === undefined) {
            exchangeRate = await this.oracleAPI.getExchangeRate(feesCollateral.currency);
        }

        const feesWrappedAsCollateral = exchangeRate.toBase(feesWrapped);
        const totalFees = feesCollateral.add(feesWrappedAsCollateral).toBig();

        // convert to percentage
        return totalFees.div(lockedCollateral.toBig()).mul(100);
    }
}
