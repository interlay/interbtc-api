import { ReplaceAPI } from "../../../src/parachain";
import { BlockNumber } from "@polkadot/types/interfaces";
import { PolkaBTC, DOT, Backing, Issuing } from "../../../src/interfaces/default";
import BN from "bn.js";
import { ReplaceRequestExt } from "../../../src/parachain/replace";
import { AccountId } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import { MockTransactionAPI } from "../transaction";
import { Bytes } from "@polkadot/types";

export class MockReplaceAPI extends MockTransactionAPI implements ReplaceAPI {
    withdraw(amountSat: Issuing): Promise<void> {
        throw new Error("Method not implemented.");
    }
    accept(oldVault: AccountId, amountSat: Issuing, collateral: Backing, btcAddress: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    execute(replaceId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        throw new Error("Method not implemented.");
    }

    
    async getBtcDustValue(): Promise<PolkaBTC> {
        return Promise.resolve(new BN(1) as PolkaBTC);
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

    async request(_amount: PolkaBTC): Promise<string> {
        return "0x41fd1760b07dc5bc3b1548b6ffdd057444fb3a426460a199a6e2d42a7960e83c";
    }
}
