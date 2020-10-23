import { PolkaBTC, Redeem, Vault, H256Le } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Hash, H256 } from "@polkadot/types/interfaces";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import { pagedIterator, sendLoggedTx } from "../utils";

export type RequestResult = { hash: Hash; vault: Vault };

export interface RedeemAPI {
    list(): Promise<Redeem[]>;
    request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult>;
    execute(redeemId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<void>;
    cancel(redeemId: H256, reimburse?: boolean): Promise<void>;
    setAccount(account?: AddressOrPair): void;
    getPagedIterator(perPage: number): AsyncGenerator<Redeem[]>;
}

export class DefaultRedeemAPI {
    private vaults: VaultsAPI;
    requestHash: Hash = this.api.createType("Hash");
    events: EventRecord[] = [];

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.vaults = new DefaultVaultsAPI(api);
    }

    private getRedeemIdFromEvents(events: EventRecord[]): Hash {
        for (const { event: { method, section, data } } of events) {
            if (section == "redeem" && method == "RequestRedeem") {
                const hash = this.api.createType("Hash", data[0]);
                return hash;
            }
        }

        throw new Error("Request transaction failed");
    }

    async request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaults.get(vaultId);
        } else {
            vaultId = await this.vaults.selectRandomVaultRedeem(amount);
            vault = await this.vaults.get(vaultId);
        }

        const requestRedeemTx = this.api.tx.redeem.requestRedeem(amount, btcAddress, vault.id);
        const events = await sendLoggedTx(requestRedeemTx, this.account, this.api);
        const hash = this.getRedeemIdFromEvents(events);
        return { hash, vault };
    }

    async execute(redeemId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<void> {
        if (!this.account) {
            throw new Error("cannot execute without setting account");
        }
        const executeRedeemTx = this.api.tx.redeem.executeRedeem(redeemId, txId, txBlockHeight, merkleProof, rawTx);
        await sendLoggedTx(executeRedeemTx, this.account, this.api);
    }

    async cancel(redeemId: H256, reimburse?: boolean): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        // if no value is specified for `reimburse`,
        // `false` = retry Redeem with another Vault.
        // `true` = accept reimbursement in polkaBTC
        const reimburseValue = reimburse ? reimburse : false;
        const cancelRedeemTx = this.api.tx.redeem.cancelRedeem(redeemId, reimburseValue);
        await sendLoggedTx(cancelRedeemTx, this.account, this.api);
    }

    async list(): Promise<Redeem[]> {
        const redeemRequests = await this.api.query.redeem.redeemRequests.entries();
        return redeemRequests.map((v) => v[1]);
    }

    async listForUser(account: AccountId): Promise<[H256, Redeem][]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        return customAPIRPC.redeem.getRedeemRequests(account);
    }

    getPagedIterator(perPage: number): AsyncGenerator<Redeem[]> {
        return pagedIterator<Redeem>(this.api.query.redeem.redeemRequests, perPage);
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
