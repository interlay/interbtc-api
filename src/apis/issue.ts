import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, H256, Hash } from "@polkadot/types/interfaces";
import { EventRecord, DispatchError } from "@polkadot/types/interfaces/system";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { Callback, ISubmittableResult } from "@polkadot/types/types";
import { DOT, H256Le, Issue as IssueRequest, PolkaBTC, Vault } from "../interfaces/default";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import { pagedIterator } from "../../src/utils";

export type RequestResult = { hash: Hash; vault: Vault };

export interface IssueAPI {
    request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult>;
    execute(issueId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(issueId: H256): Promise<void>;
    setAccount(account?: AddressOrPair): void;
    getGriefingCollateral(): Promise<DOT>;
    list(): Promise<IssueRequest[]>;
    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaults: VaultsAPI;
    requestHash: Hash;
    events: EventRecord[] = [];

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.vaults = new DefaultVaultsAPI(api);
        this.requestHash = this.api.createType("Hash");
    }

    private printEvents(events: EventRecord[]): void {
        let foundErrorEvent = false;
        events.forEach(({ event }) => {
            event.data.forEach(async (eventData: any) => {
                if (eventData.isModule) {
                    try {
                        const parsedEventData = eventData as DispatchError;
                        const decoded = await this.api.registry.findMetaError(parsedEventData.asModule);
                        const { documentation, name, section } = decoded;
                        if (documentation) {
                            console.log(`\t${section}.${name}: ${documentation.join(" ")}`);
                        } else {
                            console.log(`\t${section}.${name}`);
                        }
                        foundErrorEvent = true;
                    } catch (err) {
                        console.log("\tCould not find transaction failure details.");
                    }

                }
            });
        });
        if (!foundErrorEvent) {
            events.forEach(({ phase, event: { data, method, section } }) => {
                console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            });
        }
    }

    private txCallback(unsubscribe: Callback<ISubmittableResult>, result: ISubmittableResult) {
        if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
            this.requestHash = result.status.asFinalized;
            this.events = result.events;
            unsubscribe(result);
        }
    }

    private getIssueIdFromEvents(events: EventRecord[]): Hash {
        // A successful `request` produces four events:
        // - collateral.LockCollateral
        // - vaultRegistry.IncreaseToBeIssuedTokens
        // - issue.RequestIssue
        // - system.ExtrinsicSuccess
        this.printEvents(events);
        
        for (const { event: { method, section, data } } of events) {
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
        this.printEvents(events);

        for (const { event: { method, section } } of events) {
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
        // When passing { nonce: -1 } to signAndSend the API will use system.accountNextIndex to determine the nonce
        const unsubscribe: Callback<ISubmittableResult> = await this.api.tx.issue
            .requestIssue(amount, vault.id, griefingCollateral)
            .signAndSend(this.account, { nonce: -1 }, (result) => this.txCallback(unsubscribe, result));
        await delay(delayMs);

        const hash = this.getIssueIdFromEvents(this.events);
        return { hash, vault };
    }

    async execute(issueId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        const unsubscribe: Callback<ISubmittableResult> = await this.api.tx.issue
            .executeIssue(issueId, txId, txBlockHeight, merkleProof, rawTx)
            .signAndSend(this.account, { nonce: -1 }, (result) => this.txCallback(unsubscribe, result));
        await delay(delayMs);

        return this.isExecutionSucessful(this.events);
    }

    async cancel(issueId: H256): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        const unsubscribe: Callback<ISubmittableResult> = await this.api.tx.issue
            .cancelIssue(issueId)
            .signAndSend(this.account, { nonce: -1 }, (result) => this.txCallback(unsubscribe, result));
        await delay(delayMs);
    }

    async list(): Promise<IssueRequest[]> {
        const issueRequests = await this.api.query.issue.issueRequests.entries();
        return issueRequests.map((v) => v[1]);
    }

    getPagedIterator(perPage: number): AsyncGenerator<IssueRequest[]> {
        return pagedIterator<IssueRequest>(this.api.query.issue.issueRequests, perPage);
    }

    async getGriefingCollateral(): Promise<DOT> {
        return this.api.query.issue.issueGriefingCollateral();
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}

const delayMs = 25000;

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
