import { decodeFixedPointType } from "..";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";

/**
 * @category PolkaBTC Bridge
 * The type Big represents DOT or PolkaBTC denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface FeeAPI {
    /**
     * @param amount Amount, in BTC, for which to compute the required
     * griefing collateral
     * @param griefingCollateralRate
     * @param oracleAPI
     * @returns The griefing collateral, in DOT
     */
    getGriefingCollateral(
        amount: Big,
        griefingCollateralRate: Big
    ): Promise<Big>;
    /**
     * @param feesPolkaBTC Satoshi value representing the BTC fees accrued
     * @param feesDOT Planck value representing the DOT fees accrued
     * @param lockedDOT Planck value representing the value locked to gain yield
     * @param dotToBtcRate (Optional) Conversion rate of the large denominations (DOT/BTC as opposed to Planck/Satoshi)
     * @returns The APY, given the parameters
     */
    calculateAPY(feesPolkaBTC: Big, feesDOT: Big, lockedDOT: Big, dotToBtcRate?: Big): Promise<string>;
    /**
     * @returns The griefing collateral rate for issuing PolkaBTC
     */
    getIssueGriefingCollateralRate(): Promise<Big>;
    /**
     * @returns The griefing collateral rate for the Vault replace request
     */
    getReplaceGriefingCollateralRate(): Promise<Big>;
}

export class DefaultFeeAPI implements FeeAPI {
    private oracleAPI: OracleAPI;

    constructor(private api: ApiPromise) {
        this.oracleAPI = new DefaultOracleAPI(api);
    }

    async getGriefingCollateral(
        amount: Big,
        griefingCollateralRate: Big
    ): Promise<Big> {
        const dotAmount = await this.oracleAPI.convertBitcoinToDot(amount);
        return dotAmount.mul(griefingCollateralRate);
    }

    async getIssueGriefingCollateralRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const griefingCollateralRate = await this.api.query.fee.issueGriefingCollateral.at(head);
        return new Big(decodeFixedPointType(griefingCollateralRate));
    }

    async getReplaceGriefingCollateralRate(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const griefingCollateralRate = await this.api.query.fee.replaceGriefingCollateral.at(head);
        return new Big(decodeFixedPointType(griefingCollateralRate));
    }

    async calculateAPY(feesPolkaBTC: Big, feesDOT: Big, lockedDOT: Big, dotToBtcRate?: Big): Promise<string> {
        if(dotToBtcRate === undefined) {
            dotToBtcRate = await this.oracleAPI.getExchangeRate();
        }
        const feesPolkaBTCInDot = feesPolkaBTC.mul(dotToBtcRate);
        const totalFees = feesDOT.add(feesPolkaBTCInDot);

        // convert to percent
        return totalFees.div(lockedDOT).mul(100).toString();
    }
}