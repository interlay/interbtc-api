import { StatusCode } from "../interfaces/default";
import { u64, u128 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber, Moment } from "@polkadot/types/interfaces/runtime";
import { ApiPromise } from "@polkadot/api";
import { Bytes } from "@polkadot/types";
import BN from "bn.js";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import { AddressOrPair } from "@polkadot/api/types";

import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import { decodeFixedPointType, satToBTC, planckToDOT, storageKeyToFirstInner } from "../utils";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { CollateralAPI, DefaultCollateralAPI } from "./collateral";
import { DefaultFeeAPI, FeeAPI } from "./fee";
import { ElectrsAPI, getTxProof } from "..";

/**
 * @category PolkaBTC Bridge
 * The type Big represents Wrapped or Collateral large denominations,
 * while the type BN represents Planck or Satoshi denominations.
 */
export interface StakedRelayerAPI extends TransactionAPI {
    /**
     * @returns An array containing tuples of type [stakedRelayerId, backingCollateral]
     */
    list(): Promise<AccountId[]>;
    /**
     * @returns A mapping from vault IDs to their collateralization
     */
    getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>>;
    /**
     * @returns A tuple denoting [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime]
     */
    getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]>;
    /**
     * @returns A parachain status code object
     */
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns Total rewards in PolkaBTC for the given staked relayer
     */
    getWrappingFees(stakedRelayerId: AccountId): Promise<Big>;
    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns Total rewards in Collateral tokens for the given staked relayer
     */
    getCollateralFees(stakedRelayerId: AccountId): Promise<Big>;
    /**
     * Get the total APY for a staked relayer based on the income in Wrapped and Collateral tokens
     * divided by the locked Collateral tokens.
     *
     * @note this does not account for interest compounding
     *
     * @param stakedRelayerId the id of the relayer
     * @returns the APY as a percentage string
     */
    getAPY(stakedRelayerId: AccountId): Promise<string>;
    /**
     * @param stakedRelayerId The ID of a staked relayer
     * @returns The SLA score, an integer in the range [0, MaxSLA]
     */
    getSLA(stakedRelayerId: AccountId): Promise<number>;
    /**
     * @returns The maximum SLA score, a positive integer
     */
    getMaxSLA(): Promise<number>;
    /**
     * @param planckStake Stake amount (denoted in Planck) to register with
     */
    register(planckStake: BN): Promise<void>;
    /**
     * Deregister the Staked Relayer
     */
    deregister(): Promise<void>;
    /**
     * A Staked Relayer reports misbehavior by a Vault, providing a fraud proof
    * (malicious Bitcoin transaction and the corresponding transaction inclusion proof).
     * @remarks If `txId` is not set, the `merkleProof` and `rawTx` must both be set.
    * 
    * @param vault_id The account of the vault to check.
    * @param tx_id The hash of the transaction
    * @param merkle_proof The proof of tx inclusion.
    * @param raw_tx The raw Bitcoin transaction.
     */
    reportVaultTheft(vaultId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void>;
}

export interface PendingStatusUpdate {
    statusUpdateStorageKey: u64;
    statusUpdateEnd: BlockNumber;
    statusUpdateAyes: number;
    statusUpdateNays: number;
}

export class DefaultStakedRelayerAPI extends DefaultTransactionAPI implements StakedRelayerAPI {
    private vaultsAPI: VaultsAPI;
    private collateralAPI: CollateralAPI;
    private feeAPI: FeeAPI;

    constructor(api: ApiPromise, btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.collateralAPI = new DefaultCollateralAPI(api);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.feeAPI = new DefaultFeeAPI(api);
    }

    async register(planckStake: BN): Promise<void> {
        const tx = this.api.tx.stakedRelayers.registerStakedRelayer(planckStake);
        await this.sendLogged(tx, this.api.events.stakedRelayers.RegisterStakedRelayer);
    }

    async deregister(): Promise<void> {
        const tx = this.api.tx.stakedRelayers.deregisterStakedRelayer();
        await this.sendLogged(tx, this.api.events.stakedRelayers.DeregisterStakedRelayer);    
    }

    async reportVaultTheft(vaultId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        const parsedVaultId = this.api.createType("AccountId", vaultId);
        [merkleProof, rawTx] = await getTxProof(this.electrsAPI, btcTxId, merkleProof, rawTx);
        const tx = this.api.tx.stakedRelayers.reportVaultTheft(parsedVaultId, merkleProof, rawTx);
        await this.sendLogged(tx, this.api.events.stakedRelayers.VaultTheft);    
    }

    async list(): Promise<AccountId[]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const stakedRelayersMap = await this.api.query.wrappedRelayerRewards.stake.entriesAt(head);
        return stakedRelayersMap
            .filter(
                (v) => (new Big(v[1].toString()) > new Big(0))
            )
            .map(
                (v) => storageKeyToFirstInner(v[0])
            );
    }

    async getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>> {
        const vaults = await this.vaultsAPI.list();

        const collateralizationRates = await Promise.all(
            vaults.filter(vault => vault.status.isActive).map<Promise<[AccountId, Big | undefined]>>(async (vault) => [
                vault.id,
                await this.vaultsAPI.getVaultCollateralization(vault.id),
            ])
        );

        const map = new Map<AccountId, Big>();
        collateralizationRates
            .filter<[AccountId, Big]>(this.isMonitoredVaultCollateralizationDefined)
            .forEach((pair) => map.set(pair[0], pair[1]));
        return map;
    }

    private isMonitoredVaultCollateralizationDefined(pair: [AccountId, Big | undefined]): pair is [AccountId, Big] {
        return pair[1] !== undefined;
    }

    async getLastBTCDOTExchangeRateAndTime(): Promise<[u128, Moment]> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const lastBTCDOTExchangeRate = await this.api.query.exchangeRateOracle.exchangeRate.at(head);
        const lastBTCDOTExchangeRateTime = await this.api.query.exchangeRateOracle.lastExchangeRateTime.at(head);
        return [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime];
    }

    async getCurrentStateOfBTCParachain(): Promise<StatusCode> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.security.parachainStatus.at(head);
    }

    async getWrappingFees(stakedRelayerId: AccountId): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fees = await this.api.query.wrappedRelayerRewards.totalRewards.at(head, stakedRelayerId);
        return new Big(satToBTC(fees.toString()));
    }

    async getCollateralFees(stakedRelayerId: AccountId): Promise<Big> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const fees = await this.api.query.collateralRelayerRewards.totalRewards.at(head, stakedRelayerId);
        return new Big(planckToDOT(fees.toString()));
    }

    async getAPY(stakedRelayerId: AccountId): Promise<string> {
        const [feesWrapped, feesCollateral, lockedCollateral] = await Promise.all([
            await this.getWrappingFees(stakedRelayerId),
            await this.getCollateralFees(stakedRelayerId),
            await this.collateralAPI.balanceLocked(stakedRelayerId),
        ]);
        return this.feeAPI.calculateAPY(feesWrapped, feesCollateral, lockedCollateral);
    }

    async getSLA(stakedRelayerId: AccountId): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const sla = await this.api.query.sla.relayerSla.at(head, stakedRelayerId);
        return Number(decodeFixedPointType(sla));
    }

    async getMaxSLA(): Promise<number> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        const maxSLA = await this.api.query.sla.relayerTargetSla.at(head);
        return Number(decodeFixedPointType(maxSLA));
    }

}
