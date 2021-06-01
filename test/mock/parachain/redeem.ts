import { RedeemRequest } from "../../../src/interfaces/default";
import { AddressOrPair } from "@polkadot/api/types";
import { AccountId, Hash, H256 } from "@polkadot/types/interfaces";
import Big from "big.js";
import { RedeemAPI, RedeemRequestExt, RequestResult } from "../../../src/parachain/redeem";
import {RequestOptions} from "../../../src/utils/issueRedeem";
import { MockTransactionAPI } from "../transaction";

export class MockRedeemAPI extends MockTransactionAPI implements RedeemAPI {
    list(): Promise<RedeemRequestExt[]> {
        throw new Error("Method not implemented.");
    }
    getRequestById(_redeemId: H256): Promise<RedeemRequestExt> {
        throw new Error("Method not implemented.");
    }
    getRequestsById(_redeemIds: H256[]): Promise<RedeemRequestExt[]> {
        throw new Error("Method not implemented.");
    }
    setRedeemPeriod(_blocks: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getRedeemPeriod(): Promise<number> {
        throw new Error("Method not implemented.");
    }
    burn(_amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getMaxBurnableTokens(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getBurnExchangeRate(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    execute(_redeemId: string, _txId: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    cancel(_redeemId: H256, _reimburse?: boolean): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async request(_amount: Big, _btcAddressEnc: string, _options?: RequestOptions): Promise<RequestResult[]> {
        return Promise.resolve([{ id: <Hash>{}, redeemRequest: (await this.list())[0] }]);
    }

    async requestAdvanced(
        _amountsPerVault: Map<AccountId, Big>,
        _btcAddressEnc: string,
        _atomic: boolean
    ): Promise<RequestResult[]> {
        return this.request(new Big(0), "");
    }

    async mapForUser(_account: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        return Promise.resolve(new Map<H256, RedeemRequestExt>());
    }

    async getDustValue(): Promise<Big> {
        return Promise.resolve(new Big(0.000001));
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }

    subscribeToRedeemExpiry(_account: AccountId, _callback: (requestRedeemId: H256) => void): Promise<() => void> {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return Promise.resolve(() => { });
    }

    async getFeesToPay(_amount: Big): Promise<Big> {
        return new Big("0.08");
    }

    async getFeeRate(): Promise<Big> {
        return new Big("0.005");
    }

    async getPremiumRedeemFee(): Promise<string> {
        return "5";
    }

    async getCurrentInclusionFee(): Promise<Big> {
        return new Big("0.0000005");
    }
}
