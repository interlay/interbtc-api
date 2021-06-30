import { decodeFixedPointType } from "..";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";

/**
 * @category InterBTC Bridge
 * The type Big represents large denominations (e.g. DOT or BTC),
 * while the type BN represents small denominations (e.g. Planck or Satoshi).
 */
export interface FeeAPI {
    /**
     * @param amount Amount, in BTC, for which to compute the required
     * griefing collateral
     * @param griefingCollateralRate
     * @returns The griefing collateral, as large denomination (e.g. DOT)
     */
    getGriefingCollateral(amount: Big, griefingCollateralRate: Big): Promise<Big>;
    /**
     * @param feesWrapped Wrapped token fees accrued, in large denomination (e.g. BTC)
     * @param feesCollateral Collateral fees accrued, in large denomination (e.g. DOT)
     * @param lockedCollateral Collateral value representing the value locked to gain yield. Large denomination (e.g. DOT)
     * @param exchangeRate (Optional) Conversion rate of the large denominations (DOT/BTC as opposed to Planck/Satoshi)
     * @returns The APY, given the parameters
     */
    calculateAPY(
        feesWrapped: Big,
        feesCollateral: Big,
        lockedCollateral: Big,
        exchangeRate?: Big
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

    async getGriefingCollateral(amount: Big, griefingCollateralRate: Big): Promise<Big> {
        const dotAmount = await this.oracleAPI.convertBitcoinToDot(amount);
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

    async calculateAPY(
        feesWrapped: Big,
        feesCollateral: Big,
        lockedCollateral: Big,
        exchangeRate?: Big
    ): Promise<Big> {
        if (lockedCollateral.eq(new Big(0))) {
            return new Big(0);
        }
        if (exchangeRate === undefined) {
            exchangeRate = await this.oracleAPI.getExchangeRate();
        }
        const feesWrappedAsCollateral = feesWrapped.mul(exchangeRate);
        const totalFees = feesCollateral.add(feesWrappedAsCollateral);

        // convert to percent
        return totalFees.div(lockedCollateral).mul(100);
    }
}
