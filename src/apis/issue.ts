import { DOT, Issue as IssueRequest, PolkaBTC, Vault } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId, Hash } from "@polkadot/types/interfaces";
import Vaults from "./vaults";

export type RequestResult = { hash: Hash; vault: Vault };

interface IssueAPI {
    request(amount: PolkaBTC, vaultId?: AccountId, griefingCollateral?: DOT): Promise<RequestResult>;
    setAccount(account?: KeyringPair): void;
    getGriefingCollateral(): Promise<DOT>;
    list(): Promise<IssueRequest[]>;
}

class IssueAPI {
    private vaults: Vaults;

    constructor(private api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new Vaults(api);
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

export default IssueAPI;
