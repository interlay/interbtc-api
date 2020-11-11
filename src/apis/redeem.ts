import { PolkaBTC, RedeemRequest, Vault, H256Le } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Hash, H256 } from "@polkadot/types/interfaces";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import { pagedIterator, sendLoggedTx } from "../utils";

export type RequestResult = { hash: Hash; vault: Vault };

export interface RedeemAPI {
    list(): Promise<RedeemRequest[]>;
    request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult>;
    execute(redeemId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<void>;
    cancel(redeemId: H256, reimburse?: boolean): Promise<void>;
    setAccount(account?: AddressOrPair): void;
    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, RedeemRequest>>;
    getRequestById(redeemId: string | Uint8Array | H256): Promise<RedeemRequest>;
}

export class DefaultRedeemAPI {
    private vaults: VaultsAPI;
    requestHash: Hash = this.api.createType("Hash");
    events: EventRecord[] = [];

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.vaults = new DefaultVaultsAPI(api);
    }

    private getRedeemIdFromEvents(events: EventRecord[]): Hash {
        for (const {
            event: { method, section, data },
        } of events) {
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

    async list(): Promise<RedeemRequest[]> {
        const redeemRequests = await this.api.query.redeem.redeemRequests.entries();
        return redeemRequests.map((v) => v[1]);
    }

    async mapForUser(account: AccountId): Promise<Map<H256, RedeemRequest>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        const redeemRequestPairs: [H256, RedeemRequest][] = await customAPIRPC.redeem.getRedeemRequests(account);
        const mapForUser: Map<H256, RedeemRequest> = new Map<H256, RedeemRequest>();
        redeemRequestPairs.forEach((redeemRequestPair) => mapForUser.set(redeemRequestPair[0], redeemRequestPair[1]));
        return mapForUser;
    }

    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]> {
        return pagedIterator<RedeemRequest>(this.api.query.redeem.redeemRequests, perPage);
    }

    getRequestById(redeemId: string | Uint8Array | H256): Promise<RedeemRequest> {
        return this.api.query.redeem.redeemRequests(redeemId);
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
