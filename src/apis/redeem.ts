import { PolkaBTC, Redeem, Vault } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId, Hash } from "@polkadot/types/interfaces";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";

export type RequestResult = { hash: Hash; vault: Vault };

export interface RedeemAPI {
    list(): Promise<Redeem[]>;
    request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult>;
    setAccount(account?: KeyringPair): void;
}

export class DefaultRedeemAPI {
    private vaults: VaultsAPI;

    constructor(private api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new DefaultVaultsAPI(api);
    }

    async request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaults.get(vaultId);
        } else {
            vault = await this.vaults.selectRandomVault(amount);
        }

        const hash = await this.api.tx.redeem.requestRedeem(amount, btcAddress, vault.id).signAndSend(this.account);
        return { hash, vault };
    }

    async list(): Promise<Redeem[]> {
        const redeemRequests = await this.api.query.redeem.redeemRequests.entries();
        return redeemRequests.map((v) => v[1]);
    }

    setAccount(account?: KeyringPair): void {
        this.account = account;
    }
}
