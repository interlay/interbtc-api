import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { DOT, H256Le, IssueRequest, PolkaBTC, Vault } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import { pagedIterator, sendLoggedTx } from "../utils";

export type RequestResult = { hash: Hash; vault: Vault };

export interface IssueAPI {
    request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult>;
    execute(issueId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(issueId: H256): Promise<void>;
    setAccount(account?: AddressOrPair): void;
    getGriefingCollateral(): Promise<DOT>;
    list(): Promise<IssueRequest[]>;
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, IssueRequest>>;
    getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequest>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaults: VaultsAPI;
    requestHash: Hash;

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.vaults = new DefaultVaultsAPI(api);
        this.requestHash = this.api.createType("Hash");
    }

    private getIssueIdFromEvents(events: EventRecord[]): Hash {
        // A successful `request` produces four events:
        // - collateral.LockCollateral
        // - vaultRegistry.IncreaseToBeIssuedTokens
        // - issue.RequestIssue
        // - system.ExtrinsicSuccess

        for (const {
            event: { method, section, data },
        } of events) {
            if (section == "issue" && method == "RequestIssue") {
                const hash = this.api.createType("Hash", data[0]);
                return hash;
            }
        }

        throw new Error("Request transaction failed");
    }

    isExecutionSucessful(events: EventRecord[]): boolean {
        // A successful `execute` produces five events:
        // - vaultRegistry.IssueTokens
        // - system.NewAccount
        // - polkaBtc.Endowed
        // - treasury.Mint
        // - issue.ExecuteIssue
        // - system.ExtrinsicSuccess

        for (const {
            event: { method, section },
        } of events) {
            if (section == "issue" && method == "ExecuteIssue") {
                return true;
            }
        }

        return false;
    }

    async request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaults.get(vaultId);
        } else {
            vaultId = await this.vaults.selectRandomVaultIssue(amount);
            vault = await this.vaults.get(vaultId);
        }

        if (!griefingCollateral) {
            griefingCollateral = await this.getGriefingCollateral();
        }
        const requestIssueTx = this.api.tx.issue.requestIssue(amount, vault.id, griefingCollateral);
        const result = await sendLoggedTx(requestIssueTx, this.account, this.api);

        const hash = this.getIssueIdFromEvents(result.events);
        return { hash, vault };
    }

    async execute(issueId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const executeIssueTx = this.api.tx.issue.executeIssue(issueId, txId, txBlockHeight, merkleProof, rawTx);
        const result = await sendLoggedTx(executeIssueTx, this.account, this.api);
        return this.isExecutionSucessful(result.events);
    }

    async cancel(issueId: H256): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const cancelIssueTx = this.api.tx.issue.cancelIssue(issueId);
        await sendLoggedTx(cancelIssueTx, this.account, this.api);
    }

    async list(): Promise<IssueRequest[]> {
        const issueRequests = await this.api.query.issue.issueRequests.entries();
        return issueRequests.map((v) => v[1]);
    }

    async mapForUser(account: AccountId): Promise<Map<H256, IssueRequest>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        const issueRequestPairs: [H256, IssueRequest][] = await customAPIRPC.issue.getIssueRequests(account);
        const mapForUser: Map<H256, IssueRequest> = new Map<H256, IssueRequest>();
        issueRequestPairs.forEach((issueRequestPair) => mapForUser.set(issueRequestPair[0], issueRequestPair[1]));
        return mapForUser;
    }

    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    async getGriefingCollateral(): Promise<DOT> {
        return this.api.query.issue.issueGriefingCollateral();
    }

    getRequestById(issueId: string | Uint8Array | H256): Promise<IssueRequest> {
        return this.api.query.issue.issueRequests(issueId);
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
