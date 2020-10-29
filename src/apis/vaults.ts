import { PolkaBTC, Vault, IssueRequest, RedeemRequest } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { u128 } from "@polkadot/types/primitive";
import { pagedIterator } from "../utils";
import { DefaultIssueAPI } from "./issue";
import { DefaultRedeemAPI } from "./redeem";

export interface VaultsAPI {
    list(): Promise<Vault[]>;
    listPaged(): Promise<Vault[]>;
    mapIssueRequests(vaultId: AccountId): Promise<Map<AccountId, IssueRequest[]>>;
    mapRedeemRequests(vaultId: AccountId): Promise<Map<AccountId, RedeemRequest[]>>;
    getPagedIterator(perPage: number): AsyncGenerator<Vault[]>;
    get(vaultId: AccountId): Promise<Vault>;
    getCollateralization(vaultId: AccountId): Promise<number>;
    getIssuedPolkaBTCAmount(vaultId: AccountId): Promise<PolkaBTC>;
    getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC>;
    selectRandomVaultIssue(btc: PolkaBTC): Promise<AccountId>;
    selectRandomVaultRedeem(btc: PolkaBTC): Promise<AccountId>;
}

export class DefaultVaultsAPI {
    private issueAPI!: DefaultIssueAPI;
    private redeemAPI!: DefaultRedeemAPI;
    granularity = 5;

    constructor(private api: ApiPromise) {}

    async list(): Promise<Vault[]> {
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entries();
        return vaultsMap.map((v) => v[1]);
    }

    async listPaged(): Promise<Vault[]> {
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entriesPaged({ pageSize: 1 });
        return vaultsMap.map((v) => v[1]);
    }

    /**
     * Fetch the issue requests associated with a vault
     *
     * @remarks
     * Cannot instantiate issueAPI in the constructor, because that would create a dependency loop,
     * since issueAPI also instantiates the vaultsAPI in its constructor
     *
     * @param vaultId - The AccountId of the vault used to filter issue requests
     * @returns A map with a single key, from the vault AccountId to issue requests involving said vault
     */
    async mapIssueRequests(vaultId: AccountId): Promise<Map<AccountId, IssueRequest[]>> {
        if (!this.issueAPI) {
            this.issueAPI = new DefaultIssueAPI(this.api);
        }
        const allIssueRequests = await this.issueAPI.list();

        const issueRequestsWithCurrentVault = allIssueRequests.filter((issueRequest) => issueRequest.vault.eq(vaultId));
        return new Map([[vaultId, issueRequestsWithCurrentVault]]);
    }

    /**
     * Fetch the redeem requests associated with a vault
     *
     * @remarks
     * Cannot instantiate redeemAPI in the constructor, because that would create a dependency loop,
     * since redeemAPI also instantiates the vaultsAPI in its constructor
     *
     * @param vaultId - The AccountId of the vault used to filter redeem requests
     * @returns A map with a single key, from the vault AccountId to redeem requests involving said vault
     */
    async mapRedeemRequests(vaultId: AccountId): Promise<Map<AccountId, RedeemRequest[]>> {
        if (!this.redeemAPI) {
            this.redeemAPI = new DefaultRedeemAPI(this.api);
        }
        const allRedeemRequests = await this.redeemAPI.list();

        const redeemRequestsWithCurrentVault = allRedeemRequests.filter((redeemRequest) =>
            redeemRequest.vault.eq(vaultId)
        );
        return new Map([[vaultId, redeemRequestsWithCurrentVault]]);
    }

    getPagedIterator(perPage: number): AsyncGenerator<Vault[]> {
        return pagedIterator<Vault>(this.api.query.vaultRegistry.vaults, perPage);
    }

    get(vaultId: AccountId): Promise<Vault> {
        return this.api.query.vaultRegistry.vaults(vaultId);
    }

    async getCollateralization(vaultId: AccountId): Promise<number> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const collateralization = await customAPIRPC.vaultRegistry.getCollateralizationFromVault(vaultId);
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

    async selectRandomVaultIssue(btc: PolkaBTC): Promise<AccountId> {
        const customAPIRPC = this.api.rpc as any;
        try {
            // eslint-disable-next-line max-len
            const firstVaultWithSufficientCollateral = await customAPIRPC.vaultRegistry.getFirstVaultWithSufficientCollateral(
                btc
            );
            return firstVaultWithSufficientCollateral;
        } catch (e) {
            return Promise.reject("Did not find vault with sufficient collateral");
        }
    }

    async selectRandomVaultRedeem(btc: PolkaBTC): Promise<AccountId> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const firstVaultWithSufficientTokens = await customAPIRPC.vaultRegistry.getFirstVaultWithSufficientTokens(
                btc
            );
            return firstVaultWithSufficientTokens;
        } catch (e) {
            return Promise.reject("Did not find vault with sufficient locked BTC");
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
