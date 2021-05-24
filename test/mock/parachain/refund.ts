import { AddressOrPair } from "@polkadot/api/types";
import { AccountId, H256 } from "@polkadot/types/interfaces";
import { Bytes } from "@polkadot/types";

import { RefundAPI, RefundRequestExt } from "../../../src/parachain";
import { MockTransactionAPI } from "../transaction";

export class MockRefundAPI extends MockTransactionAPI implements RefundAPI {
    list(): Promise<RefundRequestExt[]> {
        return Promise.resolve([]);
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }

    mapForUser(_account: AccountId): Promise<Map<H256, RefundRequestExt>> {
        return Promise.resolve(new Map<H256, RefundRequestExt>());
    }

    async getRequestById(_refundId: string | Uint8Array | H256): Promise<RefundRequestExt> {
        throw new Error("Method not implemented.");
    }

    async getRequestByIssueId(_issueId: H256): Promise<RefundRequestExt> {
        throw new Error("Method not implemented.");
    }

    execute(replaceId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
