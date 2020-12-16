import { DOT, IssueRequest, PolkaBTC, H256Le, Vault, BtcAddress } from "../../interfaces/default";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, BlockNumber, Hash } from "@polkadot/types/interfaces";
import { Bytes, bool } from "@polkadot/types/primitive";
import BN from "bn.js";
import { GenericAccountId } from "@polkadot/types/generic";
import { TypeRegistry } from "@polkadot/types";
import { U8aFixed } from "@polkadot/types/codec";
import { IssueAPI, RequestResult, IssueRequestExt } from "../../apis/issue";
import { EventRecord } from "@polkadot/types/interfaces/system";

export class MockIssueAPI implements IssueAPI {
    execute(_issueId: H256, _txId: H256Le, _merkleProof: Bytes, _rawTx: Bytes): Promise<boolean> {
        return Promise.resolve(true);
    }

    cancel(_issueId: H256): Promise<void> {
        throw new Error("Method not implemented.");
    }

    request(_amount: PolkaBTC, _vaultId?: AccountId, _griefingCollateral?: DOT): Promise<RequestResult> {
        const registry = new TypeRegistry();
        const hash = new U8aFixed(
            registry,
            "0x41fd1760b07dc5bc3b1548b6ffdd057444fb3a426460a199a6e2d42a7960e83c"
        ) as Hash;
        const vault = {} as Vault;
        return Promise.resolve({ hash, vault });
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }

    getGriefingCollateral(): Promise<string> {
        return Promise.resolve("100");
    }

    list(): Promise<IssueRequestExt[]> {
        const registry = new TypeRegistry();
        const decodedAccountId1 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
        const decodedAccountId2 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D6";

        return Promise.resolve([
            <IssueRequestExt>{
                vault: new GenericAccountId(registry, decodedAccountId1),
                amount: new BN(600) as PolkaBTC,
                opentime: new BN(10908) as BlockNumber,
                btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                completed: new bool(registry, true),
                requester: new GenericAccountId(registry, decodedAccountId1),
                griefing_collateral: new BN(10) as DOT,
            },
            <IssueRequestExt>{
                vault: new GenericAccountId(registry, decodedAccountId2),
                amount: new BN(4510) as PolkaBTC,
                opentime: new BN(11938) as BlockNumber,
                btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                completed: new bool(registry, true),
                requester: new GenericAccountId(registry, decodedAccountId2),
                griefing_collateral: new BN(76) as DOT,
            },
        ]);
    }

    getIssuePeriod(): Promise<BlockNumber> {
        return Promise.resolve(new BN(200) as BlockNumber);
    }

    mapForUser(_account: AccountId): Promise<Map<H256, IssueRequestExt>> {
        return Promise.resolve(new Map<H256, IssueRequestExt>());
    }

    getPagedIterator(_perPage: number): AsyncGenerator<IssueRequest[]> {
        return {} as AsyncGenerator<IssueRequest[]>;
    }

    async getRequestById(_issueId: string | Uint8Array | H256): Promise<IssueRequestExt> {
        const registry = new TypeRegistry();
        const decodedAccountId1 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";

        return <IssueRequestExt>{
            vault: new GenericAccountId(registry, decodedAccountId1),
            amount: new BN(4510) as PolkaBTC,
            opentime: new BN(11938) as BlockNumber,
            btc_address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
            completed: new bool(registry, true),
            requester: new GenericAccountId(registry, decodedAccountId1),
            griefing_collateral: new BN(76) as DOT,
        };
    }

    isExecutionSucessful(_events: EventRecord[]): boolean {
        return false;
    }
    
    async getFeesToPay(_amount: string): Promise<string> {
        return "0.01";
    }

    async getFeePercentage(): Promise<string> {
        return "5.3";
    }
}
