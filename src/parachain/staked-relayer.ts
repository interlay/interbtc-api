import { StatusCode } from "../interfaces/default";
import { u64 } from "@polkadot/types/primitive";
import { AccountId, BlockNumber } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { Bytes } from "@polkadot/types";
import Big from "big.js";
import { Network } from "bitcoinjs-lib";
import { AddressOrPair } from "@polkadot/api/types";
import { Bitcoin, BTCUnit, ExchangeRate, Polkadot, PolkadotUnit } from "@interlay/monetary-js";

import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import { DefaultTransactionAPI, TransactionAPI } from "./transaction";
import { ElectrsAPI, getTxProof, newAccountId } from "..";
import { DefaultOracleAPI, OracleAPI } from "./oracle";

/**
 * @category InterBTC Bridge
 */
export interface StakedRelayerAPI extends TransactionAPI {
    /**
     * @returns A mapping from vault IDs to their collateralization
     */
    getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>>;
    /**
     * @returns A tuple denoting [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime]
     */
    getLastBTCDOTExchangeRateAndTime(): Promise<[ExchangeRate<Polkadot, PolkadotUnit, Bitcoin, BTCUnit>, Date]>;
    /**
     * @returns A parachain status code object
     */
    getCurrentStateOfBTCParachain(): Promise<StatusCode>;
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
    private oracleAPI: OracleAPI;

    constructor(api: ApiPromise, btcNetwork: Network, private electrsAPI: ElectrsAPI, account?: AddressOrPair) {
        super(api, account);
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork, electrsAPI);
        this.oracleAPI = new DefaultOracleAPI(api);
    }

    async reportVaultTheft(vaultId: string, btcTxId?: string, merkleProof?: Bytes, rawTx?: Bytes): Promise<void> {
        const parsedVaultId = newAccountId(this.api, vaultId);
        [merkleProof, rawTx] = await getTxProof(this.electrsAPI, btcTxId, merkleProof, rawTx);
        const tx = this.api.tx.stakedRelayers.reportVaultTheft(parsedVaultId, merkleProof, rawTx);
        await this.sendLogged(tx, this.api.events.stakedRelayers.VaultTheft);
    }

    async getMonitoredVaultsCollateralizationRate(): Promise<Map<AccountId, Big>> {
        const vaults = await this.vaultsAPI.list();
        const collateralizationRates = await Promise.all(
            vaults
                .filter((vault) => vault.status.isActive)
                .map<Promise<[AccountId, Big | undefined]>>(async (vault) => [
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

    async getLastBTCDOTExchangeRateAndTime(): Promise<[ExchangeRate<Polkadot, PolkadotUnit, Bitcoin, BTCUnit>, Date]> {
        const lastBTCDOTExchangeRate = await this.oracleAPI.getExchangeRate(Polkadot);
        const lastBTCDOTExchangeRateTime = await this.oracleAPI.getLastExchangeRateTime();
        return [lastBTCDOTExchangeRate, lastBTCDOTExchangeRateTime];
    }

    async getCurrentStateOfBTCParachain(): Promise<StatusCode> {
        const head = await this.api.rpc.chain.getFinalizedHead();
        return await this.api.query.security.parachainStatus.at(head);
    }
}
