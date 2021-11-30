import { Network } from "bitcoinjs-lib";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Index } from "@polkadot/types/interfaces";
import { Currency, MonetaryAmount, BitcoinUnit } from "@interlay/monetary-js";
import type { InterbtcPrimitivesVaultId } from "@polkadot/types/lookup";

import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    decodeFixedPointType,
    encodeVaultId,
    newCurrencyId,
    newMonetaryAmount,
    newVaultCurrencyPair,
    newVaultId,
    storageKeyToNthInner,
} from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
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
import { DefaultRewardsAPI, RewardsAPI } from "./rewards";
import { UnsignedFixedPoint } from "../interfaces";

export enum NominationAmountType {
    Raw = "raw",
    Parsed = "parsed",
}
export type NominationData<U extends CurrencyUnit> = [number, InterbtcPrimitivesVaultId, AccountId, MonetaryAmount<Currency<U>, U>];
export type RawNomination = [...NominationData<CollateralUnit>, NominationAmountType.Raw];
// The difference between `RawNomination` and `Nomination` is that the former stores the raw nomination amount (non-slashed)
// while the latter takes slashing into account.
export type Nomination = [...NominationData<CollateralUnit>, NominationAmountType.Parsed];
export type NominationReward = NominationData<BitcoinUnit>;

/**
 * @category InterBTC Bridge
 */
export interface NominationAPI extends TransactionAPI {
    /**
     * @param vaultId Vault to nominate collateral to
     * @param amount Amount to deposit, as a `Monetary.js` object
     */
    depositCollateral<C extends CollateralUnit>(
        vaultId: AccountId,
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<void>;
    /**
     * @param vaultId Vault that collateral was nominated to
     * @param amount Amount to withdraw, as a `Monetary.js` object
     */
    withdrawCollateral<C extends CollateralUnit>(
        vaultId: AccountId,
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
     * @param currency The currency of the nominations
     * @returns A list of all users who nominated collateral to vaults.
     */
    listNominationPairs(): Promise<[InterbtcPrimitivesVaultId, AccountId][]>;
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
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultAccountId Id of vault who is opted in to nomination
     */
    getFilteredNominations(nominatorId?: AccountId, vaultAccountId?: AccountId): Promise<Nomination[]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param collateralCurrency The collateral currency of the nominations
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultAccountId Id of vault who is opted in to nomination
     * @returns The total nominated amount, filtered using the given parameters
     */
    getTotalNomination(
        collateralCurrency: CollateralCurrency,
        nominatorId?: AccountId,
        vaultAccountId?: AccountId
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
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of nominated vault
     * @param currency The currency towards whose issuance the nomination was made
     * @returns The rewards a (possibly inactive) nominator has accumulated
     */
    getNominatorReward(
        nominatorId: AccountId,
        vaultId: AccountId,
        collateralCurrencyId: CollateralIdLiteral
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     *
     * @param currency The currency of the reward pool
     * @returns A map (vaultId => nonce), representing the nonces for each reward pool with the given currency
     */
    getNonces(): Promise<Map<string, number>>;
}

export class DefaultNominationAPI extends DefaultTransactionAPI implements NominationAPI {
    vaultsAPI: VaultsAPI;
    rewardsAPI: RewardsAPI;

    constructor(
        api: ApiPromise,
        btcNetwork: Network,
        electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        private nativeCurrency: CollateralCurrency,
        account?: AddressOrPair
    ) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI, wrappedCurrency, nativeCurrency);
        this.rewardsAPI = new DefaultRewardsAPI(api, btcNetwork, electrsAPI, wrappedCurrency, nativeCurrency);
    }

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
        await this.sendLogged(tx, this.api.events.nomination.DepositCollateral);
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
        await this.sendLogged(tx, this.api.events.nomination.WithdrawCollateral);
    }

    async optIn(collateralCurrency: CollateralCurrency): Promise<void> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const tx = this.api.tx.nomination.optInToNomination(vaultCurrencyPair);
        await this.sendLogged(tx, this.api.events.nomination.NominationOptIn);
    }

    async optOut(collateralCurrency: CollateralCurrency): Promise<void> {
        const vaultCurrencyPair = newVaultCurrencyPair(this.api, collateralCurrency, this.wrappedCurrency);
        const tx = this.api.tx.nomination.optOutOfNomination(vaultCurrencyPair);
        await this.sendLogged(tx, this.api.events.nomination.NominationOptOut);
    }

    async setNominationEnabled(enabled: boolean): Promise<void> {
        const tx = this.api.tx.sudo.sudo(this.api.tx.nomination.setNominationEnabled(enabled));
        await this.sendLogged(tx);
    }

    async isNominationEnabled(): Promise<boolean> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const isNominationEnabled = await this.api.query.nomination.nominationEnabled.at(head);
        return isNominationEnabled.isTrue;
    }

    async getNonces(): Promise<Map<string, number>> {
        const vaultIds = await this.listVaults();
        const nonceMap = new Map<string, number>();
        for (const vaultId of vaultIds) {
            const nonce = await this.rewardsAPI.getStakingPoolNonce(
                currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral,
                vaultId.accountId
            );
            currencyIdToLiteral;
            nonceMap.set(encodeVaultId(vaultId), nonce);
        }
        return nonceMap;
    }

    async listAllNominations(): Promise<RawNomination[]> {
        const [head, nonces] = await Promise.all([this.api.rpc.chain.getFinalizedHead(), this.getNonces()]);
        const stakesMap = await this.api.query.staking.stake.entriesAt(head);
        return stakesMap
            .map((v): RawNomination => {
                const nonce = storageKeyToNthInner(v[0], 0) as Index;
                const [vaultId, nominatorId] = storageKeyToNthInner(v[0], 1) as [InterbtcPrimitivesVaultId, AccountId];
                const nomination = decodeFixedPointType(v[1] as UnsignedFixedPoint);
                const collateralCurrency = currencyIdToMonetaryCurrency(vaultId.currencies.collateral);
                const monetaryNomination = newMonetaryAmount(nomination, collateralCurrency, true);
                return [
                    nonce.toNumber(),
                    vaultId,
                    nominatorId,
                    monetaryNomination as MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>,
                    NominationAmountType.Raw,
                ];
            })
            .filter(([nonce, vaultId, _nominatorId, nomination]) => {
                const wrappedCurrency = currencyIdToMonetaryCurrency(vaultId.currencies.wrapped);
                const vaultIdHighestNonce = nonces.get(encodeVaultId(vaultId));
                // Only consider active nominations, i.e. with the latest nonce
                return (
                    wrappedCurrency.ticker === this.wrappedCurrency.ticker &&
                    nonce === vaultIdHighestNonce &&
                    nomination.toBig().gt(0)
                );
            });
    }

    async listNominationPairs(): Promise<[InterbtcPrimitivesVaultId, AccountId][]> {
        const rawList = await this.listAllNominations();
        return rawList.map((v) => {
            const [, vaultId, nominatorId] = v;
            return [vaultId, nominatorId];
        });
    }

    async listNominatorRewards(): Promise<NominationReward[]> {
        const rawList = await this.listAllNominations();
        return await Promise.all(
            rawList.map(async (v): Promise<NominationReward> => {
                const [nonce, vaultId, nominatorId] = v;
                const reward = await this.rewardsAPI.computeReward(
                    vaultId.accountId,
                    nominatorId,
                    currencyIdToLiteral(vaultId.currencies.collateral) as CollateralIdLiteral,
                    currencyIdToLiteral(vaultId.currencies.wrapped) as WrappedIdLiteral
                );
                return [nonce, vaultId, nominatorId, reward];
            })
        );
    }

    async getActiveNominatorRewards(
        nominatorId: AccountId,
    ): Promise<NominationReward[]> {
        const nominatorRewards = await this.listNominatorRewards();
        return nominatorRewards.filter((v) => {
            const [, , nominator] = v;
            return nominator.toString() === nominatorId.toString();
        });
    }

    async getNominatorReward(
        nominatorId: AccountId,
        vaultId: AccountId,
        collateralCurrencyId: CollateralIdLiteral
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        return await this.rewardsAPI.computeReward(
            vaultId,
            nominatorId,
            collateralCurrencyId,
            tickerToCurrencyIdLiteral(this.wrappedCurrency.ticker) as WrappedIdLiteral
        );
    }

    async getFilteredNominations(
        nominatorId?: AccountId,
        vaultId?: AccountId,
        collateralCurrencyId?: CurrencyIdLiteral
    ): Promise<Nomination[]> {
        if (!nominatorId && !vaultId) {
            return Promise.reject(new Error("At least one parameter should be specified"));
        }

        const rawList = await this.listAllNominations();

        // rawList is of type `[[nominatorId, vaultId], Nominator, WrappedCurrency][]`.
        // Filter by nominatorId and vaultId if each is defined respectively.
        const rawNominations = rawList.filter((v) => {
            const [, vaultId, nominatorId, nomination] = v;
            const nominationCurrencyId = tickerToCurrencyIdLiteral(nomination.currency.ticker);
            return (
                (!nominatorId || nominatorId === nominatorId) &&
                (!vaultId || vaultId === vaultId) &&
                (!collateralCurrencyId || collateralCurrencyId === nominationCurrencyId)
            );
        });
        return await Promise.all(
            rawNominations.map(async (v): Promise<Nomination> => {
                const [nonce, vaultId, nominatorId, nomination] = v;
                const nominationCurrencyId = tickerToCurrencyIdLiteral(
                    nomination.currency.ticker
                ) as CollateralIdLiteral;
                return [
                    nonce,
                    vaultId,
                    nominatorId,
                    await this.rewardsAPI.computeCollateralInStakingPool(
                        vaultId.accountId,
                        nominatorId,
                        nominationCurrencyId
                    ),
                    NominationAmountType.Parsed,
                ];
            })
        );
    }

    async getNominationStatus(nominatorId: AccountId, vaultId: AccountId): Promise<NominationStatus> {
        // There is at most one entry determined by this pair
        const filteredNominations = await this.getFilteredNominations(nominatorId, vaultId);
        if (filteredNominations.length === 0) {
            return Promise.reject(new Error("No nomination associated with this (nominator, vault) pair"));
        }
        const [, , , nominatedAmount] = filteredNominations[0];
        if (nominatedAmount.isZero()) {
            return NominationStatus.Unstaked;
        } else {
            return NominationStatus.Staked;
        }
    }

    async getTotalNomination(
        collateralCurrency: CollateralCurrency,
        nominatorId?: AccountId,
        vaultId?: AccountId
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const filteredNominations = await this.getFilteredNominations(nominatorId, vaultId);
        if (!filteredNominations.length) {
            // Cannot return `zero` because the type of nominated collateral is unknown
            return Promise.reject("No nomination available");
        }
        const zero = newMonetaryAmount<CollateralUnit>(0, collateralCurrency as Currency<CollateralUnit>);
        return filteredNominations
            .filter((v) => {
                const [, vaultId, , ,] = v;
                const wrappedVaultCurrency = currencyIdToMonetaryCurrency(vaultId.currencies.wrapped);
                const collateralVaultCurrency = currencyIdToMonetaryCurrency(vaultId.currencies.collateral);
                wrappedVaultCurrency.ticker === this.wrappedCurrency.ticker &&
                    collateralVaultCurrency.ticker === collateralCurrency.ticker;
            })
            .map((v) => v[3])
            .reduce((previousValue, currentValue) => previousValue.add(currentValue), zero);
    }

    async listVaults(): Promise<InterbtcPrimitivesVaultId[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nominatorMap = await this.api.query.nomination.vaults.entriesAt(head);
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
