import { PolkaBTC, RedeemRequest, Vault, H256Le } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Hash, H256, Header } from "@polkadot/types/interfaces";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import { pagedIterator, sendLoggedTx } from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { DefaultSystemAPI, SystemAPI } from "./system";
import { stripHexPrefix } from "../utils";

export type RequestResult = { hash: Hash; vault: Vault };

export interface RedeemAPI {
    list(): Promise<RedeemRequest[]>;
    request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult>;
    execute(redeemId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(redeemId: H256, reimburse?: boolean): Promise<boolean>;
    setAccount(account?: AddressOrPair): void;
    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, RedeemRequest>>;
    getRequestById(redeemId: string | Uint8Array | H256): Promise<RedeemRequest>;
    subscribeToRedeemExpiry(account: AccountId, callback: (requestRedeemId: string) => void): Promise<() => void>;
    getDustValue(): Promise<PolkaBTC>;
}

export class DefaultRedeemAPI {
    private vaults: VaultsAPI;
    private system: SystemAPI;
    requestHash: Hash = this.api.createType("Hash");
    events: EventRecord[] = [];

    constructor(private api: ApiPromise, private account?: AddressOrPair) {
        this.vaults = new DefaultVaultsAPI(api);
        this.system = new DefaultSystemAPI(api);
    }

    private getRedeemHashFromEvents(events: EventRecord[], method: string): Hash {
        for (const {
            event: { method, section, data },
        } of events) {
            if (section == "redeem" && method == method) {
                // the redeem id as H256 is always the first item of the event
                const hash = this.api.createType("Hash", data[0]);
                return hash;
            }
        }

        throw new Error("Transaction failed");
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
        const result = await sendLoggedTx(requestRedeemTx, this.account, this.api);
        const hash = this.getRedeemHashFromEvents(result.events, "RequestRedeem");
        return { hash, vault };
    }

    async execute(
        redeemId: H256,
        txId: H256Le,
        txBlockHeight: u32,
        merkleProof: Bytes,
        rawTx: Bytes
    ): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot execute without setting account");
        }
        const executeRedeemTx = this.api.tx.redeem.executeRedeem(redeemId, txId, txBlockHeight, merkleProof, rawTx);
        const result = await sendLoggedTx(executeRedeemTx, this.account, this.api);
        const hash = this.getRedeemHashFromEvents(result.events, "ExecuteRedeem");
        if (hash) {
            return true;
        }
        return false;
    }

    async cancel(redeemId: H256, reimburse?: boolean): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        // if no value is specified for `reimburse`,
        // `false` = retry Redeem with another Vault.
        // `true` = accept reimbursement in polkaBTC
        const reimburseValue = reimburse ? reimburse : false;
        const cancelRedeemTx = this.api.tx.redeem.cancelRedeem(redeemId, reimburseValue);
        const result = await sendLoggedTx(cancelRedeemTx, this.account, this.api);
        const hash = this.getRedeemHashFromEvents(result.events, "CancelRedeem");
        if (hash) {
            return true;
        }
        return false;
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

    async subscribeToRedeemExpiry(
        account: AccountId,
        callback: (requestRedeemId: string) => void
    ): Promise<() => void> {
        const unsubscribe = await this.api.rpc.chain.subscribeNewHeads(async (header: Header) => {
            const redeemRequests = await this.mapForUser(account);
            const redeemPeriod = await this.getRedeemPeriod();
            const currentParachainBlockHeight = header.number.toBn();
            redeemRequests.forEach((request, id) => {
                if (request.opentime.add(redeemPeriod).lte(currentParachainBlockHeight)) {
                    callback(stripHexPrefix(id.toString()));
                }
            });
        });
        return unsubscribe;
    }

    async getRedeemPeriod(): Promise<BlockNumber> {
        return await this.api.query.redeem.redeemPeriod();
    }

    async getDustValue(): Promise<PolkaBTC> {
        return await this.api.query.redeem.redeemBtcDustValue();
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
