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
import { VaultsAPI, VaultExt } from "../../apis/vaults";
import Big from "big.js";

export class MockVaultsAPI implements VaultsAPI {
    async list(): Promise<VaultExt[]> {
        const registry = new TypeRegistry();

        // random value
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";
        return Promise.resolve([
            <VaultExt>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(120) as PolkaBTC,
                issued_tokens: new BN(330) as PolkaBTC,
                to_be_redeemed_tokens: new BN(5) as PolkaBTC,
                wallet: {
                    address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                },
                banned_until: new Option(registry, "BlockNumber", new BN(10908)),
            },
            <VaultExt>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(220) as PolkaBTC,
                issued_tokens: new BN(430) as PolkaBTC,
                to_be_redeemed_tokens: new BN(12) as PolkaBTC,
                wallet: {
                    address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                },
                banned_until: new Option(registry, "BlockNumber", new BN(11938)),
            },
        ]);
    }

    async listPaged(): Promise<VaultExt[]> {
        const registry = new TypeRegistry();

        // random value
        const decodedAccountId = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";
        return Promise.resolve([
            <VaultExt>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(120) as PolkaBTC,
                issued_tokens: new BN(330) as PolkaBTC,
                to_be_redeemed_tokens: new BN(5) as PolkaBTC,
                wallet: {
                    address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                },
                banned_until: new Option(registry, "BlockNumber", new BN(10908)),
            },
            <VaultExt>{
                id: new GenericAccountId(registry, decodedAccountId),
                to_be_issued_tokens: new BN(220) as PolkaBTC,
                issued_tokens: new BN(430) as PolkaBTC,
                to_be_redeemed_tokens: new BN(12) as PolkaBTC,
                wallet: {
                    address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
                },
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

    get(_vaultId: AccountId): Promise<VaultExt> {
        return Promise.resolve(<VaultExt>{});
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

    async getVaultCollateralization(_vaultId: AccountId, _newCollateral?: DOT, _onlyIssued = false): Promise<Big> {
        return new Big(2.0);
    }

    async getSystemCollateralization(): Promise<Big> {
        return new Big(5.2);
    }

    async getRequiredCollateralForVault(_vaultId: AccountId): Promise<DOT> {
        const registry = new TypeRegistry();
        return new UInt(registry, 100) as DOT;
    }

    async getAuctionCollateralThreshold(): Promise<Big> {
        return new Big(0);
    }

    async getSecureCollateralThreshold(): Promise<Big> {
        return new Big(0);
    }

    async getIssuablePolkaBTC(): Promise<string> {
        return "500";
    }

    async getLiquidationCollateralThreshold(): Promise<Big> {
        return new Big(0);
    }

    async getPremiumRedeemThreshold(): Promise<Big> {
        return new Big(0);
    }

    async getFeesPolkaBTC(_vaultId: string): Promise<string> {
        return "368";
    }

    async getFeesDOT(_vaultId: string): Promise<string> {
        return "368";
    }

    async getAPY(_vaultId: string): Promise<string> {
        return "3.23988247";
    }

    async getSLA(_vaultId: string): Promise<string> {
        return "62";
    }

    async getSlashableCollateral(_vaultId: string, _amount: string): Promise<string> {
        return "55.325";
    }

    async getMaxSLA(): Promise<string> {
        return "100";
    }

    async getPunishmentFee(): Promise<string> {
        return "368";
    }
}
