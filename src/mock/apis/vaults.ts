import { PolkaBTC, Vault, DOT } from "../../interfaces/default";
import { AccountId, H256, H160 } from "@polkadot/types/interfaces";
import { GenericAccountId } from "@polkadot/types/generic";
import { TypeRegistry } from "@polkadot/types";
import { U8aFixed, Option } from "@polkadot/types/codec";
import BN from "bn.js";
import { UInt } from "@polkadot/types/codec";
import { IssueRequestExt } from "../../apis/issue";
import { RedeemRequestExt } from "../../apis/redeem";
import { ReplaceRequestExt } from "../../apis/replace";
import { VaultsAPI } from "../../apis/vaults";
import { u128 } from "@polkadot/types/primitive";

export class MockVaultsAPI implements VaultsAPI {
    async list(): Promise<Vault[]> {
        const registry = new TypeRegistry();

        // random value
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";
        return Promise.resolve([
            <Vault>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(120) as PolkaBTC,
                issued_tokens: new BN(330) as PolkaBTC,
                to_be_redeemed_tokens: new BN(5) as PolkaBTC,
                wallet: new (registry.createClass("Wallet"))(registry, {
                    address: new U8aFixed(registry, "343242ddsadsadsa") as H160,
                }),
                banned_until: new Option(registry, "BlockNumber", new BN(10908)),
            },
            <Vault>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(220) as PolkaBTC,
                issued_tokens: new BN(430) as PolkaBTC,
                to_be_redeemed_tokens: new BN(12) as PolkaBTC,
                wallet: new (registry.createClass("Wallet"))(registry, {
                    address: new U8aFixed(registry, "78443543fdsf") as H160,
                }),
                banned_until: new Option(registry, "BlockNumber", new BN(11938)),
            },
        ]);
    }

    async listPaged(): Promise<Vault[]> {
        const registry = new TypeRegistry();

        // random value
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";
        return Promise.resolve([
            <Vault>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(120) as PolkaBTC,
                issued_tokens: new BN(330) as PolkaBTC,
                to_be_redeemed_tokens: new BN(5) as PolkaBTC,
                wallet: new (registry.createClass("Wallet"))(registry, {
                    address: new U8aFixed(registry, "343242ddsadsadsa") as H160,
                }),
                banned_until: new Option(registry, "BlockNumber", new BN(10908)),
            },
            <Vault>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(220) as PolkaBTC,
                issued_tokens: new BN(430) as PolkaBTC,
                to_be_redeemed_tokens: new BN(12) as PolkaBTC,
                wallet: new (registry.createClass("Wallet"))(registry, {
                    address: new U8aFixed(registry, "78443543fdsf") as H160,
                }),
                banned_until: new Option(registry, "BlockNumber", new BN(11938)),
            },
        ]);
    }

    async mapIssueRequests(_vaultId: AccountId): Promise<Map<H256, IssueRequestExt>> {
        // Empty for now, as it is difficult to mock IssueRequests
        return Promise.resolve(new Map<H256, IssueRequestExt>());
    }

    async mapRedeemRequests(_vaultId: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        // Empty for now, as it is difficult to mock RedeemRequest
        return Promise.resolve(new Map<H256, RedeemRequestExt>());
    }

    async mapReplaceRequests(_vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>> {
        // Empty for now, as it is difficult to mock ReplaceRequest
        return Promise.resolve(new Map<H256, ReplaceRequestExt>());
    }

    getPagedIterator(_perPage: number): AsyncGenerator<Vault[]> {
        return {} as AsyncGenerator<Vault[]>;
    }

    get(_vaultId: AccountId): Promise<Vault> {
        return Promise.resolve(<Vault>{});
    }

    async selectRandomVaultIssue(_btc: PolkaBTC): Promise<AccountId> {
        const vaults = await this.list();
        return vaults[0].id;
    }

    async selectRandomVaultRedeem(_btc: PolkaBTC): Promise<AccountId> {
        const vaults = await this.list();
        return vaults[0].id;
    }

    async getIssuedPolkaBTCAmount(_vaultId: AccountId): Promise<PolkaBTC> {
        return new BN(5) as PolkaBTC;
    }

    async getIssuedPolkaBTCAmounts(): Promise<PolkaBTC[]> {
        const mockIssuedAmounts: PolkaBTC[] = [0.04, 4, 12].map((x) => new BN(x) as PolkaBTC);
        return Promise.resolve(mockIssuedAmounts);
    }

    async getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC> {
        const stakedAmounts: PolkaBTC[] = await this.getIssuedPolkaBTCAmounts();
        if (stakedAmounts.length) {
            const sumReducer = (accumulator: PolkaBTC, currentValue: PolkaBTC) =>
                accumulator.add(currentValue) as PolkaBTC;
            return stakedAmounts.reduce(sumReducer);
        }
        return new BN(0) as PolkaBTC;
    }

    async getVaultCollateralization(_vaultId: AccountId, _newCollateral?: DOT, _onlyIssued = false): Promise<number> {
        return 2.0;
    }

    async getSystemCollateralization(): Promise<number> {
        return 5.2;
    }

    async getRequiredCollateralForVault(_vaultId: AccountId): Promise<DOT> {
        const registry = new TypeRegistry();
        return new UInt(registry, 100) as DOT;
    }

    async getIssuablePolkaBTC(): Promise<string> {
        return "500";
    }

    async getLiquidationCollateralThreshold(): Promise<u128> {
        const registry = new TypeRegistry();
        return new UInt(registry, 110000) as u128;
    }

    async getPremiumRedeemThreshold(): Promise<u128> {
        const registry = new TypeRegistry();
        return new UInt(registry, 120000) as u128;
    }

    async getFees(_vaultId: AccountId): Promise<PolkaBTC> {
        const registry = new TypeRegistry();
        return new UInt(registry, 368) as PolkaBTC;
    }

    async getAPY(_vaultId: AccountId): Promise<string> {
        return "3.23988247";
    }

    async getSLA(_vaultId: AccountId): Promise<number> {
        return 62;
    }

    async getSlashableCollateral(_vaultId: AccountId, _amount: PolkaBTC): Promise<string> {
        return "55.325";
    }
}
