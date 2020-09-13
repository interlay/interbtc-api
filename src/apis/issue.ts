import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId, Hash } from "@polkadot/types/interfaces";
import { DOT, PolkaBTC, Vault } from "@interlay/polkabtc/interfaces/default";
import Vaults from "./vaults";

export type RequestResult = { hash: Hash; vault: Vault };

interface Issue {
    request(amount: PolkaBTC, vaultId?: AccountId, grifiengCollateral?: DOT): Promise<RequestResult>;
    setAccount(account?: KeyringPair): void;
    getGriefingCollateral(): Promise<DOT>;
}

class Issue {
    private vaults: Vaults;

    constructor(private api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new Vaults(api);
    }

    async request(amount: PolkaBTC, vaultId?: AccountId, grifiengCollateral?: DOT): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        const vault = await this.vaults.selectRandomVault(amount);
        if (!vaultId) {
            vaultId = vault.id;
        }
        if (!grifiengCollateral) {
            grifiengCollateral = await this.getGriefingCollateral();
        }
        const hash = await this.api.tx.issue
            .requestIssue(amount, vaultId, grifiengCollateral)
            .signAndSend(this.account);
        return { hash, vault };
    }

    async getGriefingCollateral(): Promise<DOT> {
        return this.api.query.issue.issueGriefingCollateral();
    }

    setAccount(account?: KeyringPair): void {
        this.account = account;
    }
}

export default Issue;
