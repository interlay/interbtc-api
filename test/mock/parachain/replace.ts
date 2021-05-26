import { ReplaceAPI } from "../../../src/parachain";
import { BlockNumber } from "@polkadot/types/interfaces";
import { PolkaBTC, DOT, Collateral, Wrapped } from "../../../src/interfaces/default";
import BN from "bn.js";
import { ReplaceRequestExt } from "../../../src/parachain/replace";
import { AccountId } from "@polkadot/types/interfaces";
import { MockTransactionAPI } from "../transaction";
import { Bytes } from "@polkadot/types";
import Big from "big.js";

export class MockReplaceAPI extends MockTransactionAPI implements ReplaceAPI {
    getBtcDustValue(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    request(amount: Big): Promise<string> {
        throw new Error("Method not implemented.");
    }
    withdraw(amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    accept(oldVault: AccountId, amountSat: Big, collateral: Big, btcAddress: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    execute(replaceId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getGriefingCollateralRate(): Promise<DOT> {
        return Promise.resolve(new BN(12) as DOT);
    }

    async getReplacePeriod(): Promise<BlockNumber> {
        return Promise.resolve(new BN(12) as BlockNumber);
    }

    async list(): Promise<ReplaceRequestExt[]> {
        return Promise.resolve([]);
    }

    async map(): Promise<Map<AccountId, ReplaceRequestExt>> {
        return Promise.resolve(new Map<AccountId, ReplaceRequestExt>());
    }

}
