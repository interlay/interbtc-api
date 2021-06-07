import { dotToPlanck, newAccountId, storageKeyToFirstInner } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";

import Big from "big.js";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { Nominator } from "../interfaces";
import { AccountId } from "@polkadot/types/interfaces";


/**
 * @category PolkaBTC Bridge
 * The type Big represents DOT or PolkaBTC denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface NominationAPI extends TransactionAPI {
    /**
     * @param vaultId Vault to nominate collateral to
     * @param amount Amount, in BTC, to deposit
     */
    depositCollateral(vaultId: string, amount: Big): Promise<void>;
    /**
     * @param vaultId Vault that collateral was nominated to
     * @param amount Amount, in BTC, to withdraw
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
    listNominators(): Promise<[[AccountId, AccountId], Nominator][]>;
    /**
     * @returns A list of all vaults that opted in to the nomination feature.
     */
    listVaults(): Promise<AccountId[]>;
}

export class DefaultNominationAPI extends DefaultTransactionAPI implements NominationAPI {

    constructor(api: ApiPromise, account?: AddressOrPair) {
        super(api, account);
    }

    async depositCollateral(vaultId: string, amount: Big): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Collateral", dotToPlanck(amount.toString()) as string);
        const tx = this.api.tx.nomination.depositCollateral(parsedVaultId, amountAsPlanck);
        await this.sendLogged(tx, this.api.events.nomination.IncreaseNominatedCollateral);
    }

    async withdrawCollateral(vaultId: string, amount: Big): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        const amountAsPlanck = this.api.createType("Collateral", dotToPlanck(amount.toString()) as string);
        const tx = this.api.tx.nomination.withdrawCollateral(parsedVaultId, amountAsPlanck);
        await this.sendLogged(tx, this.api.events.nomination.WithdrawNominatedCollateral);
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

    async listNominators(): Promise<[[AccountId, AccountId], Nominator][]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nominatorMap = await this.api.query.nomination.nominators.entriesAt(head);
        return nominatorMap.map((v) => {
            const [nominatorId, vaultId] = storageKeyToFirstInner(v[0]);
            return ([[nominatorId, vaultId], v[1]]);
        });
    }

    async listVaults(): Promise<AccountId[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const nominatorMap = await this.api.query.nomination.vaults.entriesAt(head);
        return nominatorMap.filter((v) => v[1])
            .map((v) => storageKeyToFirstInner(v[0]));
    }

}