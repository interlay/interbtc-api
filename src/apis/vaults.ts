import { PolkaBTC, Vault } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";

interface VaultsAPI {
    list(): Promise<Vault[]>;
    selectRandomVault(btc: PolkaBTC): Promise<Vault>;
    get(vaultId: AccountId): Promise<Vault>;
}

class VaultsAPI {
    constructor(private api: ApiPromise) {}

    async list(): Promise<Vault[]> {
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entries();
        return vaultsMap.map((v) => v[1]);
    }

    get(vaultId: AccountId | string): Promise<Vault> {
        return this.api.query.vaultRegistry.vaults.at(vaultId);
    }

    // TODO: get vault with enough collateral from the registry
    async selectRandomVault(_btc: PolkaBTC): Promise<Vault> {
        const vaults = await this.list();
        return vaults[0];
    }
}

export default VaultsAPI;
