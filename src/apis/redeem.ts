import { PolkaBTC, Redeem, Vault, H256Le } from "@interlay/polkabtc/interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { AccountId, Hash, H256 } from "@polkadot/types/interfaces";
import { Bytes, u32 } from "@polkadot/types/primitive";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { ISubmittableResult } from "@polkadot/types/types";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";

export type RequestResult = { hash: Hash; vault: Vault };

export interface RedeemAPI {
    list(): Promise<Redeem[]>;
    request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult>;
    execute(redeemId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<void>;
    cancel(redeemId: H256, reimburse?: boolean): Promise<void>;
    setAccount(account?: KeyringPair): void;
}

export class DefaultRedeemAPI {
    private vaults: VaultsAPI;
    requestHash: Hash = this.api.createType("Hash");
    events: EventRecord[] = [];

    constructor(private api: ApiPromise, private account?: KeyringPair) {
        this.vaults = new DefaultVaultsAPI(api);
    }

    // using type `any` because `SubmittableResultSubscription<ApiType extends ApiTypes>` 
    // isn't recognized by type checker
    private txCallback(unsubscribe: any, result: ISubmittableResult) {
        if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
            this.requestHash = result.status.asFinalized;
            this.events = result.events;
            unsubscribe();
        }
    }

    private getRedeemIdFromEvents(events: EventRecord[]): Hash {
        return this.api.createType("Hash", events[2].event.data[0]);
    }

    async request(amount: PolkaBTC, btcAddress: string, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaults.get(vaultId);
        } else {
            vault = await this.vaults.selectRandomVault(amount);
        }

        const unsubscribe: any = await this.api.tx.redeem
            .requestRedeem(amount, btcAddress, vault.id)
            .signAndSend(this.account, { nonce: -1 }, (result) => this.txCallback(unsubscribe, result));
        await delay(delayMs);

        if (this.events.length == 4) {
            const hash = this.getRedeemIdFromEvents(this.events);
            return { hash, vault };
        }

        throw new Error("Request transaction failed");
    }

    async execute(redeemId: H256, txId: H256Le, txBlockHeight: u32, merkleProof: Bytes, rawTx: Bytes): Promise<void> {
        if (!this.account) {
            throw new Error("cannot execute without setting account");
        }
        const unsubscribe: any = await this.api.tx.redeem
            .executeRedeem(redeemId, txId, txBlockHeight, merkleProof, rawTx)
            .signAndSend(this.account, { nonce: -1 }, (result) => this.txCallback(unsubscribe, result));
        await delay(delayMs);
    }

    async cancel(redeemId: H256, reimburse?: boolean): Promise<void> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        // if no value is specified for `reimburse`,
        // `false` = retry Redeem with another Vault.
        // `true` = accept reimbursement in polkaBTC
        const reimburseValue = reimburse ? reimburse : false;
        const unsubscribe: any = await this.api.tx.redeem
            .cancelRedeem(redeemId, reimburseValue)
            .signAndSend(this.account, { nonce: -1 }, (result) => this.txCallback(unsubscribe, result));
        await delay(delayMs);
    }

    async list(): Promise<Redeem[]> {
        const redeemRequests = await this.api.query.redeem.redeemRequests.entries();
        return redeemRequests.map((v) => v[1]);
    }

    setAccount(account?: KeyringPair): void {
        this.account = account;
    }
}

const delayMs = 25000;

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}