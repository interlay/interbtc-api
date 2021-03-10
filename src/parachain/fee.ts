import { decodeFixedPointType } from "..";
import { PolkaBTC, UnsignedFixedPoint } from "../interfaces";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";

/**
 * @category PolkaBTC Bridge
 */
export interface FeeAPI {
    /**
     * @param amountSat Amount, in Satoshi, for which to compute the required
     * griefing collateral, in Planck
     * @param griefingCollateralRate
     * @param oracleAPI
     * @returns The griefing collateral, in Planck
     */
     getGriefingCollateralInPlanck(
        amountSat: PolkaBTC,
        griefingCollateralRate: UnsignedFixedPoint
    ): Promise<Big>;
    /**
     * @param feesPolkaBTC Satoshi value representing the BTC fees accrued
     * @param feesDOT Planck value representing the DOT fees accrued
     * @param lockedDOT Planck value representing the value locked to gain yield
     * @param dotToBtcRate Conversion rate
     * @returns The APY, given the parameters
     */
    calculateAPY(feesPolkaBTC: string, feesDOT: string, lockedDOT: string, dotToBtcRate: Big): string;
    /**
     * @returns The griefing collateral rate for issuing PolkaBTC
     */
    getIssueGriefingCollateralRate(): Promise<UnsignedFixedPoint>;
}

export class DefaultFeeAPI implements FeeAPI {
    private oracleAPI: OracleAPI;

    constructor(private api: ApiPromise) {
        this.oracleAPI = new DefaultOracleAPI(api);
    }

    async getGriefingCollateralInPlanck(
        amountSat: PolkaBTC,
        griefingCollateralRate: UnsignedFixedPoint
    ): Promise<Big> {
        const griefingCollateralRateBig = new Big(decodeFixedPointType(griefingCollateralRate));
        const planckPerSatoshi = await this.oracleAPI.getRawExchangeRate();
        const amountSatoshiBig = new Big(amountSat.toString());
        const amountInPlanck = planckPerSatoshi.mul(amountSatoshiBig);
        const griefingCollateralPlanck = amountInPlanck.mul(griefingCollateralRateBig).toString();
    
        // Compute the ceiling of the griefing collateral, because the parachain
        // ignores the decimal place (123.456 -> 123456), because there is nothing
        // smaller than 1 Planck
        const griefingCollateralPlanckRoundedUp = new Big(griefingCollateralPlanck).round(0, 3);
        return griefingCollateralPlanckRoundedUp;
    }

    async getIssueGriefingCollateralRate(): Promise<UnsignedFixedPoint> {
        return await this.api.query.fee.issueGriefingCollateral();
    }

    calculateAPY(feesPolkaBTC: string, feesDOT: string, lockedDOT: string, dotToBtcRate: Big): string {
        const feesPolkaBTCBig = new Big(feesPolkaBTC.toString());
        const feesPolkaBTCInDot = feesPolkaBTCBig.mul(dotToBtcRate);
        const totalFees = new Big(feesDOT).add(feesPolkaBTCInDot);
    
        const lockedDotBig = new Big(lockedDOT.toString());
    
        // convert to percent
        return totalFees.div(lockedDotBig).mul(100).toString();
    }
}