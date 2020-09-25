import { PolkaBTC, Vault } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";

export interface VaultsAPI {
    list(): Promise<Vault[]>;
    selectRandomVault(btc: PolkaBTC): Promise<Vault>;
    get(vaultId: AccountId): Promise<Vault>;
    getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC>;
    getIssuedPolkaBTCAmount(vaultId: AccountId): Promise<PolkaBTC>;
}

export class DefaultVaultsAPI {
    constructor(private api: ApiPromise) { }

    async list(): Promise<Vault[]> {
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entries();
        return vaultsMap.map((v) => v[1]);
    }

    get(vaultId: AccountId): Promise<Vault> {
        return this.api.query.vaultRegistry.vaults(vaultId);
    }

    async getIssuedPolkaBTCAmount(vaultId: AccountId): Promise<PolkaBTC> {
        const vault: Vault = await this.get(vaultId);
        return vault.issued_tokens;
    }

    private async getIssuedPolkaBTCAmounts(): Promise<PolkaBTC[]> {
        const vaults: Vault[] = await this.list();
        const issuedTokens: PolkaBTC[] = vaults.map((v) => v.issued_tokens);
        return issuedTokens;
    }

    async getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC> {
        const issuedTokens: PolkaBTC[] = await this.getIssuedPolkaBTCAmounts();
        if (issuedTokens.length) {
            const sumReducer = (accumulator: PolkaBTC, currentValue: PolkaBTC) =>
                accumulator.add(currentValue) as PolkaBTC;
            return issuedTokens.reduce(sumReducer);
        }
        return new UInt(new TypeRegistry(), 0) as PolkaBTC;
    }

    // TODO: get vault with enough collateral from the registry
    async selectRandomVault(_btc: PolkaBTC): Promise<Vault> {
        const vaults = await this.list();
        return vaults[0];
    }
}
