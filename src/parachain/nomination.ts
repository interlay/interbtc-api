import { Network } from "bitcoinjs-lib";
import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId } from "@polkadot/types/interfaces";

import { Nominator } from "../interfaces";
import { DefaultVaultsAPI, VaultsAPI } from "./vaults";
import { bnToBig, computeStake, decodeFixedPointType, dotToPlanck, newAccountId, planckToDOT, storageKeyToFirstInner } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI } from "../external";
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
    listNominators(): Promise<[AccountId, AccountId][]>;
    /**
     * @returns A list of all vaults that opted in to the nomination feature.
     */
    listVaults(): Promise<AccountId[]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param nominatorId Id of user who nominated to a vault
     * @param vaultId Id of vault who is opted in to nomination
     * @returns A list of `[nominatorId, vaultId], nominatedAmount` pairs
     */
    getFilteredNominations(nominatorId?: string, vaultId?: string): Promise<[[AccountId, AccountId], Big][]>;
    /**
     * @remarks At least one of the parameters must be specified
     * @param nominatorId Id of user who nominated to a vault
     * @param vaultId Id of vault who is opted in to nomination
     * @returns The total nominated amount, filtered using the given parameters 
     */
    getTotalNomination(nominatorId?: string, vaultId?: string): Promise<Big>;
}

export class DefaultNominationAPI extends DefaultTransactionAPI implements NominationAPI {
    vaultsAPI: VaultsAPI;

    constructor(api: ApiPromise, btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI);
    }

    async depositCollateral(vaultId: string, amount: Big): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Collateral", dotToPlanck(amount));
        const tx = this.api.tx.nomination.depositCollateral(parsedVaultId, amountAsPlanck);
        await this.sendLogged(tx, this.api.events.nomination.DepositCollateral);
    }

    async withdrawCollateral(vaultId: string, amount: Big): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Collateral", dotToPlanck(amount));
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
        const tx = this.api.tx.sudo
            .sudo(
                this.api.tx.nomination.setNominationEnabled(enabled)
            );
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
            const [nominatorId, vaultId] = storageKeyToFirstInner(v[0]);
            return ([[nominatorId, vaultId], v[1]]);
        });
    }

    async listNominators(): Promise<[AccountId, AccountId][]> {
        const rawList = await this.listNominatorsRaw();
        return rawList.map((v) => v[0]);
    }

    async getFilteredNominations(nominatorId?: string, vaultId?: string): Promise<[[AccountId, AccountId], Big][]> {
        if(!nominatorId && !vaultId) {
            Promise.reject("At least one parameter should be specified");
        }
        const parsedNominatorId = nominatorId ? newAccountId(this.api, nominatorId) : undefined;
        const parsedVaultId = vaultId ? newAccountId(this.api, vaultId) : undefined;

        const rawList = await this.listNominatorsRaw();

        // rawList is of type `[[nominatorId, vaultId], Nominator][]`. 
        // Filter by nominatorId and vaultId if each is defined respectively.
        const nominationEntries = rawList.filter((v) => {
            return (!parsedNominatorId || v[0][0].eq(parsedNominatorId)) 
                && (!parsedVaultId || v[0][1].eq(parsedVaultId));
        });
        return await Promise.all(nominationEntries.map(async (v): Promise<[[AccountId, AccountId], Big]> => {
            const vaultId = v[0][1];
            const vault = await this.vaultsAPI.get(vaultId);
            const nominator = v[1];
            return [
                [nominator.id, vaultId], 
                planckToDOT(
                    computeStake(
                        bnToBig(nominator.collateral),
                        decodeFixedPointType(vault.slash_per_token),
                        bnToBig(nominator.slash_tally)
                    )
                )
            ];
        }));
    }

    async getTotalNomination(nominatorId?: string, vaultId?: string): Promise<Big> {
        const filteredNominations = await this.getFilteredNominations(nominatorId, vaultId);
        return filteredNominations
            .map(v => v[1])
            .reduce((previousValue, currentValue) => previousValue.add(currentValue), new Big(0));
    }

    async listVaults(): Promise<AccountId[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nominatorMap = await this.api.query.nomination.vaults.entriesAt(head);
        return nominatorMap.filter((v) => v[1])
            .map((v) => storageKeyToFirstInner(v[0]));
    }

}