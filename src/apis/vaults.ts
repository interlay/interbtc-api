import { PolkaBTC, Vault, IssueRequest, RedeemRequest, ReplaceRequest, DOT, Wallet } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AccountId, H256, Balance } from "@polkadot/types/interfaces";
import {
    calculateAPY,
    FIXEDI128_SCALING_FACTOR,
    pagedIterator,
    planckToDOT,
    decodeFixedPointType,
    encodeBtcAddress,
} from "../utils";
import { BalanceWrapper } from "../interfaces/default";
import { CollateralAPI, DefaultCollateralAPI } from "./collateral";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import Big from "big.js";
import { IssueRequestExt, encodeIssueRequest } from "./issue";
import { RedeemRequestExt, encodeRedeemRequest } from "./redeem";
import { ReplaceRequestExt, encodeReplaceRequest } from "./replace";
import { Network } from "bitcoinjs-lib";

export interface WalletExt {
    // network encoded btc addresses
    addresses: Array<string>;
}

export interface VaultExt extends Omit<Vault, "wallet"> {
    wallet: WalletExt;
}

function encodeWallet(wallet: Wallet, network: Network): WalletExt {
    const { addresses } = wallet;

    const btcAddresses: Array<string> = [];
    for (const value of addresses.values()) {
        btcAddresses.push(encodeBtcAddress(value, network));
    }

    return {
        addresses: btcAddresses,
    };
}

export function encodeVault(vault: Vault, network: Network): VaultExt {
    const { wallet, ...obj } = vault;
    return Object.assign(
        {
            wallet: encodeWallet(wallet, network),
        },
        obj
    ) as VaultExt;
}

export interface VaultsAPI {
    list(): Promise<VaultExt[]>;
    listPaged(): Promise<VaultExt[]>;
    mapIssueRequests(vaultId: AccountId): Promise<Map<H256, IssueRequestExt>>;
    mapRedeemRequests(vaultId: AccountId): Promise<Map<H256, RedeemRequestExt>>;
    mapReplaceRequests(vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>>;
    getPagedIterator(perPage: number): AsyncGenerator<Vault[]>;
    get(vaultId: AccountId): Promise<VaultExt>;
    getVaultCollateralization(vaultId: AccountId, newCollateral?: DOT, onlyIssued?: boolean): Promise<Big | undefined>;
    getSystemCollateralization(): Promise<Big | undefined>;
    getRequiredCollateralForVault(vaultId: AccountId): Promise<DOT>;
    getIssuedPolkaBTCAmount(vaultId: AccountId): Promise<PolkaBTC>;
    getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC>;
    selectRandomVaultIssue(btc: PolkaBTC): Promise<AccountId>;
    selectRandomVaultRedeem(btc: PolkaBTC): Promise<AccountId>;
    getIssuablePolkaBTC(): Promise<string>;
    getLiquidationCollateralThreshold(): Promise<Big>;
    getPremiumRedeemThreshold(): Promise<Big>;
    getAuctionCollateralThreshold(): Promise<Big>;
    getSecureCollateralThreshold(): Promise<Big>;
    getFeesPolkaBTC(vaultId: string): Promise<string>;
    getFeesDOT(vaultId: string): Promise<string>;
    getAPY(vaultId: string): Promise<string>;
    getSLA(vaultId: string): Promise<string>;
    getMaxSLA(): Promise<string>;
    getSlashableCollateral(vaultId: string, amount: string): Promise<string>;
    getPunishmentFee(): Promise<string>;
}

export class DefaultVaultsAPI {
    granularity = 5;
    private btcNetwork: Network;
    collateralAPI: CollateralAPI;
    oracleAPI: OracleAPI;

    constructor(private api: ApiPromise, btcNetwork: Network) {
        this.btcNetwork = btcNetwork;
        this.collateralAPI = new DefaultCollateralAPI(this.api);
        this.oracleAPI = new DefaultOracleAPI(this.api);
    }

    /**
     * @returns An array containing the vaults
     */
    async list(): Promise<VaultExt[]> {
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entries();
        return vaultsMap.map((v) => encodeVault(v[1], this.btcNetwork));
    }

    /**
     * This function is not finalized
     *
     * @returns An array containing the vaults, paged. This function is meant to be used as an
     * iterator
     */
    async listPaged(): Promise<VaultExt[]> {
        // TODO: Finish or remove this function
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entriesPaged({ pageSize: 1 });
        return vaultsMap.map((v) => encodeVault(v[1], this.btcNetwork));
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

    /**
     * @param perPage Number of vaults to iterate through at a time
     * @returns An AsyncGenerator to be used as an iterator
     */
    getPagedIterator(perPage: number): AsyncGenerator<Vault[]> {
        return pagedIterator<Vault>(this.api.query.vaultRegistry.vaults, perPage);
    }

    /**
     * @param vaultId The ID of the vault to fetch
     * @returns A vault object
     */
    async get(vaultId: AccountId): Promise<VaultExt> {
        const vault = await this.api.query.vaultRegistry.vaults(vaultId);
        if (!vaultId.eq(vault.id)) {
            throw new Error(`No vault registered with id ${vaultId}`);
        }
        return encodeVault(vault, this.btcNetwork);
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
    ): Promise<Big | undefined> {
        const customAPIRPC = this.api.rpc as any;
        let collateralization = undefined;
        try {
            collateralization = newCollateral
                ? await customAPIRPC.vaultRegistry.getCollateralizationFromVaultAndCollateral(
                    vaultId,
                    this.wrapCurrency(newCollateral),
                    onlyIssued
                )
                : await customAPIRPC.vaultRegistry.getCollateralizationFromVault(vaultId, onlyIssued);
        } catch (e) {
            if (this.isNoTokensIssuedError(e)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(`Error during collateralization computation: ${(e as Error).message}`);
        }
        if (!collateralization) {
            return Promise.resolve(undefined);
        }
        return new Big(decodeFixedPointType(collateralization));
    }

    /**
     * Get the total system collateralization measured by the amount of issued PolkaBTC
     * divided by the total locked DOT collateral.
     *
     * @returns The total system collateralization
     */
    async getSystemCollateralization(): Promise<Big | undefined> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const collateralization = await customAPIRPC.vaultRegistry.getTotalCollateralization();
            return new Big(decodeFixedPointType(collateralization));
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
     * @param vaultId The vault account ID
     * @returns The required collateral the vault needs to deposit to stay
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

    /**
     * @param vaultId The vault account ID
     * @returns The amount of PolkaBTC issued by the given vault, denoted in Satoshi
     */
    async getIssuedPolkaBTCAmount(vaultId: AccountId): Promise<PolkaBTC> {
        const vault: VaultExt = await this.get(vaultId);
        return vault.issued_tokens;
    }

    private async getIssuedPolkaBTCAmounts(): Promise<PolkaBTC[]> {
        const vaults: VaultExt[] = await this.list();
        const issuedTokens: PolkaBTC[] = vaults.map((v) => v.issued_tokens);
        return issuedTokens;
    }

    /**
     * @returns The total amount of PolkaBTC issued by the vaults, denoted in Satoshi
     */
    async getTotalIssuedPolkaBTCAmount(): Promise<PolkaBTC> {
        const issuedTokens: PolkaBTC[] = await this.getIssuedPolkaBTCAmounts();
        if (issuedTokens.length) {
            const sumReducer = (accumulator: PolkaBTC, currentValue: PolkaBTC) =>
                accumulator.add(currentValue) as PolkaBTC;
            return issuedTokens.reduce(sumReducer);
        }
        return this.api.createType("Balance", 0) as PolkaBTC;
    }

    /**
     * @returns The total amount of PolkaBTC that can be issued, considering the DOT
     * locked by the vaults
     */
    async getIssuablePolkaBTC(): Promise<string> {
        const totalLockedDotAsPlanck = await this.collateralAPI.totalLockedDOT();
        const totalLockedDot = new Big(planckToDOT(totalLockedDotAsPlanck.toString()));
        const oracle = new DefaultOracleAPI(this.api);
        const exchangeRate = await oracle.getExchangeRate();
        const exchangeRateU128 = new Big(exchangeRate);
        const secureCollateralThreshold = await this.getSecureCollateralThreshold();
        return totalLockedDot.div(exchangeRateU128).div(secureCollateralThreshold).toString();
    }

    /**
     * @param amountAsSat PolkaBTC amount to issue, denoted in Satoshi
     * @returns A vault that has sufficient DOT collateral to issue the given PolkaBTC amount
     */
    async selectRandomVaultIssue(amountAsSat: PolkaBTC): Promise<AccountId> {
        const customAPIRPC = this.api.rpc as any;
        try {
            // eslint-disable-next-line max-len
            const firstVaultWithSufficientCollateral = await customAPIRPC.vaultRegistry.getFirstVaultWithSufficientCollateral(
                this.wrapCurrency(amountAsSat)
            );
            return firstVaultWithSufficientCollateral;
        } catch (e) {
            return Promise.reject("Did not find vault with sufficient collateral");
        }
    }

    /**
     * @param amountAsSat PolkaBTC amount to redeem, denoted in Satoshi
     * @returns A vault that has issued sufficient PolkaBTC to redeem the given PolkaBTC amount
     */
    async selectRandomVaultRedeem(amountAsSat: PolkaBTC): Promise<AccountId> {
        const customAPIRPC = this.api.rpc as any;
        try {
            const firstVaultWithSufficientTokens = await customAPIRPC.vaultRegistry.getFirstVaultWithSufficientTokens(
                this.wrapCurrency(amountAsSat)
            );
            return firstVaultWithSufficientTokens;
        } catch (e) {
            return Promise.reject("Did not find vault with sufficient locked BTC");
        }
    }

    /**
     * @param vaultId The vault account ID
     * @returns A bollean value
     */
    async isVaultFlaggedForTheft(vaultId: AccountId): Promise<boolean> {
        const theftReports = await this.api.query.stakedRelayers.theftReports(vaultId);
        return theftReports.isEmpty;
    }

    /**
     * @returns The lower bound for the collateral rate in PolkaBTC.
     * If a Vault’s collateral rate
     * drops below this, automatic liquidation (forced Redeem) is triggered.
     */
    async getLiquidationCollateralThreshold(): Promise<Big> {
        const threshold = await this.api.query.vaultRegistry.liquidationCollateralThreshold();
        return new Big(decodeFixedPointType(threshold));
    }

    /**
     * @returns The collateral rate of Vaults at which users receive
     * a premium in DOT, allocated from the
     * Vault’s collateral, when performing a redeem with this Vault.
     */
    async getPremiumRedeemThreshold(): Promise<Big> {
        const threshold = await this.api.query.vaultRegistry.premiumRedeemThreshold();
        return new Big(decodeFixedPointType(threshold));
    }

    /**
     * @returns The collateral rate of Vaults at which the
     * BTC backed by the Vault are opened up for auction to other Vaults
     */
    async getAuctionCollateralThreshold(): Promise<Big> {
        const threshold = await this.api.query.vaultRegistry.auctionCollateralThreshold();
        return new Big(decodeFixedPointType(threshold));
    }

    /**
     * @returns The over-collateralization rate for DOT collateral locked
     * by Vaults, necessary for issuing PolkaBTC
     */
    async getSecureCollateralThreshold(): Promise<Big> {
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold();
        return new Big(decodeFixedPointType(threshold));
    }

    /**
     * @param vaultId The vault account ID
     * @returns The total PolkaBTC reward collected by the vault, denoted in Satoshi
     */
    async getFeesPolkaBTC(vaultId: string): Promise<string> {
        const parsedId = this.api.createType("AccountId", vaultId);
        return (await this.api.query.fee.totalRewardsPolkaBTC(parsedId)).toString();
    }

    /**
     * @param vaultId The vault account ID
     * @returns The total DOT reward collected by the vault, denoted in Planck
     */
    async getFeesDOT(vaultId: string): Promise<string> {
        const parsedId = this.api.createType("AccountId", vaultId);
        return (await this.api.query.fee.totalRewardsDOT(parsedId)).toString();
    }

    /**
     * Get the total APY for a vault based on the income in PolkaBTC and DOT
     * divided by the locked DOT.
     *
     * @note this does not account for interest compounding
     *
     * @param vaultId the id of the vault
     * @returns the APY as a percentage string
     */
    async getAPY(vaultId: string): Promise<string> {
        const parsedVaultId = this.api.createType("AccountId", vaultId);
        const [feesPolkaBTC, feesDOT, dotToBtcRate, lockedDOT] = await Promise.all([
            await this.getFeesPolkaBTC(vaultId),
            await this.getFeesDOT(vaultId),
            await this.oracleAPI.getExchangeRate(),
            await (await this.collateralAPI.balanceLockedDOT(parsedVaultId)).toString(),
        ]);
        return calculateAPY(feesPolkaBTC, feesDOT, lockedDOT, dotToBtcRate);
    }

    /**
     * @param vaultId The vault account ID
     * @returns The SLA score of the given vault, an integer in the range [0, MaxSLA]
     */
    async getSLA(vaultId: string): Promise<string> {
        const parsedId = this.api.createType("AccountId", vaultId);
        const sla = await this.api.query.sla.vaultSla(parsedId);
        return decodeFixedPointType(sla);
    }

    /**
     * @returns The maximum SLA score, a positive integer
     */
    async getMaxSLA(): Promise<string> {
        const maxSLA = await this.api.query.sla.relayerTargetSla();
        const maxSlaBig = new Big(maxSLA.toString());
        const divisor = new Big(Math.pow(10, FIXEDI128_SCALING_FACTOR));
        return maxSlaBig.div(divisor).toString();
    }

    async getSlashableCollateral(_vaultId: string, _amount: string): Promise<string> {
        // TODO: get real value from backend
        return "123";
    }

    /**
     * @returns Fee that a Vault has to pay if it fails to execute redeem or replace requests
     * (for redeem, on top of the slashed BTC-in-DOT value of the request). The fee is
     * paid in DOT based on the PolkaBTC amount at the current exchange rate.
     */
    async getPunishmentFee(): Promise<string> {
        const fee = await this.api.query.fee.punishmentFee();
        return decodeFixedPointType(fee);
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
