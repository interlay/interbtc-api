import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId } from "@polkadot/types/interfaces";

import { Nominator } from "../interfaces";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import {
    bnToBig,
    computeLazyDistribution,
    decodeFixedPointType,
    dotToPlanck,
    newAccountId,
    storageKeyToNthInner,
} from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
import { NominationStatus } from "../types";
import { Bitcoin, BTCAmount, PolkadotAmount } from "../../../monetary/build";

/**
 * @category InterBTC Bridge
 * The type Big represents DOT or InterBTC denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface NominationAPI extends TransactionAPI {
    /**
     * @param vaultId Vault to nominate collateral to
     * @param amount Amount, in collateral token (e.g. DOT), to deposit
     */
    depositCollateral(vaultId: string, amount: Big): Promise<void>;
    /**
     * @param vaultId Vault that collateral was nominated to
     * @param amount Amount, in collateral token (e.g. DOT), to withdraw
     */
    withdrawCollateral(vaultId: string, amount: Big): Promise<void>;
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
     * @returns A list of all users who nominated collateral to vaults.
     * There is a separate entry for each (nominatorId, vaultId) pair.
     * The return format is `[[nominatorId, vaultId], Nominator][]`
     */
    listNominationPairs(): Promise<[AccountId, AccountId][]>;
    /**
     * @returns The rewards (in InterBTC a nominator has accumulated)
     */
    listNominatorRewards(): Promise<[[AccountId, AccountId], BTCAmount][]>;
    /**
     * @returns A list of all vaults that opted in to the nomination feature.
     */
    listVaults(): Promise<AccountId[]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of vault who is opted in to nomination
     * @returns A list of `[nominatorId, vaultId], nominatedAmount` pairs
     */
    getFilteredNominations(nominatorId?: string, vaultId?: string): Promise<[[AccountId, AccountId], PolkadotAmount][]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param nominatorId Id of user who nominated to one or more vaults
     * @param vaultId Id of vault who is opted in to nomination
     * @returns The total nominated amount, filtered using the given parameters
     */
    getTotalNomination(nominatorId?: string, vaultId?: string): Promise<PolkadotAmount>;
    /**
     *
     * @param nominatorId Id of user who nominated to one or more vaults
     * @returns The rewards (in InterBTC a nominator has accumulated)
     */
    getNominatorRewards(nominatorId: string): Promise<[[AccountId, AccountId], BTCAmount][]>;
}

export class DefaultNominationAPI extends DefaultTransactionAPI implements NominationAPI {
    vaultsAPI: VaultsAPI;

    constructor(api: ApiPromise, btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI);
    }

    async depositCollateral(vaultId: string, amount: Big): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Balance", dotToPlanck(amount));
        const tx = this.api.tx.nomination.depositCollateral(parsedVaultId, amountAsPlanck);
        await this.sendLogged(tx, this.api.events.nomination.DepositCollateral);
    }

    async withdrawCollateral(vaultId: string, amount: Big): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Balance", dotToPlanck(amount));
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

    async listNominatorsRaw(): Promise<[[AccountId, AccountId], Nominator][]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nominatorMap = await this.api.query.nomination.nominators.entriesAt(head);
        return nominatorMap.map((v) => {
            const nominatorId = storageKeyToNthInner(v[0]);
            const vaultId = storageKeyToNthInner(v[0], 1);
            return [[nominatorId, vaultId], v[1] as Nominator];
        });
    }

    async listNominationPairs(): Promise<[AccountId, AccountId][]> {
        const rawList = await this.listNominatorsRaw();
        return rawList.map((v) => v[0]);
    }

    async listNominatorRewards(): Promise<[[AccountId, AccountId], BTCAmount][]> {
        const rawList = await this.listNominatorsRaw();
        return await Promise.all(
            rawList.map(async (v): Promise<[[AccountId, AccountId], BTCAmount]> => {
                const [[nominatorId, vaultId]] = v;
                const reward = await this.vaultsAPI.computeReward(
                    Bitcoin,
                    vaultId.toString(),
                    nominatorId.toString()
                );
                return [[nominatorId, vaultId], reward];
            })
        );
    }

    async getNominatorRewards(
        nominatorId: string
    ): Promise<[[AccountId, AccountId], BTCAmount][]> {
        const nominatorRewards = await this.listNominatorRewards();
        return nominatorRewards.filter(([[id, _vaultId], _]) => id.toString() === nominatorId);
    }

    async getFilteredNominations(nominatorId?: string, vaultId?: string): Promise<[[AccountId, AccountId], PolkadotAmount][]> {
        if (!nominatorId && !vaultId) {
            return Promise.reject(new Error("At least one parameter should be specified"));
        }
        const parsedNominatorId = nominatorId ? newAccountId(this.api, nominatorId) : undefined;
        const parsedVaultId = vaultId ? newAccountId(this.api, vaultId) : undefined;

        const rawList = await this.listNominatorsRaw();

        // rawList is of type `[[nominatorId, vaultId], Nominator][]`.
        // Filter by nominatorId and vaultId if each is defined respectively.
        const nominationEntries = rawList.filter((v) => {
            return (
                (!parsedNominatorId || v[0][0].eq(parsedNominatorId)) && (!parsedVaultId || v[0][1].eq(parsedVaultId))
            );
        });
        return await Promise.all(
            nominationEntries.map(async (v): Promise<[[AccountId, AccountId], PolkadotAmount]> => {
                const vaultId = v[0][1];
                const vault = await this.vaultsAPI.get(vaultId);
                const nominator = v[1];
                return [
                    [nominator.id, vaultId],
                    PolkadotAmount.from.Planck(
                        computeLazyDistribution(
                            bnToBig(nominator.collateral),
                            decodeFixedPointType(vault.slash_per_token),
                            bnToBig(nominator.slash_tally)
                        )
                    ),
                ];
            })
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

    async getTotalNomination(nominatorId?: string, vaultId?: string): Promise<PolkadotAmount> {
        const filteredNominations = await this.getFilteredNominations(nominatorId, vaultId);
        return filteredNominations
            .map((v) => v[1])
            .reduce((previousValue, currentValue) => previousValue.add(currentValue), PolkadotAmount.zero);
    }

    async listVaults(): Promise<AccountId[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nominatorMap = await this.api.query.nomination.vaults.entriesAt(head);
        return nominatorMap.filter((v) => v[1]).map((v) => storageKeyToNthInner(v[0]));
    }
}
