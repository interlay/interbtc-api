import { ApiPromise } from "@polkadot/api";
import { AccountId, Index } from "@polkadot/types/interfaces";
import { Currency, MonetaryAmount } from "@interlay/monetary-js";
import type { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import { VaultsAPI } from "./vaults";
import {
    decodeFixedPointType,
    isCurrencyEqual,
    newMonetaryAmount,
    newVaultCurrencyPair,
    newVaultId,
    queryNominationsMap,
    storageKeyToNthInner,
} from "../utils";
import { TransactionAPI } from "./transaction";
import { CollateralCurrencyExt, NominationStatus, WrappedCurrency } from "../types";
import { RewardsAPI } from "./rewards";
import { UnsignedFixedPoint } from "../interfaces";
import { AssetRegistryAPI } from "../parachain/asset-registry";
import { currencyIdToMonetaryCurrency } from "../utils/currency";
import { LoansAPI } from "./loans";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

export enum NominationAmountType {
    Raw = "raw",
    Parsed = "parsed",
}
export type NominationData = {
    nonce: number;
    vaultId: InterbtcPrimitivesVaultId;
    nominatorId: AccountId;
    amount: MonetaryAmount<Currency>;
};

export type RawNomination = NominationData & { type: NominationAmountType.Raw };
export type Nomination = NominationData & { type: NominationAmountType.Parsed };
export type NominationReward = NominationData;

/**
 * @category BTC Bridge
 */
export interface NominationAPI {
    /**
     * @param vaultAccountId Vault to nominate collateral to
     * @param amount Amount to deposit, as a `Monetary.js` object or `ForeignAsset`
     */
    depositCollateral(vaultAccountId: AccountId, amount: MonetaryAmount<CollateralCurrencyExt>): Promise<void>;
    /**
     * @param vaultAccountId Vault that collateral was nominated to
     * @param amount Amount to withdraw, as a `Monetary.js` object or `ForeignAsset`
     */
    withdrawCollateral(vaultAccountId: AccountId, amount: MonetaryAmount<CollateralCurrencyExt>): Promise<void>;
    /**
     * @param collateralCurrency Currency to accept as nomination
     * @remarks Function callable by vaults to opt in to the nomination feature
     */
    optIn(collateralCurrency: CollateralCurrencyExt): Promise<void>;
    /**
     * @param collateralCurrency Currency to stop accepting as nomination
     * @remarks Function callable by vaults to opt out of the nomination feature
     */
    optOut(collateralCurrency: CollateralCurrencyExt): Promise<void>;
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
    isVaultOptedIn(accountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<boolean>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param vaultAccountId Id of vault who is opted in to nomination
     * @param collateralCurrencyId The collateral currency of the nominations
     * @param nominatorId Id of user who nominated to one or more vaults
     */
    getFilteredNominations(
        vaultAccountId?: AccountId,
        collateralCurrency?: CollateralCurrencyExt,
        nominatorId?: AccountId
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
        collateralCurrency?: CollateralCurrencyExt,
        nominatorId?: AccountId
    ): Promise<MonetaryAmount<CollateralCurrencyExt>>;
    /**
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @returns The rewards a currently active nominator has accumulated
     */
    getActiveNominatorRewards(nominatorId: AccountId): Promise<NominationReward[]>;
    /**
     * @param vaultAccountId Id of nominated vault
     * @param collateralCurrency The currency towards whose issuance the nomination was made
     * @param rewardCurrency The reward currency, e.g. kBTC, KINT, interBTC, INTR
     * @param nominatorId Id of user who nominated to one or more vaults
     * @returns The rewards a (possibly inactive) nominator has accumulated
     */
    getNominatorReward(
        vaultId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        rewardCurrency: Currency,
        nominatorId: AccountId
    ): Promise<MonetaryAmount<Currency>>;
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
        private transactionAPI: TransactionAPI,
        private assetRegistryAPI: AssetRegistryAPI,
        private loansAPI: LoansAPI
    ) {}

    static buildDepositCollateralExtrinsic(
        api: ApiPromise,
        vaultAccountId: AccountId,
        amount: MonetaryAmount<CollateralCurrencyExt>,
        wrappedCurrency: Currency
    ): SubmittableExtrinsic<"promise", ISubmittableResult> {
        const vaultId = newVaultId(api, vaultAccountId.toString(), amount.currency, wrappedCurrency);
        const amountAsPlanck = api.createType("Balance", amount.toString(true));
        return api.tx.nomination.depositCollateral(vaultId, amountAsPlanck);
    }

    async depositCollateral(vaultAccountId: AccountId, amount: MonetaryAmount<CollateralCurrencyExt>): Promise<void> {
        const tx = DefaultNominationAPI.buildDepositCollateralExtrinsic(
            this.api,
            vaultAccountId,
            amount,
            this.wrappedCurrency
        );
        await this.transactionAPI.sendLogged(tx, this.api.events.nomination.DepositCollateral, true);
    }

    static async buildWithdrawCollateralExtrinsic(
        api: ApiPromise,
        rewardsAPI: RewardsAPI,
        vaultAccountId: AccountId,
        amount: MonetaryAmount<CollateralCurrencyExt>,
        wrappedCurrency: Currency,
        nonce?: number
    ): Promise<SubmittableExtrinsic<"promise", ISubmittableResult>> {
        const vaultId = newVaultId(api, vaultAccountId.toString(), amount.currency, wrappedCurrency);
        const definedNonce = nonce ? nonce : await rewardsAPI.getStakingPoolNonce(amount.currency, vaultAccountId);
        const amountAsPlanck = api.createType("Balance", amount.toString(true));
        const parsedNonce = api.createType("Index", definedNonce);
        return api.tx.nomination.withdrawCollateral(vaultId, amountAsPlanck, parsedNonce);
    }

    async withdrawCollateral(
        vaultAccountId: AccountId,
        amount: MonetaryAmount<CollateralCurrencyExt>,
        nonce?: number
    ): Promise<void> {
        const tx = await DefaultNominationAPI.buildWithdrawCollateralExtrinsic(
            this.api,
            this.rewardsAPI,
            vaultAccountId,
            amount,
            this.wrappedCurrency,
            nonce
        );
        await this.transactionAPI.sendLogged(tx, this.api.events.nomination.WithdrawCollateral, true);
    }

    async optIn(collateralCurrency: CollateralCurrencyExt): Promise<void> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const tx = this.api.tx.nomination.optInToNomination(vaultCurrencyPair);
        await this.transactionAPI.sendLogged(tx, this.api.events.nomination.NominationOptIn, true);
    }

    async optOut(collateralCurrency: CollateralCurrencyExt): Promise<void> {
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
                await currencyIdToMonetaryCurrency(this.assetRegistryAPI, this.loansAPI, vaultId.currencies.collateral),
                vaultId.accountId
            );
            nonceMap.set(vaultId, nonce);
        }
        return nonceMap;
    }

    async listAllNominations(): Promise<RawNomination[]> {
        const nonces = await this.getNonces();
        const stakesMap = await this.api.query.vaultStaking.stake.entries();

        const nominations: RawNomination[] = [];
        for (const v of stakesMap) {
            const nonce = storageKeyToNthInner(v[0], 0) as Index;
            const [vaultId, nominatorId] = storageKeyToNthInner(v[0], 1) as [InterbtcPrimitivesVaultId, AccountId];
            const nomination = decodeFixedPointType(v[1] as UnsignedFixedPoint);
            const collateralCurrency = await currencyIdToMonetaryCurrency(
                this.assetRegistryAPI,
                this.loansAPI,
                vaultId.currencies.collateral
            );
            const monetaryNomination = newMonetaryAmount(nomination, collateralCurrency, true);

            const rawNomination = {
                nonce: nonce.toNumber(),
                vaultId,
                nominatorId,
                amount: monetaryNomination,
                type: NominationAmountType.Raw,
            } as RawNomination;

            // Cannot just do `nonces.get(rawNomination.vaultId)` because vaultId objects differ
            // ever so slightly even if they have identical properties
            const vaultIdHighestNonce = await queryNominationsMap(
                this.assetRegistryAPI,
                this.loansAPI,
                nonces,
                rawNomination.vaultId
            );
            // Only consider active nominations, i.e. with the latest nonce
            if (rawNomination.nonce === vaultIdHighestNonce && rawNomination.amount.toBig().gt(0)) {
                nominations.push(rawNomination);
            }
        }

        return nominations;
    }

    async listNominatorRewards(): Promise<NominationReward[]> {
        const rawList = await this.listAllNominations();
        return await Promise.all(
            rawList.map(async (rawNomination): Promise<NominationReward> => {
                const reward = await this.vaultsAPI.computeReward(
                    rawNomination.vaultId.accountId,
                    await currencyIdToMonetaryCurrency(
                        this.assetRegistryAPI,
                        this.loansAPI,
                        rawNomination.vaultId.currencies.collateral
                    ),
                    await currencyIdToMonetaryCurrency(
                        this.assetRegistryAPI,
                        this.loansAPI,
                        rawNomination.vaultId.currencies.wrapped
                    )
                );
                return {
                    nonce: rawNomination.nonce,
                    vaultId: rawNomination.vaultId,
                    nominatorId: rawNomination.nominatorId,
                    amount: reward,
                };
            })
        );
    }

    async getActiveNominatorRewards(nominatorId: AccountId): Promise<NominationReward[]> {
        const nominatorRewards = await this.listNominatorRewards();
        return nominatorRewards.filter((nominationReward) => {
            return nominationReward.nominatorId.toString() === nominatorId.toString();
        });
    }

    async getNominatorReward(
        vaultId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        rewardCurrency: Currency,
    ): Promise<MonetaryAmount<Currency>> {
        return await this.vaultsAPI.computeReward(vaultId, collateralCurrency, rewardCurrency);
    }

    async list(): Promise<Nomination[]> {
        return await this.getFilteredNominations();
    }

    async getFilteredNominations(
        vaultId?: AccountId,
        collateralCurrency?: CollateralCurrencyExt,
        nominatorId?: AccountId
    ): Promise<Nomination[]> {
        const rawList = await this.listAllNominations();
        // Filter by nominatorId and vaultId if each is defined respectively.
        const rawNominations: typeof rawList = [];
        for (const rawNomination of rawList) {
            const nominationCurrency = await currencyIdToMonetaryCurrency(
                this.assetRegistryAPI,
                this.loansAPI,
                rawNomination.vaultId.currencies.collateral
            );
            const nominationWrappedCurrency = await currencyIdToMonetaryCurrency(
                this.assetRegistryAPI,
                this.loansAPI,
                rawNomination.vaultId.currencies.wrapped
            );
            const wrappedCurrency = this.wrappedCurrency;

            if (
                (!nominatorId || nominatorId === nominatorId) &&
                (!vaultId || vaultId === vaultId) &&
                (!collateralCurrency || isCurrencyEqual(collateralCurrency, nominationCurrency)) &&
                isCurrencyEqual(nominationWrappedCurrency, wrappedCurrency)
            ) {
                rawNominations.push(rawNomination);
            }
        }

        return await Promise.all(
            rawNominations.map(async (rawNomination): Promise<Nomination> => {
                return {
                    ...rawNomination,
                    amount: await this.rewardsAPI.computeCollateralInStakingPool(
                        rawNomination.vaultId,
                        rawNomination.nominatorId
                    ),
                    type: NominationAmountType.Parsed,
                };
            })
        );
    }

    async getNominationStatus(
        vaultId: AccountId,
        collateralCurrency: CollateralCurrencyExt,
        nominatorId: AccountId
    ): Promise<NominationStatus> {
        // There is at most one entry determined by this pair
        const filteredNominations = await this.getFilteredNominations(vaultId, collateralCurrency, nominatorId);
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
        collateralCurrency?: CollateralCurrencyExt,
        nominatorId?: AccountId
    ): Promise<MonetaryAmount<CollateralCurrencyExt>> {
        const filteredNominations = await this.getFilteredNominations(vaultId, collateralCurrency, nominatorId);
        if (!filteredNominations.length) {
            // Cannot return `zero` because the type of nominated collateral is unknown
            return Promise.reject("No nomination available");
        }
        const zero = newMonetaryAmount(0, collateralCurrency as Currency);

        const ccyFilteredNominations: typeof filteredNominations = [];
        for (const nomination of filteredNominations) {
            const wrappedVaultCurrency = await currencyIdToMonetaryCurrency(
                this.assetRegistryAPI,
                this.loansAPI,
                nomination.vaultId.currencies.wrapped
            );
            const collateralVaultCurrency = await currencyIdToMonetaryCurrency(
                this.assetRegistryAPI,
                this.loansAPI,
                nomination.vaultId.currencies.collateral
            );

            if (
                wrappedVaultCurrency.ticker === this.wrappedCurrency.ticker &&
                collateralCurrency &&
                collateralVaultCurrency.ticker === collateralCurrency.ticker
            ) {
                ccyFilteredNominations.push(nomination);
            }
        }
        return ccyFilteredNominations
            .map((nomination) => nomination.amount)
            .reduce((previousValue, currentValue) => previousValue.add(currentValue), zero);
    }

    async listVaults(): Promise<InterbtcPrimitivesVaultId[]> {
        const nominatorMap = await this.api.query.nomination.vaults.entries();
        return nominatorMap.filter((v) => v[1]).map((v) => storageKeyToNthInner(v[0]));
    }

    async isVaultOptedIn(accountId: AccountId, collateralCurrency: CollateralCurrencyExt): Promise<boolean> {
        const optedInVaults = await this.listVaults();
        const vaultId = newVaultId(this.api, accountId.toString(), collateralCurrency, this.wrappedCurrency);
        return optedInVaults.includes(vaultId);
    }
}
