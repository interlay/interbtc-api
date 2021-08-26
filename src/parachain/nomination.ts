import { Network } from "bitcoinjs-lib";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Index } from "@polkadot/types/interfaces";
import { Bitcoin, Currency, BTCAmount, MonetaryAmount, Polkadot } from "@interlay/monetary-js";

import { CurrencyId, UnsignedFixedPoint } from "../interfaces";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import { decodeFixedPointType, newAccountId, newMonetaryAmount, storageKeyToNthInner } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import {
    CollateralUnit,
    currencyIdToMonetaryCurrency,
    CurrencyUnit,
    NominationStatus,
    tickerToCurrencyIdLiteral,
} from "../types";
import { DefaultPoolsAPI, PoolsAPI } from "./pools";

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
    listNominationPairs<C extends CurrencyUnit>(currency: Currency<C>): Promise<[string, string][]>;
    /**
     * @param currency The currency of the nominations
     * @returns The rewards (in InterBTC a nominator has accumulated)
     */
    listNominatorRewards<C extends CollateralUnit>(currency: Currency<C>): Promise<[[string, string], BTCAmount][]>;
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
     * @param currency The currency of the nominations
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of vault who is opted in to nomination
     * @returns A list of `[[nominatorId, vaultId], nominatedAmount]` tuples
     */
    getFilteredNominations<C extends CollateralUnit>(
        currency: Currency<C>,
        nominatorId?: string,
        vaultId?: string
    ): Promise<[[string, string], MonetaryAmount<Currency<C>, C>][]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param currency The collateral currency of the nominations
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of vault who is opted in to nomination
     * @returns The total nominated amount, filtered using the given parameters
     */
    getTotalNomination<C extends CollateralUnit>(
        currency: Currency<C>,
        nominatorId?: string,
        vaultId?: string
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param currency The currency of the nominations
     * @returns The rewards a currently active nominator has accumulated
     */
    getActiveNominatorRewards<C extends CurrencyUnit>(
        nominatorId: string,
        currency: Currency<C>
    ): Promise<[[string, string], BTCAmount][]>;
    /**
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of nominated vault
     * @param currency The currency of the nominations
     * @returns The rewards a (possibly inactive) nominator has accumulated
     */
    getNominatorReward<C extends CurrencyUnit>(
        nominatorId: string,
        vaultId: string,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>>;
    /**
     *
     * @param currency The currency of the reward pool
     * @returns A map (nomineeId => nonce), representing the nonces for each reward pool with the given currency
     */
    getNonces<C extends CurrencyUnit>(currency: Currency<C>): Promise<Map<string, number>>;
}

export class DefaultNominationAPI extends DefaultTransactionAPI implements NominationAPI {
    vaultsAPI: VaultsAPI;
    poolsAPI: PoolsAPI;

    constructor(api: ApiPromise, btcNetwork: Network, electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI);
        this.poolsAPI = new DefaultPoolsAPI(api, btcNetwork, electrsAPI);
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

    async getNonces<C extends CurrencyUnit>(currency: Currency<C>): Promise<Map<string, number>> {
        const currencyId = tickerToCurrencyIdLiteral(currency.ticker);
        const vaultIds = await this.listVaults();
        const nonceMap = new Map<string, number>();
        for (const vaultId of vaultIds) {
            const nonce = await this.poolsAPI.getStakingPoolNonce(currencyId, vaultId);
            nonceMap.set(vaultId, nonce);
        }
        return nonceMap;
    }

    async listNominatorsRaw<C extends CurrencyUnit>(
        currency: Currency<C>
    ): Promise<
        [[Currency<CurrencyUnit>, [number, string, string]], MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>][]
    > {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nonces = await this.getNonces(currency);

        const stakesMap = await this.api.query.staking.stake.entriesAt(head);
        return stakesMap
            .map(
                (
                    v
                ): [
                    [Currency<CurrencyUnit>, [number, string, string]],
                    MonetaryAmount<Currency<CurrencyUnit>, CurrencyUnit>
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
                        [currency, [nonce.toNumber(), vaultId.toString(), nominatorId.toString()]],
                        monetaryNomination,
                    ];
                }
            )
            .filter((v) => {
                const [stakedCurrency, [nonce, vaultId]] = v[0];
                // Only consider active nominations, i.e. with the latest nonce
                return stakedCurrency.name === currency.name && nonce === nonces.get(vaultId);
            });
    }

    async listNominationPairs<C extends CurrencyUnit>(currency: Currency<C>): Promise<[string, string][]> {
        const rawList = await this.listNominatorsRaw(currency);
        return rawList.map((v) => {
            const [, [, vaultId, nominatorId]] = v[0];
            return [vaultId, nominatorId];
        });
    }

    // TODO: Are nominator rewards always in BTC, or might other currencies be used?
    async listNominatorRewards<C extends CurrencyUnit>(
        collateralCurrency: Currency<C>
    ): Promise<[[string, string], BTCAmount][]> {
        const rawList = await this.listNominatorsRaw(collateralCurrency);
        return await Promise.all(
            rawList.map(async (v): Promise<[[string, string], BTCAmount]> => {
                const [, [, vaultId, nominatorId]] = v[0];
                const reward = await this.poolsAPI.computeReward(Bitcoin, Polkadot, vaultId, nominatorId);
                return [[nominatorId, vaultId], reward];
            })
        );
    }

    async getActiveNominatorRewards<C extends CurrencyUnit>(
        nominatorId: string,
        collateralCurrency: Currency<C>
    ): Promise<[[string, string], BTCAmount][]> {
        const nominatorRewards = await this.listNominatorRewards(collateralCurrency);
        return nominatorRewards.filter((v) => {
            const [nominator] = v[0];
            return nominator === nominatorId;
        });
    }

    async getNominatorReward<C extends CurrencyUnit>(
        nominatorId: string,
        vaultId: string,
        currency: Currency<C>
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        return await this.poolsAPI.computeReward(currency, Polkadot, vaultId, nominatorId);
    }

    async getFilteredNominations<C extends CollateralUnit>(
        currency: Currency<C>,
        nominatorId?: string,
        vaultId?: string
    ): Promise<[[string, string], MonetaryAmount<Currency<C>, C>][]> {
        if (!nominatorId && !vaultId) {
            return Promise.reject(new Error("At least one parameter should be specified"));
        }

        const rawList = await this.listNominatorsRaw(currency);

        // rawList is of type `[[nominatorId, vaultId], Nominator][]`.
        // Filter by nominatorId and vaultId if each is defined respectively.
        const nominationEntries = rawList.filter((v) => {
            const [, [, vault, nominator]] = v[0];

            return (!nominatorId || nominator === nominatorId) && (!vaultId || vault === vaultId);
        });
        return await Promise.all(
            nominationEntries.map(async (v): Promise<[[string, string], MonetaryAmount<Currency<C>, C>]> => {
                const [, [, vault, nominator]] = v[0];
                return [
                    [nominator, vault],
                    await this.poolsAPI.computeCollateralInStakingPool(currency, vault, nominator),
                ];
            })
        );
    }

    async getNominationStatus<C extends CollateralUnit>(
        currency: Currency<C>,
        nominatorId: string,
        vaultId: string
    ): Promise<NominationStatus> {
        // There is at most one entry determined by this pair
        const filteredNominations = await this.getFilteredNominations(currency, nominatorId, vaultId);
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

    async getTotalNomination<C extends CollateralUnit>(
        currency: Currency<C>,
        nominatorId?: string,
        vaultId?: string
    ): Promise<MonetaryAmount<Currency<C>, C>> {
        const filteredNominations = await this.getFilteredNominations(currency, nominatorId, vaultId);
        const zero = new MonetaryAmount<Currency<C>, C>(currency, 0);
        return filteredNominations
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
