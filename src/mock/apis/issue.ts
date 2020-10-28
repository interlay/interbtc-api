import { DOT, IssueRequest, PolkaBTC, H256Le, Vault } from "../../interfaces/default";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, H160, BlockNumber, Hash } from "@polkadot/types/interfaces";
import { Bytes, u32, bool } from "@polkadot/types/primitive";
import BN from "bn.js";
import { GenericAccountId } from "@polkadot/types/generic";
import { TypeRegistry } from "@polkadot/types";
import { U8aFixed } from "@polkadot/types/codec";

import { IssueAPI, RequestResult } from "../../apis/issue";

export class MockIssueAPI implements IssueAPI {
    execute(_issueId: H256, _txId: H256Le, _txBlockHeight: u32, _merkleProof: Bytes, _rawTx: Bytes): Promise<boolean> {
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

    getGriefingCollateral(): Promise<DOT> {
        return Promise.resolve(new BN(100) as DOT);
    }

    list(): Promise<IssueRequest[]> {
        const registry = new TypeRegistry();
        const decodedAccountId1 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
        const decodedAccountId2 = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D6";

        return Promise.resolve([
            <IssueRequest>{
                vault: new GenericAccountId(registry, decodedAccountId1),
                amount: new BN(600) as PolkaBTC,
                opentime: new BN(10908) as BlockNumber,
                btc_address: new U8aFixed(registry, "343242ddsadsadsa") as H160,
                completed: new bool(registry, true),
                requester: new GenericAccountId(registry, decodedAccountId1),
                griefing_collateral: new BN(10) as DOT,
            },
            <IssueRequest>{
                vault: new GenericAccountId(registry, decodedAccountId2),
                amount: new BN(4510) as PolkaBTC,
                opentime: new BN(11938) as BlockNumber,
                btc_address: new U8aFixed(registry, "321321321321321") as H160,
                completed: new bool(registry, true),
                requester: new GenericAccountId(registry, decodedAccountId2),
                griefing_collateral: new BN(76) as DOT,
            },
        ]);
    }

    getPagedIterator(_perPage: number): AsyncGenerator<IssueRequest[]> {
        return {} as AsyncGenerator<IssueRequest[]>;
    }
}
