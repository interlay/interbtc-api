import { DOT, IssueRequest, PolkaBTC, H256Le } from "../../../src/interfaces/default";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, BlockNumber, Hash } from "@polkadot/types/interfaces";
import { Bytes, bool } from "@polkadot/types/primitive";
import BN from "bn.js";
import { GenericAccountId } from "@polkadot/types/generic";
import { TypeRegistry } from "@polkadot/types";
import { U8aFixed } from "@polkadot/types/codec";
import { IssueAPI, IssueRequestResult, IssueRequestExt } from "../../../src/parachain/issue";
import { EventRecord } from "@polkadot/types/interfaces/system";
import Big from "big.js";

export class MockIssueAPI implements IssueAPI {
    execute(_issueId: H256, _txId: H256Le, _merkleProof: Bytes, _rawTx: Bytes): Promise<void> {
        return Promise.resolve();
    }

    cancel(_issueId: H256): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async request(_amount: PolkaBTC, _vaultId?: AccountId, _griefingCollateral?: DOT): Promise<IssueRequestResult> {
        const registry = new TypeRegistry();
        const id = new U8aFixed(registry, "0x41fd1760b07dc5bc3b1548b6ffdd057444fb3a426460a199a6e2d42a7960e83c") as Hash;
        return Promise.resolve({ id, issueRequest: (await this.list())[0] });
    }

    setAccount(_account?: AddressOrPair): void {
        return;
    }

    getGriefingCollateralInPlanck(_amountSat: PolkaBTC): Promise<Big> {
        return Promise.resolve(new Big("100"));
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

    isRequestSuccessful(_events: EventRecord[]): boolean {
        return true;
    }

    isExecutionSuccessful(_events: EventRecord[]): boolean {
        return false;
    }

    async getFeesToPay(_amountBtc: string): Promise<string> {
        return "0.01";
    }

    async getFeeRate(): Promise<Big> {
        return new Big("0.005");
    }
}
