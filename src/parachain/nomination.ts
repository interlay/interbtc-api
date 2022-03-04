import { ApiPromise } from "@polkadot/api";
import { AccountId, Index } from "@polkadot/types/interfaces";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";
import type { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import { VaultsAPI } from "./vaults";
import {
    decodeFixedPointType,
    newCurrencyId,
    newMonetaryAmount,
    newVaultCurrencyPair,
    newVaultId,
    queryNominationsMap,
    storageKeyToNthInner,
} from "../utils";
import { TransactionAPI } from "./transaction";
import {
    CollateralCurrency,
    CollateralIdLiteral,
    CollateralUnit,
    CurrencyIdLiteral,
    currencyIdToLiteral,
    currencyIdToMonetaryCurrency,
    CurrencyUnit,
    NominationStatus,
    tickerToCurrencyIdLiteral,
    WrappedCurrency,
    WrappedIdLiteral,
} from "../types";
import { RewardsAPI } from "./rewards";
import { UnsignedFixedPoint } from "../interfaces";

export enum NominationAmountType {
    Raw = "raw",
    Parsed = "parsed",
}
export type NominationData<U extends CurrencyUnit> = {
    nonce: number,
    vaultId: InterbtcPrimitivesVaultId,
    nominatorId: AccountId,
    amount: MonetaryAmount<Currency<U>, U>
};

export type RawNomination = NominationData<CollateralUnit> & { type: NominationAmountType.Raw };
export type Nomination = NominationData<CollateralUnit> & { type: NominationAmountType.Parsed };
export type NominationReward = NominationData<CurrencyUnit>;

/**
 * @category BTC Bridge
 */
export interface NominationAPI {
    /**
     * @param vaultAccountId Vault to nominate collateral to
     * @param amount Amount to deposit, as a `Monetary.js` object
     */
    depositCollateral<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<void>;
    /**
     * @param vaultAccountId Vault that collateral was nominated to
     * @param amount Amount to withdraw, as a `Monetary.js` object
     */
    withdrawCollateral<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<void>;
    /**
     * @param collateralCurrency Currency to accept as nomination
     * @remarks Function callable by vaults to opt in to the nomination feature
     */
    optIn(collateralCurrency: CollateralCurrency): Promise<void>;
    /**
     * @param collateralCurrency Currency to stop accepting as nomination
     * @remarks Function callable by vaults to opt out of the nomination feature
     */
    optOut(collateralCurrency: CollateralCurrency): Promise<void>;
    /**
     * @remarks Testnet utility function
     */
    setNominationEnabled(enabled: boolean): Promise<void>;
    /**
     * @returns A boolean value representing whether the vault nomination feature is enabled
     */
    isNominationEnabled(): Promise<boolean>;
    /**
     * @returns All nominations for the wrapped currency set in the API
     */
    list(): Promise<Nomination[]>;
    /**
     * @param currency The currency of the nominations
     * @returns The rewards a nominator has accumulated, in wrapped token (e.g. interBTC, kBTC)
     */
    listNominatorRewards(): Promise<NominationReward[]>;
    /**
     * @returns A list of all vaults that opted in to the nomination feature.
     */
    listVaults(): Promise<InterbtcPrimitivesVaultId[]>;
    /**
     * @param A string representing the vault's account ID
     * @returns A boolean value
     */
    isVaultOptedIn(accountId: AccountId, collateralCurrencyIdLiteral: CollateralIdLiteral): Promise<boolean>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param vaultAccountId Id of vault who is opted in to nomination
     * @param collateralCurrencyId The collateral currency of the nominations
     * @param nominatorId Id of user who nominated to one or more vaults
     */
    getFilteredNominations(
        vaultAccountId?: AccountId,
        collateralCurrencyId?: CurrencyIdLiteral,
        nominatorId?: AccountId,
    ): Promise<Nomination[]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param vaultAccountId Id of vault who is opted in to nomination
     * @param collateralCurrency The collateral currency of the nominations
     * @param nominatorId Id of user who nominated to one or more vaults
     * @returns The total nominated amount, filtered using the given parameters
     */
    getTotalNomination(
        vaultAccountId?: AccountId,
        collateralCurrency?: CollateralCurrency,
        nominatorId?: AccountId,
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @returns The rewards a currently active nominator has accumulated
     */
    getActiveNominatorRewards(
        nominatorId: AccountId,
    ): Promise<NominationReward[]>;
    /**
     * @param vaultAccountId Id of nominated vault
     * @param collateralCurrencyId The currency towards whose issuance the nomination was made
     * @param rewardCurrencyId The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @param nominatorId Id of user who nominated to one or more vaults
     * @returns The rewards a (possibly inactive) nominator has accumulated
     */
    getNominatorReward(
        vaultId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        rewardCurrencyId: CurrencyIdLiteral,
        nominatorId: AccountId,
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>>;
    /**
     * @returns A map (vaultId => nonce), representing the nonces for each reward pool with the given currency
     */
    getNonces(): Promise<Map<InterbtcPrimitivesVaultId, number>>;
}

export class DefaultNominationAPI implements NominationAPI {
    constructor(
        private api: ApiPromise,
        private wrappedCurrency: WrappedCurrency,
        private vaultsAPI: VaultsAPI,
        private rewardsAPI: RewardsAPI,
        private transactionAPI: TransactionAPI
    ) {}

    async depositCollateral<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<void> {
        const vaultId = newVaultId(
            this.api,
            vaultAccountId.toString(),
            amount.currency as unknown as CollateralCurrency,
            this.wrappedCurrency
        );
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const tx = this.api.tx.nomination.depositCollateral(vaultId, amountAsPlanck);
        await this.transactionAPI.sendLogged(tx, this.api.events.nomination.DepositCollateral, true);
    }

    async withdrawCollateral<C extends CollateralUnit>(
        vaultAccountId: AccountId,
        amount: MonetaryAmount<Currency<C>, C>,
        nonce?: number
    ): Promise<void> {
        const currencyIdLiteral = tickerToCurrencyIdLiteral(amount.currency.ticker) as CollateralIdLiteral;
        const vaultId = newVaultId(
            this.api,
            vaultAccountId.toString(),
            amount.currency as unknown as CollateralCurrency,
            this.wrappedCurrency
        );
        const definedNonce = nonce
            ? nonce
            : await this.rewardsAPI.getStakingPoolNonce(currencyIdLiteral, vaultAccountId);
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const parsedNonce = this.api.createType("Index", definedNonce);
        const tx = this.api.tx.nomination.withdrawCollateral(vaultId, amountAsPlanck, parsedNonce);
        await this.transactionAPI.sendLogged(tx, this.api.events.nomination.WithdrawCollateral, true);
    }

    async optIn(collateralCurrency: CollateralCurrency): Promise<void> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const tx = this.api.tx.nomination.optInToNomination(vaultCurrencyPair);
        await this.transactionAPI.sendLogged(tx, this.api.events.nomination.NominationOptIn, true);
    }

    async optOut(collateralCurrency: CollateralCurrency): Promise<void> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const tx = this.api.tx.nomination.optOutOfNomination(vaultCurrencyPair);
        await this.transactionAPI.sendLogged(tx, this.api.events.nomination.NominationOptOut, true);
    }

    async setNominationEnabled(enabled: boolean): Promise<void> {
        const tx = this.api.tx.sudo.sudo(this.api.tx.nomination.setNominationEnabled(enabled));
        await this.transactionAPI.sendLogged(tx, undefined, true);
    }

    async isNominationEnabled(): Promise<boolean> {
        const isNominationEnabled = await this.api.query.nomination.nominationEnabled();
        return isNominationEnabled.isTrue;
    }

    async getNonces(): Promise<Map<InterbtcPrimitivesVaultId, number>> {
        const vaultIds = await this.listVaults();
        const nonceMap = new Map<InterbtcPrimitivesVaultId, number>();
        for (const vaultId of vaultIds) {
            const nonce = await this.rewardsAPI.getStakingPoolNonce(
                currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral,
                vaultId.accountId
            );
            currencyIdToLiteral;
            nonceMap.set(vaultId, nonce);
        }
        return nonceMap;
    }

    async listAllNominations(): Promise<RawNomination[]> {
        const nonces = await this.getNonces();
        const stakesMap = await this.api.query.vaultStaking.stake.entries();
        return stakesMap
            .map((v): RawNomination => {
                const nonce = storageKeyToNthInner(v[0], 0) as Index;
                const [vaultId, nominatorId] = storageKeyToNthInner(v[0], 1) as [InterbtcPrimitivesVaultId, AccountId];
                const nomination = decodeFixedPointType(v[1] as UnsignedFixedPoint);
                const collateralCurrency = currencyIdToMonetaryCurrency(vaultId.currencies.collateral) as Currency<CurrencyUnit>;
                const monetaryNomination = newMonetaryAmount(nomination, collateralCurrency, true);
                return {
                    nonce: nonce.toNumber(),
                    vaultId,
                    nominatorId,
                    amount: monetaryNomination as MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>,
                    type: NominationAmountType.Raw,
                };
            })
            .filter((rawNomination) => {
                // Cannot just do `nonces.get(rawNomination.vaultId)` because vaultId objects differ
                // ever so slightly even if they have identical properties
                const vaultIdHighestNonce = queryNominationsMap(nonces, rawNomination.vaultId);
                // Only consider active nominations, i.e. with the latest nonce
                return (
                    rawNomination.nonce === vaultIdHighestNonce &&
                    rawNomination.amount.toBig().gt(0)
                );
            });
    }

    async listNominatorRewards(): Promise<NominationReward[]> {
        const rawList = await this.listAllNominations();
        return await Promise.all(
            rawList.map(async (rawNomination): Promise<NominationReward> => {
                const reward = await this.vaultsAPI.computeReward(
                    rawNomination.vaultId.accountId,
                    rawNomination.nominatorId,
                    currencyIdToLiteral(rawNomination.vaultId.currencies.collateral) as CollateralIdLiteral,
                    currencyIdToLiteral(rawNomination.vaultId.currencies.wrapped) as WrappedIdLiteral
                );
                return {
                    nonce: rawNomination.nonce,
                    vaultId: rawNomination.vaultId,
                    nominatorId: rawNomination.nominatorId,
                    amount: reward
                };
            })
        );
    }

    async getActiveNominatorRewards(
        nominatorId: AccountId,
    ): Promise<NominationReward[]> {
        const nominatorRewards = await this.listNominatorRewards();
        return nominatorRewards.filter((nominationReward) => {
            return nominationReward.nominatorId.toString() === nominatorId.toString();
        });
    }

    async getNominatorReward(
        vaultId: AccountId,
        collateralCurrencyId: CollateralIdLiteral,
        rewardCurrencyId: CurrencyIdLiteral,
        nominatorId: AccountId,
    ): Promise<MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>> {
        return await this.vaultsAPI.computeReward(
            vaultId,
            nominatorId,
            collateralCurrencyId,
            rewardCurrencyId
        );
    }

    async list(): Promise<Nomination[]> {
        return await this.getFilteredNominations();
    }

    async getFilteredNominations(
        vaultId?: AccountId,
        collateralCurrencyId?: CurrencyIdLiteral,
        nominatorId?: AccountId,
    ): Promise<Nomination[]> {
        const rawList = await this.listAllNominations();
        // Filter by nominatorId and vaultId if each is defined respectively.
        const rawNominations = rawList.filter((rawNomination) => {
            const nominationCurrencyId = currencyIdToLiteral(rawNomination.vaultId.currencies.collateral);
            const nominationWrappedCurrencyId = currencyIdToLiteral(rawNomination.vaultId.currencies.wrapped);
            const wrappedCurrencyId = tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker);
            return (
                (!nominatorId || nominatorId === nominatorId) &&
                (!vaultId || vaultId === vaultId) &&
                (!collateralCurrencyId || collateralCurrencyId === nominationCurrencyId) &&
                (nominationWrappedCurrencyId === wrappedCurrencyId)
            );
        });
        return await Promise.all(
            rawNominations.map(async (rawNomination): Promise<Nomination> => {
                return {
                    ...rawNomination,
                    amount: await this.rewardsAPI.computeCollateralInStakingPool(
                        rawNomination.vaultId,
                        rawNomination.nominatorId,
                    ),
                    type: NominationAmountType.Parsed,
                };
            })
        );
    }

    async getNominationStatus(
        vaultId: AccountId,
        collateralCurrencyId: CurrencyIdLiteral,
        nominatorId: AccountId
    ): Promise<NominationStatus> {
        // There is at most one entry determined by this pair
        const filteredNominations = await this.getFilteredNominations(vaultId, collateralCurrencyId, nominatorId);
        if (filteredNominations.length === 0) {
            return Promise.reject(new Error("No nomination associated with this (nominator, vault) pair"));
        }

        if (filteredNominations[0].amount.isZero()) {
            return NominationStatus.Unstaked;
        } else {
            return NominationStatus.Staked;
        }
    }

    async getTotalNomination(
        vaultId?: AccountId,
        collateralCurrency?: CollateralCurrency,
        nominatorId?: AccountId,
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const collateralCurrencyId = collateralCurrency ? tickerToCurrencyIdLiteral(collateralCurrency.ticker) : undefined;
        const filteredNominations = await this.getFilteredNominations(vaultId, collateralCurrencyId, nominatorId);
        if (!filteredNominations.length) {
            // Cannot return `zero` because the type of nominated collateral is unknown
            return Promise.reject("No nomination available");
        }
        const zero = newMonetaryAmount<CollateralUnit>(0, collateralCurrency as Currency<CollateralUnit>);
        return filteredNominations
            .filter((nomination) => {
                const wrappedVaultCurrency = currencyIdToMonetaryCurrency(nomination.vaultId.currencies.wrapped);
                const collateralVaultCurrency = currencyIdToMonetaryCurrency(nomination.vaultId.currencies.collateral);
                wrappedVaultCurrency.ticker === this.wrappedCurrency.ticker &&
                    (collateralCurrency && collateralVaultCurrency.ticker === collateralCurrency.ticker);
            })
            .map((nomination) => nomination.amount)
            .reduce((previousValue, currentValue) => previousValue.add(currentValue), zero);
    }

    async listVaults(): Promise<InterbtcPrimitivesVaultId[]> {
        const nominatorMap = await this.api.query.nomination.vaults.entries();
        return nominatorMap.filter((v) => v[1]).map((v) => storageKeyToNthInner(v[0]));
    }

    async isVaultOptedIn(accountId: AccountId, collateralCurrencyIdLiteral: CollateralIdLiteral): Promise<boolean> {
        const optedInVaults = await this.listVaults();
        const collateralCurrency = currencyIdToMonetaryCurrency(
            newCurrencyId(this.api, collateralCurrencyIdLiteral)
        ) as CollateralCurrency;
        const vaultId = newVaultId(this.api, accountId.toString(), collateralCurrency, this.wrappedCurrency);
        return optedInVaults.includes(vaultId);
    }
}
