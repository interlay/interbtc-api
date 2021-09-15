import { ApiPromise } from "@polkadot/api";
import { AccountId, Balance, BlockNumber, BlockHash } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import { MonetaryAmount, Currency, BitcoinUnit } from "@interlay/monetary-js";

import { Bytes } from "@polkadot/types";
import {
    Vault,
    BalanceWrapper,
    VaultStatus,
    DefaultVault,
    UnsignedFixedPoint,
    DefaultSystemVault,
} from "../interfaces/default";
import {
    decodeFixedPointType,
    newMonetaryAmount,
    parseWallet,
    parseSystemVault,
    newAccountId,
    getTxProof,
} from "../utils";
import { TokensAPI, DefaultTokensAPI } from "./tokens";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import { DefaultIssueAPI } from "./issue";
import {
    CollateralUnit,
    tickerToCurrencyIdLiteral,
    VaultExt,
    SystemVaultExt,
    VaultStatusExt,
    currencyIdToMonetaryCurrency,
    CurrencyUnit,
    CollateralCurrency,
    WrappedCurrency,
} from "../types";
import { DefaultRewardsAPI, RewardsAPI } from "./rewards";

/**
 * @category InterBTC Bridge
 */
export interface VaultsAPI extends TransactionAPI {
    /**
     * @returns An array containing the vaults with non-zero backing collateral
     */
    list(atBlock?: BlockHash): Promise<VaultExt<BitcoinUnit>[]>;
    /**
     * @param vaultId The ID of the vault to fetch
     * @returns A vault object
     */
    get(vaultId: AccountId): Promise<VaultExt<BitcoinUnit>>;
    /**
     * Get the collateralization of a single vault measured by dividing the value of issued (wrapped) tokens
     * by the value of total locked collateral.
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
     * Get the total system collateralization measured by dividing the value of issued (wrapped) tokens
     * by the value of total locked collateral.
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
     * @param collateralCurrency The currency specification, a `Monetary.js` object
     * @returns The required collateral amount for issuing
     */
    getRequiredCollateralForWrapped<C extends CollateralUnit>(
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param vaultId The vault account ID
     * @returns The amount of wrapped tokens issued by the given vault
     */
    getIssuedAmount(vaultId: AccountId): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @param vaultId The vault account ID
     * @returns The amount of wrapped tokens issuable by this vault
     */
    getIssuableAmount(vaultId: AccountId): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @returns The total amount of wrapped tokens issued by the vaults
     */
    getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @returns The total amount of wrapped tokens that can be issued, considering the collateral
     * locked by the vaults
     */
    getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     * @param amount Wrapped tokens amount to issue
     * @returns A vault that has sufficient collateral to issue the given amount
     */
    selectRandomVaultIssue(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<AccountId>;
    /**
     * @param amount Wrapped tokens amount to redeem
     * @returns A vault that has issued sufficient wrapped tokens to redeem the given amount
     */
    selectRandomVaultRedeem(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<AccountId>;
    /**
     * @returns Vaults below the premium redeem threshold, sorted in descending order of their redeemable tokens
     */
    getPremiumRedeemVaults(): Promise<Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>>;
    /**
     * @returns Vaults with issuable tokens, sorted in descending order of this value
     */
    getVaultsWithIssuableTokens(): Promise<Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>>;
    /**
     * @returns Vaults with redeemable tokens, sorted in descending order of this value
     */
    getVaultsWithRedeemableTokens(): Promise<Map<AccountId, MonetaryAmount<WrappedCurrency, BitcoinUnit>>>;
    /**
     * @param vaultId The vault account ID
     * @returns A bollean value
     */
    isVaultFlaggedForTheft(vaultId: AccountId): Promise<boolean>;
    /**
     * @param collateralCurrency
     * @returns The lower bound for vault collateralization.
     * If a Vault’s collateral rate
     * drops below this, automatic liquidation (forced Redeem) is triggered.
     */
    getLiquidationCollateralThreshold<C extends CollateralUnit>(collateralCurrency: Currency<C>): Promise<Big>;
    /**
     * @param collateralCurrency
     * @returns The collateral rate at which users receive
     * a premium allocated from the Vault’s collateral, when performing a redeem with this Vault.
     */
    getPremiumRedeemThreshold<C extends CollateralUnit>(collateralCurrency: Currency<C>): Promise<Big>;
    /**
     * @param collateralCurrency
     * @returns The over-collateralization rate for collateral locked
     * by Vaults, necessary for issuing wrapped tokens
     */
    getSecureCollateralThreshold<C extends CollateralUnit>(collateralCurrency: Currency<C>): Promise<Big>;
    /**
     * Get the total APY for a vault based on the income in wrapped and collateral tokens
     * divided by the locked collateral.
     *
     * @note this does not account for interest compounding
     *
     * @param vaultId the id of the vault
     * @returns the APY as a percentage string
     */
    getAPY(vaultId: AccountId): Promise<Big>;
    /**
     * @returns Fee that a Vault has to pay, as a percentage, if it fails to execute
     * redeem or replace requests (for redeem, on top of the slashed wrapped-token-to-collateral
     * value of the request). The fee is paid in collateral currency based on the wrapped token
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
     * @param collateralCurrency
     * @returns A vault object representing the liquidation vault
     */
    getLiquidationVault<C extends CollateralUnit>(collateralCurrency: Currency<C>): Promise<SystemVaultExt<BitcoinUnit>>;
    /**
     * @param vaultId account id
     * @returns The collateral of a vault, taking slashes into account.
     */
    getCollateral(vaultId: AccountId): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * @param collateralCurrency The collateral currency specification, a `Monetary.js` object
     * @returns The maximum collateral a vault can accept as nomination, as a ratio of its own collateral
     */
    getMaxNominationRatio(collateralCurrency: Currency<CollateralUnit>): Promise<Big>;
    /**
     * @param vaultId account id
     * @returns Staking capacity, as a collateral currency (e.g. DOT)
     */
    getStakingCapacity(vaultId: AccountId): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     * @param collateralCurrency The collateral currency specification, a `Monetary.js` object
     * @param vaultId account id
     * @param nonce Nonce of the staking pool
     * @returns The entire collateral backing a vault's issued tokens.
     */
    computeBackingCollateral(
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
    /**
     * @returns The wrapped currency issued by the vaults
     */
    getWrappedCurrency(): WrappedCurrency;
}

export class DefaultVaultsAPI extends DefaultTransactionAPI implements VaultsAPI {
    private btcNetwork: Network;
    tokensAPI: TokensAPI;
    oracleAPI: OracleAPI;
    feeAPI: FeeAPI;
    rewardsAPI: RewardsAPI;

    constructor(
        api: ApiPromise,
        btcNetwork: Network,
        private electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        account?: AddressOrPair
    ) {
        super(api, account);
        this.btcNetwork = btcNetwork;
        this.tokensAPI = new DefaultTokensAPI(api);
        this.oracleAPI = new DefaultOracleAPI(api, wrappedCurrency);
        this.feeAPI = new DefaultFeeAPI(api, wrappedCurrency);
        this.rewardsAPI = new DefaultRewardsAPI(api, btcNetwork, electrsAPI, wrappedCurrency);
    }

    getWrappedCurrency(): WrappedCurrency {
        return this.wrappedCurrency;
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

    async list(atBlock?: BlockHash): Promise<VaultExt<BitcoinUnit>[]> {
        const block = atBlock || (await this.api.rpc.chain.getFinalizedHead());
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entriesAt(block);
        return Promise.all(
            vaultsMap
                .filter((v) => v[1].isSome)
                .map((v) => this.parseVault(v[1].value as DefaultVault, this.btcNetwork))
        );
    }

    async get(vaultId: AccountId): Promise<VaultExt<BitcoinUnit>> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const vault = await this.api.query.vaultRegistry.vaults.at(head, vaultId);
        if (!vault.isSome) {
            return Promise.reject(`No vault registered with id ${vaultId}`);
        }
        return this.parseVault(vault.value as DefaultVault, this.btcNetwork);
    }

    async getCollateral(vaultId: AccountId): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        return this.rewardsAPI.computeCollateralInStakingPool(vaultId.toString(), vaultId.toString());
    }

    async getMaxNominationRatio(collateralCurrency: Currency<CollateralUnit>): Promise<Big> {
        const [premiumRedeemThreshold, secureCollateralThreshold] = await Promise.all([
            this.getPremiumRedeemThreshold(collateralCurrency),
            this.getSecureCollateralThreshold(collateralCurrency),
        ]);
        return secureCollateralThreshold.div(premiumRedeemThreshold);
    }

    async computeBackingCollateral(
        collateralCurrency: Currency<CollateralUnit>,
        vaultId: AccountId,
        nonce?: number
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const currencyId = tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker);
        if (nonce === undefined) {
            nonce = await this.rewardsAPI.getStakingPoolNonce(currencyId, vaultId.toString());
        }
        const rawBackingCollateral = await this.api.query.staking.totalCurrentStake(currencyId, [nonce, vaultId]);
        return newMonetaryAmount(decodeFixedPointType(rawBackingCollateral), collateralCurrency);
    }

    async getStakingCapacity(vaultId: AccountId): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const vault = await this.get(vaultId);
        const [collateral, maxNominationRatio] = await Promise.all([
            this.getCollateral(vaultId),
            this.getMaxNominationRatio(vault.collateralCurrency),
        ]);
        return collateral.mul(maxNominationRatio).sub(vault.backingCollateral);
    }

    async getLiquidationVaultId(): Promise<string> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const liquidationVaultId = await this.api.query.vaultRegistry.liquidationVaultAccountId.at(head);
        return liquidationVaultId.toString();
    }

    async getLiquidationVault<C extends CollateralUnit>(
        collateralCurrency: Currency<C>
    ): Promise<SystemVaultExt<BitcoinUnit>> {
        const currencyIdLiteral = tickerToCurrencyIdLiteral(collateralCurrency.ticker);
        const head = await this.api.rpc.chain.getFinalizedHead();
        const liquidationVault = await this.api.query.vaultRegistry.liquidationVault.at(head, currencyIdLiteral);
        if (!liquidationVault.isSome) {
            return Promise.reject("System vault could not be fetched");
        }
        return parseSystemVault(liquidationVault.value as DefaultSystemVault, this.wrappedCurrency);
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
        amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>,
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

    async getIssuedAmount(vaultId: AccountId): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const vault = await this.get(vaultId);
        return vault.issuedTokens;
    }

    async getIssuableAmount(vaultId: AccountId): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        const vault = await this.get(vaultId);
        const wrappedTokenCapacity = await this.calculateCapacity(vault.backingCollateral);
        const issuedAmount = vault.issuedTokens.add(vault.toBeIssuedTokens);
        const issuableAmountExcludingFees = wrappedTokenCapacity.sub(issuedAmount);
        const issueAPI = new DefaultIssueAPI(this.api, this.btcNetwork, this.electrsAPI, this.wrappedCurrency);
        const fees = await issueAPI.getFeesToPay(issuableAmountExcludingFees);
        return issuableAmountExcludingFees.sub(fees);
    }

    async getTotalIssuedAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        const issuedTokens = await this.tokensAPI.total(this.wrappedCurrency);
        return issuedTokens;
    }

    async getTotalIssuableAmount(): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        const perCollateralIssuableAmounts = await Promise.all(
            CollateralCurrency.map(
                (currency) =>
                    new Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>((resolve) => {
                        this.tokensAPI.total(currency as Currency<CurrencyUnit>).then(async (nomination) => {
                            const capacity = await this.calculateCapacity(
                                nomination as MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>
                            );
                            resolve(capacity);
                        });
                    })
            )
        );
        const totalIssuableAmount = perCollateralIssuableAmounts.reduce((acc, v) => acc.add(v));
        const issuedAmountBtc = await this.getTotalIssuedAmount();
        return totalIssuableAmount.sub(issuedAmountBtc);
    }

    private async calculateCapacity<C extends CollateralUnit>(
        collateral: MonetaryAmount<Currency<C>, C>
    ): Promise<MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>> {
        try {
            const oracle = new DefaultOracleAPI(this.api, this.wrappedCurrency);
            const [exchangeRate, secureCollateralThreshold] = await Promise.all([
                oracle.getExchangeRate(collateral.currency),
                this.getSecureCollateralThreshold(collateral.currency),
            ]);
            const unusedCollateral = collateral.div(secureCollateralThreshold);
            return exchangeRate.toBase(unusedCollateral);
        } catch (error) {
            return newMonetaryAmount(0, this.wrappedCurrency);
        }
    }

    async selectRandomVaultIssue(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<AccountId> {
        try {
            const amountSat = this.api.createType("Balance", amount.toString());
            const currencyIdLiteral = tickerToCurrencyIdLiteral(amount.currency.ticker);
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

    async selectRandomVaultRedeem(amount: MonetaryAmount<WrappedCurrency, BitcoinUnit>): Promise<AccountId> {
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

    async getPremiumRedeemVaults(): Promise<Map<AccountId, MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>> {
        try {
            const vaults = await this.api.rpc.vaultRegistry.getPremiumRedeemVaults();
            return new Map(
                vaults.map(([id, redeemableTokens]) => [
                    id,
                    newMonetaryAmount(this.unwrapCurrency(redeemableTokens).toString(), this.wrappedCurrency),
                ])
            );
        } catch (e) {
            return Promise.reject(new Error("Did not find vault below the premium redeem threshold"));
        }
    }

    async getVaultsWithIssuableTokens(): Promise<Map<AccountId, MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>> {
        const vaults = await this.api.rpc.vaultRegistry.getVaultsWithIssuableTokens();
        return new Map(
            vaults.map(([id, issuableTokens]) => [
                id,
                newMonetaryAmount(this.unwrapCurrency(issuableTokens).toString(), this.wrappedCurrency),
            ])
        );
    }

    async getVaultsWithRedeemableTokens(): Promise<Map<AccountId, MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>>> {
        const vaults = await this.api.rpc.vaultRegistry.getVaultsWithRedeemableTokens();
        return new Map(
            vaults.map(([id, redeemableTokens]) => [
                id,
                newMonetaryAmount(this.unwrapCurrency(redeemableTokens).toString(), this.wrappedCurrency),
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
            return Promise.reject(`No liquidation threshold for currency ${currency.ticker}`);
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

    async getAPY(vaultId: AccountId): Promise<Big> {
        const vault = await this.get(vaultId);
        const [feesWrapped, lockedCollateral] = await Promise.all([
            await this.rewardsAPI.getFeesWrapped(vaultId.toString()),
            await this.tokensAPI.balanceLocked(vault.collateralCurrency, vaultId),
        ]);
        return this.feeAPI.calculateAPY(feesWrapped, lockedCollateral);
    }

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

    async parseVault(vault: Vault, network: Network): Promise<VaultExt<BitcoinUnit>> {
        const collateralCurrency = currencyIdToMonetaryCurrency<CollateralUnit>(vault.currency_id);
        const replaceCollateral = newMonetaryAmount(vault.replace_collateral.toString(), collateralCurrency);
        const liquidatedCollateral = newMonetaryAmount(vault.liquidated_collateral.toString(), collateralCurrency);
        const backingCollateral = await this.computeBackingCollateral(collateralCurrency, vault.id);
        return {
            wallet: parseWallet(vault.wallet, network),
            backingCollateral,
            id: vault.id,
            status: this.parseVaultStatus(vault.status),
            bannedUntil: vault.banned_until.isSome ? (vault.banned_until.value as BlockNumber).toNumber() : undefined,
            toBeIssuedTokens: newMonetaryAmount(vault.to_be_issued_tokens.toString(), this.wrappedCurrency),
            issuedTokens: newMonetaryAmount(vault.issued_tokens.toString(), this.wrappedCurrency),
            toBeRedeemedTokens: newMonetaryAmount(vault.to_be_redeemed_tokens.toString(), this.wrappedCurrency),
            toBeReplacedTokens: newMonetaryAmount(vault.to_be_replaced_tokens.toString(), this.wrappedCurrency),
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
