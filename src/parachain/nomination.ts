import { Network } from "bitcoinjs-lib";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Index } from "@polkadot/types/interfaces";
import { Currency, MonetaryAmount, BitcoinUnit } from "@interlay/monetary-js";

import { CurrencyId, UnsignedFixedPoint } from "../interfaces";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import { decodeFixedPointType, newAccountId, newMonetaryAmount, storageKeyToNthInner } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import {
    CollateralCurrency,
    CollateralUnit,
    currencyIdToMonetaryCurrency,
    CurrencyUnit,
    NominationStatus,
    tickerToCurrencyIdLiteral,
    WrappedCurrency,
} from "../types";
import { DefaultRewardsAPI, RewardsAPI } from "./rewards";

/**
 * @category InterBTC Bridge
 */
export interface NominationAPI extends TransactionAPI {
    /**
     * @param vaultId Vault to nominate collateral to
     * @param amount Amount to deposit, as a `Monetary.js` object
     */
    depositCollateral<C extends CollateralUnit>(vaultId: string, amount: MonetaryAmount<Currency<C>, C>): Promise<void>;
    /**
     * @param vaultId Vault that collateral was nominated to
     * @param amount Amount to withdraw, as a `Monetary.js` object
     */
    withdrawCollateral<C extends CollateralUnit>(
        vaultId: string,
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<void>;
    /**
     * @remarks Function callable by vaults to opt in to the nomination feature
     */
    optIn(): Promise<void>;
    /**
     * @remarks Function callable by vaults to opt out of the nomination feature
     */
    optOut(): Promise<void>;
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
     * There is a separate entry for each (nominatorId, vaultId) pair.
     * The return format is `[[nominatorId, vaultId], Nominator][]`
     */
    listNominationPairs<U extends CurrencyUnit>(currency: Currency<U>): Promise<[string, string][]>;
    /**
     * @param currency The currency of the nominations
     * @returns The rewards a nominator has accumulated, in wrapped token (e.g. interBTC, kBTC)
     */
    listNominatorRewards<C extends CollateralUnit>(
        currency: Currency<C>
    ): Promise<[[string, string], MonetaryAmount<WrappedCurrency, BitcoinUnit>][]>;
    /**
     * @returns A list of all vaults that opted in to the nomination feature.
     */
    listVaults(): Promise<string[]>;
    /**
     * @param A string representing the vault's account ID
     * @returns A boolean value
     */
    isVaultOptedIn(accountId: string): Promise<boolean>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of vault who is opted in to nomination
     * @returns A list of `[[nominatorId, vaultId], nominatedAmount, wrappedCurrency]` tuples
     */
    getFilteredNominations(
        nominatorId?: string,
        vaultId?: string
    ): Promise<[[string, string], MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>, WrappedCurrency][]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param collateralCurrency The collateral currency of the nominations
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of vault who is opted in to nomination
     * @returns The total nominated amount, filtered using the given parameters
     */
    getTotalNomination(
        collateralCurrency: CollateralCurrency,
        nominatorId?: string,
        vaultId?: string
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>>;
    /**
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param currency The currency of the nominations
     * @returns The rewards a currently active nominator has accumulated
     */
    getActiveNominatorRewards(
        nominatorId: string
    ): Promise<[[string, string], MonetaryAmount<WrappedCurrency, BitcoinUnit>][]>;
    /**
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of nominated vault
     * @param currency The currency towards whose issuance the nomination was made
     * @returns The rewards a (possibly inactive) nominator has accumulated
     */
    getNominatorReward(
        nominatorId: string,
        vaultId: string,
        currency: WrappedCurrency
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>>;
    /**
     *
     * @param currency The currency of the reward pool
     * @returns A map (vaultId => nonce), representing the nonces for each reward pool with the given currency
     */
    getNonces<U extends CurrencyUnit>(currency: Currency<U>): Promise<Map<string, number>>;
}

export class DefaultNominationAPI extends DefaultTransactionAPI implements NominationAPI {
    vaultsAPI: VaultsAPI;
    rewardsAPI: RewardsAPI;

    constructor(
        api: ApiPromise,
        btcNetwork: Network,
        electrsAPI: ElectrsAPI,
        private wrappedCurrency: WrappedCurrency,
        account?: AddressOrPair
    ) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI, wrappedCurrency);
        this.rewardsAPI = new DefaultRewardsAPI(api, btcNetwork, electrsAPI, wrappedCurrency);
    }

    async depositCollateral<C extends CollateralUnit>(
        vaultId: string,
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const tx = this.api.tx.nomination.depositCollateral(parsedVaultId, amountAsPlanck);
        await this.sendLogged(tx, this.api.events.nomination.DepositCollateral);
    }

    async withdrawCollateral<C extends CollateralUnit>(
        vaultId: string,
        amount: MonetaryAmount<Currency<C>, C>
    ): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Balance", amount.toString());
        const tx = this.api.tx.nomination.withdrawCollateral(parsedVaultId, amountAsPlanck);
        await this.sendLogged(tx, this.api.events.nomination.WithdrawCollateral);
    }

    async optIn(): Promise<void> {
        const tx = this.api.tx.nomination.optInToNomination();
        await this.sendLogged(tx, this.api.events.nomination.NominationOptIn);
    }

    async optOut(): Promise<void> {
        const tx = this.api.tx.nomination.optOutOfNomination();
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

    async getNonces<U extends CurrencyUnit>(currency: Currency<U>): Promise<Map<string, number>> {
        const currencyId = tickerToCurrencyIdLiteral(currency.ticker);
        const vaultIds = await this.listVaults();
        const nonceMap = new Map<string, number>();
        for (const vaultId of vaultIds) {
            const nonce = await this.rewardsAPI.getStakingPoolNonce(currencyId, vaultId);
            nonceMap.set(vaultId, nonce);
        }
        return nonceMap;
    }

    async listAllNominations(): Promise<
        [[WrappedCurrency, [number, string, string]], MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>][]
        > {
        const [head, nonces] = await Promise.all([
            this.api.rpc.chain.getFinalizedHead(),
            this.getNonces(this.wrappedCurrency),
        ]);
        const stakesMap = await this.api.query.staking.stake.entriesAt(head);
        return stakesMap
            .map(
                (
                    v
                ): [
                    [WrappedCurrency, [number, string, string]],
                    MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>
                ] => {
                    const currencyId = storageKeyToNthInner(v[0], 0) as CurrencyId;
                    const [nonce, vaultId, nominatorId] = storageKeyToNthInner(v[0], 1) as [
                        Index,
                        AccountId,
                        AccountId
                    ];
                    const nomination = decodeFixedPointType(v[1] as UnsignedFixedPoint);
                    const currency = currencyIdToMonetaryCurrency(currencyId);

                    const monetaryNomination = newMonetaryAmount(nomination, currency, true);
                    return [
                        [currency as WrappedCurrency, [nonce.toNumber(), vaultId.toString(), nominatorId.toString()]],
                        monetaryNomination as MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>,
                    ];
                }
            )
            .filter((v) => {
                const [issuedCurrency, [nonce, vaultId]] = v[0];
                const nomination = v[1];
                // Only consider active nominations, i.e. with the latest nonce
                return (
                    issuedCurrency.ticker === this.wrappedCurrency.ticker &&
                    nonce === nonces.get(vaultId) &&
                    nomination.toBig().gt(0)
                );
            });
    }

    async listNominationPairs(): Promise<[string, string][]> {
        const rawList = await this.listAllNominations();
        return rawList.map((v) => {
            const [, [, vaultId, nominatorId]] = v[0];
            return [vaultId, nominatorId];
        });
    }

    async listNominatorRewards(): Promise<[[string, string], MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>][]> {
        const rawList = await this.listAllNominations();
        return await Promise.all(
            rawList.map(async (v): Promise<[[string, string], MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>]> => {
                const [, [, vaultId, nominatorId]] = v[0];
                const reward = await this.rewardsAPI.computeReward(vaultId, nominatorId);
                return [[nominatorId, vaultId], reward];
            })
        );
    }

    async getActiveNominatorRewards(
        nominatorId: string
    ): Promise<[[string, string], MonetaryAmount<Currency<BitcoinUnit>, BitcoinUnit>][]> {
        const nominatorRewards = await this.listNominatorRewards();
        return nominatorRewards.filter((v) => {
            const [nominator] = v[0];
            return nominator === nominatorId;
        });
    }

    async getNominatorReward(
        nominatorId: string,
        vaultId: string
    ): Promise<MonetaryAmount<WrappedCurrency, BitcoinUnit>> {
        return await this.rewardsAPI.computeReward(vaultId, nominatorId);
    }

    async getFilteredNominations(
        nominatorId?: string,
        vaultId?: string
    ): Promise<[[string, string], MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>, WrappedCurrency][]> {
        if (!nominatorId && !vaultId) {
            return Promise.reject(new Error("At least one parameter should be specified"));
        }

        const rawList = await this.listAllNominations();

        // rawList is of type `[[nominatorId, vaultId], Nominator, WrappedCurrency][]`.
        // Filter by nominatorId and vaultId if each is defined respectively.
        const nominationEntries = rawList.filter((v) => {
            const [, [, vault, nominator]] = v[0];

            return (!nominatorId || nominator === nominatorId) && (!vaultId || vault === vaultId);
        });
        return await Promise.all(
            nominationEntries.map(
                async (
                    v
                ): Promise<
                    [[string, string], MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>, WrappedCurrency]
                > => {
                    const [wrappedCurrency, [, vaultId, nominatorId]] = v[0];
                    return [
                        [nominatorId, vaultId],
                        await this.rewardsAPI.computeCollateralInStakingPool(vaultId, nominatorId),
                        wrappedCurrency,
                    ];
                }
            )
        );
    }

    async getNominationStatus(nominatorId: string, vaultId: string): Promise<NominationStatus> {
        // There is at most one entry determined by this pair
        const filteredNominations = await this.getFilteredNominations(nominatorId, vaultId);
        if (filteredNominations.length === 0) {
            return Promise.reject(new Error("No nomination associated with this (nominator, vault) pair"));
        }
        const filteredNomination = filteredNominations[0];
        if (filteredNomination[1].isZero()) {
            return NominationStatus.Unstaked;
        } else {
            return NominationStatus.Staked;
        }
    }

    async getTotalNomination(
        collateralCurrency: CollateralCurrency,
        nominatorId?: string,
        vaultId?: string
    ): Promise<MonetaryAmount<Currency<CollateralUnit>, CollateralUnit>> {
        const filteredNominations = await this.getFilteredNominations(nominatorId, vaultId);
        if (!filteredNominations.length) {
            // Cannot return `zero` because the type of nominated collateral is unknown
            return Promise.reject("No nomination available");
        }
        const zero = newMonetaryAmount<CollateralUnit>(0, collateralCurrency as Currency<CollateralUnit>);
        return filteredNominations
            .filter(
                (v) => v[2].ticker === this.wrappedCurrency.ticker && v[1].currency.ticker === collateralCurrency.ticker
            )
            .map((v) => v[1])
            .reduce((previousValue, currentValue) => previousValue.add(currentValue), zero);
    }

    async listVaults(): Promise<string[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nominatorMap = await this.api.query.nomination.vaults.entriesAt(head);
        return nominatorMap.filter((v) => v[1]).map((v) => storageKeyToNthInner(v[0]).toString());
    }

    async isVaultOptedIn(accountId: string): Promise<boolean> {
        const optedInVaults = await this.listVaults();
        return optedInVaults.includes(accountId);
    }
}
