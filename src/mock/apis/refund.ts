import { PolkaBTC } from "../../interfaces/default";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256 } from "@polkadot/types/interfaces";
import { GenericAccountId } from "@polkadot/types/generic";

import { TypeRegistry, bool, U8aFixed } from "@polkadot/types";
import BN from "bn.js";
import { RefundAPI, RefundRequestExt, ReplaceAPI, ReplaceRequestExt } from "../../parachain";

export class MockRefundAPI implements RefundAPI {
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
        const registry = new TypeRegistry();
        const decodedAccountId1 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";

        return <RefundRequestExt>{
            vault: new GenericAccountId(registry, decodedAccountId1),
            amount_btc: new BN(4510) as PolkaBTC,
            amount_polka_btc: new BN(4510) as PolkaBTC,
            fee: new BN(4510) as PolkaBTC,
            issuer: new GenericAccountId(registry, decodedAccountId1),
            btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            completed: new bool(registry, true),
            issue_id: new U8aFixed(registry, "0") as H256,
        };
    }

    async getRequestByIssueId(_issueId: string): Promise<RefundRequestExt> {
        const registry = new TypeRegistry();
        const decodedAccountId1 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";

        return <RefundRequestExt>{
            vault: new GenericAccountId(registry, decodedAccountId1),
            amount_btc: new BN(4510) as PolkaBTC,
            amount_polka_btc: new BN(4510) as PolkaBTC,
            fee: new BN(4510) as PolkaBTC,
            issuer: new GenericAccountId(registry, decodedAccountId1),
            btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            completed: new bool(registry, true),
            issue_id: new U8aFixed(registry, "0") as H256,
        };
    }
}
