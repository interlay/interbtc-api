import { ApiPromise } from "@polkadot/api";
import { AccountId, H256, Balance, BlockNumber, BlockHash } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import { BTCAmount, Polkadot, MonetaryAmount, Currency, Kusama } from "@interlay/monetary-js";

import { Bytes } from "@polkadot/types";
import {
    Vault,
    IssueRequest,
    RedeemRequest,
    ReplaceRequest,
    BalanceWrapper,
    VaultStatus,
    DefaultVault,
    UnsignedFixedPoint,
} from "../interfaces/default";
import {
    decodeFixedPointType,
    newMonetaryAmount,
    parseReplaceRequest,
    parseWallet,
    parseSystemVault,
    newAccountId,
    getTxProof,
    parseIssueRequest,
    parseRedeemRequest,
} from "../utils";
import { TokensAPI, DefaultTokensAPI } from "./tokens";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import { DefaultIssueAPI } from "./issue";
import {
    Issue,
    Redeem,
    CollateralUnit,
    tickerToCurrencyIdLiteral,
    ReplaceRequestExt,
    VaultExt,
    SystemVaultExt,
    VaultStatusExt,
    WrappedCurrency,
    currencyIdToMonetaryCurrency,
    WRAPPED_CURRENCIES,
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
     * @param wrappedCurrency Currency denoting the wrapped token (e.g. InterBTC or KBTC).
     * @returns The amount of InterBTC issuable by this vault
     */
    getIssuableAmount(vaultId: AccountId, wrappedCurrency: WrappedCurrency): Promise<BTCAmount>;
    /**
     * @param wrappedCurrency Currency denoting the wrapped token (e.g. InterBTC or KBTC).
     * @returns The total amount of InterBTC issued by the vaults
     */
    getTotalIssuedAmount(wrappedCurrency: WrappedCurrency): Promise<BTCAmount>;
    /**
     * @param wrappedCurrency Currency denoting the wrapped token (e.g. InterBTC or KBTC).
     * @returns The total amount of InterBTC that can be issued, considering the DOT
     * locked by the vaults
     */
    getTotalIssuableAmount(wrappedCurrency: WrappedCurrency): Promise<BTCAmount>;
    /**
     * @param amount InterBTC amount to issue
     * @param wrappedCurrency Currency denoting the wrapped token (e.g. InterBTC or KBTC).
     * @returns A vault that has sufficient DOT collateral to issue the given InterBTC amount
     */
    selectRandomVaultIssue(amount: BTCAmount, wrappedCurrency: WrappedCurrency): Promise<AccountId>;
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
     * @param collateralCurrency
     * @returns The lower bound for the collateral rate in InterBTC.
     * If a Vault’s collateral rate
     * drops below this, automatic liquidation (forced Redeem) is triggered.
     */
    getLiquidationCollateralThreshold<C extends CollateralUnit>(collateralCurrency: Currency<C>): Promise<Big>;
    /**
     * @param collateralCurrency
     * @returns The collateral rate of Vaults at which users receive
     * a premium in DOT, allocated from the
     * Vault’s collateral, when performing a redeem with this Vault.
     */
    getPremiumRedeemThreshold<C extends CollateralUnit>(collateralCurrency: Currency<C>): Promise<Big>;
    /**
     * @param collateralCurrency
     * @returns The over-collateralization rate for DOT collateral locked
     * by Vaults, necessary for issuing InterBTC
     */
    getSecureCollateralThreshold<C extends CollateralUnit>(collateralCurrency: Currency<C>): Promise<Big>;
    /**
     * Get the total APY for a vault based on the income in InterBTC and DOT
     * divided by the locked DOT.
     *
     * @note this does not account for interest compounding
     *
     * @param vaultId the id of the vault
     * @param wrappedCurrency Currency denoting the wrapped token (e.g. InterBTC or KBTC).
     * @returns the APY as a percentage string
     */
    getAPY(vaultId: AccountId, wrappedCurrency: WrappedCurrency): Promise<Big>;
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
     * @param wrappedCurrency The wrapped collateral currency specification, a `Monetary.js` object
     * @returns The collateral of a vault, taking slashes into account.
     */
    getCollateral(
        vaultId: AccountId,
        wrappedCurrency: WrappedCurrency
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * @param collateralCurrency The collateral currency specification, a `Monetary.js` object
     * @returns The maximum collateral a vault can accept as nomination, as a ratio of its own collateral
     */
    getMaxNominationRatio(collateralCurrency: Currency<CollateralUnit>): Promise<Big>;
    /**
     * @param vaultId account id
     * @param wrappedCurrency The wrapped collateral currency specification, a `Monetary.js` object
     * @returns Staking capacity, as a collateral currency (e.g. DOT)
     */
    getStakingCapacity(
        vaultId: AccountId,
        wrappedCurrency: WrappedCurrency
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * @param wrappedCurrency The wrapped currency specification, a `Monetary.js` object, to compute backing collateral for
     * @param collateralCurrency The collateral currency specification, a `Monetary.js` object
     * @param vaultId account id
     * @param nonce Nonce of the staking pool
     * @returns The entire collateral backing a vault's issued tokens.
     */
    computeBackingCollateral(
        wrappedCurrency: WrappedCurrency,
        collateralCurrency: Currency<CollateralUnit>,
        vaultId: AccountId,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * A relayer may report Vault misbehavior by providing a fraud proof
     * (malicious Bitcoin transaction and transaction inclusion proof).
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
     *
     * @param vault_id The account of the vault to check.
     * @param tx_id The hash of the transaction
     * @param merkle_proof The proof of tx inclusion.
     * @param raw_tx The raw Bitcoin transaction.
     */
    reportVaultTheft(vaultId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void>;
}

export class DefaultVaultsAPI extends DefaultTransactionAPI implements VaultsAPI {
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

    async register<C extends CollateralUnit>(amount: MonetaryAmount<Currency<C>, C>, publicKey: string): Promise<void> {
        const currencyIdLiteral = tickerToCurrencyIdLiteral(amount.currency.ticker);
        const amountSmallDenomination = this.api.createType("Balance", amount.toString());
        const tx = this.api.tx.vaultRegistry.registerVault(amountSmallDenomination, publicKey, currencyIdLiteral);
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
        const block = atBlock || (await this.api.rpc.chain.getFinalizedHead());
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entriesAt(block);
        return Promise.all(
            vaultsMap
                .filter((v) => v[1].isSome)
                .map((v) => this.parseVault(v[1].value as DefaultVault, this.btcNetwork))
        );
    }

    async mapIssueRequests(vaultId: AccountId): Promise<Map<H256, Issue>> {
        try {
            const issueRequestPairs: [H256, IssueRequest][] = await this.api.rpc.issue.getVaultIssueRequests(vaultId);
            return new Map(issueRequestPairs.map(([id, req]) => [id, parseIssueRequest(req, this.btcNetwork, id)]));
        } catch (err) {
            return Promise.reject(new Error(`Error during issue request retrieval: ${err}`));
        }
    }

    async mapRedeemRequests(vaultId: AccountId): Promise<Map<H256, Redeem>> {
        try {
            const redeemRequestPairs: [H256, RedeemRequest][] = await this.api.rpc.redeem.getVaultRedeemRequests(
                vaultId
            );
            return new Map(redeemRequestPairs.map(([id, req]) => [id, parseRedeemRequest(req, this.btcNetwork, id)]));
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
        if (!vault.isSome) {
            Promise.reject(`No vault registered with id ${vaultId}`);
        }
        return this.parseVault(vault.value as DefaultVault, this.btcNetwork);
    }

    async getCollateral(
        vaultId: AccountId,
        wrappedCurrency: WrappedCurrency
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        return this.poolsAPI.computeCollateralInStakingPool(wrappedCurrency, vaultId.toString(), vaultId.toString());
    }

    async getMaxNominationRatio(collateralCurrency: Currency<CollateralUnit>): Promise<Big> {
        const [premiumRedeemThreshold, secureCollateralThreshold] = await Promise.all([
            this.getPremiumRedeemThreshold(collateralCurrency),
            this.getSecureCollateralThreshold(collateralCurrency),
        ]);
        return secureCollateralThreshold.div(premiumRedeemThreshold);
    }

    async computeBackingCollateral(
        wrappedCurrency: WrappedCurrency,
        collateralCurrency: Currency<CollateralUnit>,
        vaultId: AccountId,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const currencyId = tickerToCurrencyIdLiteral(wrappedCurrency.ticker);
        if (nonce === undefined) {
            nonce = await this.poolsAPI.getStakingPoolNonce(currencyId, vaultId.toString());
        }
        const rawBackingCollateral = await this.api.query.staking.totalCurrentStake(currencyId, [nonce, vaultId]);
        return newMonetaryAmount(decodeFixedPointType(rawBackingCollateral), collateralCurrency);
    }

    static getBackingCollateral(
        wrappedCurrency: WrappedCurrency,
        vault: VaultExt
    ): MonetaryAmount<Currency<CollateralUnit>, CollateralUnit> {
        const backingCollateralForWrapped = vault.backingCollateral.get(wrappedCurrency);
        if (backingCollateralForWrapped === undefined) {
            throw new Error("No backing collateral for given wrapped currency");
        }
        return backingCollateralForWrapped;
    }

    async getStakingCapacity(
        vaultId: AccountId,
        wrappedCurrency: WrappedCurrency
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const vault = await this.get(vaultId);
        const backingCollateral = DefaultVaultsAPI.getBackingCollateral(wrappedCurrency, vault);

        const [collateral, maxNominationRatio] = await Promise.all([
            this.getCollateral(vaultId, wrappedCurrency),
            this.getMaxNominationRatio(vault.collateralCurrency),
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
        return e.message !== undefined && e.message.includes("NoTokensIssued");
    }

    async getVaultCollateralization<C extends CollateralUnit>(
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
            if (this.isNoTokensIssuedError(e as Error)) {
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
            if (this.isNoTokensIssuedError(e as Error)) {
                return Promise.resolve(undefined);
            }
            return Promise.reject(new Error("Error during collateralization computation"));
        }
    }

    async getRequiredCollateralForVault<C extends CollateralUnit>(
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

    async getRequiredCollateralForWrapped<C extends CollateralUnit>(
        amount: BTCAmount,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        try {
            const wrapped = this.api.createType("BalanceWrapper", amount.str.Satoshi());
            const currencyIdLiteral = tickerToCurrencyIdLiteral(amount.currency.ticker);
            const amountWrapper: BalanceWrapper = await this.api.rpc.vaultRegistry.getRequiredCollateralForWrapped(
                wrapped,
                currencyIdLiteral
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

    async getIssuableAmount(vaultId: AccountId, wrappedCurrency: WrappedCurrency): Promise<BTCAmount> {
        const vault = await this.get(vaultId);
        const backingCollateralForWrapped = DefaultVaultsAPI.getBackingCollateral(wrappedCurrency, vault);
        const interBtcCapacity = await this.calculateCapacity(backingCollateralForWrapped);
        const issuedAmountBtc = vault.issuedTokens.add(vault.toBeIssuedTokens);
        const issuableAmountExcludingFees = interBtcCapacity.sub(issuedAmountBtc);
        const issueAPI = new DefaultIssueAPI(this.api, this.btcNetwork, this.electrsAPI);
        const fees = await issueAPI.getFeesToPay(issuableAmountExcludingFees);
        return issuableAmountExcludingFees.sub(fees);
    }

    async getTotalIssuedAmount(wrappedCurrency: WrappedCurrency): Promise<BTCAmount> {
        const issuedTokens = await this.tokensAPI.total(wrappedCurrency);
        return issuedTokens;
    }

    async getTotalIssuableAmount(wrappedCurrency: WrappedCurrency): Promise<BTCAmount> {
        // TODO: Can this be generalized by iterating over `COLLATERAL_CURRENCIES`?

        const [totalLockedDot, totalLockedKsm] = await Promise.all([
            this.tokensAPI.total(Polkadot),
            this.tokensAPI.total(Kusama),
        ]);
        const [interBtcCapacityFromDot, interBtcCapacityFromKsm, issuedAmountBtc] = await Promise.all([
            this.calculateCapacity(totalLockedDot),
            this.calculateCapacity(totalLockedKsm),
            this.getTotalIssuedAmount(wrappedCurrency),
        ]);
        return interBtcCapacityFromDot.add(interBtcCapacityFromKsm).sub(issuedAmountBtc);
    }

    private async calculateCapacity<C extends CollateralUnit>(
        collateral: MonetaryAmount<Currency<C>, C>
    ): Promise<BTCAmount> {
        try {
            const oracle = new DefaultOracleAPI(this.api);
            const [exchangeRate, secureCollateralThreshold] = await Promise.all([
                oracle.getExchangeRate(collateral.currency),
                this.getSecureCollateralThreshold(collateral.currency),
            ]);
            const unusedCollateral = collateral.div(secureCollateralThreshold);
            return exchangeRate.toBase(unusedCollateral);
        } catch (error) {
            return BTCAmount.zero;
        }
    }

    async selectRandomVaultIssue(amount: BTCAmount, wrappedCurrency: WrappedCurrency): Promise<AccountId> {
        try {
            const amountSat = this.api.createType("Balance", amount.toString());
            const currencyIdLiteral = tickerToCurrencyIdLiteral(wrappedCurrency.ticker);
            // eslint-disable-next-line max-len
            const firstVaultWithSufficientCollateral =
                await this.api.rpc.vaultRegistry.getFirstVaultWithSufficientCollateral(
                    this.wrapCurrency(amountSat),
                    currencyIdLiteral
                );
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

    async getLiquidationCollateralThreshold<C extends CollateralUnit>(currency: Currency<C>): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
        const threshold = await this.api.query.vaultRegistry.liquidationCollateralThreshold.at(head, currencyIdLiteral);
        if (!threshold.isSome) {
            Promise.reject(`No liquidation threshold for currency ${currency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getPremiumRedeemThreshold<C extends CollateralUnit>(currency: Currency<C>): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
        const threshold = await this.api.query.vaultRegistry.premiumRedeemThreshold.at(head, currencyIdLiteral);
        if (!threshold.isSome) {
            return Promise.reject(`No liquidation threshold for currency ${currency.ticker}`);
        }
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getSecureCollateralThreshold<C extends CollateralUnit>(currency: Currency<C>): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const currencyIdLiteral = tickerToCurrencyIdLiteral(currency.ticker);
        const threshold = await this.api.query.vaultRegistry.secureCollateralThreshold.at(head, currencyIdLiteral);
        return decodeFixedPointType(threshold.value as UnsignedFixedPoint);
    }

    async getAPY(vaultId: AccountId, wrappedCurrency: WrappedCurrency): Promise<Big> {
        const vault = await this.get(vaultId);
        const [feesWrapped, lockedCollateral] = await Promise.all([
            await this.poolsAPI.getFeesWrapped(wrappedCurrency, vaultId.toString()),
            await this.tokensAPI.balanceLocked(vault.collateralCurrency, vaultId),
        ]);
        return this.feeAPI.calculateAPY(feesWrapped, lockedCollateral);
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

    private parseVaultStatus(status: VaultStatus): VaultStatusExt {
        if (status.isActive) {
            return status.asActive ? VaultStatusExt.Active : VaultStatusExt.Inactive;
        } else if (status.isLiquidated) {
            return VaultStatusExt.Liquidated;
        } else if (status.isCommittedTheft) {
            return VaultStatusExt.CommittedTheft;
        } else {
            throw new Error("Unknown vault status");
        }
    }

    async parseVault(vault: Vault, network: Network): Promise<VaultExt> {
        const collateralCurrency = currencyIdToMonetaryCurrency<CollateralUnit>(vault.currency_id);
        const replaceCollateral = newMonetaryAmount(vault.replace_collateral.toString(), collateralCurrency);
        const liquidatedCollateral = newMonetaryAmount(vault.liquidated_collateral.toString(), collateralCurrency);
        const backingCollateral = new Map<WrappedCurrency, MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>();
        for (const wrappedCurrency of WRAPPED_CURRENCIES) {
            const backingCollateralForWrapped = await this.computeBackingCollateral(
                wrappedCurrency,
                collateralCurrency,
                vault.id
            );
            backingCollateral.set(wrappedCurrency, backingCollateralForWrapped);
        }
        return {
            wallet: parseWallet(vault.wallet, network),
            backingCollateral,
            id: vault.id,
            status: this.parseVaultStatus(vault.status),
            bannedUntil: vault.banned_until.isSome ? (vault.banned_until.value as BlockNumber).toNumber() : undefined,
            toBeIssuedTokens: BTCAmount.from.Satoshi(vault.to_be_issued_tokens.toString()),
            issuedTokens: BTCAmount.from.Satoshi(vault.issued_tokens.toString()),
            toBeRedeemedTokens: BTCAmount.from.Satoshi(vault.to_be_redeemed_tokens.toString()),
            toBeReplacedTokens: BTCAmount.from.Satoshi(vault.to_be_replaced_tokens.toString()),
            replaceCollateral,
            liquidatedCollateral,
            collateralCurrency: collateralCurrency,
        };
    }

    async reportVaultTheft(vaultId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        [merkleProof, rawTx] = await getTxProof(this.electrsAPI, btcTxId, merkleProof, rawTx);
        const tx = this.api.tx.relay.reportVaultTheft(parsedVaultId, merkleProof, rawTx);
        await this.sendLogged(tx, this.api.events.relay.VaultTheft);
    }
}
