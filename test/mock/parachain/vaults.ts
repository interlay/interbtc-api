import { Vault, SystemVault } from "../../../src/interfaces/default";
import { AccountId, H256 } from "@polkadot/types/interfaces";
import { IssueRequestExt } from "../../../src/parachain/issue";
import { RedeemRequestExt } from "../../../src/parachain/redeem";
import { ReplaceRequestExt } from "../../../src/parachain/replace";
import { VaultsAPI, VaultExt } from "../../../src/parachain/vaults";
import Big from "big.js";
import { MockTransactionAPI } from "../transaction";

export class MockVaultsAPI extends MockTransactionAPI implements VaultsAPI {
    list(): Promise<VaultExt[]> {
        throw new Error("Method not implemented.");
    }
    listPaged(): Promise<VaultExt[]> {
        throw new Error("Method not implemented.");
    }
    mapIssueRequests(vaultId: AccountId): Promise<Map<H256, IssueRequestExt>> {
        throw new Error("Method not implemented.");
    }
    mapRedeemRequests(vaultId: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        throw new Error("Method not implemented.");
    }
    mapReplaceRequests(vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>> {
        throw new Error("Method not implemented.");
    }
    getPagedIterator(perPage: number): AsyncGenerator<Vault[], any, unknown> {
        throw new Error("Method not implemented.");
    }
    get(vaultId: AccountId): Promise<VaultExt> {
        throw new Error("Method not implemented.");
    }
    getVaultCollateralization(vaultId: AccountId, newCollateral?: Big, onlyIssued?: boolean): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getSystemCollateralization(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getRequiredCollateralForVault(vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getIssuedAmount(vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getTotalIssuedPolkaBTCAmount(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getIssuablePolkaBTC(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    selectRandomVaultIssue(btc: Big): Promise<AccountId> {
        throw new Error("Method not implemented.");
    }
    selectRandomVaultRedeem(btc: Big): Promise<AccountId> {
        throw new Error("Method not implemented.");
    }
    getPremiumRedeemVaults(): Promise<Map<AccountId, Big>> {
        throw new Error("Method not implemented.");
    }
    getVaultsWithIssuableTokens(): Promise<Map<AccountId, Big>> {
        throw new Error("Method not implemented.");
    }
    getVaultsWithRedeemableTokens(): Promise<Map<AccountId, Big>> {
        throw new Error("Method not implemented.");
    }
    isVaultFlaggedForTheft(vaultId: AccountId): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getLiquidationCollateralThreshold(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getPremiumRedeemThreshold(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getSecureCollateralThreshold(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getFeesWrapped(vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getFeesCollateral(vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getAPY(vaultId: AccountId): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getSLA(vaultId: AccountId): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getMaxSLA(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getPunishmentFee(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getPolkaBTCCapacity(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    withdrawCollateral(amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    lockAdditionalCollateral(amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getLiquidationVaultId(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getLiquidationVault(): Promise<SystemVault> {
        throw new Error("Method not implemented.");
    }
}
