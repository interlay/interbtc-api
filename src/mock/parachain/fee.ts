import { FeeAPI } from "../../parachain";
import { PolkaBTC, UnsignedFixedPoint } from "../../interfaces/default";
import { ReplaceRequestExt } from "../../parachain/replace";
import { AccountId } from "@polkadot/types/interfaces";
import Big from "big.js";

export class MockFeeAPI implements FeeAPI {
    getIssueGriefingCollateralRate(): Promise<UnsignedFixedPoint> {
        throw new Error("Method not implemented.");
    }
    
    getGriefingCollateralInPlanck(_amountSat: PolkaBTC, _griefingCollateralRate: UnsignedFixedPoint): Promise<Big> {
        throw new Error("Method not implemented.");
    }

    calculateAPY(_feesPolkaBTC: string, _feesDOT: string, _lockedDOT: string, _dotToBtcRate: Big): string {
        throw new Error("Method not implemented.");
    }

    async list(): Promise<ReplaceRequestExt[]> {
        return Promise.resolve([]);
    }

    async map(): Promise<Map<AccountId, ReplaceRequestExt>> {
        return Promise.resolve(new Map<AccountId, ReplaceRequestExt>());
    }

    async request(_amount: PolkaBTC): Promise<void> {
        return;
    }
}
