import { PolkaBTC, Vault, IssueRequest, RedeemRequest, ReplaceRequest, DOT } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AccountId, H256, Balance } from "@polkadot/types/interfaces";
import { UInt } from "@polkadot/types/codec";
import { TypeRegistry } from "@polkadot/types";
import { u128 } from "@polkadot/types/primitive";
import { pagedIterator, PERCENTAGE_GRANULARITY, planckToDOT } from "../utils";
import { BalanceWrapper } from "../interfaces/default";
import { CollateralAPI, DefaultCollateralAPI } from "./collateral";
import { DefaultOracleAPI } from "./oracle";
import Big from "big.js";
import { IssueRequestExt, encodeIssueRequest } from "./issue";
import { RedeemRequestExt, encodeRedeemRequest } from "./redeem";
import { ReplaceRequestExt, encodeReplaceRequest } from "./replace";
import { Network } from "bitcoinjs-lib";

export interface VaultsAPI {
    list(): Promise<Vault[]>;
    listPaged(): Promise<Vault[]>;
    mapIssueRequests(vaultId: AccountId): Promise<Map<H256, IssueRequestExt>>;
    mapRedeemRequests(vaultId: AccountId): Promise<Map<H256, RedeemRequestExt>>;
    mapReplaceRequests(vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>>;
    getPagedIterator(perPage: number): AsyncGenerator<Vault[]>;
    get(vaultId: AccountId): Promise<Vault>;
    getVaultCollateralization(
        vaultId: AccountId,
        newCollateral?: DOT,
        onlyIssued?: boolean
    ): Promise<number | undefined>;
    getSystemCollateralization(): Promise<number | undefined>;
    getRequiredCollateralForVault(vaultId: AccountId): Promise<DOT>;
    getIssuedPolkaBTCAmount(vaultId: AccountId): Promise<PolkaBTC>;
    getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC>;
    selectRandomVaultIssue(btc: PolkaBTC): Promise<AccountId>;
    selectRandomVaultRedeem(btc: PolkaBTC): Promise<AccountId>;
    getIssuablePolkaBTC(): Promise<string>;
    getLiquidationCollateralThreshold(): Promise<u128>;
    getPremiumRedeemThreshold(): Promise<u128>;
    getFees(vaultId: AccountId): Promise<PolkaBTC>;
    getAPY(vaultId: AccountId): Promise<string>;
    getSLA(vaultId: AccountId): Promise<number>;
    getSlashableCollateral(vaultId: AccountId, amount: PolkaBTC): Promise<string>;
}

export class DefaultVaultsAPI {
    granularity = 5;
    private btcNetwork: Network;
    collateralAPI: CollateralAPI;

    constructor(private api: ApiPromise, btcNetwork: Network) {
        this.btcNetwork = btcNetwork;
        this.collateralAPI = new DefaultCollateralAPI(this.api);
    }

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
     * @param vaultId - The AccountId of the vault used to filter issue requests
     * @returns A map with issue ids to issue requests involving said vault
     */
    async mapIssueRequests(vaultId: AccountId): Promise<Map<H256, IssueRequestExt>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        try {
            const issueRequestPairs: [H256, IssueRequest][] = await customAPIRPC.issue.getVaultIssueRequests(vaultId);
            return new Map(issueRequestPairs.map(([id, req]) => [id, encodeIssueRequest(req, this.btcNetwork)]));
        } catch (err) {
            return Promise.reject(`Error during issue request retrieval: ${err}`);
        }
    }

    /**
     * Fetch the redeem requests associated with a vault
     *
     * @param vaultId - The AccountId of the vault used to filter redeem requests
     * @returns A map with redeem ids to redeem requests involving said vault
     */
    async mapRedeemRequests(vaultId: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        try {
            const redeemRequestPairs: [H256, RedeemRequest][] = await customAPIRPC.redeem.getVaultRedeemRequests(
                vaultId
            );
            return new Map(redeemRequestPairs.map(([id, req]) => [id, encodeRedeemRequest(req, this.btcNetwork)]));
        } catch (err) {
            return Promise.reject(`Error during redeem request retrieval: ${err}`);
        }
    }

    /**
     * Fetch the replace requests associated with a vault. In the returned requests,
     * the vault is either the replaced or the replacing one.
     *
     * @param vaultId - The AccountId of the vault used to filter replace requests
     * @returns A map with replace ids to replace requests involving said vault as new vault and old vault
     */
    async mapReplaceRequests(vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const oldVaultReplaceRequests: [
                H256,
                ReplaceRequest
            ][] = await customAPIRPC.replace.getOldVaultReplaceRequests(vaultId);
            const oldVaultReplaceRequestsExt = oldVaultReplaceRequests.map(
                ([id, req]) => [id, encodeReplaceRequest(req, this.btcNetwork)] as [H256, ReplaceRequestExt]
            );
            const newVaultReplaceRequests: [
                H256,
                ReplaceRequest
            ][] = await customAPIRPC.replace.getNewVaultReplaceRequests(vaultId);
            const newVaultReplaceRequestsExt = newVaultReplaceRequests.map(
                ([id, req]) => [id, encodeReplaceRequest(req, this.btcNetwork)] as [H256, ReplaceRequestExt]
            );
            return new Map([...oldVaultReplaceRequestsExt, ...newVaultReplaceRequestsExt]);
        } catch (err) {
            return Promise.reject(`Error during replace request retrieval: ${err}`);
        }
    }

    getPagedIterator(perPage: number): AsyncGenerator<Vault[]> {
        return pagedIterator<Vault>(this.api.query.vaultRegistry.vaults, perPage);
    }

    async get(vaultId: AccountId): Promise<Vault> {
        const vault = await this.api.query.vaultRegistry.vaults(vaultId);
        if (!vaultId.eq(vault.id)) {
            throw new Error(`No vault registered with id ${vaultId}`);
        }
        return vault;
    }

    private isNoTokensIssuedError(e: Error): boolean {
        return e.message.includes("NoTokensIssued");
    }

    /**
     * Get the collateralization of a single vault measured by the amount of issued PolkaBTC
     * divided by the total locked DOT collateral.
     *
     * @remarks Undefined collateralization is handled as infinite collateralization in the UI.
     * If no tokens have been issued, the `collateralFunds / issuedFunds` ratio divides by zero,
     * which means collateralization is infinite.
     * @param vaultId the vault account id
     * @param newCollateral use this instead of the vault's actual collateral
     * @param onlyIssued optional, defaults to `false`. Specifies whether the collateralization
     * should only include the issued tokens, leaving out unsettled ("to-be-issued") tokens
     * @returns the vault collateralization
     */
    async getVaultCollateralization(
        vaultId: AccountId,
        newCollateral?: DOT,
        onlyIssued = false
    ): Promise<number | undefined> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const collateralization = newCollateral
                ? await customAPIRPC.vaultRegistry.getCollateralizationFromVaultAndCollateral(
                    vaultId,
                    this.wrapCurrency(newCollateral),
                    onlyIssued
                )
                : await customAPIRPC.vaultRegistry.getCollateralizationFromVault(vaultId, onlyIssued);
            return this.scaleUsingParachainGranularity(collateralization);
        } catch (e) {
            if (this.isNoTokensIssuedError(e)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(`Error during collateralization computation: ${(e as Error).message}`);
        }
    }

    /**
     * Get the total system collateralization measured by the amount of issued PolkaBTC
     * divided by the total locked DOT collateral.
     *
     * @returns the total system collateralization
     */
    async getSystemCollateralization(): Promise<number | undefined> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const collateralization = await customAPIRPC.vaultRegistry.getTotalCollateralization();
            return this.scaleUsingParachainGranularity(collateralization);
        } catch (e) {
            if (this.isNoTokensIssuedError(e)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject("Error during collateralization computation");
        }
    }

    /**
     * Get the amount of collateral required for the given vault to be at the
     * current SecureCollateralThreshold with the current exchange rate
     *
     * @param vaultId the vault account id
     * @returns the required collateral the vault needs to deposit to stay
     * above the threshold limit
     */
    async getRequiredCollateralForVault(vaultId: AccountId): Promise<DOT> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const dotWrapper: BalanceWrapper = await customAPIRPC.vaultRegistry.getRequiredCollateralForVault(vaultId);
            return this.unwrapCurrency(dotWrapper) as DOT;
        } catch (e) {
            return Promise.reject((e as Error).message);
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

    private async getSecureCollateralThreshold(): Promise<Big> {
        const secureCollateralThresholdU128 = await this.api.query.vaultRegistry.secureCollateralThreshold();
        return new Big(secureCollateralThresholdU128.toString());
    }

    async getIssuablePolkaBTC(): Promise<string> {
        const totalLockedDotAsPlanck = await this.collateralAPI.totalLockedDOT();
        const totalLockedDot = new Big(planckToDOT(totalLockedDotAsPlanck.toString()));
        const oracle = new DefaultOracleAPI(this.api);
        const exchangeRate = await oracle.getExchangeRate();
        const exchangeRateU128 = new Big(exchangeRate);
        let secureCollateralThreshold = await this.getSecureCollateralThreshold();

        // scale by (PERCENTAGE_GRANULARITY + 2) to go from e.g. 200_000 to 2
        secureCollateralThreshold = secureCollateralThreshold.div(Math.pow(10, PERCENTAGE_GRANULARITY + 2));
        return totalLockedDot.div(exchangeRateU128).div(secureCollateralThreshold).toString();
    }

    async selectRandomVaultIssue(btc: PolkaBTC): Promise<AccountId> {
        const customAPIRPC = this.api.rpc as any;
        try {
            // eslint-disable-next-line max-len
            const firstVaultWithSufficientCollateral = await customAPIRPC.vaultRegistry.getFirstVaultWithSufficientCollateral(
                this.wrapCurrency(btc)
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
                this.wrapCurrency(btc)
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

    async getLiquidationCollateralThreshold(): Promise<u128> {
        return await this.api.query.vaultRegistry.liquidationCollateralThreshold();
    }

    async getPremiumRedeemThreshold(): Promise<u128> {
        return await this.api.query.vaultRegistry.premiumRedeemThreshold();
    }

    async getFees(_vaultId: AccountId): Promise<PolkaBTC> {
        // TODO: get real value from backend
        return this.api.createType("FixedU128", 368) as PolkaBTC;
    }

    async getAPY(vaultId: AccountId): Promise<string> {
        const fees = await this.getFees(vaultId);
        // TODO: convert from PolkaBTC to USD
        const feesInUSD = fees;

        const lockedDot = await this.collateralAPI.balanceLockedDOT(vaultId);
        // TODO convert from DOT to USD
        const lockedUsdValue = lockedDot;

        return feesInUSD.div(lockedUsdValue).toString();
    }

    async getSLA(_vaultId: AccountId): Promise<number> {
        // TODO: get real value from backend
        return 62;
    }

    async getMaxSLA(): Promise<number> {
        // TODO: get real value from backend
        return 99;
    }

    async getSlashableCollateral(_vaultId: AccountId, _amount: PolkaBTC): Promise<string> {
        // TODO: get real value from backend
        return "123";
    }

    private scaleUsingParachainGranularity(value: u128): number {
        return value.toNumber() / Math.pow(10, this.granularity);
    }

    private wrapCurrency(amount: Balance): BalanceWrapper {
        return {
            amount: this.api.createType("Text", amount.toString(10)),
        } as BalanceWrapper;
    }

    private unwrapCurrency(wrappedBalance: BalanceWrapper): Balance {
        return this.api.createType("Balance", wrappedBalance.amount.toString());
    }
}
