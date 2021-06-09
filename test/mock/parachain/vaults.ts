import { SystemVault } from "../../../src/interfaces/default";
import { AccountId, H256 } from "@polkadot/types/interfaces";
import { ReplaceRequestExt } from "../../../src/parachain/replace";
import { VaultsAPI, VaultExt } from "../../../src/parachain/vaults";
import Big from "big.js";
import { MockTransactionAPI } from "../transaction";
import { Issue, Redeem } from "../../../src";

export class MockVaultsAPI extends MockTransactionAPI implements VaultsAPI {
    getRequiredCollateralForWrapped(_amount: Big): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    list(): Promise<VaultExt[]> {
        throw new Error("Method not implemented.");
    }
    listPaged(): Promise<VaultExt[]> {
        throw new Error("Method not implemented.");
    }
    mapIssueRequests(_vaultId: AccountId): Promise<Map<H256, Issue>> {
        throw new Error("Method not implemented.");
    }
    mapRedeemRequests(_vaultId: AccountId): Promise<Map<H256, Redeem>> {
        throw new Error("Method not implemented.");
    }
    mapReplaceRequests(_vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>> {
        throw new Error("Method not implemented.");
    }
    get(_vaultId: AccountId): Promise<VaultExt> {
        throw new Error("Method not implemented.");
    }
    getVaultCollateralization(_vaultId: AccountId, _newCollateral?: Big, _onlyIssued?: boolean): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getSystemCollateralization(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getRequiredCollateralForVault(_vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getIssuedAmount(_vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getIssuableAmount(_vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getTotalIssuedAmount(): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getTotalIssuableAmount(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    selectRandomVaultIssue(_btc: Big): Promise<AccountId> {
        throw new Error("Method not implemented.");
    }
    selectRandomVaultRedeem(_btc: Big): Promise<AccountId> {
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
    isVaultFlaggedForTheft(_vaultId: AccountId): Promise<boolean> {
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
    getFeesWrapped(_vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getFeesCollateral(_vaultId: AccountId): Promise<Big> {
        throw new Error("Method not implemented.");
    }
    getAPY(_vaultId: AccountId): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getSLA(_vaultId: AccountId): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getMaxSLA(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getPunishmentFee(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    withdrawCollateral(_amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    lockAdditionalCollateral(_amount: Big): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getLiquidationVaultId(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    getLiquidationVault(): Promise<SystemVault> {
        throw new Error("Method not implemented.");
    }
}
