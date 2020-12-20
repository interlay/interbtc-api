import { PolkaBTC, RedeemRequest, Vault, H256Le, DOT } from "../interfaces/default";
import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/submittable/types";
import { AccountId, Hash, H256, Header } from "@polkadot/types/interfaces";
import { Bytes } from "@polkadot/types/primitive";
import { EventRecord } from "@polkadot/types/interfaces/system";
import { VaultsAPI, DefaultVaultsAPI } from "./vaults";
import {
    decodeBtcAddress,
    encodeBtcAddress,
    FIXEDI128_SCALING_FACTOR,
    pagedIterator,
    scaleFixedPointType,
    sendLoggedTx,
} from "../utils";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { stripHexPrefix } from "../utils";
import { Network } from "bitcoinjs-lib";
import Big from "big.js";

export type RequestResult = { id: Hash; vault: Vault };

export interface RedeemRequestExt extends Omit<RedeemRequest, "btc_address"> {
    // network encoded btc address
    btc_address: string;
}

export function encodeRedeemRequest(req: RedeemRequest, network: Network): RedeemRequestExt {
    const { btc_address, ...obj } = req;
    return Object.assign(
        {
            btc_address: encodeBtcAddress(btc_address, network),
        },
        obj
    ) as RedeemRequestExt;
}

export interface RedeemAPI {
    list(): Promise<RedeemRequestExt[]>;
    request(amount: PolkaBTC, btcAddressEnc: string, vaultId?: AccountId): Promise<RequestResult>;
    execute(redeemId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean>;
    cancel(redeemId: H256, reimburse?: boolean): Promise<boolean>;
    setAccount(account?: AddressOrPair): void;
    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]>;
    mapForUser(account: AccountId): Promise<Map<H256, RedeemRequestExt>>;
    getRequestById(redeemId: string | Uint8Array | H256): Promise<RedeemRequestExt>;
    subscribeToRedeemExpiry(account: AccountId, callback: (requestRedeemId: string) => void): Promise<() => void>;
    getDustValue(): Promise<PolkaBTC>;
    getFeesToPay(amount: string): Promise<string>;
    getPremiumRedeemFee(): Promise<string>;
    getRedeemPeriod(): Promise<BlockNumber>;
    getFeePercentage(): Promise<string>;
}

export class DefaultRedeemAPI {
    private vaultsAPI: VaultsAPI;
    private btcNetwork: Network;
    requestHash: Hash = this.api.createType("Hash");
    events: EventRecord[] = [];

    constructor(private api: ApiPromise, btcNetwork: Network, private account?: AddressOrPair) {
        this.vaultsAPI = new DefaultVaultsAPI(api, btcNetwork);
        this.btcNetwork = btcNetwork;
    }

    private getRedeemIdFromEvents(events: EventRecord[], method: string): Hash {
        for (const {
            event: { method, section, data },
        } of events) {
            if (section == "redeem" && method == method) {
                // the redeem id as H256 is always the first item of the event
                const id = this.api.createType("Hash", data[0]);
                return id;
            }
        }

        throw new Error("Transaction failed");
    }

    isRequestSuccessful(events: EventRecord[]): boolean {
        // A successful `execute` produces the following events:
        // - vaultRegistry.IncreaseToBeRedeemedTokens
        // - polkaBtc.Reserved
        // - treasury.Lock
        // - redeem.RequestRedeem
        // - system.ExtrinsicSuccess

        for (const {
            event: { method, section },
        } of events) {
            if (section == "redeem" && method == "RequestRedeem") {
                return true;
            }
        }

        return false;
    }

    isExecutionSuccessful(events: EventRecord[]): boolean {
        for (const {
            event: { method, section },
        } of events) {
            if (section == "redeem" && method == "ExecuteRedeem") {
                return true;
            }
        }

        return false;
    }

    async request(amount: PolkaBTC, btcAddressEnc: string, vaultId?: AccountId): Promise<RequestResult> {
        if (!this.account) {
            throw new Error("cannot request without setting account");
        }

        let vault: Vault;
        if (vaultId) {
            vault = await this.vaultsAPI.get(vaultId);
        } else {
            vaultId = await this.vaultsAPI.selectRandomVaultRedeem(amount);
            vault = await this.vaultsAPI.get(vaultId);
        }

        const btcAddress = this.api.createType("BtcAddress", decodeBtcAddress(btcAddressEnc, this.btcNetwork));
        const requestRedeemTx = this.api.tx.redeem.requestRedeem(amount, btcAddress, vault.id);
        const result = await sendLoggedTx(requestRedeemTx, this.account, this.api);
        if (!this.isRequestSuccessful(result.events)) {
            throw new Error("Request failed");
        }
        const id = this.getRedeemIdFromEvents(result.events, "RequestRedeem");
        return { id, vault };
    }

    async execute(redeemId: H256, txId: H256Le, merkleProof: Bytes, rawTx: Bytes): Promise<boolean> {
        if (!this.account) {
            throw new Error("cannot execute without setting account");
        }
        const executeRedeemTx = this.api.tx.redeem.executeRedeem(redeemId, txId, merkleProof, rawTx);
        const result = await sendLoggedTx(executeRedeemTx, this.account, this.api);
        if (!this.isExecutionSuccessful(result.events)) {
            throw new Error("Execution failed");
        }
        const id = this.getRedeemIdFromEvents(result.events, "ExecuteRedeem");
        if (id) {
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
        const id = this.getRedeemIdFromEvents(result.events, "CancelRedeem");
        if (id) {
            return true;
        }
        return false;
    }

    async list(): Promise<RedeemRequestExt[]> {
        const redeemRequests = await this.api.query.redeem.redeemRequests.entries();
        return redeemRequests.map((v) => encodeRedeemRequest(v[1], this.btcNetwork));
    }

    async mapForUser(account: AccountId): Promise<Map<H256, RedeemRequestExt>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAPIRPC = this.api.rpc as any;
        const redeemRequestPairs: [H256, RedeemRequest][] = await customAPIRPC.redeem.getRedeemRequests(account);
        const mapForUser: Map<H256, RedeemRequestExt> = new Map<H256, RedeemRequestExt>();
        redeemRequestPairs.forEach((redeemRequestPair) =>
            mapForUser.set(redeemRequestPair[0], encodeRedeemRequest(redeemRequestPair[1], this.btcNetwork))
        );
        return mapForUser;
    }

    async subscribeToRedeemExpiry(
        account: AccountId,
        callback: (requestRedeemId: string) => void
    ): Promise<() => void> {
        const expired = new Set();
        const unsubscribe = await this.api.rpc.chain.subscribeNewHeads(async (header: Header) => {
            const redeemRequests = await this.mapForUser(account);
            const redeemPeriod = await this.getRedeemPeriod();
            const currentParachainBlockHeight = header.number.toBn();
            redeemRequests.forEach((request, id) => {
                if (request.opentime.add(redeemPeriod).lte(currentParachainBlockHeight) && !expired.has(id)) {
                    expired.add(id);
                    callback(stripHexPrefix(id.toString()));
                }
            });
        });
        return unsubscribe;
    }

    async getFeesToPay(amount: string): Promise<string> {
        const feePercentage = await this.getFeePercentage();
        const feePercentageBN = new Big(feePercentage);
        const amountBig = new Big(amount);
        return amountBig.mul(feePercentageBN).toString();
    }

    async getFeePercentage(): Promise<string> {
        const redeemFee = await this.api.query.fee.redeemFee();
        return scaleFixedPointType(redeemFee);
    }

    async getRedeemPeriod(): Promise<BlockNumber> {
        return await this.api.query.redeem.redeemPeriod();
    }

    async getDustValue(): Promise<PolkaBTC> {
        return await this.api.query.redeem.redeemBtcDustValue();
    }

    async getPremiumRedeemFee(): Promise<string> {
        const premiumRedeemFee = await this.api.query.fee.premiumRedeemFee();
        return scaleFixedPointType(premiumRedeemFee);
    }

    getPagedIterator(perPage: number): AsyncGenerator<RedeemRequest[]> {
        return pagedIterator<RedeemRequest>(this.api.query.redeem.redeemRequests, perPage);
    }

    async getRequestById(redeemId: string | Uint8Array | H256): Promise<RedeemRequestExt> {
        return encodeRedeemRequest(await this.api.query.redeem.redeemRequests(redeemId), this.btcNetwork);
    }

    setAccount(account?: AddressOrPair): void {
        this.account = account;
    }
}
