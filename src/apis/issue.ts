import { DOT, Issue as IssueRequest, PolkaBTC, Vault, H256Le } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId, Hash, H256 } from "@polkadot/types/interfaces";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";

export type RequestResult = { hash: Hash; vault: Vault };

export interface IssueAPI {
    request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult>;
    execute(issueId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<void>;
    cancel(issueId: H256): Promise<void>;
    setAccount(account?: KeyringPair): void;
    getGriefingCollateral(): Promise<DOT>;
    list(): Promise<IssueRequest[]>;
}

export class DefaultIssueAPI implements IssueAPI {
    private vaults: VaultsAPI;

    constructor(private api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new DefaultVaultsAPI(api);
    }

    async request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaults.get(vaultId);
        } else {
            vault = await this.vaults.selectRandomVault(amount);
        }

        if (!griefingCollateral) {
            griefingCollateral = await this.getGriefingCollateral();
        }
        const hash = await this.api.tx.issue
            .requestIssue(amount, vault.id, griefingCollateral)
            .signAndSend(this.account);
        return { hash, vault };
    }

    async execute(issueId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        await this.api.tx.issue
            .executeIssue(issueId, txId, txBlockHeight, merkleProof, rawTx)
            .signAndSend(this.account);
    }

    async cancel(issueId: H256): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }
        await this.api.tx.issue.cancelIssue(issueId).signAndSend(this.account);
    }

    async list(): Promise<IssueRequest[]> {
        const issueRequests = await this.api.query.issue.issueRequests.entries();
        return issueRequests.map((v) => v[1]);
    }

    async getGriefingCollateral(): Promise<DOT> {
        return this.api.query.issue.issueGriefingCollateral();
    }

    setAccount(account?: KeyringPair): void {
        this.account = account;
    }
}
