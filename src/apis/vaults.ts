import { PolkaBTC, Vault } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { u128 } from "@polkadot/types/primitive";

export interface VaultsAPI {
    list(): Promise<Vault[]>;
    get(vaultId: AccountId): Promise<Vault>;
    getCollateralization(vaultId: AccountId): Promise<number>;
    getIssuedPolkaBTCAmount(vaultId: AccountId): Promise<PolkaBTC>;
    getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC>;
    selectRandomVault(btc: PolkaBTC): Promise<AccountId>;
}

export class DefaultVaultsAPI {
    granularity = 5;

    constructor(private api: ApiPromise) { }

    async list(): Promise<Vault[]> {
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entries();
        return vaultsMap.map((v) => v[1]);
    }

    get(vaultId: AccountId): Promise<Vault> {
        return this.api.query.vaultRegistry.vaults(vaultId);
    }

    async getCollateralization(vaultId: AccountId): Promise<number> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const collateralization =
                await customAPIRPC.vaultRegistry.getCollateralizationFromVault(vaultId);
            return this.scaleUsingParachainGranularity(collateralization);
        } catch (e) {
            return Promise.reject("Error during collateralization computation");
        }
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

    async selectRandomVault(btc: PolkaBTC): Promise<AccountId> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const firstVaultWithSufficientCollateral =
                await customAPIRPC.vaultRegistry.getFirstVaultWithSufficientCollateral(btc);
            return firstVaultWithSufficientCollateral;
        } catch (e) {
            return Promise.reject("Error during vault search");
        }
    }

    async isVaultFlaggedForTheft(vaultId: AccountId): Promise<boolean> {
        const theftReports = await this.api.query.stakedRelayers.theftReports(vaultId);
        return theftReports.isEmpty;
    }

    private scaleUsingParachainGranularity(value: u128): number {
        return value.toNumber() / Math.pow(10, this.granularity);
    }
}
