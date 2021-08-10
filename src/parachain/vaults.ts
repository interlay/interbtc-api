import { ApiPromise } from "@polkadot/api";
import { AccountId, H256, Balance, BlockNumber, BlockHash } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import BN from "bn.js";
import { Network } from "bitcoinjs-lib";
import {
    Bitcoin,
    BTCAmount,
    Polkadot,
    PolkadotUnit,
    MonetaryAmount,
    Currency,
    PolkadotAmount,
} from "@interlay/monetary-js";

import { Vault, IssueRequest, RedeemRequest, ReplaceRequest, BalanceWrapper } from "../interfaces/default";
import {
    FIXEDI128_SCALING_FACTOR,
    decodeFixedPointType,
    newMonetaryAmount,
    parseReplaceRequest,
    parseWallet,
    parseSystemVault,
} from "../utils";
import { TokensAPI, DefaultTokensAPI } from "./tokens";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import { DefaultIssueAPI, encodeIssueRequest } from "./issue";
import { encodeRedeemRequest } from "./redeem";
import {
    Issue,
    Redeem,
    CollateralUnit,
    tickerToCurrencyIdLiteral,
    ReplaceRequestExt,
    VaultExt,
    SystemVaultExt,
} from "../types";
import { DefaultPoolsAPI, PoolsAPI } from "./pools";

/**
 * @category InterBTC Bridge
 */
export interface VaultsAPI extends TransactionAPI {
    /**
     * @returns An array containing the vaults with non-zero backing collateral
     */
    list(atBlock?: BlockHash): Promise<VaultExt[]>;
    /**
     * Fetch the issue requests associated with a vault
     *
     * @param vaultId - The AccountId of the vault used to filter issue requests
     * @returns A map with issue ids to issue requests involving said vault
     */
    mapIssueRequests(vaultId: AccountId): Promise<Map<H256, Issue>>;
    /**
     * Fetch the redeem requests associated with a vault
     *
     * @param vaultId - The AccountId of the vault used to filter redeem requests
     * @returns A map with redeem ids to redeem requests involving said vault
     */
    mapRedeemRequests(vaultId: AccountId): Promise<Map<H256, Redeem>>;
    /**
     * Fetch the replace requests associated with a vault. In the returned requests,
     * the vault is either the replaced or the replacing one.
     *
     * @param vaultId - The AccountId of the vault used to filter replace requests
     * @returns A map with replace ids to replace requests involving said vault as new vault and old vault
     */
    mapReplaceRequests(vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>>;
    /**
     * @param vaultId The ID of the vault to fetch
     * @returns A vault object
     */
    get(vaultId: AccountId): Promise<VaultExt>;
    /**
     * Get the collateralization of a single vault measured by the amount of issued InterBTC
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
    getVaultCollateralization<C extends CollateralUnit>(
        vaultId: AccountId,
        newCollateral?: MonetaryAmount<Currency<C>, C>,
        onlyIssued?: boolean
    ): Promise<Big | undefined>;
    /**
     * Get the total system collateralization measured by the amount of issued InterBTC
     * divided by the total locked DOT collateral.
     *
     * @returns The total system collateralization
     */
    getSystemCollateralization(): Promise<Big | undefined>;
    /**
     * Get the amount of collateral required for the given vault to be at the
     * current SecureCollateralThreshold with the current exchange rate
     *
     * @param vaultId The vault account ID
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The required collateral the vault needs to deposit to stay
     * above the threshold limit
     */
    getRequiredCollateralForVault<C extends CollateralUnit>(
        vaultId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * Get the minimum amount of collateral required for the given amount of btc
     * with the current threshold and exchange rate
     *
     * @param amount Amount to issue, denominated in BTC
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The required collateral for issuing, denominated in DOT
     */
    getRequiredCollateralForWrapped<C extends CollateralUnit>(
        amount: BTCAmount,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param vaultId The vault account ID
     * @returns The amount of InterBTC issued by the given vault
     */
    getIssuedAmount(vaultId: AccountId): Promise<BTCAmount>;
    /**
     * @param vaultId The vault account ID
     * @returns The amount of InterBTC issuable by this vault
     */
    getIssuableAmount(vaultId: AccountId): Promise<BTCAmount>;
    /**
     * @returns The total amount of InterBTC issued by the vaults
     */
    getTotalIssuedAmount(): Promise<BTCAmount>;
    /**
     * @returns The total amount of InterBTC that can be issued, considering the DOT
     * locked by the vaults
     */
    getTotalIssuableAmount(): Promise<BTCAmount>;
    /**
     * @param amount InterBTC amount to issue
     * @returns A vault that has sufficient DOT collateral to issue the given InterBTC amount
     */
    selectRandomVaultIssue(amount: BTCAmount): Promise<AccountId>;
    /**
     * @param amount InterBTC amount to redeem
     * @returns A vault that has issued sufficient InterBTC to redeem the given InterBTC amount
     */
    selectRandomVaultRedeem(amount: BTCAmount): Promise<AccountId>;
    /**
     * @returns Vaults below the premium redeem threshold, sorted in descending order of their redeemable tokens
     */
    getPremiumRedeemVaults(): Promise<Map<AccountId, BTCAmount>>;
    /**
     * @returns Vaults with issuable tokens, sorted in descending order of this value
     */
    getVaultsWithIssuableTokens(): Promise<Map<AccountId, BTCAmount>>;
    /**
     * @returns Vaults with redeemable tokens, sorted in descending order of this value
     */
    getVaultsWithRedeemableTokens(): Promise<Map<AccountId, BTCAmount>>;
    /**
     * @param vaultId The vault account ID
     * @returns A bollean value
     */
    isVaultFlaggedForTheft(vaultId: AccountId): Promise<boolean>;
    /**
     * @returns The lower bound for the collateral rate in InterBTC.
     * If a Vault’s collateral rate
     * drops below this, automatic liquidation (forced Redeem) is triggered.
     */
    getLiquidationCollateralThreshold(): Promise<Big>;
    /**
     * @returns The collateral rate of Vaults at which users receive
     * a premium in DOT, allocated from the
     * Vault’s collateral, when performing a redeem with this Vault.
     */
    getPremiumRedeemThreshold(): Promise<Big>;
    /**
     * @returns The over-collateralization rate for DOT collateral locked
     * by Vaults, necessary for issuing InterBTC
     */
    getSecureCollateralThreshold(): Promise<Big>;
    /**
     * Get the total APY for a vault based on the income in InterBTC and DOT
     * divided by the locked DOT.
     *
     * @note this does not account for interest compounding
     *
     * @param vaultId the id of the vault
     * @returns the APY as a percentage string
     */
    getAPY(vaultId: AccountId): Promise<Big>;
    /**
     * @param vaultId The vault account ID
     * @returns The SLA score of the given vault, an integer in the range [0, MaxSLA]
     */
    getSLA(vaultId: AccountId): Promise<number>;
    /**
     * @returns The maximum SLA score, a positive integer
     */
    getMaxSLA(): Promise<number>;
    /**
     * @returns Fee that a Vault has to pay, as a percentage, if it fails to execute
     * redeem or replace requests (for redeem, on top of the slashed BTC-in-DOT
     * value of the request). The fee is paid in DOT based on the InterBTC
     * amount at the current exchange rate.
     */
    getPunishmentFee(): Promise<Big>;
    /**
     * @param amount The amount of collateral to withdraw
     */
    withdrawCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void>;
    /**
     * @param amount The amount of extra collateral to lock
     */
    depositCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void>;
    /**
     * @returns The account id of the liquidation vault
     */
    getLiquidationVaultId(): Promise<string>;
    /**
     * @returns A vault object representing the liquidation vault
     */
    getLiquidationVault(): Promise<SystemVaultExt>;
    /**
     * @param vaultId account id
     * @param currency The collateral currency specification, a `Monetary.js` object
     * @returns The collateral of a vault, taking slashes into account.
     */
    getCollateral<C extends CollateralUnit>(
        vaultId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @returns The maximum collateral a vault can accept as nomination, as a ratio of its own collateral
     */
    getMaxNominationRatio(): Promise<Big>;
    /**
     * @param vaultId account id
     * @param currency The collateral currency specification, a `Monetary.js` object
     * @returns Staking capacity, as a collateral currency (e.g. DOT)
     */
    getStakingCapacity<C extends CollateralUnit>(
        vaultId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param vaultId account id
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The entire collateral backing a vault's issued tokens.
     */
    getBackingCollateral<C extends CollateralUnit>(
        vaultId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
}

export class DefaultVaultsAPI extends DefaultTransactionAPI implements VaultsAPI {
    granularity = 5;
    private btcNetwork: Network;
    tokensAPI: TokensAPI;
    oracleAPI: OracleAPI;
    feeAPI: FeeAPI;
    poolsAPI: PoolsAPI;

    constructor(api: ApiPromise, btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.btcNetwork = btcNetwork;
        this.tokensAPI = new DefaultTokensAPI(api);
        this.oracleAPI = new DefaultOracleAPI(api);
        this.feeAPI = new DefaultFeeAPI(api);
        this.poolsAPI = new DefaultPoolsAPI(api, btcNetwork, electrsAPI);
    }

    async register(planckCollateral: BN, publicKey: string): Promise<void> {
        const tx = this.api.tx.vaultRegistry.registerVault(planckCollateral, publicKey);
        await this.sendLogged(tx, this.api.events.vaultRegistry.RegisterVault);
    }

    async withdrawCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountSmallDenomination = this.api.createType("Balance", amount.toString());
        // TODO: Add currency parameter when parachain adds it
        const tx = this.api.tx.vaultRegistry.withdrawCollateral(amountSmallDenomination);
        await this.sendLogged(tx, this.api.events.vaultRegistry.WithdrawCollateral);
    }

    async depositCollateral<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const tx = this.api.tx.vaultRegistry.depositCollateral(amountAsPlanck);
        await this.sendLogged(tx, this.api.events.vaultRegistry.DepositCollateral);
    }

    async list(atBlock?: BlockHash): Promise<VaultExt[]> {
        const block = atBlock || await this.api.rpc.chain.getFinalizedHead();
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entriesAt(block);
        return Promise.all(vaultsMap.map((v) => this.parseVault(v[1], this.btcNetwork)));
    }

    async mapIssueRequests(vaultId: AccountId): Promise<Map<H256, Issue>> {
        try {
            const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getVaultIssueRequests(vaultId);
            return new Map(issueRequestPairs.map(([id, req]) => [id, encodeIssueRequest(req, this.btcNetwork, id)]));
        } catch (err) {
            return Promise.reject(new Error(`Error during issue request retrieval: ${err}`));
        }
    }

    async mapRedeemRequests(vaultId: AccountId): Promise<Map<H256, Redeem>> {
        try {
            const redeemRequestPairs: [H256, RedeemRequest][] = await this.api.rpc.redeem.getVaultRedeemRequests(
                vaultId
            );
            return new Map(redeemRequestPairs.map(([id, req]) => [id, encodeRedeemRequest(req, this.btcNetwork, id)]));
        } catch (err) {
            return Promise.reject(new Error(`Error during redeem request retrieval: ${err}`));
        }
    }

    async mapReplaceRequests(vaultId: AccountId): Promise<Map<H256, ReplaceRequestExt>> {
        try {
            const oldVaultReplaceRequests: [H256, ReplaceRequest][] =
                await this.api.rpc.replace.getOldVaultReplaceRequests(vaultId);
            const oldVaultReplaceRequestsExt = oldVaultReplaceRequests.map(
                ([id, req]) => [id, parseReplaceRequest(req, this.btcNetwork)] as [H256, ReplaceRequestExt]
            );
            const newVaultReplaceRequests: [H256, ReplaceRequest][] =
                await this.api.rpc.replace.getNewVaultReplaceRequests(vaultId);
            const newVaultReplaceRequestsExt = newVaultReplaceRequests.map(
                ([id, req]) => [id, parseReplaceRequest(req, this.btcNetwork)] as [H256, ReplaceRequestExt]
            );
            return new Map([...oldVaultReplaceRequestsExt, ...newVaultReplaceRequestsExt]);
        } catch (err) {
            return Promise.reject(new Error(`Error during replace request retrieval: ${err}`));
        }
    }

    async get(vaultId: AccountId): Promise<VaultExt> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const vault = await this.api.query.vaultRegistry.vaults.at(head, vaultId);
        if (!vaultId.eq(vault.id)) {
            throw new Error(`No vault registered with id ${vaultId}`);
        }
        return this.parseVault(vault, this.btcNetwork);
    }

    async getCollateral<C extends CollateralUnit = PolkadotUnit>(
        vaultId: AccountId,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        return this.poolsAPI.computeCollateralInStakingPool(collateralCurrency, vaultId.toString(), vaultId.toString());
    }

    async getMaxNominationRatio(): Promise<Big> {
        const [premiumRedeemThreshold, secureCollateralThreshold] = await Promise.all([
            this.getPremiumRedeemThreshold(),
            this.getSecureCollateralThreshold(),
        ]);
        return secureCollateralThreshold.div(premiumRedeemThreshold);
    }

    async getBackingCollateral<C extends CollateralUnit>(
        vaultId: AccountId,
        currency: Currency<C>,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const currencyId = tickerToCurrencyIdLiteral(Bitcoin.ticker);
        if (nonce === undefined) {
            nonce = await this.poolsAPI.getStakingPoolNonce(currencyId, vaultId.toString());
        }
        const rawBackingCollateral = await this.api.query.staking.totalCurrentStake(currencyId, [nonce, vaultId]);
        return newMonetaryAmount(decodeFixedPointType(rawBackingCollateral), currency);
    }

    async getStakingCapacity<C extends CollateralUnit = PolkadotUnit>(
        vaultId: AccountId,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const [backingCollateral, collateral, maxNominationRatio] = await Promise.all([
            this.getBackingCollateral(vaultId, collateralCurrency),
            this.getCollateral(vaultId, collateralCurrency),
            this.getMaxNominationRatio(),
        ]);

        return collateral.mul(maxNominationRatio).sub(backingCollateral);
    }

    async getLiquidationVaultId(): Promise<string> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const liquidationVaultId = await this.api.query.vaultRegistry.liquidationVaultAccountId.at(head);
        return liquidationVaultId.toString();
    }

    async getLiquidationVault(): Promise<SystemVaultExt> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const liquidationVault = await this.api.query.vaultRegistry.liquidationVault.at(head);
        return parseSystemVault(liquidationVault);
    }

    private isNoTokensIssuedError(e: Error): boolean {
        return e.message.includes("NoTokensIssued");
    }

    async getVaultCollateralization<C extends CollateralUnit = PolkadotUnit>(
        vaultId: AccountId,
        newCollateral?: MonetaryAmount<Currency<C>, C>,
        onlyIssued = false
    ): Promise<Big | undefined> {
        let collateralization = undefined;
        try {
            if (newCollateral) {
                const newCollateralPlanck = this.api.createType("Balance", newCollateral.toString());
                collateralization = await this.api.rpc.vaultRegistry.getCollateralizationFromVaultAndCollateral(
                    vaultId,
                    this.wrapCurrency(newCollateralPlanck),
                    onlyIssued
                );
            } else {
                collateralization = await this.api.rpc.vaultRegistry.getCollateralizationFromVault(vaultId, onlyIssued);
            }
        } catch (e) {
            if (this.isNoTokensIssuedError(e)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error(`Error during collateralization computation: ${(e as Error).message}`));
        }
        if (!collateralization) {
            return Promise.resolve(undefined);
        }
        return decodeFixedPointType(collateralization);
    }

    async getSystemCollateralization(): Promise<Big | undefined> {
        try {
            const collateralization = await this.api.rpc.vaultRegistry.getTotalCollateralization();
            return decodeFixedPointType(collateralization);
        } catch (e) {
            if (this.isNoTokensIssuedError(e)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error("Error during collateralization computation"));
        }
    }

    async getRequiredCollateralForVault<C extends CollateralUnit = PolkadotUnit>(
        vaultId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        try {
            const amountWrapper: BalanceWrapper = await this.api.rpc.vaultRegistry.getRequiredCollateralForVault(
                vaultId
            );
            const amountUnwrapped = this.unwrapCurrency(amountWrapper);
            return newMonetaryAmount(amountUnwrapped.toString(), currency);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async getRequiredCollateralForWrapped<C extends CollateralUnit = PolkadotUnit>(
        amount: BTCAmount,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        try {
            const wrapped = this.api.createType("BalanceWrapper", amount.str.Satoshi());
            const amountWrapper: BalanceWrapper = await this.api.rpc.vaultRegistry.getRequiredCollateralForWrapped(
                wrapped
            );
            const amountUnwrapped = this.unwrapCurrency(amountWrapper);
            return newMonetaryAmount(amountUnwrapped.toString(), currency);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async getIssuedAmount(vaultId: AccountId): Promise<BTCAmount> {
        const vault = await this.get(vaultId);
        return vault.issuedTokens;
    }

    async getIssuableAmount(vaultId: AccountId): Promise<BTCAmount> {
        const [vault, backingCollateral] = await Promise.all([
            this.get(vaultId),
            this.getBackingCollateral(vaultId, Polkadot),
        ]);
        const interBtcCapacity = await this.calculateCapacity(backingCollateral);
        const issuedAmountBtc = vault.issuedTokens.add(vault.toBeIssuedTokens);
        const issuableAmountExcludingFees = interBtcCapacity.sub(issuedAmountBtc);
        const issueAPI = new DefaultIssueAPI(this.api, this.btcNetwork, this.electrsAPI);
        const fees = await issueAPI.getFeesToPay(issuableAmountExcludingFees);
        return issuableAmountExcludingFees.sub(fees);
    }

    async getTotalIssuedAmount(): Promise<BTCAmount> {
        const issuedTokens = await this.tokensAPI.total(Bitcoin);
        return issuedTokens;
    }

    async getTotalIssuableAmount(): Promise<BTCAmount> {
        // TODO: Can generalize to multiple collateral tokens
        const totalLockedDot = await this.tokensAPI.total(Polkadot);
        const [interBtcCapacity, issuedAmountBtc] = await Promise.all([
            this.calculateCapacity(totalLockedDot),
            this.getTotalIssuedAmount(),
        ]);
        return interBtcCapacity.sub(issuedAmountBtc);
    }

    private async calculateCapacity<C extends CollateralUnit = PolkadotUnit>(
        collateral: MonetaryAmount<Currency<C>, C>
    ): Promise<BTCAmount> {
        const oracle = new DefaultOracleAPI(this.api);
        const [exchangeRate, secureCollateralThreshold] = await Promise.all([
            oracle.getExchangeRate(collateral.currency),
            this.getSecureCollateralThreshold(),
        ]);
        const unusedCollateral = collateral.div(secureCollateralThreshold);
        return exchangeRate.toBase(unusedCollateral);
    }

    async selectRandomVaultIssue(amount: BTCAmount): Promise<AccountId> {
        try {
            const amountSat = this.api.createType("Balance", amount.toString());
            // eslint-disable-next-line max-len
            const firstVaultWithSufficientCollateral =
                await this.api.rpc.vaultRegistry.getFirstVaultWithSufficientCollateral(this.wrapCurrency(amountSat));
            return firstVaultWithSufficientCollateral;
        } catch (e) {
            return Promise.reject(new Error("Did not find vault with sufficient collateral"));
        }
    }

    async selectRandomVaultRedeem(amount: BTCAmount): Promise<AccountId> {
        const amountSat = this.api.createType("Balance", amount.toString());
        try {
            const firstVaultWithSufficientTokens = await this.api.rpc.vaultRegistry.getFirstVaultWithSufficientTokens(
                this.wrapCurrency(amountSat)
            );
            return firstVaultWithSufficientTokens;
        } catch (e) {
            return Promise.reject(new Error("Did not find vault with sufficient locked BTC"));
        }
    }

    async getPremiumRedeemVaults(): Promise<Map<AccountId, BTCAmount>> {
        try {
            const vaults = await this.api.rpc.vaultRegistry.getPremiumRedeemVaults();
            return new Map(
                vaults.map(([id, redeemableTokens]) => [
                    id,
                    BTCAmount.from.Satoshi(this.unwrapCurrency(redeemableTokens).toString()),
                ])
            );
        } catch (e) {
            return Promise.reject(new Error("Did not find vault below the premium redeem threshold"));
        }
    }

    async getVaultsWithIssuableTokens(): Promise<Map<AccountId, BTCAmount>> {
        const vaults = await this.api.rpc.vaultRegistry.getVaultsWithIssuableTokens();
        return new Map(
            vaults.map(([id, issuableTokens]) => [
                id,
                BTCAmount.from.Satoshi(this.unwrapCurrency(issuableTokens).toString()),
            ])
        );
    }

    async getVaultsWithRedeemableTokens(): Promise<Map<AccountId, BTCAmount>> {
        const vaults = await this.api.rpc.vaultRegistry.getVaultsWithRedeemableTokens();
        return new Map(
            vaults.map(([id, redeemableTokens]) => [
                id,
                BTCAmount.from.Satoshi(this.unwrapCurrency(redeemableTokens).toString()),
            ])
        );
    }

    async isVaultFlaggedForTheft(vaultId: AccountId): Promise<boolean> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const theftReports = await this.api.query.relay.theftReports.at(head, vaultId);
        return theftReports.isEmpty;
    }

    async getLiquidationCollateralThreshold(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const threshold = await this.api.query.vaultRegistry.liquidationCollateralThreshold.at(head);
        return decodeFixedPointType(threshold);
    }

    async getPremiumRedeemThreshold(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const threshold = await this.api.query.vaultRegistry.premiumRedeemThreshold.at(head);
        return decodeFixedPointType(threshold);
    }

    async getSecureCollateralThreshold(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold.at(head);
        return decodeFixedPointType(threshold);
    }

    async getAPY(vaultId: AccountId): Promise<Big> {
        // TODO: Fetch data for all collateral currencies
        const [feesWrapped, lockedCollateral] = await Promise.all([
            await this.poolsAPI.getFeesWrapped(vaultId.toString(), Polkadot),
            await this.tokensAPI.balanceLocked(Polkadot, vaultId),
        ]);
        return this.feeAPI.calculateAPY(feesWrapped, lockedCollateral);
    }

    async getSLA(vaultId: AccountId): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const sla = await this.api.query.sla.vaultSla.at(head, vaultId);
        return decodeFixedPointType(sla).toNumber();
    }

    async getMaxSLA(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const maxSLA = await this.api.query.sla.vaultTargetSla.at(head);
        const maxSlaBig = new Big(maxSLA.toString());
        const divisor = new Big(Math.pow(10, FIXEDI128_SCALING_FACTOR));
        return maxSlaBig.div(divisor).toNumber();
    }

    /**
     * @returns Fee that a Vault has to pay if it fails to execute redeem or replace requests
     * (for redeem, on top of the slashed BTC-in-DOT value of the request). The fee is
     * paid in DOT based on the InterBTC amount at the current exchange rate.
     */
    async getPunishmentFee(): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fee = await this.api.query.fee.punishmentFee.at(head);
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

    async parseVault(vault: Vault, network: Network): Promise<VaultExt> {
        const backingCollateral = await this.getBackingCollateral(vault.id, Polkadot);
        return {
            wallet: parseWallet(vault.wallet, network),
            backingCollateral,
            id: vault.id,
            status: vault.status,
            bannedUntil: vault.banned_until.isSome ? (vault.banned_until.value as BlockNumber).toNumber() : undefined,
            toBeIssuedTokens: BTCAmount.from.Satoshi(vault.to_be_issued_tokens.toString()),
            issuedTokens: BTCAmount.from.Satoshi(vault.issued_tokens.toString()),
            toBeRedeemedTokens: BTCAmount.from.Satoshi(vault.to_be_redeemed_tokens.toString()),
            toBeReplacedTokens: BTCAmount.from.Satoshi(vault.to_be_replaced_tokens.toString()),
            replaceCollateral: PolkadotAmount.from.Planck(vault.replace_collateral.toString()),
            liquidatedCollateral: PolkadotAmount.from.Planck(vault.liquidated_collateral.toString()),
        };
    }
}
