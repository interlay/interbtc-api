import {
    IssueRequest,
    PolkaBTC,
    RedeemRequest,
    ReplaceRequest,
    Vault,
    DOT,
    BalanceWrapper,
} from "../../interfaces/default";
import { AccountId, H256, H160 } from "@polkadot/types/interfaces";
import { GenericAccountId } from "@polkadot/types/generic";
import { TypeRegistry } from "@polkadot/types";
import { U8aFixed, Option } from "@polkadot/types/codec";
import BN from "bn.js";
import { UInt } from "@polkadot/types/codec";

import { VaultsAPI } from "../../apis/vaults";

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

    async mapIssueRequests(_vaultId: AccountId): Promise<Map<H256, IssueRequest>> {
        // Empty for now, as it is difficult to mock IssueRequests
        return Promise.resolve(new Map<H256, IssueRequest>());
    }

    async mapRedeemRequests(_vaultId: AccountId): Promise<Map<H256, RedeemRequest>> {
        // Empty for now, as it is difficult to mock RedeemRequest
        return Promise.resolve(new Map<H256, RedeemRequest>());
    }

    async mapReplaceRequests(_vaultId: AccountId): Promise<Map<H256, ReplaceRequest>> {
        // Empty for now, as it is difficult to mock ReplaceRequest
        return Promise.resolve(new Map<H256, ReplaceRequest>());
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
}
