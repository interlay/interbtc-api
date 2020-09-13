import { ApiPromise } from "@polkadot/api";
import { PolkaBTC, Vault } from "@interlay/polkabtc/interfaces/default";

interface Vaults {
    list(): Promise<Vault[]>;
    selectRandomVault(btc: PolkaBTC): Promise<Vault>;
}

class Vaults {
    constructor(private api: ApiPromise) {}

    async list(): Promise<Vault[]> {
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entries();
        return vaultsMap.map((v) => v[1]);
    }

    // TODO: get vault with enough collateral from the registry
    async selectRandomVault(_btc: PolkaBTC): Promise<Vault> {
        const vaults = await this.list();
        return vaults[0];
    }
}

export default Vaults;
