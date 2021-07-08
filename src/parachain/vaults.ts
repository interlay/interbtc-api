import { ApiPromise } from "@polkadot/api";
import { AccountId, H256, Balance } from "@polkadot/types/interfaces";
import { AddressOrPair } from "@polkadot/api/types";
import Big from "big.js";
import BN from "bn.js";
import { Network } from "bitcoinjs-lib";
import { Bitcoin, BTCAmount, Polkadot, PolkadotUnit, MonetaryAmount, Currency, PolkadotAmount } from "@interlay/monetary-js";

import {
    Vault,
    IssueRequest,
    RedeemRequest,
    ReplaceRequest,
    Wallet,
    SystemVault,
    BalanceWrapper,
    RewardPool,
} from "../interfaces/default";
import {
    FIXEDI128_SCALING_FACTOR,
    decodeFixedPointType,
    encodeBtcAddress,
    computeLazyDistribution,
    newAccountId,
    newMonetaryAmount,
} from "../utils";
import { TokensAPI, DefaultTokensAPI } from "./tokens";
import { DefaultOracleAPI, OracleAPI } from "./oracle";
import { ReplaceRequestExt, encodeReplaceRequest } from "./replace";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import { DefaultIssueAPI, encodeIssueRequest } from "./issue";
import { encodeRedeemRequest } from "./redeem";
import { CurrencyIdLiteral, Issue, Redeem, CollateralUnits, tickerToCurrencyIdLiteral, CurrencyUnits } from "../types";

export interface WalletExt {
    // network encoded btc addresses
    publicKey: string;
    btcAddress?: string;
    addresses: Array<string>;
}

export interface VaultExt extends Omit<Vault, "wallet"> {
    wallet: WalletExt;
}

function encodeWallet(wallet: Wallet, network: Network): WalletExt {
    const { addresses, public_key } = wallet;

    const btcAddresses: Array<string> = [];
    for (const value of addresses.values()) {
        btcAddresses.push(encodeBtcAddress(value, network));
    }

    return {
        publicKey: public_key.toString(),
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

/**
 * @category InterBTC Bridge
 */
export interface VaultsAPI extends TransactionAPI {
    /**
     * @returns An array containing the vaults with non-zero backing collateral
     */
    list(): Promise<VaultExt[]>;
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
    getVaultCollateralization<C extends CollateralUnits>(
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
    getRequiredCollateralForVault<C extends CollateralUnits>(
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
    getRequiredCollateralForWrapped<C extends CollateralUnits>(
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
     * @param vaultId The vault account ID
     * @returns The total InterBTC reward collected by the vault
     */
    getFeesWrapped(vaultId: string): Promise<BTCAmount>;
    /**
     * @param vaultId The vault account ID
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The total DOT reward collected by the vault
     */
    getFeesCollateral<C extends CollateralUnits = PolkadotUnit>(
        vaultId: string,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
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
    withdrawCollateral<C extends CollateralUnits>(amount: MonetaryAmount<Currency<C>, C>): Promise<void>;
    /**
     * @param amount The amount of extra collateral to lock
     */
    depositCollateral<C extends CollateralUnits>(amount: MonetaryAmount<Currency<C>, C>): Promise<void>;
    /**
     * @returns The account id of the liquidation vault
     */
    getLiquidationVaultId(): Promise<string>;
    /**
     * @returns A vault object representing the liquidation vault
     */
    getLiquidationVault(): Promise<SystemVault>;
    /**
     * @param vaultId account id
     * @param currency The collateral currency specification, a `Monetary.js` object
     * @returns The collateral of a vault, taking slashes into account.
     */
    getCollateral<C extends CollateralUnits>(
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
    getStakingCapacity<C extends CollateralUnits>(
        vaultId: AccountId,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param currency The currency specification, a `Monetary.js` object
     * @param localPoolId the account id for the local pool
     * @param accountId the account id of the local pool nominator
     * @returns The reward as a currency type, dependending on the currencyId parameter
     */
    computeReward<C extends CurrencyUnits>(
        currency: Currency<C>,
        localPoolId: string,
        accountId: string
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     * @param vaultId account id
     * @param currency The currency specification, a `Monetary.js` object
     * @returns The entire collateral backing a vault's issued tokens.
     */
    getBackingCollateral<C extends CollateralUnits>(
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

    constructor(api: ApiPromise, btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.btcNetwork = btcNetwork;
        this.tokensAPI = new DefaultTokensAPI(api);
        this.oracleAPI = new DefaultOracleAPI(api);
        this.feeAPI = new DefaultFeeAPI(api);
    }

    async register(planckCollateral: BN, publicKey: string): Promise<void> {
        const tx = this.api.tx.vaultRegistry.registerVault(planckCollateral, publicKey);
        await this.sendLogged(tx, this.api.events.vaultRegistry.RegisterVault);
    }

    async withdrawCollateral<C extends CollateralUnits>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountSmallDenomination = this.api.createType("Balance", amount.toString());
        // TODO: Add currency parameter when parachain adds it
        const tx = this.api.tx.vaultRegistry.withdrawCollateral(amountSmallDenomination);
        await this.sendLogged(tx, this.api.events.vaultRegistry.WithdrawCollateral);
    }

    async depositCollateral<C extends CollateralUnits>(amount: MonetaryAmount<Currency<C>, C>): Promise<void> {
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const tx = this.api.tx.vaultRegistry.depositCollateral(amountAsPlanck);
        await this.sendLogged(tx, this.api.events.vaultRegistry.DepositCollateral);
    }

    async list(): Promise<VaultExt[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const vaultsMap = await this.api.query.vaultRegistry.vaults.entriesAt(head);
        return vaultsMap.map((v) => encodeVault(v[1], this.btcNetwork));
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
                ([id, req]) => [id, encodeReplaceRequest(req, this.btcNetwork)] as [H256, ReplaceRequestExt]
            );
            const newVaultReplaceRequests: [H256, ReplaceRequest][] =
                await this.api.rpc.replace.getNewVaultReplaceRequests(vaultId);
            const newVaultReplaceRequestsExt = newVaultReplaceRequests.map(
                ([id, req]) => [id, encodeReplaceRequest(req, this.btcNetwork)] as [H256, ReplaceRequestExt]
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
        return encodeVault(vault, this.btcNetwork);
    }

    async getCollateral<C extends CollateralUnits = PolkadotUnit>(
        vaultId: AccountId,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const vault = await this.get(vaultId);
        const collateral = newMonetaryAmount(vault.collateral.toString(), collateralCurrency);
        const perToken = decodeFixedPointType(vault.slash_per_token);
        const slashTally = decodeFixedPointType(vault.slash_tally);
        const toSlash = newMonetaryAmount(
            computeLazyDistribution(collateral.toBig(), perToken, slashTally),
            collateralCurrency
        );
        return collateral.sub(toSlash);
    }

    async getBackingCollateral<C extends CollateralUnits = PolkadotUnit>(
        vaultId: AccountId,
        collateralCurrency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const vault = await this.get(vaultId);
        const backingCollateral = newMonetaryAmount(vault.backing_collateral.toString(), collateralCurrency);

        const perToken = decodeFixedPointType(vault.slash_per_token);
        const slashTally = decodeFixedPointType(vault.slash_tally);
        const toSlash = newMonetaryAmount(
            computeLazyDistribution(backingCollateral.toBig(), perToken, slashTally),
            collateralCurrency
        );
        return backingCollateral.sub(toSlash);
    }

    async getMaxNominationRatio(): Promise<Big> {
        const [premiumRedeemThreshold, secureCollateralThreshold] = await Promise.all([
            this.getPremiumRedeemThreshold(),
            this.getSecureCollateralThreshold(),
        ]);
        return secureCollateralThreshold.div(premiumRedeemThreshold);
    }

    async getStakingCapacity<C extends CollateralUnits = PolkadotUnit>(
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

    async computeReward<C extends CurrencyUnits>(
        currency: Currency<C>,
        localPoolId: string,
        accountId: string
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const globalRewardPool = this.api.createType("RewardPool", "Global");
        const localRewardPool = this.api.createType("RewardPool", { local: localPoolId });
        const currencyId = tickerToCurrencyIdLiteral(currency.ticker);
        const globalReward = await this.computeRewardInPool(currency, globalRewardPool, localPoolId);
        let perTokenIncrease = new Big(0);
        // TODO: Currently assumes `Polkadot` is the only currency that backs collateral
        const vaultBackingCollateral = await this.getBackingCollateral(newAccountId(this.api, localPoolId), Polkadot);
        const localPoolRewardPerToken = await this.getRewardPerToken(currencyId, localRewardPool);
        const zero = newMonetaryAmount(0, vaultBackingCollateral.currency);
        if (vaultBackingCollateral.gt(zero)) {
            perTokenIncrease = globalReward.toBig().div(vaultBackingCollateral.toBig());
        }
        const totalRewardPerToken = localPoolRewardPerToken.add(perTokenIncrease);
        const localPoolRewardTally = await this.getRewardTally(currencyId, localRewardPool, accountId);
        const rawLazyDistribution = computeLazyDistribution(
            vaultBackingCollateral.toBig(),
            totalRewardPerToken,
            localPoolRewardTally
        );
        return newMonetaryAmount(rawLazyDistribution, currency);
    }

    async computeRewardInPool<C extends CurrencyUnits>(
        currency: Currency<C>,
        rewardPool: RewardPool,
        accountId: string
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const currencyId = tickerToCurrencyIdLiteral(currency.ticker);
        const stake = await this.getStake(currencyId, rewardPool, accountId);
        const rewardPerToken = await this.getRewardPerToken(currencyId, rewardPool);
        const rewardTally = await this.getRewardTally(currencyId, rewardPool, accountId);
        const rawLazyDistribution = computeLazyDistribution(stake, rewardPerToken, rewardTally);
        return newMonetaryAmount(rawLazyDistribution, currency);
    }

    async getStake(currencyId: CurrencyIdLiteral, rewardPool: RewardPool, accountId: string): Promise<Big> {
        return decodeFixedPointType(await this.api.query.vaultRewards.stake(currencyId, [rewardPool, accountId]));
    }

    async getRewardTally(currencyId: CurrencyIdLiteral, rewardPool: RewardPool, accountId: string): Promise<Big> {
        return decodeFixedPointType(await this.api.query.vaultRewards.rewardTally(currencyId, [rewardPool, accountId]));
    }

    async getRewardPerToken(currencyId: CurrencyIdLiteral, rewardPool: RewardPool): Promise<Big> {
        return decodeFixedPointType(await this.api.query.vaultRewards.rewardPerToken(currencyId, rewardPool));
    }

    async getLiquidationVaultId(): Promise<string> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const liquidationVaultId = await this.api.query.vaultRegistry.liquidationVaultAccountId.at(head);
        return liquidationVaultId.toString();
    }

    async getLiquidationVault(): Promise<SystemVault> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const liquidationVault = await this.api.query.vaultRegistry.liquidationVault.at(head);
        return liquidationVault;
    }

    private isNoTokensIssuedError(e: Error): boolean {
        return e.message.includes("NoTokensIssued");
    }

    async getVaultCollateralization<C extends CollateralUnits = PolkadotUnit>(
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

    async getRequiredCollateralForVault<C extends CollateralUnits = PolkadotUnit>(
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

    async getRequiredCollateralForWrapped<C extends CollateralUnits = PolkadotUnit>(
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
        return BTCAmount.from.Satoshi(vault.issued_tokens.toString());
    }

    async getIssuableAmount(vaultId: AccountId): Promise<BTCAmount> {
        const vault = await this.get(vaultId);
        const lockedDot = PolkadotAmount.from.Planck(vault.backing_collateral.toString());
        const interBtcCapacity = await this.calculateCapacity(lockedDot);
        const backedTokens = vault.issued_tokens.add(vault.to_be_issued_tokens);
        const issuedAmountBtc = BTCAmount.from.Satoshi(backedTokens.toString());
        const issuableAmountExcludingFees = interBtcCapacity.sub(issuedAmountBtc);
        const issueAPI = new DefaultIssueAPI(this.api, this.btcNetwork, this.electrsAPI);
        const fees = await issueAPI.getFeesToPay(issuableAmountExcludingFees);
        return issuableAmountExcludingFees.sub(fees);
    }

    private async getIssuedAmounts(): Promise<BTCAmount[]> {
        const vaults: VaultExt[] = await this.list();
        const issuedTokens: BTCAmount[] = vaults.map((v) => BTCAmount.from.Satoshi(v.issued_tokens.toString()));
        return issuedTokens;
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
            this.getTotalIssuedAmount()
        ]);
        return interBtcCapacity.sub(issuedAmountBtc);
    }

    private async calculateCapacity<C extends CollateralUnits = PolkadotUnit>(
        collateral: MonetaryAmount<Currency<C>, C>
    ): Promise<BTCAmount> {
        const oracle = new DefaultOracleAPI(this.api);
        const [exchangeRate, secureCollateralThreshold] = await Promise.all([
            oracle.getExchangeRate(collateral.currency),
            this.getSecureCollateralThreshold()
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
        const theftReports = await this.api.query.stakedRelayers.theftReports.at(head, vaultId);
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

    async getFeesWrapped(vaultId: string): Promise<BTCAmount> {
        return await this.computeReward(Bitcoin, vaultId, vaultId);
    }

    async getFeesCollateral<C extends CollateralUnits = PolkadotUnit>(
        vaultId: string,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        return await this.computeReward(currency, vaultId, vaultId);
    }

    async getAPY(vaultId: AccountId): Promise<Big> {
        // TODO: Fetch data for all collateral currencies
        const [feesWrapped, feesCollateral, lockedCollateral] = await Promise.all([
            await this.getFeesWrapped(vaultId.toString()),
            await this.getFeesCollateral(vaultId.toString(), Polkadot),
            await this.tokensAPI.balanceLocked(Polkadot, vaultId),
        ]);
        return this.feeAPI.calculateAPY(feesWrapped, feesCollateral, lockedCollateral);
    }

    async getSLA(vaultId: AccountId): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const sla = await this.api.query.sla.vaultSla.at(head, vaultId);
        return decodeFixedPointType(sla).toNumber();
    }

    async getMaxSLA(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const maxSLA = await this.api.query.sla.relayerTargetSla.at(head);
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
}
